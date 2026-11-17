import type { Language } from '../../../shared/types';

export type OnlinePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'DISCUSSION'
  | 'VOTING'
  | 'ELIMINATION_RESULT'
  | 'MR_WHITE_GUESS'
  | 'GAME_OVER'
  | 'DISCONNECTED';

export interface OnlinePlayer {
  id: string;
  name: string;
  isAlive: boolean;
  isConnected: boolean;
  totalVotesReceived: number;
}

export interface PublicOnlineState {
  code: string;
  hostId: string;
  phase: OnlinePhase;
  players: OnlinePlayer[];
  round: number;
  winnerFaction: 'CIVILIANS' | 'IMPOSTERS' | 'MR_WHITE' | null;
  winReason: string;
  lastEliminatedId: string | null;
  mrWhiteGuessPending: boolean;
  discussionTimerSeconds: number;
}

export interface PrivateRoleInfo {
  word: string | null;
  roleLabel: 'Civilian' | 'Mr. White' | null;
  instructions: string;
}

export interface EliminationEvent {
  playerId: string;
  playerName: string;
  revealedRole: 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE';
  revealedWord: string | null;
  isMrWhite: boolean;
}

export interface PlayerResult {
  id: string;
  name: string;
  role: 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE';
  word: string | null;
  totalVotesReceived: number;
  isAlive: boolean;
}

export interface OnlineCreateConfig {
  playerName: string;
  language: Language;
  category: string;
  mrWhiteEnabled: boolean;
  discussionTimerSeconds: number;
}
