import { describe, it, expect } from 'vitest';
import {
  assignRoles,
  getDefaultImposterCount,
  validateRoleConfig,
  fisherYatesShuffle,
} from '../../client/src/game/engine/roleAssigner';
import { buildPlayerView } from '../../client/src/game/engine/playerView';
import {
  evaluateWinCondition,
  evaluateMrWhiteGuess,
} from '../../client/src/game/engine/winCondition';
import {
  initGame,
  pickRoleCard,
  showReveal,
  hideReveal,
  showRoundWordReveal,
  getAvailableRoleCardIds,
  startVoting,
  eliminateGroupSelection,
  returnToDiscussion,
  submitMrWhiteGuess,
  continueToDiscussion,
  getCurrentPlayerView,
  getGameResults,
} from '../../client/src/game/engine/gameEngine';
import { selectWordPair } from '../../client/src/game/engine/wordSelector';
import { calculateGameScores } from '../../client/src/game/engine/scoring';
import {
  applyAllTimeScores,
  applyCurrentGameScores,
  clearAllTimeLeaderboard,
  createCurrentGameLeaderboard,
  emptyAllTimeLeaderboard,
  loadAllTimeLeaderboard,
  loadCurrentGameLeaderboard,
  persistAllTimeLeaderboard,
  persistCurrentGameLeaderboard,
  registerPlayerIdentities,
  type StorageLike,
} from '../../client/src/game/local/leaderboardStorage';
import type {
  InternalGameState,
  LocalGameConfig,
  InternalPlayer,
} from '../../client/src/game/engine/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(
  count: number,
  mrWhite = false,
  language: LocalGameConfig['language'] = 'en'
): LocalGameConfig {
  return {
    playerNames: Array.from({ length: count }, (_, i) => `P${i + 1}`),
    imposterCount: getDefaultImposterCount(count),
    mrWhiteEnabled: mrWhite,
    language,
    category: 'random',
    discussionTimerSeconds: 180,
    votingTimerSeconds: 60,
  };
}

const WORD_PAIR = { civilian: 'Apple', imposter: 'Mango', category: 'food', language: 'en' as const };

// ── Role distribution ─────────────────────────────────────────────────────────

describe('getDefaultImposterCount', () => {
  it('returns 1 for 3-5 players', () => {
    expect(getDefaultImposterCount(3)).toBe(1);
    expect(getDefaultImposterCount(5)).toBe(1);
  });
  it('returns 2 for 6-14 players', () => {
    expect(getDefaultImposterCount(6)).toBe(2);
    expect(getDefaultImposterCount(14)).toBe(2);
  });
  it('returns 3 for 15-20 players', () => {
    expect(getDefaultImposterCount(15)).toBe(3);
    expect(getDefaultImposterCount(20)).toBe(3);
  });
});

describe('validateRoleConfig', () => {
  it('throws for < 3 players', () => {
    expect(() => validateRoleConfig({ playerCount: 2, imposterCount: 1, mrWhiteEnabled: false })).toThrow();
  });
  it('throws when special roles >= player count', () => {
    expect(() => validateRoleConfig({ playerCount: 3, imposterCount: 2, mrWhiteEnabled: true })).toThrow();
  });
  it('passes valid config', () => {
    expect(() => validateRoleConfig({ playerCount: 5, imposterCount: 1, mrWhiteEnabled: false })).not.toThrow();
  });
});

describe('assignRoles', () => {
  for (let count = 3; count <= 20; count++) {
    it(`${count} players: always has at least 1 civilian`, () => {
      const config = makeConfig(count);
      const players = assignRoles(config, WORD_PAIR);
      const civilians = players.filter((p) => p.role === 'CIVILIAN');
      expect(civilians.length).toBeGreaterThanOrEqual(1);
    });
  }

  it('imposter receives the imposter word', () => {
    const players = assignRoles(makeConfig(5), WORD_PAIR);
    const imposters = players.filter((p) => p.role === 'IMPOSTER');
    imposters.forEach((p) => expect(p.word).toBe(WORD_PAIR.imposter));
  });

  it('civilians receive the civilian word', () => {
    const players = assignRoles(makeConfig(5), WORD_PAIR);
    const civilians = players.filter((p) => p.role === 'CIVILIAN');
    civilians.forEach((p) => expect(p.word).toBe(WORD_PAIR.civilian));
  });

  it('mr. white receives no word', () => {
    const config = makeConfig(5, true);
    const players = assignRoles(config, WORD_PAIR);
    const mrWhites = players.filter((p) => p.role === 'MR_WHITE');
    expect(mrWhites.length).toBe(1);
    mrWhites.forEach((p) => expect(p.word).toBeNull());
  });

  it('imposter and civilian words are different', () => {
    expect(WORD_PAIR.civilian).not.toBe(WORD_PAIR.imposter);
  });
});

