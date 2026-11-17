import type { PlayerResult, WinnerFaction } from '../engine/types';

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  totalPoints: number;
}

export interface AllTimeLeaderboard {
  version: 1;
  players: LeaderboardEntry[];
  completedGameIds: string[];
}

export interface CurrentGameEntry {
  playerId: string;
  name: string;
  pointsEarned: number;
}

export interface CurrentGameLeaderboard {
  gameId: string;
  entries: CurrentGameEntry[];
  scored: boolean;
}

export interface CompletedGame {
  gameId: string;
  winner: WinnerFaction;
  scores: PlayerResult[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const ALL_TIME_LEADERBOARD_KEY = 'undercover.all-time-leaderboard.v1';
export const CURRENT_GAME_LEADERBOARD_KEY = 'undercover.current-game-leaderboard.v1';

export function emptyAllTimeLeaderboard(): AllTimeLeaderboard {
  return { version: 1, players: [], completedGameIds: [] };
}

export function loadAllTimeLeaderboard(storage = getStorage()): AllTimeLeaderboard {
  if (!storage) return emptyAllTimeLeaderboard();
  const raw = readStoredValue(storage, ALL_TIME_LEADERBOARD_KEY);
  if (!raw) return emptyAllTimeLeaderboard();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAllTimeLeaderboard(parsed)) throw new Error('Stored all-time leaderboard has an invalid shape.');
    return parsed;
  } catch (error) {
    console.error('Unable to read stored all-time leaderboard; starting empty.', error);
    return emptyAllTimeLeaderboard();
  }
}

export function loadCurrentGameLeaderboard(storage = getStorage()): CurrentGameLeaderboard | null {
  if (!storage) return null;
  const raw = readStoredValue(storage, CURRENT_GAME_LEADERBOARD_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isCurrentGameLeaderboard(parsed)) throw new Error('Stored current-game leaderboard has an invalid shape.');
    return parsed;
  } catch (error) {
    console.error('Unable to read stored current-game leaderboard; starting empty.', error);
    return null;
  }
}

export function registerPlayerIdentities(
  leaderboard: AllTimeLeaderboard,
  names: string[],
  createId: () => string
): { leaderboard: AllTimeLeaderboard; playerIds: string[] } {
  const players = leaderboard.players.map((player) => ({ ...player }));
  const playerIds = names.map((name) => {
    const normalizedName = normalizeName(name);
    const existing = players.find((player) => normalizeName(player.name) === normalizedName);
    if (existing) {
      existing.name = name;
      return existing.playerId;
    }

    const playerId = createId();
    players.push({ playerId, name, totalPoints: 0 });
    return playerId;
  });
  return {
    leaderboard: { ...leaderboard, players },
    playerIds,
  };
}

export function createCurrentGameLeaderboard(
  gameId: string,
  players: Array<{ playerId: string; name: string }>
): CurrentGameLeaderboard {
  return {
    gameId,
    entries: players.map(({ playerId, name }) => ({
      playerId,
      name,
      pointsEarned: 0,
    })),
    scored: false,
  };
}

export function applyCurrentGameScores(
  board: CurrentGameLeaderboard,
  gameId: string,
  scores: PlayerResult[]
): CurrentGameLeaderboard {
  if (board.gameId !== gameId || board.scored) return board;
  const scoreById = new Map(scores.map((score) => [score.id, score.pointsEarned]));
  return {
    ...board,
    scored: true,
    entries: board.entries.map((entry) => ({
      ...entry,
      pointsEarned: scoreById.get(entry.playerId) ?? 0,
    })),
  };
}

export function applyAllTimeScores(
  leaderboard: AllTimeLeaderboard,
  gameId: string,
  scores: PlayerResult[]
): AllTimeLeaderboard {
  if (leaderboard.completedGameIds.includes(gameId)) return leaderboard;

  const players = leaderboard.players.map((player) => ({ ...player }));
  for (const score of scores) {
    let player = players.find((entry) => entry.playerId === score.id);
    if (!player) {
      player = { playerId: score.id, name: score.name, totalPoints: 0 };
      players.push(player);
    }
    player.name = score.name;
    player.totalPoints += score.pointsEarned;
  }

  return {
    ...leaderboard,
    players,
    completedGameIds: [...leaderboard.completedGameIds, gameId],
  };
}

export function persistAllTimeLeaderboard(
  leaderboard: AllTimeLeaderboard,
  storage = getStorage()
): boolean {
  return writeStoredValue(storage, ALL_TIME_LEADERBOARD_KEY, leaderboard);
}

export function persistCurrentGameLeaderboard(
  leaderboard: CurrentGameLeaderboard,
  storage = getStorage()
): boolean {
  return writeStoredValue(storage, CURRENT_GAME_LEADERBOARD_KEY, leaderboard);
}

export function clearAllTimeLeaderboard(storage = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(ALL_TIME_LEADERBOARD_KEY);
    return true;
  } catch (error) {
    console.error('Unable to reset the all-time leaderboard.', error);
    return false;
  }
}

function getStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch (error) {
    console.error('Browser storage is unavailable for leaderboards.', error);
    return null;
  }
}

function readStoredValue(storage: StorageLike, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.error(`Unable to read stored leaderboard data (${key}).`, error);
    return null;
  }
}

function writeStoredValue(
  storage: StorageLike | null,
  key: string,
  value: unknown
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save leaderboard data (${key}).`, error);
    return false;
  }
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function isAllTimeLeaderboard(value: unknown): value is AllTimeLeaderboard {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AllTimeLeaderboard>;
  return candidate.version === 1 &&
    Array.isArray(candidate.players) &&
    candidate.players.every((player) =>
      !!player &&
      typeof player.playerId === 'string' &&
      typeof player.name === 'string' &&
      Number.isFinite(player.totalPoints) &&
      player.totalPoints >= 0
    ) &&
    Array.isArray(candidate.completedGameIds) &&
    candidate.completedGameIds.every((gameId) => typeof gameId === 'string');
}

function isCurrentGameLeaderboard(value: unknown): value is CurrentGameLeaderboard {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CurrentGameLeaderboard>;
  return typeof candidate.gameId === 'string' &&
    typeof candidate.scored === 'boolean' &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every((entry) =>
      !!entry &&
      typeof entry.playerId === 'string' &&
      typeof entry.name === 'string' &&
      Number.isFinite(entry.pointsEarned) &&
      entry.pointsEarned >= 0
    );
}
