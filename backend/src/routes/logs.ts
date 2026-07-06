import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Fetch audit logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM audit_logs ORDER BY id DESC');
    return res.json(rows);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Create audit log
router.post('/', async (req: Request, res: Response) => {
  const { user, action, status } = req.body;
  try {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await pool.query<ResultSetHeader>(
      'INSERT INTO audit_logs (timestamp, user, action, status) VALUES (?, ?, ?, ?)',
      [nowStr, user, action, status]
    );

    return res.status(201).json({ timestamp: nowStr, user, action, status });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
