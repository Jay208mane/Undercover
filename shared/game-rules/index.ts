// Shared game rule constants used by both client engine and server
export const GAME_RULES = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 20,
  MIN_IMPOSTERS: 1,
  MAX_IMPOSTERS_RATIO: 0.3, // At most 30% of players can be imposters
  DEFAULT_DISCUSSION_TIMER: 180, // seconds
  DEFAULT_VOTING_TIMER: 60,     // seconds
  ROOM_CODE_LENGTH: 6,
  ROOM_EXPIRY_MINUTES: 60,
} as const;

export const VICTORY_CONDITIONS = {
  // Civilians win when all imposters are eliminated before Mr. White (if present)
  CIVILIANS_WIN_MSG: 'Civilians found all imposters!',
  IMPOSTER_WIN_MSG: 'Imposter survived!',
  MR_WHITE_WIN_MSG: 'Mr. White guessed the word correctly!',
} as const;