// ── Player view — hidden Imposter mechanic ─────────────────────────────────────

describe('buildPlayerView', () => {
  const makePlayer = (role: InternalPlayer['role'], word: string | null): InternalPlayer => ({
    id: 'x', name: 'X', role, word, isAlive: true,
  });

  it('civilian view has roleLabel = Civilian', () => {
    const view = buildPlayerView(makePlayer('CIVILIAN', 'Apple'));
    expect(view.roleLabel).toBe('Civilian');
    expect(view.word).toBe('Apple');
  });

  it('imposter view has roleLabel = null (NEVER shows Imposter)', () => {
    const view = buildPlayerView(makePlayer('IMPOSTER', 'Mango'));
    expect(view.roleLabel).toBeNull();
    // Imposter instructions must NOT contain the word "Imposter"
    expect(view.instructions.toLowerCase()).not.toContain('imposter');
    expect(view.instructions.toLowerCase()).not.toContain('different');
  });

  it('imposter still receives their word', () => {
    const view = buildPlayerView(makePlayer('IMPOSTER', 'Mango'));
    expect(view.word).toBe('Mango');
  });

  it('mr. white view has roleLabel = Mr. White and no word', () => {
    const view = buildPlayerView(makePlayer('MR_WHITE', null));
    expect(view.roleLabel).toBe('Mr. White');
    expect(view.word).toBeNull();
  });
});

// ── Win conditions ────────────────────────────────────────────────────────────

function makePlayers(defs: Array<{ role: InternalPlayer['role']; alive: boolean }>): InternalPlayer[] {
  return defs.map((d, i) => ({
    id: `p${i}`, name: `P${i}`, role: d.role,
    word: d.role === 'MR_WHITE' ? null : d.role === 'IMPOSTER' ? 'Mango' : 'Apple',
    isAlive: d.alive,
  }));
}

function setRoles(
  state: InternalGameState,
  roles: InternalPlayer['role'][]
): InternalGameState {
  const resolvedRoles = roles.map((role) => {
    if (!role) throw new Error('Test role must be assigned.');
    return role;
  });
  const roleCards = resolvedRoles.map((role, index) => ({
    id: `test_card_${index}`,
    role,
    word:
      role === 'MR_WHITE'
        ? null
        : role === 'IMPOSTER'
          ? state.wordPair.imposter
          : state.wordPair.civilian,
    picked: false,
  }));
  const shuffledCards = [...roleCards].reverse();
  return {
    ...state,
    roleCards: shuffledCards,
    players: state.players.map((player, index) => ({
      ...player,
      role: null,
      word: null,
    })),
  };
}

function resultPlayers(roles: InternalPlayer['role'][]) {
  return roles.map((role, index) => ({
    id: `stable_${index}`,
    name: `Player ${index + 1}`,
    role: role!,
    word: role === 'MR_WHITE' ? null : role === 'IMPOSTER' ? 'Mango' : 'Apple',
    isAlive: index % 2 === 0,
    pointsEarned: 0,
  }));
}

function revealEveryone(state: InternalGameState): InternalGameState {
  for (let i = 0; i < state.players.length; i++) {
    state = showReveal(state);
    const player = state.players[state.revealQueueIndex];
    const view = getCurrentPlayerView(state)!;
    if (player.role === 'CIVILIAN') {
      expect(view.word).toBe(state.wordPair.civilian);
      expect(view.roleLabel).toBe('Civilian');
    } else if (player.role === 'IMPOSTER') {
      expect(view.word).toBe(state.wordPair.imposter);
      expect(view.roleLabel).toBeNull();
    } else {
      expect(view.word).toBeNull();
      expect(view.roleLabel).toBe('Mr. White');
    }
    state = hideReveal(state);
  }
  return state;
}

