import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Manual login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid institutional email or password' });
    }

    const user = rows[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid institutional email or password' });
    }

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Demo login (quick access)
router.post('/login-demo', async (req: Request, res: Response) => {
  const { role } = req.body;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE role = ? LIMIT 1',
      [role]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: `No user with role ${role} found` });
    }

    const user = rows[0];
    const { password: _, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error during demo login:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
