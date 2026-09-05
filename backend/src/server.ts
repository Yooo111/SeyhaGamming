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
  try {
    console.log('🔄 Initializing MySQL Database connection...');
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`\n🚀 Backend Server successfully running at: http://localhost:${PORT}`);
      console.log(`📡 API Routes available:`);
      console.log(`   - POST http://localhost:${PORT}/api/register`);
      console.log(`   - GET  http://localhost:${PORT}/api/users\n`);
    });
  } catch (error) {
    console.error('❌ Database connection failed. Please ensure MySQL database server is running and accessible!', error);
    process.exit(1);
  }
};

startServer();
