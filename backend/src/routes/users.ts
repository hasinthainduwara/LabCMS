import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, role, department, status, avatar FROM users'
    );
    return res.json(rows);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Create new user profile
router.post('/', async (req: Request, res: Response) => {
  const { name, email, role, department, password, status } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password || 'password', 10);
    const userId = `USR-${Math.floor(100 + Math.random() * 900)}`;
    const userStatus = status || 'Active';
    const avatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQkWnpNjwXsbgz-c10i20NwDj-7A9FCPchgUjxcRl4zdjGDWXGBzXZ1TaTzjT19AUQyNd4yCDlkrbApi0C_5Nd3LTuMzio3JvHF3_vPHpAK2VCThmqM0ZaoqPnnkfY3pg4gfjG3By7Su50TjPL2uZdfBHyR5RTqHyPmktlFpLk2VgLfpNY2tVyoXGULB1EdxXUcLcpF7WfkugYYe5E_Z_IAk0bLIIRWJtcgtQ8AwVfSGyL5Aq7FbSplwJ79iZVIhVFGc41Hvi5i9k';

    await pool.query<ResultSetHeader>(
      'INSERT INTO users (id, name, email, password, role, department, status, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role, department, userStatus, avatar]
    );

    return res.status(201).json({ id: userId, name, email, role, department, status: userStatus, avatar });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
