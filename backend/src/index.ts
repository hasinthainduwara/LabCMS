import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health';
import exampleRouter from './routes/example';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import departmentsRouter from './routes/departments';
import grantsRouter from './routes/grants';
import chemicalsRouter from './routes/chemicals';
import requestsRouter from './routes/requests';
import notificationsRouter from './routes/notifications';
import excelRouter from './routes/excel';
import logsRouter from './routes/logs';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/example', exampleRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/grants', grantsRouter);
app.use('/api/chemicals', chemicalsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/excel', excelRouter);
app.use('/api/logs', logsRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
