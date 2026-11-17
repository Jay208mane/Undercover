/**
 * Game state machine for single-device play.
 *
 * All transitions are pure functions that take InternalGameState and return
 * a new state. No side effects, no React, no DOM.
 *
 * SECURITY: InternalGameState contains secret roles/words.
 *           Never return this state directly to UI components.
 *           Use the safe accessor functions at the bottom of this file.
 */

import type {
  InternalGameState,
  InternalPlayer,
  LocalGameConfig,
  SafePlayer,
  PlayerView,
  PlayerResult,
  SafeConfig,
} from './types';
import { createWordPairCycle, selectWordPair, selectWordPairById } from './wordSelector';
import { assignRoles, fisherYatesShuffle } from './roleAssigner';
import { buildPlayerView } from './playerView';
import { evaluateWinCondition, evaluateMrWhiteGuess } from './winCondition';
import { eliminatePlayer } from './votingEngine';

// ── Init ──────────────────────────────────────────────────────────────────────

export function initGame(config: LocalGameConfig): InternalGameState {
  const wordPairDeckIds = createWordPairCycle(config.category);
  const wordPair = config.customWordPair
    ? selectWordPair(config.language, config.category, config.customWordPair)
    : selectWordPairById(config.language, wordPairDeckIds[0]);
  const assignedPlayers = assignRoles(config, wordPair);
  const roleCards = fisherYatesShuffle(
    assignedPlayers.map((player, index) => {
      if (!player.role) throw new Error('Role assignment did not produce a role card.');
      return {
        id: `card_${index}`,
        role: player.role,
        word: player.word,
        picked: false,
      };
    })
  );
  const players = assignedPlayers.map((player) => ({
    ...player,
    role: null,
    word: null,
  }));

  return {
    gameId: createGameId(),
    phase: 'ROLE_REVEAL_QUEUE',
    config,
    players,
    roleCards,
    selectedRoleCardId: null,
    revealQueueIndex: 0,
    roundWordRevealPlayerIds: [],
    roundWordRevealIndex: 0,
    round: 1,
    startingPlayerCount: assignedPlayers.length,
    startingCivilianCount: assignedPlayers.filter((player) => player.role === 'CIVILIAN').length,
    lastElimination: null,
    mrWhiteGuessPending: false,
    winResult: null,
    wordPair,
    wordPairDeckIds,
    wordPairDeckIndex: config.customWordPair ? 0 : 1,
    civilianWord: wordPair.civilian,
  };
}

/** Return to the same discussion round if the group cannot decide. */
export function returnToDiscussion(state: InternalGameState): InternalGameState {
  if (state.phase !== 'VOTING_QUEUE') {
    throw invalidTransition(state.phase, 'returnToDiscussion');
  }
  return { ...state, phase: 'DISCUSSION' };
}

// ── Reveal phase ──────────────────────────────────────────────────────────────

/** Select a single face-down card for the current player. */
export function pickRoleCard(state: InternalGameState, cardId: string): InternalGameState {
  if (state.phase !== 'ROLE_REVEAL_QUEUE') {
    throw invalidTransition(state.phase, 'pickRoleCard');
  }

  const cardIndex = state.roleCards.findIndex((card) => card.id === cardId);
  const card = state.roleCards[cardIndex];
  if (!card || card.picked) throw new Error('That card is no longer available.');

  const player = state.players[state.revealQueueIndex];
  if (!player) throw new Error('There is no player waiting to pick a card.');

  const players = state.players.map((candidate, index) =>
    index === state.revealQueueIndex
      ? { ...candidate, role: card.role, word: card.word }
      : candidate
  );
  const roleCards = state.roleCards.map((candidate, index) =>
    index === cardIndex ? { ...candidate, picked: true } : candidate
  );

  return {
    ...state,
    phase: 'ROLE_REVEAL_SHOW',
    players,
    roleCards,
    selectedRoleCardId: card.id,
  };
}

/** Legacy engine helper: select the first remaining card. */
export function showReveal(state: InternalGameState): InternalGameState {
  const card = state.roleCards.find((candidate) => !candidate.picked);
  if (!card) throw new Error('There are no cards left to pick.');
  return pickRoleCard(state, card.id);
}

/** Hide the selected card and advance to the next player or discussion. */
export function hideReveal(state: InternalGameState): InternalGameState {
  if (state.phase === 'ROUND_WORD_REVEAL_SHOW') {
    const nextIndex = state.roundWordRevealIndex + 1;
    const allRevealed = nextIndex >= state.roundWordRevealPlayerIds.length;
    return {
      ...state,
      roundWordRevealIndex: nextIndex,
      roundWordRevealPlayerIds: allRevealed ? [] : state.roundWordRevealPlayerIds,
      phase: allRevealed ? 'DISCUSSION' : 'ROUND_WORD_REVEAL_QUEUE',
    };
  }
  if (state.phase !== 'ROLE_REVEAL_SHOW') throw invalidTransition(state.phase, 'hideReveal');

  const nextIndex = state.revealQueueIndex + 1;
  const allRevealed = nextIndex >= state.players.length;

  return {
    ...state,
    revealQueueIndex: nextIndex,
    selectedRoleCardId: null,
    phase: allRevealed ? 'DISCUSSION' : 'ROLE_REVEAL_QUEUE',
  };
}

