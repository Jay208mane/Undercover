/**
 * Privacy & security tests for the Undercover game engine.
 *
 * Covers all 13 required cases from the Prompt 4 spec:
 *  1. Civilian receives common word
 *  2. Imposter receives alternate word
 *  3. Imposter view never contains actual role
 *  4. Imposter view never contains faction objective
 *  5. Mr. White receives no word
 *  6. Mr. White is explicitly identified
 *  7. Player cannot access another player's private view
 *  8. Public state never exposes secret words
 *  9. Final results unavailable before GAME_OVER
 * 10. Custom word pairs work
 * 11. All three languages work
 * 12. Reveal state clears when hidden
 * 13. Invalid role assignments are rejected
 */

import { describe, it, expect } from 'vitest';
import { assignRoles, getDefaultImposterCount } from '../../client/src/game/engine/roleAssigner';
import { buildPlayerView } from '../../client/src/game/engine/playerView';
import {
  initGame,
  showReveal,
  hideReveal,
  getCurrentPlayerView,
  getPlayerView,
  getGameResults,
  getSafeConfig,
  getAllSafePlayers,
  getAliveSafePlayers,
} from '../../client/src/game/engine/gameEngine';
import { selectWordPair } from '../../client/src/game/engine/wordSelector';
import { getWordPairs, validateWordBank } from '../../client/src/game/engine/wordData';
import type { LocalGameConfig, InternalPlayer } from '../../client/src/game/engine/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(
  count: number,
  mrWhite = false,
  lang: 'en' | 'mr' | 'hi' = 'en'
): LocalGameConfig {
  return {
    playerNames: Array.from({ length: count }, (_, i) => `P${i + 1}`),
    imposterCount: getDefaultImposterCount(count),
    mrWhiteEnabled: mrWhite,
    language: lang,
    category: 'random',
    discussionTimerSeconds: 60,
    votingTimerSeconds: 30,
  };
}

const PAIR_EN = { civilian: 'Apple', imposter: 'Mango', category: 'food', language: 'en' as const };

function makePlayer(role: InternalPlayer['role'], word: string | null): InternalPlayer {
  return {
    id: 'x', name: 'X', role, word, isAlive: true,
  };
}

// ── Test 1: Civilian receives common word ────────────────────────────────────

describe('Test 1 — Civilian receives common word', () => {
  it('civilian view word matches civilian word from pair', () => {
    const players = assignRoles(makeConfig(5), PAIR_EN);
    players
      .filter((p) => p.role === 'CIVILIAN')
      .forEach((p) => {
        const view = buildPlayerView(p);
        expect(view.word).toBe(PAIR_EN.civilian);
      });
  });
});

// ── Test 2: Imposter receives alternate word ─────────────────────────────────

describe('Test 2 — Imposter receives alternate word', () => {
  it('imposter view word matches imposter word from pair', () => {
    const players = assignRoles(makeConfig(5), PAIR_EN);
    players
      .filter((p) => p.role === 'IMPOSTER')
      .forEach((p) => {
        const view = buildPlayerView(p);
        expect(view.word).toBe(PAIR_EN.imposter);
        expect(view.word).not.toBe(PAIR_EN.civilian);
      });
  });
});

// ── Test 3: Imposter view never contains actual role ─────────────────────────

describe('Test 3 — Imposter view never contains actual role string', () => {
  it('roleLabel is null for Imposter', () => {
    const view = buildPlayerView(makePlayer('IMPOSTER', 'Mango'));
    expect(view.roleLabel).toBeNull();
  });

  it('no field in PlayerView carries "IMPOSTER" or "imposter"', () => {
    const view = buildPlayerView(makePlayer('IMPOSTER', 'Mango'));
    const json = JSON.stringify(view).toLowerCase();
    expect(json).not.toContain('imposter');
    expect(json).not.toContain('undercover');
  });
});

// ── Test 4: Imposter view never contains faction objective ────────────────────

describe('Test 4 — Imposter view never contains faction objective', () => {
  it('instructions mention neither "imposter" nor "blend" nor faction info', () => {
    const view = buildPlayerView(makePlayer('IMPOSTER', 'Mango'));
    const instr = view.instructions.toLowerCase();
    // Must not mention their role or strategic objective
    expect(instr).not.toContain('imposter');
    expect(instr).not.toContain('outnumber');
    expect(instr).not.toContain('eliminate civilian');
    expect(instr).not.toContain('faction');
  });
});

