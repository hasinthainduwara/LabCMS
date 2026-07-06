import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get all requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM requests');
    return res.json(rows.map(row => ({ ...row, quantity: Number(row.quantity) })));
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Submit a request
router.post('/', async (req: Request, res: Response) => {
  const { chemicalId, quantity, neededBy, grantId, purpose, studentName, studentEmail, department } = req.body;
  try {
    // Fetch chemical details
    const [chemRows] = await pool.query<RowDataPacket[]>(
      'SELECT name, unit FROM chemicals WHERE id = ?',
      [chemicalId]
    );

    if (chemRows.length === 0) {
      return res.status(404).json({ message: 'Chemical not found' });
    }

    const chemicalName = chemRows[0].name;
    const unit = chemRows[0].unit;
    const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const submissionDate = new Date().toISOString().split('T')[0];

    // Insert request
    await pool.query<ResultSetHeader>(
      'INSERT INTO requests (id, chemical_id, chemical_name, quantity, unit, student_name, student_email, department, submission_date, needed_by, purpose, status, grant_id, approved_by, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'PENDING\', ?, \'\', \'\')',
      [reqId, chemicalId, chemicalName, quantity, unit, studentName, studentEmail, department, submissionDate, neededBy, purpose, grantId || null]
    );

    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    // Create notifications for TOs and Admin
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read, timestamp) VALUES (?, ?, false, ?)',
      ['to', `Student ${studentName} submitted requisition ${reqId} for ${chemicalName}.`, nowStr]
    );
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read, timestamp) VALUES (?, ?, false, ?)',
      ['superadmin', `Organic synthesis request ${reqId} requires department review.`, nowStr]
    );

    return res.status(201).json({
      id: reqId, chemicalId, chemicalName, quantity, unit, studentName, studentEmail, department, submissionDate, neededBy, purpose, status: 'PENDING', grantId, approvedBy: '', rejectionReason: ''
    });
  } catch (error: any) {
    console.error('Error submitting request:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Approve request
router.put('/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  try {
    // Get request details
    const [reqRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM requests WHERE id = ?',
      [id]
    );

    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    const request = reqRows[0];
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Requisition has already been processed' });
    }

    // Update status
    await pool.query<ResultSetHeader>(
      'UPDATE requests SET status = \'APPROVED\', approved_by = ? WHERE id = ?',
      [approvedBy, id]
    );

    // Deduct quantity from inventory
    await pool.query(
      'UPDATE chemicals SET quantity = GREATEST(0, quantity - ?) WHERE id = ?',
      [request.quantity, request.chemical_id]
    );

    // Write audit log
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await pool.query(
      'INSERT INTO audit_logs (timestamp, user, action, status) VALUES (?, ?, ?, \'Success\')',
      [nowStr, approvedBy, `Approved request ${id} for ${request.chemical_name} (${request.quantity} ${request.unit})`, 'Success']
    );

    return res.json({ message: 'Requisition approved and stock updated', id, status: 'APPROVED' });
  } catch (error: any) {
    console.error('Error approving request:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Reject request
router.put('/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approvedBy, rejectionReason } = req.body;
  try {
    // Get request details
    const [reqRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM requests WHERE id = ?',
      [id]
    );

    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    const request = reqRows[0];
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Requisition has already been processed' });
    }

    // Update status
    await pool.query<ResultSetHeader>(
      'UPDATE requests SET status = \'REJECTED\', approved_by = ?, rejection_reason = ? WHERE id = ?',
      [approvedBy, rejectionReason, id]
    );

    // Write audit log
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await pool.query(
      'INSERT INTO audit_logs (timestamp, user, action, status) VALUES (?, ?, ?, \'Rejected\')',
      [nowStr, approvedBy, `Rejected request ${id} for ${request.chemical_name}. Reason: ${rejectionReason}`, 'Success']
    );

    return res.json({ message: 'Requisition rejected', id, status: 'REJECTED', rejectionReason });
  } catch (error: any) {
    console.error('Error rejecting request:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