function revealRoundWords(state: InternalGameState): InternalGameState {
  while (state.phase === 'ROUND_WORD_REVEAL_QUEUE') {
    state = showRoundWordReveal(state);
    const currentPlayerId = state.roundWordRevealPlayerIds[state.roundWordRevealIndex];
    const player = state.players.find((candidate) => candidate.id === currentPlayerId)!;
    const view = getCurrentPlayerView(state)!;
    if (player.role === 'CIVILIAN') {
      expect(view.word).toBe(state.wordPair.civilian);
      expect(view.roleLabel).toBe('Civilian');
    } else if (player.role === 'IMPOSTER') {
      expect(view.word).toBe(state.wordPair.imposter);
      expect(view.roleLabel).toBeNull();
    } else {
      expect(view.word).toBeNull();
      expect(view.roleLabel).toBe('Mr. White');
    }
    state = hideReveal(state);
  }
  return state;
}

function eliminateByGroupChoice(
  state: InternalGameState,
  targetId: string
): InternalGameState {
  return eliminateGroupSelection(startVoting(state), targetId);
}

describe('group elimination', () => {
  it('eliminates the selected active player directly without vote counts', () => {
    let state = setRoles(
      initGame(makeConfig(5, true)),
      ['CIVILIAN', 'CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']
    );
    state = revealEveryone(state);
    state = eliminateByGroupChoice(state, state.players.find((player) => player.role === 'IMPOSTER')!.id);
    expect(state.phase).toBe('ELIMINATION_RESULT');
    expect(state.lastElimination?.revealedRole).toBe('IMPOSTER');
    expect(state.players.filter((player) => player.isAlive)).toHaveLength(4);
    expect('totalVotesReceived' in (state.lastElimination?.player ?? {})).toBe(false);
    expect(() => eliminateGroupSelection(state, state.players[0].id)).toThrow();
  });

  it('cannot select an eliminated or unknown player', () => {
    let state = setRoles(initGame(makeConfig(3)), ['CIVILIAN', 'CIVILIAN', 'IMPOSTER']);
    state = revealEveryone(state);
    state.players[0].isAlive = false;
    state = startVoting(state);
    expect(() => eliminateGroupSelection(state, state.players[0].id)).toThrow('not active');
    expect(() => eliminateGroupSelection(state, 'missing')).toThrow('not active');
  });

  it('returns to discussion without elimination when no decision is made', () => {
    let state = revealEveryone(initGame(makeConfig(3)));
    state = startVoting(state);
    state = returnToDiscussion(state);
    expect(state.phase).toBe('DISCUSSION');
    expect(state.round).toBe(1);
    expect(state.players.every((player) => player.isAlive)).toBe(true);
    expect(state.lastElimination).toBeNull();
  });

  it('ends when two remain and preserves the established Undercover victory', () => {
    let state = setRoles(initGame(makeConfig(4)), ['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'IMPOSTER']);
    state = revealEveryone(state);
    state = eliminateByGroupChoice(state, state.players.find((player) => player.role === 'CIVILIAN')!.id);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winResult?.winner).toBe('IMPOSTERS');
  });

  it('uses the chosen Civilian fallback for two players when the normal rules are undecided', () => {
    let state = setRoles(
      initGame(makeConfig(4, true)),
      ['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']
    );
    state = revealEveryone(state);
    state = eliminateByGroupChoice(state, state.players.find((player) => player.role === 'IMPOSTER')!.id);
    expect(state.phase).toBe('ELIMINATION_RESULT');
    state = revealRoundWords(continueToDiscussion(state));
    state = eliminateByGroupChoice(state, state.players.find((player) => player.role === 'CIVILIAN')!.id);
    expect(state.players.filter((player) => player.isAlive)).toHaveLength(2);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winResult?.winner).toBe('CIVILIANS');
    expect(() => startVoting(state)).toThrow();
    expect(() => eliminateGroupSelection(state, state.players.find((player) => player.isAlive)!.id)).toThrow();
  });

  it('gives Mr. White the guess before applying the two-player fallback', () => {
    let state = setRoles(
      initGame(makeConfig(3, true)),
      ['CIVILIAN', 'CIVILIAN', 'MR_WHITE']
    );
    state = revealEveryone(state);
    const mrWhite = state.players.find((player) => player.role === 'MR_WHITE')!;
    state = eliminateByGroupChoice(state, mrWhite.id);
    expect(state.phase).toBe('MR_WHITE_GUESS');
    state = submitMrWhiteGuess(state, state.wordPair.civilian);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winResult?.winner).toBe('MR_WHITE');
  });
});

