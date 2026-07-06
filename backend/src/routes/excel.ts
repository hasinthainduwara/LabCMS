import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Fetch bulk upload queue
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM excel_uploads');
    return res.json(rows.map(row => ({
      id: row.id,
      uploadedBy: row.uploaded_by,
      department: row.department,
      timestamp: row.timestamp,
      status: row.status,
      chemicals: typeof row.chemicals_data === 'string' ? JSON.parse(row.chemicals_data) : row.chemicals_data
    })));
  } catch (error: any) {
    console.error('Error fetching excel queue:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Upload simulator files
router.post('/upload', async (req: Request, res: Response) => {
  const { uploadedBy, department, chemicals } = req.body;
  try {
    const xlsId = `XLS-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    await pool.query<ResultSetHeader>(
      'INSERT INTO excel_uploads (id, uploaded_by, department, timestamp, status, chemicals_data) VALUES (?, ?, ?, ?, \'PENDING\', ?)',
      [xlsId, uploadedBy, department, nowStr, JSON.stringify(chemicals)]
    );

    return res.status(201).json({
      id: xlsId, uploadedBy, department, timestamp: nowStr, status: 'PENDING', chemicals
    });
  } catch (error: any) {
    console.error('Error uploading excel data:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Approve a staged upload
router.post('/approve/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  try {
    // Fetch staging upload
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM excel_uploads WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Upload batch not found' });
    }

    const uploadItem = rows[0];
    if (uploadItem.status !== 'PENDING') {
      return res.status(400).json({ message: 'Upload batch has already been processed' });
    }

    const chemicals = typeof uploadItem.chemicals_data === 'string' ? JSON.parse(uploadItem.chemicals_data) : uploadItem.chemicals_data;

    // Approve the staging status
    await pool.query(
      'UPDATE excel_uploads SET status = \'APPROVED\' WHERE id = ?',
      [id]
    );

    // Insert chemicals into chemical inventory
    for (const chem of chemicals) {
      const chemId = `CHEM-${Math.floor(100 + Math.random() * 900)}`;
      const hazards = Array.isArray(chem.hazards) ? chem.hazards.join(',') : (chem.hazards || '');
      await pool.query(
        'INSERT INTO chemicals (id, name, formula, cas, quantity, unit, state, grade, department, location, grant_ref, hazards, expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [chemId, chem.name, chem.formula, chem.cas, chem.quantity, chem.unit, chem.state, chem.grade, chem.department, chem.location, chem.grant || null, hazards, chem.expiry]
      );
    }

    // Write audit log
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await pool.query(
      'INSERT INTO audit_logs (timestamp, user, action, status) VALUES (?, ?, ?, \'Success\')',
      [nowStr, approvedBy, `Approved bulk chemical upload ${id} containing ${chemicals.length} items.`, 'Success']
    );

    return res.json({ message: 'Staged chemicals approved and integrated to inventory', id });
  } catch (error: any) {
    console.error('Error approving excel upload:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