// ── Test 5: Mr. White receives no word ───────────────────────────────────────

describe('Test 5 — Mr. White receives no word', () => {
  it('MR_WHITE role has word = null in internal representation', () => {
    const players = assignRoles(makeConfig(5, true), PAIR_EN);
    const mrWhite = players.find((p) => p.role === 'MR_WHITE');
    expect(mrWhite).toBeDefined();
    expect(mrWhite!.word).toBeNull();
  });

  it('MR_WHITE player view has word = null', () => {
    const view = buildPlayerView(makePlayer('MR_WHITE', null));
    expect(view.word).toBeNull();
  });
});

// ── Test 6: Mr. White is explicitly identified ────────────────────────────────

describe('Test 6 — Mr. White is explicitly identified', () => {
  it('roleLabel is "Mr. White" for MR_WHITE', () => {
    const view = buildPlayerView(makePlayer('MR_WHITE', null));
    expect(view.roleLabel).toBe('Mr. White');
  });

  it('instructions explicitly mention Mr. White', () => {
    const view = buildPlayerView(makePlayer('MR_WHITE', null));
    expect(view.instructions.toLowerCase()).toContain('mr. white');
  });
});

// ── Test 7: Player cannot access another player's private view ────────────────

describe('Test 7 — getPlayerView returns null for wrong player or phase', () => {
  it('returns null during ROLE_REVEAL_QUEUE (not SHOW)', () => {
    const state = initGame(makeConfig(3));
    // phase is ROLE_REVEAL_QUEUE
    const p0Id = state.players[0].id;
    expect(getPlayerView(state, p0Id)).toBeNull();
  });

  it('returns null for a player who is not currently being revealed', () => {
    let state = initGame(makeConfig(3));
    state = showReveal(state); // phase: ROLE_REVEAL_SHOW, index 0
    const revealedId = state.players[0].id;
    const otherPlayerId = state.players[1].id;
    // Correct player gets a view
    expect(getPlayerView(state, revealedId)).not.toBeNull();
    // Other player gets null — cannot peek
    expect(getPlayerView(state, otherPlayerId)).toBeNull();
  });

  it('getCurrentPlayerView returns null outside ROLE_REVEAL_SHOW', () => {
    const state = initGame(makeConfig(3));
    // Phase is ROLE_REVEAL_QUEUE here
    expect(getCurrentPlayerView(state)).toBeNull();
  });
});

// ── Test 8: Public (safe) state never exposes secret words ────────────────────

describe('Test 8 — Safe player arrays never carry role or word', () => {
  it('getAllSafePlayers has no role or word fields', () => {
    const state = initGame(makeConfig(5));
    const safePlayers = getAllSafePlayers(state);
    safePlayers.forEach((p) => {
      expect('role' in p).toBe(false);
      expect('word' in p).toBe(false);
    });
  });

  it('getAliveSafePlayers has no role or word fields', () => {
    const state = initGame(makeConfig(5));
    const alive = getAliveSafePlayers(state);
    alive.forEach((p) => {
      expect('role' in p).toBe(false);
      expect('word' in p).toBe(false);
    });
  });

  it('getSafeConfig has no customWordPair', () => {
    const config = {
      ...makeConfig(5),
      customWordPair: PAIR_EN,
    };
    const state = initGame(config);
    const safe = getSafeConfig(state);
    expect('customWordPair' in safe).toBe(false);
  });
});

// ── Test 9: Final results unavailable before GAME_OVER ────────────────────────

describe('Test 9 — getGameResults throws before GAME_OVER', () => {
  it('throws in ROLE_REVEAL_QUEUE', () => {
    const state = initGame(makeConfig(3));
    expect(() => getGameResults(state)).toThrow();
  });

  it('throws after moving to DISCUSSION', () => {
    let state = initGame(makeConfig(3));
    for (let i = 0; i < 3; i++) {
      state = showReveal(state);
      state = hideReveal(state);
    }
    expect(state.phase).toBe('DISCUSSION');
    expect(() => getGameResults(state)).toThrow();
  });
});

// ── Test 10: Custom word pairs work ──────────────────────────────────────────

