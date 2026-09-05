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

import { exec } from 'child_process';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Secure Backend API running on port ${PORT}`);
  
  // Auto-migrate and seed for the user asynchronously so it doesn't freeze Render!
  console.log('Automatically pushing database schema to Supabase in the background...');
  exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to push database:', error, stderr);
      return;
    }
    console.log(stdout);
    
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
});
