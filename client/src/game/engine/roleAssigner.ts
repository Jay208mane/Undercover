import type { InternalPlayer, LocalGameConfig, WordPair } from './types';

/**
 * Compute the number of imposters for a given player count.
 * Never exceeds MAX_IMPOSTERS_RATIO and always leaves ≥ 1 Civilian.
 */
export function getDefaultImposterCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 14) return 2;
  return 3;
}

/**
 * Validate role distribution before assignment.
 * Throws a descriptive error on invalid config.
 */
export function validateRoleConfig(config: {
  playerCount: number;
  imposterCount: number;
  mrWhiteEnabled: boolean;
}): void {
  const { playerCount, imposterCount, mrWhiteEnabled } = config;

  if (playerCount < 3) throw new Error('Minimum 3 players required.');
  if (playerCount > 20) throw new Error('Maximum 20 players allowed.');
  if (imposterCount < 1) throw new Error('At least 1 Imposter required.');

  const specialRoles = imposterCount + (mrWhiteEnabled ? 1 : 0);
  if (specialRoles >= playerCount) {
    throw new Error(
      `Not enough Civilians: ${playerCount} players but ${specialRoles} special roles assigned.`
    );
  }
}

/**
 * Assign roles and words to players.
 * Returns an array of InternalPlayer in SHUFFLED order so role positions are random.
 *
 * SECURITY: This is the ONLY place where PlayerRole is attached to a player.
 * The result must never be passed wholesale to any UI component.
 */
export function assignRoles(
  config: LocalGameConfig,
  wordPair: WordPair
): InternalPlayer[] {
  validateRoleConfig({
    playerCount: config.playerNames.length,
    imposterCount: config.imposterCount,
    mrWhiteEnabled: config.mrWhiteEnabled,
  });

  if (
    config.playerIds &&
    (config.playerIds.length !== config.playerNames.length ||
      new Set(config.playerIds).size !== config.playerIds.length)
  ) {
    throw new Error('Player identities must be unique and match the player list.');
  }
  const participants = config.playerNames.map((name, index) => ({
    id: config.playerIds?.[index] ?? `player_${index}`,
    name,
  }));
  fisherYatesShuffle(participants);

  // Build role slots: [imposter × N] [mr_white × 0|1] [civilian × rest]
  const roles: Array<{ role: 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE'; word: string | null }> = [];

  for (let i = 0; i < config.imposterCount; i++) {
    roles.push({ role: 'IMPOSTER', word: wordPair.imposter });
  }
  if (config.mrWhiteEnabled) {
    roles.push({ role: 'MR_WHITE', word: null });
  }
  while (roles.length < participants.length) {
    roles.push({ role: 'CIVILIAN', word: wordPair.civilian });
  }

  // Shuffle role slots independently so they don't track name shuffle
  fisherYatesShuffle(roles);

  return participants.map((participant, i) => ({
    id: participant.id,
    name: participant.name,
    role: roles[i].role,
    word: roles[i].word,
    isAlive: true,
  }));
}

/** In-place Fisher-Yates shuffle. Returns the same array for chaining. */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
