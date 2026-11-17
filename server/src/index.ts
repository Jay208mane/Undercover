import { createServer } from 'http';
import express from 'express';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { applyMiddleware } from './middleware/setup';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import { createSocketServer } from './sockets/index';

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = createServer(app);

  // Middleware
  applyMiddleware(app);

  // Routes
  app.use('/api', healthRouter);

  // 404 + error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Socket.IO
  createSocketServer(httpServer);

  // Database (non-blocking — server still starts if DB is unavailable)
  connectDatabase().catch((err) => {
    console.warn('⚠️  Running without database:', err.message);
  });

  httpServer.listen(config.port, () => {
    console.log(`\n🎮  Undercover server running`);
    console.log(`    Mode    : ${config.nodeEnv}`);
    console.log(`    Port    : ${config.port}`);
    console.log(`    Health  : http://localhost:${config.port}/api/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
