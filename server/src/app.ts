
import express from 'express';
import { applyMiddleware } from './middleware/setup';
import {
  errorHandler,
  notFoundHandler
} from './middleware/errorHandler';
import healthRouter from './routes/health';
import { connectDatabase } from './config/database';

const app = express();

// Middleware
applyMiddleware(app);

// API routes
app.use('/api', healthRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Connect database
connectDatabase().catch((err) => {
  console.error('Database connection failed:', err.message);
});

// Export Express application for Vercel
export default app;
