import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get all grants
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, funding_org, pi_name, budget, used, start_date, end_date FROM grants'
    );
    return res.json(rows);
  } catch (error: any) {
    console.error('Error fetching grants:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Create new research grant
router.post('/', async (req: Request, res: Response) => {
  const { id, name, fundingOrg, piName, budget, startDate, endDate } = req.body;
  try {
    await pool.query<ResultSetHeader>(
      'INSERT INTO grants (id, name, funding_org, pi_name, budget, used, start_date, end_date) VALUES (?, ?, ?, ?, ?, 0.00, ?, ?)',
      [id, name, fundingOrg, piName, budget, startDate, endDate]
    );

    return res.status(201).json({ id, name, funding_org: fundingOrg, pi_name: piName, budget, used: 0, start_date: startDate, end_date: endDate });
  } catch (error: any) {
    console.error('Error creating grant:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
