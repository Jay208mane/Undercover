import { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import { config } from '../config/env';

export function applyMiddleware(app: Application): void {
  // Security headers
  app.use(helmet());

  // CORS — allow configured origins
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );

  // Request logging
  app.use(morgan(config.isDev ? 'dev' : 'combined'));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
}
