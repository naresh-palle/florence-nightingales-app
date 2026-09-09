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

import { runCompleteSeed } from './services/seeder.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Server] Secure Backend API running on port ${PORT}`);
  
  try {
    const invCount = await prisma.invoice.count();
    if (invCount === 0) {
      console.log('Detected 0 invoices. Seeding initial rich production data...');
      await runCompleteSeed(false);
      console.log('✅ Initial database seed finished successfully!');
    } else {
      console.log(`✅ Database already has ${invCount} invoices.`);
    }
  } catch (err) {
    console.warn('Startup check/seed note:', err);
  }
});