describe('exact scoring rules', () => {
  it('awards 2 points to every Civilian and zero to all losing roles', () => {
    const scores = calculateGameScores(
      resultPlayers(['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']),
      'CIVILIANS',
      2,
      4
    );
    expect(scores.map((player) => player.pointsEarned)).toEqual([2, 2, 0, 0]);
  });

  it('awards each Undercover twice the starting Civilian count', () => {
    const scores = calculateGameScores(
      resultPlayers(['CIVILIAN', 'CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'IMPOSTER']),
      'IMPOSTERS',
      3,
      5
    );
    expect(scores.map((player) => player.pointsEarned)).toEqual([0, 0, 0, 6, 6]);
  });

  it('awards Mr. White twice the starting player count only on a Mr. White win', () => {
    const scores = calculateGameScores(
      resultPlayers(['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']),
      'MR_WHITE',
      2,
      4
    );
    expect(scores.map((player) => player.pointsEarned)).toEqual([0, 0, 0, 8]);
  });
});

class MemoryStorage implements StorageLike {
  private readonly data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

describe('leaderboard persistence and deduplication', () => {
  it('reuses stable player IDs and persists accumulated all-time scores', () => {
    const storage = new MemoryStorage();
    const registration = registerPlayerIdentities(
      emptyAllTimeLeaderboard(),
      ['Alice', 'Bob'],
      (() => {
        let next = 0;
        return () => `id_${++next}`;
      })()
    );
    expect(registration.playerIds).toEqual(['id_1', 'id_2']);
    const nextRegistration = registerPlayerIdentities(
      registration.leaderboard,
      ['Alice', 'Bob'],
      () => 'wrong-id'
    );
    expect(nextRegistration.playerIds).toEqual(registration.playerIds);

    const scores = calculateGameScores(resultPlayers(['CIVILIAN', 'IMPOSTER']), 'CIVILIANS', 1, 2)
      .map((score, index) => ({ ...score, id: registration.playerIds[index] }));
    const awarded = applyAllTimeScores(registration.leaderboard, 'game_1', scores);
    expect(persistAllTimeLeaderboard(awarded, storage)).toBe(true);
    expect(loadAllTimeLeaderboard(storage).players.map((player) => player.totalPoints)).toEqual([2, 0]);

    const duplicate = applyAllTimeScores(awarded, 'game_1', scores);
    expect(duplicate.players[0].totalPoints).toBe(2);
    const secondGame = applyAllTimeScores(awarded, 'game_2', scores);
    expect(secondGame.players[0].totalPoints).toBe(4);
  });

  it('creates zeroed current-game scores and applies game awards only once', () => {
    const storage = new MemoryStorage();
    const board = createCurrentGameLeaderboard('game_1', [
      { playerId: 'id_a', name: 'Alice' },
      { playerId: 'id_b', name: 'Bob' },
    ]);
    expect(board.entries.map((entry) => entry.pointsEarned)).toEqual([0, 0]);
    expect(persistCurrentGameLeaderboard(board, storage)).toBe(true);
    expect(loadCurrentGameLeaderboard(storage)).toEqual(board);
    const scores = resultPlayers(['CIVILIAN', 'IMPOSTER']).map((score, index) => ({
      ...score,
      id: index === 0 ? 'id_a' : 'id_b',
      pointsEarned: index === 0 ? 2 : 0,
    }));
    const awarded = applyCurrentGameScores(board, 'game_1', scores);
    expect(awarded.entries.map((entry) => entry.pointsEarned)).toEqual([2, 0]);
    expect(applyCurrentGameScores(awarded, 'game_1', scores)).toBe(awarded);
    expect(applyCurrentGameScores(awarded, 'another_game', scores)).toBe(awarded);

    const nextGame = createCurrentGameLeaderboard('game_2', [
      { playerId: 'id_a', name: 'Alice' },
    ]);
    expect(nextGame.entries).toEqual([{ playerId: 'id_a', name: 'Alice', pointsEarned: 0 }]);
    expect(persistCurrentGameLeaderboard(awarded, storage)).toBe(true);
    expect(persistAllTimeLeaderboard({
      version: 1,
      players: [{ playerId: 'id_a', name: 'Alice', totalPoints: 2 }],
      completedGameIds: ['game_1'],
    }, storage)).toBe(true);
    expect(clearAllTimeLeaderboard(storage)).toBe(true);
    expect(loadAllTimeLeaderboard(storage)).toEqual(emptyAllTimeLeaderboard());
    expect(loadCurrentGameLeaderboard(storage)).toEqual(awarded);
  });
});

describe('evaluateWinCondition', () => {
  it('civilians win when all imposters eliminated', () => {
    const players = makePlayers([
      { role: 'CIVILIAN', alive: true },
      { role: 'CIVILIAN', alive: true },
      { role: 'IMPOSTER', alive: false },
    ]);
    expect(evaluateWinCondition(players)?.winner).toBe('CIVILIANS');
  });

  it('imposters win when equal to civilians', () => {
    const players = makePlayers([
      { role: 'CIVILIAN', alive: true },
      { role: 'IMPOSTER', alive: true },
    ]);
    expect(evaluateWinCondition(players)?.winner).toBe('IMPOSTERS');
  });

  it('game continues when civilians outnumber imposters and imposters alive', () => {
    const players = makePlayers([
      { role: 'CIVILIAN', alive: true },
      { role: 'CIVILIAN', alive: true },
      { role: 'IMPOSTER', alive: true },
    ]);
    expect(evaluateWinCondition(players)).toBeNull();
  });

  it('mr. white guess win', () => {
    expect(evaluateMrWhiteGuess('Apple', 'Apple')).toBe(true);
    expect(evaluateMrWhiteGuess('  apple  ', 'Apple')).toBe(true);
    expect(evaluateMrWhiteGuess('Mango', 'Apple')).toBe(false);
  });

  it('civilians do not win while Mr. White remains', () => {
    const players = makePlayers([
      { role: 'CIVILIAN', alive: true },
      { role: 'MR_WHITE', alive: true },
      { role: 'IMPOSTER', alive: false },
    ]);
    expect(evaluateWinCondition(players)).toBeNull();
  });
});

// ── Full game state machine ───────────────────────────────────────────────────

describe('gameEngine state machine', () => {
  it('invalid transition throws', () => {
    const state = initGame(makeConfig(4));
    // Can't start voting from ROLE_REVEAL_QUEUE
    expect(() => startVoting(state)).toThrow();
  });

  it('complete reveal cycle transitions to DISCUSSION', () => {
    let state = initGame(makeConfig(3));
    expect(state.phase).toBe('ROLE_REVEAL_QUEUE');
    expect(state.roleCards).toHaveLength(3);
    // Reveal all 3 players
    for (let i = 0; i < 3; i++) {
      state = showReveal(state);
      expect(state.phase).toBe('ROLE_REVEAL_SHOW');
      state = hideReveal(state);
    }
    expect(state.phase).toBe('DISCUSSION');
    expect(getAvailableRoleCardIds(state)).toHaveLength(0);
  });

  it('imposter view never reveals role label during reveal phase', () => {
    const config = makeConfig(5);
    let state = initGame(config);
    // Advance each player through reveal
    for (let i = 0; i < 5; i++) {
      state = showReveal(state);
      const view = getCurrentPlayerView(state);
      const internalPlayer = state.players[state.revealQueueIndex - 0]; // current
      // If this player is an Imposter, roleLabel must be null
      if (internalPlayer?.role === 'IMPOSTER') {
        expect(view?.roleLabel).toBeNull();
      }
      state = hideReveal(state);
    }
  });

  it('results only available after GAME_OVER', () => {
    const state = initGame(makeConfig(3));
    expect(() => getGameResults(state)).toThrow();
  });

  it('supports valid role counts for every player count from 3 to 20', () => {
    for (let count = 3; count <= 20; count++) {
      const state = initGame(makeConfig(count, true));
      expect(state.players).toHaveLength(count);
      expect(state.roleCards).toHaveLength(count);
      expect(state.roleCards.filter((card) => card.role === 'MR_WHITE')).toHaveLength(1);
      expect(state.roleCards.filter((card) => card.role === 'CIVILIAN').length).toBeGreaterThanOrEqual(1);
      expect(state.players.every((player) => player.role === null && player.word === null)).toBe(true);
    }
  });

  it('uses the configured Imposter count and assigns each role its own word', () => {
    const config = { ...makeConfig(6, true), imposterCount: 3 };
    const state = initGame(config);
    expect(state.roleCards.filter((card) => card.role === 'IMPOSTER')).toHaveLength(3);
    expect(state.roleCards.filter((card) => card.role === 'MR_WHITE')).toHaveLength(1);
    expect(state.roleCards.filter((card) => card.role === 'CIVILIAN')).toHaveLength(2);
    expect(state.roleCards.filter((card) => card.role === 'IMPOSTER').every((card) => card.word === state.wordPair.imposter)).toBe(true);
    expect(state.roleCards.filter((card) => card.role === 'CIVILIAN').every((card) => card.word === state.wordPair.civilian)).toBe(true);
    expect(state.roleCards.find((card) => card.role === 'MR_WHITE')?.word).toBeNull();
  });

  it('creates five face-down cards and only exposes identifiers to the picker', () => {
    const state = initGame(makeConfig(5));
    expect(state.roleCards).toHaveLength(5);
    expect(getAvailableRoleCardIds(state)).toHaveLength(5);
    expect(getAvailableRoleCardIds(state)).not.toContain('Apple');
    expect(getAvailableRoleCardIds(state)).not.toContain('Mango');
  });

  it('a selected card cannot be picked again and its content stays private after hiding', () => {
    let state = initGame(makeConfig(5));
    const cardId = getAvailableRoleCardIds(state)[0];
    state = pickRoleCard(state, cardId);
    expect(state.roleCards.find((card) => card.id === cardId)?.picked).toBe(true);
    expect(getAvailableRoleCardIds(state)).toHaveLength(0);
    const privateView = getCurrentPlayerView(state);
    expect(privateView).not.toBeNull();
    expect(state.players.filter((player) => player.role !== null)).toHaveLength(1);
    state = hideReveal(state);
    expect(state.phase).toBe('ROLE_REVEAL_QUEUE');
    expect(state.selectedRoleCardId).toBeNull();
    expect(getCurrentPlayerView(state)).toBeNull();
    expect(() => pickRoleCard(state, cardId)).toThrow('That card is no longer available.');
    expect(getAvailableRoleCardIds(state)).toHaveLength(4);
  });

  it('eliminating the last Imposter ends the game for Civilians', () => {
    let state = setRoles(initGame(makeConfig(3)), ['CIVILIAN', 'CIVILIAN', 'IMPOSTER']);
    state = revealEveryone(state);
    state = eliminateByGroupChoice(state, state.players.find((player) => player.role === 'IMPOSTER')!.id);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winResult?.winner).toBe('CIVILIANS');
  });

  it('Imposters win when their living count equals the Civilians', () => {
    let state = setRoles(
      initGame(makeConfig(4, true)),
      ['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']
    );
    state = revealEveryone(state);
    const civilianId = state.players.find((player) => player.role === 'CIVILIAN')!.id;
    state = eliminateByGroupChoice(state, civilianId);
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winResult?.winner).toBe('IMPOSTERS');
  });

  it('Mr. White can win by guessing correctly after elimination', () => {
    let state = setRoles(
      initGame(makeConfig(4, true)),
      ['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']
    );
    state = revealEveryone(state);
    const mrWhiteId = state.players.find((player) => player.role === 'MR_WHITE')!.id;
    state = eliminateByGroupChoice(state, mrWhiteId);
    expect(state.phase).toBe('MR_WHITE_GUESS');
    state = submitMrWhiteGuess(state, state.wordPair.civilian.toLowerCase());
    expect(state.phase).toBe('GAME_OVER');
    expect(state.winResult?.winner).toBe('MR_WHITE');
  });

  it('a wrong Mr. White guess resumes the next round without prior vote state', () => {
    let state = setRoles(
      initGame(makeConfig(4, true)),
      ['CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE']
    );
    state = revealEveryone(state);
    const mrWhiteId = state.players.find((player) => player.role === 'MR_WHITE')!.id;
    state = eliminateByGroupChoice(state, mrWhiteId);
    state = submitMrWhiteGuess(state, 'not the word');
    expect(state.phase).toBe('ELIMINATION_RESULT');
    state = revealRoundWords(continueToDiscussion(state));
    expect(state.phase).toBe('DISCUSSION');
    expect(state.round).toBe(2);
    expect(state.lastElimination).toBeNull();
    state = startVoting(state);
    expect(state.phase).toBe('VOTING_QUEUE');
  });

  it('reinitializing a finished game starts a clean first round', () => {
    let state = setRoles(initGame(makeConfig(3)), ['CIVILIAN', 'CIVILIAN', 'IMPOSTER']);
    state = revealEveryone(state);
    state = eliminateByGroupChoice(state, state.players.find((player) => player.role === 'IMPOSTER')!.id);
    expect(state.phase).toBe('GAME_OVER');

    const restarted = initGame(state.config);
    expect(restarted.phase).toBe('ROLE_REVEAL_QUEUE');
    expect(restarted.round).toBe(1);
    expect(restarted.players.every((player) => player.isAlive)).toBe(true);
    expect(restarted.roleCards).toHaveLength(restarted.players.length);
    expect(restarted.roleCards.every((card) => !card.picked)).toBe(true);
    expect(restarted.players.every((player) => player.role === null && player.word === null)).toBe(true);
  });
});

// ── Word selector ─────────────────────────────────────────────────────────────

describe('selectWordPair', () => {
  it('selects a pair from bank', () => {
    const pair = selectWordPair('en', 'random');
    expect(pair.civilian).toBeTruthy();
    expect(pair.imposter).toBeTruthy();
    expect(pair.civilian).not.toBe(pair.imposter);
  });

  it('uses custom pair when provided', () => {
    const custom = { civilian: 'Sun', imposter: 'Moon', category: 'custom', language: 'en' as const };
    expect(selectWordPair('en', 'random', custom)).toEqual(custom);
  });

  it('throws when custom pair has identical words', () => {
    const bad = { civilian: 'Same', imposter: 'same', category: 'c', language: 'en' as const };
    expect(() => selectWordPair('en', 'random', bad)).toThrow();
  });

  it.each(['en', 'mr', 'hi'] as const)('assigns same-round %s pair according to role', (language) => {
    let state = setRoles(initGame(makeConfig(4, true, language)), [
      'CIVILIAN', 'CIVILIAN', 'IMPOSTER', 'MR_WHITE',
    ]);
    state = revealEveryone(state);
    for (const player of state.players) {
      expect(player.word).toBe(
        player.role === 'CIVILIAN'
          ? state.wordPair.civilian
          : player.role === 'IMPOSTER'
            ? state.wordPair.imposter
            : null
      );
    }
    expect(state.civilianWord).toBe(state.wordPair.civilian);
  });

  it('uses every pair once in a 250-round game cycle and resets for a new game', () => {
    let state = revealEveryone(setRoles(initGame(makeConfig(3)), [
      'CIVILIAN', 'CIVILIAN', 'IMPOSTER',
    ]));
    const usedIds = [state.wordPair.id!];

    for (let round = 1; round < 250; round++) {
      state = { ...state, phase: 'ELIMINATION_RESULT' };
      state = revealRoundWords(continueToDiscussion(state));
      expect(state.phase).toBe('DISCUSSION');
      usedIds.push(state.wordPair.id!);
    }
    expect(new Set(usedIds).size).toBe(250);

    const restarted = initGame(state.config);
    expect(restarted.round).toBe(1);
    expect(restarted.wordPairDeckIndex).toBe(1);
    expect(restarted.wordPairDeckIds).toHaveLength(250);
    expect(restarted.wordPair.id).toBe(restarted.wordPairDeckIds[0]);
  });
});
