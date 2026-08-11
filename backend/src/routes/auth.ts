import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { RowDataPacket } from 'mysql2';
import { sendEmail } from '../mailer';
import { RESET_TOKEN_TTL_MS, hashToken, generateResetToken } from '../tokens';

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

// Request a password reset link
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  const genericResponse = { message: 'If that institutional email is registered, a reset link has been sent.' };
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      const user = rows[0];
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await pool.query(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        [hashToken(token), expiresAt, user.id]
      );

      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost'}/?token=${token}`;
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject: 'LabCMS Password Reset Request',
        html: `<p>Hello ${user.name},</p>
          <p>A password reset was requested for your LabCMS account. This link expires in 1 hour:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>`,
      });
    }

    return res.json(genericResponse);
  } catch (error: any) {
    console.error('Error during forgot-password:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Complete a password reset using a token
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = ?',
      [hashToken(token)]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    const user = rows[0];
    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    return res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (error: any) {
    console.error('Error during reset-password:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
