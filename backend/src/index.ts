import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health';
import exampleRouter from './routes/example';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/example', exampleRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
