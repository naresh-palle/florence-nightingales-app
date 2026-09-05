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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Secure Backend API running on port ${PORT}`);
});
