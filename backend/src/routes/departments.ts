import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get all departments
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, faculty, location, technical_officer, head_of_department FROM departments'
    );
    return res.json(rows);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Create new department
router.post('/', async (req: Request, res: Response) => {
  const { name, faculty, location, technicalOfficer, headOfDepartment } = req.body;
  try {
    const deptId = `DEPT-${Math.floor(10 + Math.random() * 90)}`;
    await pool.query<ResultSetHeader>(
      'INSERT INTO departments (id, name, faculty, location, technical_officer, head_of_department) VALUES (?, ?, ?, ?, ?, ?)',
      [deptId, name, faculty, location, technicalOfficer, headOfDepartment]
    );

    return res.status(201).json({ id: deptId, name, faculty, location, technical_officer: technicalOfficer, head_of_department: headOfDepartment });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
