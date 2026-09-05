import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import operationsRoutes from './routes/operations.routes';
import financeRoutes from './routes/finance.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/finance', financeRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Florence Nightingales API is running securely.' });
});

import { exec } from 'child_process';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Secure Backend API running on port ${PORT}`);
  
  // Auto-seed for the user asynchronously
  console.log('Automatically seeding mock users...');
  exec('npx ts-node prisma/seed.ts', (seedErr, seedOut, seedStdErr) => {
    if (seedErr) {
      console.error('❌ Failed to seed database:', seedErr, seedStdErr);
      return;
    }
    console.log(seedOut);
    console.log('✅ Database is fully ready to use!');
  });
});
