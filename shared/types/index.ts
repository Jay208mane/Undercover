// ─────────────────────────────────────────────────────────────────────────────
// UNDERCOVER — Shared Types
// CRITICAL: PlayerRole is INTERNAL ONLY. Never expose to clients via
// Socket.IO events or REST responses. Clients receive PlayerView instead.
// ─────────────────────────────────────────────────────────────────────────────

// ── Roles (server-side, never sent to clients) ───────────────────────────────
export type PlayerRole = 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE';

// ── What each player actually sees (safe to send) ────────────────────────────
export interface PlayerView {
  /** The word shown to this player. null for Mr. White. */
  word: string | null;
  /**
   * Label shown on the role card.
   * - 'Civilian'  → Civilian role card
   * - 'Mr. White' → Mr. White role card
   * - null        → Imposter sees no role label; just generic game instructions
   */
  roleLabel: 'Civilian' | 'Mr. White' | null;
  /** Generic instructions shown below the word */
  instructions: string;
}

// ── Languages ─────────────────────────────────────────────────────────────────
export type Language = 'en' | 'mr' | 'hi';

// ── Game phases ───────────────────────────────────────────────────────────────
export type GamePhase =
  | 'LOBBY'          // Waiting for players
  | 'ROLE_REVEAL'    // Pass device / show word screen one by one
  | 'DISCUSSION'     // Players discuss; timer running
  | 'VOTING'         // Voting round
  | 'ELIMINATION'    // Elimination animation
  | 'MR_WHITE_GUESS' // Mr. White gets to guess civilian word
  | 'RESULTS'        // Game over, show winner
  | 'LEADERBOARD';   // Show cumulative scores

// ── Game mode ─────────────────────────────────────────────────────────────────
export type GameMode = 'SINGLE_DEVICE' | 'ONLINE';

// ── Player (client-safe representation) ──────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  avatarIndex: number;
  isAlive: boolean;
  isSpectator: boolean;
  score: number;
}

// ── Word pair used in a game ──────────────────────────────────────────────────
export interface WordPair {
  id?: number;
  civilian: string;
  imposter: string;
  category: string;
  language: Language;
}

// ── Room config ───────────────────────────────────────────────────────────────
export interface RoomConfig {
  playerCount: number;
  imposterCount: number;
  mrWhiteEnabled: boolean;
  language: Language;
  customWords?: WordPair;
  discussionTimerSeconds: number;  // 0 = no timer
  votingTimerSeconds: number;      // 0 = no timer
  allowSpectators: boolean;
}

// ── Public game state (safe to broadcast) ─────────────────────────────────────
export interface PublicGameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  players: Player[];
  eliminatedPlayerIds: string[];
  config: RoomConfig;
  /** Ids of players who have submitted their vote this round */
  votedPlayerIds: string[];
  /** Populated only during RESULTS / after MR_WHITE_GUESS */
  winner?: 'CIVILIANS' | 'IMPOSTER' | 'MR_WHITE';
}

// ── Socket event names ────────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  // Room lifecycle
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_UPDATED: 'room_updated',
  ROOM_ERROR: 'room_error',

  // Game flow
  START_GAME: 'start_game',
  GAME_STATE: 'game_state',
  NEXT_PHASE: 'next_phase',

  // Role reveal (server → individual socket)
  YOUR_ROLE: 'your_role',         // Sends PlayerView — never PlayerRole

  // Voting
  SUBMIT_VOTE: 'submit_vote',
  VOTE_RESULT: 'vote_result',
  ELIMINATION: 'elimination',

  // Mr. White special
  MR_WHITE_GUESS: 'mr_white_guess',
  MR_WHITE_RESULT: 'mr_white_result',

  // Chat / discussion
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',

  // Voice (signalling)
  VOICE_OFFER: 'voice_offer',
  VOICE_ANSWER: 'voice_answer',
  VOICE_ICE: 'voice_ice',

  // Utility
  PING: 'ping',
  PONG: 'pong',
  RECONNECT: 'reconnect_player',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// ── Leaderboard entry ─────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  playerName: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;
}

// ── API response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
