import { z } from 'zod';

export const CreateRoomSchema = z.object({
  playerName: z.string().min(1).max(20).trim(),
  language: z.enum(['en', 'mr', 'hi']),
  category: z.string().min(1).max(50).default('random'),
  mrWhiteEnabled: z.boolean().default(false),
  discussionTimerSeconds: z.number().int().min(0).max(600).default(180),
});

export const JoinRoomSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
  playerName: z.string().min(1).max(20).trim(),
  sessionToken: z.string().optional(),
});

export const RoomCodeSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
});

export const VoteSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
  targetId: z.string().min(1),
});

export const MrWhiteGuessSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
  guess: z.string().min(1).max(100).trim(),
});

export const ReconnectSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
  sessionToken: z.string().min(1),
});
