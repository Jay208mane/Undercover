import { Schema, model, Document } from 'mongoose';

export interface IGameResult extends Document {
  roomCode: string;
  winnerFaction: 'CIVILIANS' | 'IMPOSTERS' | 'MR_WHITE';
  playerCount: number;
  rounds: number;
  language: string;
  category: string;
  playedAt: Date;
}

const GameResultSchema = new Schema<IGameResult>({
  roomCode: { type: String, required: true, index: true },
  winnerFaction: { type: String, required: true, enum: ['CIVILIANS', 'IMPOSTERS', 'MR_WHITE'] },
  playerCount: { type: Number, required: true },
  rounds: { type: Number, required: true },
  language: { type: String, required: true },
  category: { type: String, required: true },
  playedAt: { type: Date, default: Date.now },
});

export const GameResult = model<IGameResult>('GameResult', GameResultSchema);