export function showRoundWordReveal(state: InternalGameState): InternalGameState {
  if (state.phase !== 'ROUND_WORD_REVEAL_QUEUE') {
    throw invalidTransition(state.phase, 'showRoundWordReveal');
  }
  if (!state.roundWordRevealPlayerIds[state.roundWordRevealIndex]) {
    throw new Error('There is no active player waiting to see the new word.');
  }
  return { ...state, phase: 'ROUND_WORD_REVEAL_SHOW' };
}

// ── Discussion → Voting ───────────────────────────────────────────────────────

export function startVoting(state: InternalGameState): InternalGameState {
  if (state.phase !== 'DISCUSSION') throw invalidTransition(state.phase, 'startVoting');
  return { ...state, phase: 'VOTING_QUEUE' };
}

/** Eliminate the active player selected by the group. */
export function eliminateGroupSelection(
  state: InternalGameState,
  eliminatedId: string
): InternalGameState {
  if (state.phase !== 'VOTING_QUEUE') {
    throw invalidTransition(state.phase, 'eliminateGroupSelection');
  }
  const candidate = state.players.find((player) => player.id === eliminatedId);
  if (!candidate?.isAlive) throw new Error('That player is not active.');

  const mutablePlayers: InternalPlayer[] = state.players.map((p) => ({ ...p }));
  const elimination = eliminatePlayer(mutablePlayers, eliminatedId);

  // If Mr. White, trigger guess phase
  if (elimination.isMrWhite) {
    return {
      ...state,
      players: mutablePlayers,
      lastElimination: elimination,
      phase: 'MR_WHITE_GUESS',
      mrWhiteGuessPending: true,
    };
  }

  // Check win conditions after elimination
  const winResult = evaluateGameEnding(mutablePlayers);
  if (winResult) {
    return {
      ...state,
      players: mutablePlayers,
      lastElimination: elimination,
      winResult,
      phase: 'GAME_OVER',
    };
  }

  return {
    ...state,
    players: mutablePlayers,
    lastElimination: elimination,
    phase: 'ELIMINATION_RESULT',
  };
}

/** After seeing elimination, continue to next discussion round */
export function continueToDiscussion(state: InternalGameState): InternalGameState {
  if (state.phase !== 'ELIMINATION_RESULT') throw invalidTransition(state.phase, 'continueToDiscussion');

  let wordPair = state.wordPair;
  let wordPairDeckIds = state.wordPairDeckIds;
  let wordPairDeckIndex = state.wordPairDeckIndex;
  let players = state.players;
  if (!state.config.customWordPair) {
    if (wordPairDeckIndex >= wordPairDeckIds.length) {
      wordPairDeckIds = createWordPairCycle(state.config.category);
      wordPairDeckIndex = 0;
    }
    wordPair = selectWordPairById(
      state.config.language,
      wordPairDeckIds[wordPairDeckIndex]
    );
    wordPairDeckIndex += 1;
    players = state.players.map((player) => ({
      ...player,
      word: player.role === 'CIVILIAN'
        ? wordPair.civilian
        : player.role === 'IMPOSTER'
          ? wordPair.imposter
          : null,
    }));
  }

  return {
    ...state,
    players,
    wordPair,
    civilianWord: wordPair.civilian,
    wordPairDeckIds,
    wordPairDeckIndex,
    roundWordRevealPlayerIds: players.filter((player) => player.isAlive).map((player) => player.id),
    roundWordRevealIndex: 0,
    phase: 'ROUND_WORD_REVEAL_QUEUE',
    round: state.round + 1,
    lastElimination: null, // cleared immediately — no longer readable from context
  };
}

// ── Per-player view accessor (future online-mode safe path) ─────────────────

/**
 * Get the PlayerView for a specific player by id.
 * Only callable during ROLE_REVEAL_SHOW and only for the CURRENT reveal player.
 * Returns null for any other player or phase — no peeking.
 */
export function getPlayerView(
  state: InternalGameState,
  playerId: string
): PlayerView | null {
  if (state.phase === 'ROUND_WORD_REVEAL_SHOW') {
    const currentId = state.roundWordRevealPlayerIds[state.roundWordRevealIndex];
    if (currentId !== playerId) return null;
    const current = state.players.find((player) => player.id === currentId);
    return current?.role ? buildPlayerView(current) : null;
  }
  if (state.phase !== 'ROLE_REVEAL_SHOW') return null;
  const current = state.players[state.revealQueueIndex];
  if (!current || current.id !== playerId || !current.role) return null;
  return buildPlayerView(current);
}

// ── Mr. White guess ───────────────────────────────────────────────────────────

