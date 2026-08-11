import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendEmail } from '../mailer';
import { RESET_TOKEN_TTL_MS, hashToken, generateResetToken } from '../tokens';

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
  const { name, email, role, department, status } = req.body;
  try {
    // Account is created with an unusable random password; the user sets their own via the emailed link
    const hashedPassword = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
    const userId = `USR-${Math.floor(100 + Math.random() * 900)}`;
    const userStatus = status || 'Active';
    const avatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQkWnpNjwXsbgz-c10i20NwDj-7A9FCPchgUjxcRl4zdjGDWXGBzXZ1TaTzjT19AUQyNd4yCDlkrbApi0C_5Nd3LTuMzio3JvHF3_vPHpAK2VCThmqM0ZaoqPnnkfY3pg4gfjG3By7Su50TjPL2uZdfBHyR5RTqHyPmktlFpLk2VgLfpNY2tVyoXGULB1EdxXUcLcpF7WfkugYYe5E_Z_IAk0bLIIRWJtcgtQ8AwVfSGyL5Aq7FbSplwJ79iZVIhVFGc41Hvi5i9k';

    const setPasswordToken = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await pool.query<ResultSetHeader>(
      'INSERT INTO users (id, name, email, password, role, department, status, avatar, reset_token, reset_token_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role, department, userStatus, avatar, hashToken(setPasswordToken), expiresAt]
    );

    const setPasswordLink = `${process.env.FRONTEND_URL || 'http://localhost'}/?token=${setPasswordToken}`;
    await sendEmail({
      to: email,
      toName: name,
      subject: 'Set Your LabCMS Password',
      html: `<p>Hello ${name},</p>
        <p>An account has been created for you on LabCMS as <strong>${role}</strong> in the ${department} department.</p>
        <p>Set your password to activate your account. This link expires in 1 hour:</p>
        <p><a href="${setPasswordLink}">${setPasswordLink}</a></p>`,
    });

    return res.status(201).json({ id: userId, name, email, role, department, status: userStatus, avatar });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Delete a user profile
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ message: 'User deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
