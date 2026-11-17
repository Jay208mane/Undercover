import { randomBytes } from 'crypto';

/** playerId → sessionToken mapping (server-side) */
const tokens = new Map<string, string>(); // playerId → token

export function generateSessionToken(): string {
  return randomBytes(24).toString('hex');
}

export function storeToken(playerId: string, token: string): void {
  tokens.set(playerId, token);
}

export function validateToken(playerId: string, token: string): boolean {
  return tokens.get(playerId) === token;
}

export function revokeToken(playerId: string): void {
  tokens.delete(playerId);
}
