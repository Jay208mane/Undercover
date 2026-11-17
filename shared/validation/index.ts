export const VALIDATION = {
  PLAYER_NAME_MIN: 1,
  PLAYER_NAME_MAX: 20,
  ROOM_CODE_REGEX: /^[A-Z0-9]{6}$/,
  CUSTOM_WORD_MAX: 50,
} as const;
