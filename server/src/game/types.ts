/**
 * Server-side room and game types.
 * SECURITY: ServerRoom contains InternalPlayer[] — never serialise it wholesale to clients.
 */

import type { Language } from '../../../shared/types';

// ── Room phases ───────────────────────────────────────────────────────────────
export type RoomPhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'DISCUSSION'
  | 'VOTING'
  | 'ELIMINATION_RESULT'
  | 'MR_WHITE_GUESS'
  | 'GAME_OVER';

// ── Lobby player ──────────────────────────────────────────────────────────────
export interface LobbyPlayer {
  id: string;        // stable across reconnects
  socketId: string;  // current socket (changes on reconnect)
  name: string;
  isReady: boolean;
  isConnected: boolean;
}

// ── Internal game player (server-only, never sent wholesale) ──────────────────
export interface ServerInternalPlayer {
  id: string;
  name: string;
  socketId: string;
  role: 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE';   // SECRET
  word: string | null;                            // SECRET
  isAlive: boolean;
  votesReceivedThisRound: number;
  totalVotesReceived: number;
}

// ── Safe player for broadcast ─────────────────────────────────────────────────
export interface SafeOnlinePlayer {
  id: string;
  name: string;
  isAlive: boolean;
  isConnected: boolean;
  totalVotesReceived: number;
}

// ── Vote record ───────────────────────────────────────────────────────────────
export interface ServerVote {
  voterId: string;
  targetId: string;
}

// ── The full server room (kept only in memory) ───────────────────────────────
export interface ServerRoom {
  code: string;
  hostId: string;
  phase: RoomPhase;
  lobbyPlayers: LobbyPlayer[];          // used before game starts
  gamePlayers: ServerInternalPlayer[];  // used during game — SECRET
  votes: ServerVote[];
  round: number;
  wordPairCivilian: string;             // SECRET
  wordPairImposter: string;             // SECRET
  wordPairCategory: string;
  wordPairDeckIds: number[];
  wordPairDeckIndex: number;
  language: Language;
  mrWhiteEnabled: boolean;
  discussionTimerSeconds: number;
  revealQueueIndex: number;             // online reveal: who's next
  winnerFaction: 'CIVILIANS' | 'IMPOSTERS' | 'MR_WHITE' | null;
  winReason: string;
  lastEliminatedId: string | null;
  mrWhiteGuessPending: boolean;
  createdAt: number;
}

// ── Public room snapshot — safe to broadcast ──────────────────────────────────
export interface PublicRoomState {
  code: string;
  hostId: string;
  phase: RoomPhase;
  players: SafeOnlinePlayer[];         // no roles, no words
  round: number;
  winnerFaction: ServerRoom['winnerFaction'];
  winReason: string;
  lastEliminatedId: string | null;
  mrWhiteGuessPending: boolean;
  discussionTimerSeconds: number;
}

// ── Socket event payloads ─────────────────────────────────────────────────────

export interface CreateRoomPayload {
  playerName: string;
  language: Language;
  category: string;
  mrWhiteEnabled: boolean;
  discussionTimerSeconds: number;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  sessionToken?: string; // for reconnect
}

export interface StartGamePayload {
  roomCode: string;
}

export interface ReadyPayload {
  roomCode: string;
}

export interface VotePayload {
  roomCode: string;
  targetId: string;
}

export interface MrWhiteGuessPayload {
  roomCode: string;
  guess: string;
}

export interface ReconnectPayload {
  roomCode: string;
  sessionToken: string;
}

// ── What each player gets privately on role reveal ────────────────────────────
export interface PrivateRoleInfo {
  word: string | null;
  roleLabel: 'Civilian' | 'Mr. White' | null; // null for Imposter
  instructions: string;
}
