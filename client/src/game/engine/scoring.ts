import type { PlayerResult, WinnerFaction } from './types';

/**
 * Compute the only points allowed by the local game's scoring rules.
 * The player list is the complete starting roster, not just survivors.
 */
export function calculateGameScores(
  players: PlayerResult[],
  winner: WinnerFaction,
  startingCivilianCount: number,
  startingPlayerCount: number
): PlayerResult[] {
  const pointsByRole: Record<WinnerFaction, number> = {
    CIVILIANS: 2,
    IMPOSTERS: startingCivilianCount * 2,
    MR_WHITE: startingPlayerCount * 2,
  };
  const winningRole = winner === 'CIVILIANS'
    ? 'CIVILIAN'
    : winner === 'IMPOSTERS'
      ? 'IMPOSTER'
      : 'MR_WHITE';

  return players.map((player) => ({
    ...player,
    pointsEarned: player.role === winningRole ? pointsByRole[winner] : 0,
  }));
}