export function submitMrWhiteGuess(
  state: InternalGameState,
  guess: string
): InternalGameState {
  if (state.phase !== 'MR_WHITE_GUESS') throw invalidTransition(state.phase, 'submitMrWhiteGuess');

  const correct = evaluateMrWhiteGuess(guess, state.civilianWord);

  if (correct) {
    return {
      ...state,
      mrWhiteGuessPending: false,
      winResult: {
        winner: 'MR_WHITE',
        reason: 'Mr. White guessed the Civilian word correctly!',
      },
      phase: 'GAME_OVER',
    };
  }

  // Wrong guess — evaluate remaining players
  const winResult = evaluateGameEnding(state.players);
  if (winResult) {
    return {
      ...state,
      mrWhiteGuessPending: false,
      winResult,
      phase: 'GAME_OVER',
    };
  }

  // Game continues with Mr. White eliminated but no winner yet
  return {
    ...state,
    mrWhiteGuessPending: false,
    phase: 'ELIMINATION_RESULT',
  };
}

// ── Safe accessor functions — these are what UI receives ─────────────────────

/** Get the player whose turn it is to see their reveal */
export function getCurrentRevealPlayer(state: InternalGameState): SafePlayer | null {
  if (state.phase === 'ROUND_WORD_REVEAL_QUEUE' || state.phase === 'ROUND_WORD_REVEAL_SHOW') {
    const playerId = state.roundWordRevealPlayerIds[state.roundWordRevealIndex];
    const currentPlayer = state.players.find((player) => player.id === playerId);
    return currentPlayer ? toSafePlayer(currentPlayer) : null;
  }
  const p = state.players[state.revealQueueIndex];
  if (!p) return null;
  return toSafePlayer(p);
}

/** Get the PlayerView for the current reveal player — the ONLY time we expose word.
 * Returns null if the phase is not ROLE_REVEAL_SHOW. */
export function getCurrentPlayerView(state: InternalGameState): PlayerView | null {
  if (state.phase === 'ROUND_WORD_REVEAL_SHOW') {
    const playerId = state.roundWordRevealPlayerIds[state.roundWordRevealIndex];
    const player = state.players.find((candidate) => candidate.id === playerId);
    return player?.role ? buildPlayerView(player) : null;
  }
  if (state.phase !== 'ROLE_REVEAL_SHOW') return null;
  const p = state.players[state.revealQueueIndex];
  if (!p || !p.role) return null;
  return buildPlayerView(p);
}

/** Get all alive players as SafePlayer array (no roles, no words) */
export function getAliveSafePlayers(state: InternalGameState): SafePlayer[] {
  return state.players.filter((p) => p.isAlive).map(toSafePlayer);
}

/** Get all players as SafePlayer */
export function getAllSafePlayers(state: InternalGameState): SafePlayer[] {
  return state.players.map(toSafePlayer);
}

/** Get full results for the GAME_OVER screen (reveals roles and words) */
export function getGameResults(state: InternalGameState): PlayerResult[] {
  if (state.phase !== 'GAME_OVER') throw new Error('Results only available after game over.');
  return state.players.map((p) => {
    if (!p.role) throw new Error(`Player ${p.name} has no assigned role.`);
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      word: p.word,
      isAlive: p.isAlive,
      pointsEarned: 0,
    };
  });
}

/** Return face-down card identifiers only; never expose private card contents. */
export function getAvailableRoleCardIds(state: InternalGameState): string[] {
  if (state.phase !== 'ROLE_REVEAL_QUEUE') return [];
  return state.roleCards.filter((card) => !card.picked).map((card) => card.id);
}

/** Build a SafePlayer from an InternalPlayer (strips role and word) */
function toSafePlayer(p: InternalPlayer): SafePlayer {
  return {
    id: p.id,
    name: p.name,
    isAlive: p.isAlive,
  };
}

function invalidTransition(current: string, action: string): Error {
  return new Error(`Invalid transition: cannot perform "${action}" from phase "${current}".`);
}

/** Return a safe subset of config — strips customWordPair (contains both secret words) */
export function getSafeConfig(state: InternalGameState): SafeConfig {
  return {
    playerCount: state.config.playerNames.length,
    imposterCount: state.config.imposterCount,
    mrWhiteEnabled: state.config.mrWhiteEnabled,
    language: state.config.language,
    category: state.config.category,
    discussionTimerSeconds: state.config.discussionTimerSeconds,
    votingTimerSeconds: state.config.votingTimerSeconds,
  };
}

function evaluateGameEnding(players: InternalPlayer[]): ReturnType<typeof evaluateWinCondition> {
  const establishedWin = evaluateWinCondition(players);
  if (establishedWin) return establishedWin;

  if (players.filter((player) => player.isAlive).length === 2) {
    return {
      winner: 'CIVILIANS',
      reason: 'Two players remain. The Civilians win this game.',
    };
  }
  return null;
}

function createGameId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `game_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}
