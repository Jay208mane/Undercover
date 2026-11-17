/**
 * In-memory room store.
 * Active game state lives here only — not persisted to MongoDB.
 * Rooms expire after ROOM_TTL_MS of inactivity.
 */

import type { ServerRoom } from './types';

const rooms = new Map<string, ServerRoom>();

const ROOM_TTL_MS = 60 * 60 * 1000; // 1 hour
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateRoomCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function getRoom(code: string): ServerRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function setRoom(room: ServerRoom): void {
  rooms.set(room.code, room);
}

export function deleteRoom(code: string): void {
  rooms.delete(code.toUpperCase());
}

export function getAllRooms(): ServerRoom[] {
  return [...rooms.values()];
}

/** Prune rooms older than TTL (call periodically) */
export function pruneExpiredRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      rooms.delete(code);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(pruneExpiredRooms, 10 * 60 * 1000);
