import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { seedInitialData } from './data/seeder.js';
import authRoutes from './routes/authRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean).map((u) => u.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    message: '💈 The Classic Cut Salon API Server is Live & Running!',
    status: 'online',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'The Classic Cut Salon API',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: JWT_SECRET environment variable is missing in production. Halting server.');
      process.exit(1);
    } else {
      console.warn('⚠️ WARNING: JWT_SECRET is not defined in environment variables. Please configure JWT_SECRET in server/.env.');
    }
  }

  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`\n💈 The Classic Cut Salon Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
