import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Florence Nightingales API is running securely.' });
});

import { execSync } from 'child_process';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Secure Backend API running on port ${PORT}`);
  
  // Auto-migrate and seed for the user
  try {
    console.log('Automatically pushing database schema to Supabase...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('Automatically seeding mock users...');
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
    console.log('✅ Database is ready to use!');
  } catch (error) {
    console.error('❌ Failed to auto-initialize database:', error);
  }
});
