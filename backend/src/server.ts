import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend API is up and running!' });
});

// Auth & User API Routes
app.use('/api', authRoutes);

// Start Server and Initialize Database
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Backend Server successfully running at port ${PORT}`);
    console.log(`📡 API Routes available:`);
    console.log(`   - POST /api/register`);
    console.log(`   - GET  /api/users\n`);
  });

  try {
    console.log('🔄 Initializing MySQL Database connection...');
    await initDatabase();
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('⚠️ Database connection error during startup:', error);
  }
};

startServer();

