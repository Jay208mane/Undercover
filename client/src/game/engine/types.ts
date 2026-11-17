// ─────────────────────────────────────────────────────────────────────────────
// Local game engine types
// SECURITY: InternalPlayer contains PlayerRole — NEVER pass to UI directly.
//           UI components must only receive SafePlayer or PlayerView.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerRole, PlayerView, Language, WordPair } from '../../../../shared/types';
export type { PlayerRole, PlayerView, Language, WordPair };

// ── Internal engine representation — NEVER expose to UI ──────────────────────
export interface InternalPlayer {
  id: string;
  name: string;
  role: PlayerRole | null; // SECRET; assigned from the selected card
  word: string | null;     // SECRET
  isAlive: boolean;
}

export interface PrivateRoleCard {
  id: string;
  role: PlayerRole;
  word: string | null;
  picked: boolean;
}

// ── Safe public player — OK to pass to UI ────────────────────────────────────
export interface SafePlayer {
  id: string;
  name: string;
  isAlive: boolean;
  // role and word are intentionally absent
}

// ── Game phases ───────────────────────────────────────────────────────────────
export type LocalGamePhase =
  | 'SETUP'
  | 'ROLE_REVEAL_QUEUE'      // Waiting to pass phone to next player
  | 'ROLE_REVEAL_SHOW'       // Showing one player their private info
  | 'ROUND_WORD_REVEAL_QUEUE'
  | 'ROUND_WORD_REVEAL_SHOW'
  | 'DISCUSSION'
  | 'VOTING_QUEUE'           // Group selects one elimination candidate
  | 'ELIMINATION_RESULT'
  | 'MR_WHITE_GUESS'
  | 'GAME_OVER';

// ── Game config ───────────────────────────────────────────────────────────────
export interface LocalGameConfig {
  playerNames: string[];
  playerIds?: string[];
  imposterCount: number;
  mrWhiteEnabled: boolean;
  language: Language;
  category: string;
  customWordPair?: WordPair;
  discussionTimerSeconds: number;
  votingTimerSeconds: number;
}

// ── Elimination result ────────────────────────────────────────────────────────
export interface EliminationResult {
  player: SafePlayer;
  revealedRole: PlayerRole;    // revealed only at elimination moment
  revealedWord: string | null; // revealed only at elimination moment
  isMrWhite: boolean;
}

// ── Win state ─────────────────────────────────────────────────────────────────
export type WinnerFaction = 'CIVILIANS' | 'IMPOSTERS' | 'MR_WHITE';

export interface WinResult {
  winner: WinnerFaction;
  reason: string;
}

// ── Final results for results screen ─────────────────────────────────────────
export interface PlayerResult {
  id: string;
  name: string;
  role: PlayerRole;
  word: string | null;
  isAlive: boolean;
  pointsEarned: number;
}

// ── Safe config — subset of LocalGameConfig with no word data ────────────────
/** What the UI is allowed to see about the game config */
export interface SafeConfig {
  playerCount: number;
  imposterCount: number;
  mrWhiteEnabled: boolean;
  language: Language;
  category: string;
  discussionTimerSeconds: number;
  votingTimerSeconds: number;
}

// ── Full internal game state (engine-private) ─────────────────────────────────
export interface InternalGameState {
  gameId: string;
  phase: LocalGamePhase;
  config: LocalGameConfig;
  players: InternalPlayer[];         // SECRET
  roleCards: PrivateRoleCard[];      // SECRET card contents; expose IDs only
  selectedRoleCardId: string | null;
  revealQueueIndex: number;          // which player is next to see their info
  roundWordRevealPlayerIds: string[];
  roundWordRevealIndex: number;
  round: number;
  startingPlayerCount: number;
  startingCivilianCount: number;
  lastElimination: EliminationResult | null;
  mrWhiteGuessPending: boolean;
  winResult: WinResult | null;
  wordPair: WordPair;                // SECRET — the actual word pair used
  wordPairDeckIds: number[];         // SECRET — shuffled pair IDs for this game's cycle
  wordPairDeckIndex: number;
  civilianWord: string;              // SECRET
}
