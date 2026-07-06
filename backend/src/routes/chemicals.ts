import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

const transformChemical = (row: any) => {
  return {
    ...row,
    quantity: Number(row.quantity),
    hazards: row.hazards ? row.hazards.split(',').filter(Boolean) : []
  };
};

// Get all chemicals with optional search
router.get('/', async (req: Request, res: Response) => {
  const { search, state, department } = req.query;
  try {
    let query = 'SELECT * FROM chemicals WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR cas LIKE ? OR location LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (state && state !== 'all') {
      query += ' AND state = ?';
      params.push(state);
    }
    if (department && department !== 'all') {
      query += ' AND department = ?';
      params.push(department);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return res.json(rows.map(transformChemical));
  } catch (error: any) {
    console.error('Error fetching chemicals:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Create new chemical record
router.post('/', async (req: Request, res: Response) => {
  const { name, formula, cas, quantity, unit, state, grade, department, location, grant_ref, hazards, expiry } = req.body;
  try {
    const chemId = `CHEM-${Math.floor(100 + Math.random() * 900)}`;
    const hazardString = Array.isArray(hazards) ? hazards.join(',') : (hazards || '');

    await pool.query<ResultSetHeader>(
      'INSERT INTO chemicals (id, name, formula, cas, quantity, unit, state, grade, department, location, grant_ref, hazards, expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [chemId, name, formula, cas, quantity, unit, state, grade, department, location, grant_ref || null, hazardString, expiry]
    );

    return res.status(201).json(transformChemical({
      id: chemId, name, formula, cas, quantity, unit, state, grade, department, location, grant_ref, hazards: hazardString, expiry
    }));
  } catch (error: any) {
    console.error('Error creating chemical:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Update chemical record
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, formula, cas, quantity, unit, state, grade, department, location, grant_ref, hazards, expiry } = req.body;
  try {
    const hazardString = Array.isArray(hazards) ? hazards.join(',') : (hazards || '');

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE chemicals SET name=?, formula=?, cas=?, quantity=?, unit=?, state=?, grade=?, department=?, location=?, grant_ref=?, hazards=?, expiry=? WHERE id=?',
      [name, formula, cas, quantity, unit, state, grade, department, location, grant_ref || null, hazardString, expiry, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Chemical not found' });
    }

    return res.json(transformChemical({
      id, name, formula, cas, quantity, unit, state, grade, department, location, grant_ref, hazards: hazardString, expiry
    }));
  } catch (error: any) {
    console.error('Error updating chemical:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Delete chemical record
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM chemicals WHERE id=?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Chemical not found' });
    }

    return res.json({ message: 'Chemical record deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting chemical:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
