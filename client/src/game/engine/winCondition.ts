import type { InternalPlayer, WinResult } from './types';

/**
 * Evaluate win conditions after each elimination.
 * Returns a WinResult if someone has won, or null if the game continues.
 *
 * Rules:
 *   1. IMPOSTERS win when alive_imposters >= alive_civilians.
 *   2. CIVILIANS win when alive_imposters === 0 AND alive_mr_whites === 0.
 *   3. MR_WHITE win is handled separately via the guess mechanic (not here).
 */
export function evaluateWinCondition(players: InternalPlayer[]): WinResult | null {
  const alive = players.filter((p) => p.isAlive);

  const aliveCivilians = alive.filter((p) => p.role === 'CIVILIAN').length;
  const aliveImposters = alive.filter((p) => p.role === 'IMPOSTER').length;
  const aliveMrWhites  = alive.filter((p) => p.role === 'MR_WHITE').length;

  // Imposters win when they equal or outnumber civilians
  if (aliveImposters > 0 && aliveImposters >= aliveCivilians) {
    return {
      winner: 'IMPOSTERS',
      reason: `The Imposter${aliveImposters > 1 ? 's' : ''} survived long enough — civilians are outnumbered!`,
    };
  }

  // Civilians win when all imposters AND all Mr. Whites are eliminated
  if (aliveImposters === 0 && aliveMrWhites === 0) {
    return {
      winner: 'CIVILIANS',
      reason: 'All threats have been eliminated. Civilians win!',
    };
  }

  return null; // game continues
}

/**
 * Evaluate a Mr. White word guess.
 * Case-insensitive, trims whitespace.
 */
export function evaluateMrWhiteGuess(guess: string, civilianWord: string): boolean {
  return guess.trim().toLowerCase() === civilianWord.trim().toLowerCase();
}
