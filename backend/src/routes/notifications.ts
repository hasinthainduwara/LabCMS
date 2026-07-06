import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get notifications for a user/role
router.get('/', async (req: Request, res: Response) => {
  const { userId } = req.query; // 'superadmin' or 'to', etc.
  try {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params: any[] = [];
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY id DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return res.json(rows.map(row => ({ ...row, is_read: !!row.is_read })));
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = true WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json({ message: 'Notification marked as read', id });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Clear all notifications for a user/role
router.delete('/', async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    let query = 'DELETE FROM notifications';
    const params: any[] = [];
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    await pool.query(query, params);
    return res.json({ message: 'Notifications cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
