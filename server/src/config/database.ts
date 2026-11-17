import mongoose from 'mongoose';
import { config } from './env';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri, {
      dbName: 'undercover',
    });
    console.log('✅  MongoDB connected');
  } catch (error) {
    console.error('❌  MongoDB connection failed:', error);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄  MongoDB reconnected');
});
