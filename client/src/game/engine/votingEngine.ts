import type { InternalPlayer, EliminationResult } from './types';

/**
 * Eliminate a player and build the EliminationResult.
 * Mutates the players array (marks isAlive = false).
 * Returns the elimination result for the UI reveal.
 */
export function eliminatePlayer(
  players: InternalPlayer[],
  eliminatedId: string
): EliminationResult {
  const player = players.find((p) => p.id === eliminatedId);
  if (!player) throw new Error(`Player ${eliminatedId} not found.`);
  if (!player.isAlive) throw new Error(`Player ${player.name} is already eliminated.`);
  if (!player.role) throw new Error(`${player.name} has no assigned role.`);

  player.isAlive = false;

  return {
    player: {
      id: player.id,
      name: player.name,
      isAlive: false,
    },
    revealedRole: player.role,
    revealedWord: player.word,
    isMrWhite: player.role === 'MR_WHITE',
  };
}