describe('Test 10 — Custom word pairs', () => {
  it('uses provided custom pair', () => {
    const custom = { civilian: 'Sun', imposter: 'Moon', category: 'custom', language: 'en' as const };
    const pair = selectWordPair('en', 'random', custom);
    expect(pair.civilian).toBe('Sun');
    expect(pair.imposter).toBe('Moon');
  });

  it('assigns custom words correctly to roles', () => {
    const custom = { civilian: 'Sun', imposter: 'Moon', category: 'custom', language: 'en' as const };
    const config: LocalGameConfig = { ...makeConfig(5), customWordPair: custom };
    const players = assignRoles(config, custom);
    players.filter((p) => p.role === 'CIVILIAN').forEach((p) => expect(p.word).toBe('Sun'));
    players.filter((p) => p.role === 'IMPOSTER').forEach((p) => expect(p.word).toBe('Moon'));
  });

  it('rejects custom pair with identical words', () => {
    const bad = { civilian: 'Same', imposter: 'same', category: 'c', language: 'en' as const };
    expect(() => selectWordPair('en', 'random', bad)).toThrow();
  });

  it('rejects custom pair with empty words', () => {
    const bad = { civilian: '', imposter: 'Moon', category: 'c', language: 'en' as const };
    expect(() => selectWordPair('en', 'random', bad)).toThrow();
  });
});

// ── Test 11: All three languages work ────────────────────────────────────────

describe('Test 11 — Language coverage', () => {
  for (const lang of ['en', 'mr', 'hi'] as const) {
    it(`${lang}: word bank has ≥ 10 pairs`, () => {
      const pairs = getWordPairs(lang, 'random');
      expect(pairs.length).toBeGreaterThanOrEqual(10);
    });

    it(`${lang}: selectWordPair returns a valid pair`, () => {
      const pair = selectWordPair(lang, 'random');
      expect(pair.civilian).toBeTruthy();
      expect(pair.imposter).toBeTruthy();
      expect(pair.language).toBe(lang);
      expect(pair.civilian.toLowerCase()).not.toBe(pair.imposter.toLowerCase());
    });

    it(`${lang}: initGame runs without error`, () => {
      expect(() => initGame(makeConfig(4, false, lang))).not.toThrow();
    });
  }
});

// ── Test 12: Reveal state clears when hidden ─────────────────────────────────

describe('Test 12 — Reveal state clears on hideReveal', () => {
  it('phase returns to ROLE_REVEAL_QUEUE after hiding (not done yet)', () => {
    let state = initGame(makeConfig(3)); // 3 players
    state = showReveal(state);
    expect(state.phase).toBe('ROLE_REVEAL_SHOW');
    state = hideReveal(state);
    // Player 0 done, player 1 next
    expect(state.phase).toBe('ROLE_REVEAL_QUEUE');
    expect(state.revealQueueIndex).toBe(1);
  });

  it('getCurrentPlayerView is null after hiding (back in QUEUE)', () => {
    let state = initGame(makeConfig(3));
    state = showReveal(state);
    state = hideReveal(state);
    // Now in QUEUE phase — no view should be accessible
    expect(getCurrentPlayerView(state)).toBeNull();
  });

  it('getPlayerView for previously-revealed player is null after hiding', () => {
    let state = initGame(makeConfig(3));
    const p0Id = state.players[0].id;
    state = showReveal(state);
    // P0 view accessible during SHOW
    expect(getPlayerView(state, p0Id)).not.toBeNull();
    state = hideReveal(state);
    // P0 view must be null — phase is QUEUE, index moved
    expect(getPlayerView(state, p0Id)).toBeNull();
  });
});

// ── Test 13: Invalid role assignments are rejected ───────────────────────────

describe('Test 13 — Invalid role assignments rejected', () => {
  it('throws for < 3 players', () => {
    const config = makeConfig(2);
    expect(() => initGame(config)).toThrow();
  });

  it('throws when imposters + Mr. White leaves no Civilian', () => {
    const config: LocalGameConfig = {
      ...makeConfig(3),
      imposterCount: 2,
      mrWhiteEnabled: true,
    };
    expect(() => initGame(config)).toThrow();
  });

  it('throws when imposterCount is 0', () => {
    const config: LocalGameConfig = { ...makeConfig(5), imposterCount: 0 };
    expect(() => initGame(config)).toThrow();
  });
});

// ── Test 14 (bonus): Word bank integrity ─────────────────────────────────────

describe('Word bank integrity', () => {
  it('no pair has identical civilian and imposter words', () => {
    const errors = validateWordBank();
    expect(errors).toHaveLength(0);
  });
});
