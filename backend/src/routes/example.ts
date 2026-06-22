import { Router, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM example');
    res.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message });
  }
});

router.post('/', async (_req: Request, res: Response) => {
  try {
    const [result] = await pool.query<ResultSetHeader>('INSERT INTO example () VALUES ()');
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message });
  }
});

export default router;
