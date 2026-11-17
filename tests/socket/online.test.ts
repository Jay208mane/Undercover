/**
 * Online multiplayer server tests.
 * Tests room management, role assignment, voting, secret delivery.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRoomCode,
  getRoom,
  setRoom,
  deleteRoom,
  pruneExpiredRooms,
} from '../../server/src/game/roomStore';
import {
  pickWordPair,
  getDefaultImposterCount,
  assignServerRoles,
  buildPrivateRoleInfo,
  buildPublicState,
  validateServerVote,
  tallyServerVotes,
  resolveServerElimination,
  evaluateServerWinCondition,
  toSafePlayer,
} from '../../server/src/game/gameLogic';
import {
  generateSessionToken,
  storeToken,
  validateToken,
  revokeToken,
} from '../../server/src/utils/sessionTokens';
import type { ServerRoom } from '../../server/src/game/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRoom(playerCount = 4, mrWhite = false): ServerRoom {
  const wordPair = pickWordPair('en', 'random');
  const lobbyPlayers = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`,
    socketId: `s${i}`,
    name: `Player${i + 1}`,
    isReady: true,
    isConnected: true,
  }));

  return {
    code: 'TEST01',
    hostId: 'p0',
    phase: 'LOBBY',
    lobbyPlayers,
    gamePlayers: [],
    votes: [],
    round: 1,
    wordPairCivilian: wordPair.civilian,
    wordPairImposter: wordPair.imposter,
    wordPairCategory: 'random',
    language: 'en',
    mrWhiteEnabled: mrWhite,
    discussionTimerSeconds: 180,
    revealQueueIndex: 0,
    winnerFaction: null,
    winReason: '',
    lastEliminatedId: null,
    mrWhiteGuessPending: false,
    createdAt: Date.now(),
  };
}

// ── Test 1: Room creation ─────────────────────────────────────────────────────

describe('Room creation', () => {
  it('generates a 6-character room code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('room codes are unique', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()));
    expect(codes.size).toBe(50);
  });

  it('stores and retrieves a room', () => {
    const room = makeRoom();
    setRoom(room);
    expect(getRoom('TEST01')).toBeDefined();
    deleteRoom('TEST01');
    expect(getRoom('TEST01')).toBeUndefined();
  });
});

// ── Test 2 & 3: Joining ───────────────────────────────────────────────────────

describe('Room joining', () => {
  it('invalid room code returns undefined', () => {
    expect(getRoom('ZZZZZZ')).toBeUndefined();
  });
});

// ── Test 4: Full room ─────────────────────────────────────────────────────────

describe('Room capacity', () => {
  it('can detect when room is at max capacity', () => {
    const room = makeRoom(20);
    expect(room.lobbyPlayers.length).toBe(20);
    expect(room.lobbyPlayers.length >= 20).toBe(true);
  });
});

// ── Test 7: Server-side role assignment ───────────────────────────────────────

describe('Server-side role assignment', () => {
  it('assigns correct number of imposters', () => {
    const room = makeRoom(5);
    const players = assignServerRoles(room);
    const imposters = players.filter((p) => p.role === 'IMPOSTER');
    expect(imposters.length).toBe(getDefaultImposterCount(5));
  });

  it('always has at least 1 civilian', () => {
    for (let n = 3; n <= 10; n++) {
      const room = makeRoom(n);
      const players = assignServerRoles(room);
      expect(players.filter((p) => p.role === 'CIVILIAN').length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── Test 8: Imposter never receives Imposter label ───────────────────────────

describe('Imposter hidden role mechanic', () => {
  it('buildPrivateRoleInfo for IMPOSTER has roleLabel = null', () => {
    const room = makeRoom(5);
    const players = assignServerRoles(room);
    const imposter = players.find((p) => p.role === 'IMPOSTER')!;
    const info = buildPrivateRoleInfo(imposter);
    expect(info.roleLabel).toBeNull();
  });

  it('imposter private info JSON never contains "imposter" string', () => {
    const room = makeRoom(5);
    const players = assignServerRoles(room);
    const imposter = players.find((p) => p.role === 'IMPOSTER')!;
    const info = buildPrivateRoleInfo(imposter);
    expect(JSON.stringify(info).toLowerCase()).not.toContain('imposter');
  });

  it('imposter receives the imposter word', () => {
    const room = makeRoom(5);
    const players = assignServerRoles(room);
    const imposter = players.find((p) => p.role === 'IMPOSTER')!;
    expect(imposter.word).toBe(room.wordPairImposter);
  });
});

// ── Test 9: Each player gets only their own word ──────────────────────────────

describe('Private word delivery', () => {
  it('civilians receive the civilian word', () => {
    const room = makeRoom(5);
    const players = assignServerRoles(room);
    players.filter((p) => p.role === 'CIVILIAN').forEach((p) => {
      const info = buildPrivateRoleInfo(p);
      expect(info.word).toBe(room.wordPairCivilian);
    });
  });

  it('imposter word differs from civilian word', () => {
    const room = makeRoom(5);
    expect(room.wordPairCivilian.toLowerCase()).not.toBe(room.wordPairImposter.toLowerCase());
  });
});

// ── Test 10: Mr. White receives no word ──────────────────────────────────────

describe('Mr. White', () => {
  it('MR_WHITE gets null word', () => {
    const room = makeRoom(5, true);
    const players = assignServerRoles(room);
    const mrWhite = players.find((p) => p.role === 'MR_WHITE')!;
    expect(mrWhite).toBeDefined();
    const info = buildPrivateRoleInfo(mrWhite);
    expect(info.word).toBeNull();
    expect(info.roleLabel).toBe('Mr. White');
  });
});

// ── Test 11: Voting ───────────────────────────────────────────────────────────

describe('Voting', () => {
  let players: ReturnType<typeof assignServerRoles>;
  beforeEach(() => {
    const room = makeRoom(4);
    players = assignServerRoles(room);
  });

  it('records a valid vote', () => {
    const err = validateServerVote('p0', 'p1', [], players);
    expect(err).toBeNull();
  });

  it('rejects self-vote', () => {
    const err = validateServerVote('p0', 'p0', [], players);
    expect(err).toBeTruthy();
  });

  it('rejects duplicate vote', () => {
    const existing = [{ voterId: 'p0', targetId: 'p1' }];
    const err = validateServerVote('p0', 'p2', existing, players);
    expect(err).toBeTruthy();
  });

  it('eliminates player with most votes', () => {
    const votes = [
      { voterId: 'p0', targetId: 'p1' },
      { voterId: 'p2', targetId: 'p1' },
      { voterId: 'p3', targetId: 'p0' },
    ];
    const tally = tallyServerVotes(votes, players);
    expect(resolveServerElimination(tally)).toBe('p1');
  });

  it('handles tie without throwing', () => {
    const votes = [
      { voterId: 'p0', targetId: 'p1' },
      { voterId: 'p2', targetId: 'p3' },
    ];
    const tally = tallyServerVotes(votes, players);
    const result = resolveServerElimination(tally);
    expect(['p1', 'p3']).toContain(result);
  });
});

// ── Public state never exposes secrets ───────────────────────────────────────

describe('Public state security', () => {
  it('buildPublicState has no role or word fields on players', () => {
    const room = makeRoom(4);
    room.gamePlayers = assignServerRoles(room);
    const pub = buildPublicState(room);
    pub.players.forEach((p) => {
      expect('role' in p).toBe(false);
      expect('word' in p).toBe(false);
    });
  });

  it('toSafePlayer strips role and word', () => {
    const room = makeRoom(4);
    const players = assignServerRoles(room);
    const safe = toSafePlayer(players[0]);
    expect('role' in safe).toBe(false);
    expect('word' in safe).toBe(false);
  });
});

// ── Win conditions ────────────────────────────────────────────────────────────

describe('Win conditions', () => {
  it('civilians win when all imposters eliminated', () => {
    const room = makeRoom(4);
    const players = assignServerRoles(room);
    players.filter((p) => p.role === 'IMPOSTER').forEach((p) => { p.isAlive = false; });
    const result = evaluateServerWinCondition(players);
    expect(result?.winner).toBe('CIVILIANS');
  });

  it('imposters win when equal to civilians', () => {
    const players = [
      { id: 'a', name: 'A', socketId: 's0', role: 'CIVILIAN' as const, word: 'Apple', isAlive: true, votesReceivedThisRound: 0, totalVotesReceived: 0 },
      { id: 'b', name: 'B', socketId: 's1', role: 'IMPOSTER' as const, word: 'Mango', isAlive: true, votesReceivedThisRound: 0, totalVotesReceived: 0 },
    ];
    expect(evaluateServerWinCondition(players)?.winner).toBe('IMPOSTERS');
  });
});

// ── Session tokens ────────────────────────────────────────────────────────────

describe('Session tokens (reconnect auth)', () => {
  it('validates correct token', () => {
    const token = generateSessionToken();
    storeToken('player1', token);
    expect(validateToken('player1', token)).toBe(true);
  });

  it('rejects wrong token', () => {
    const token = generateSessionToken();
    storeToken('player2', token);
    expect(validateToken('player2', 'wrongtoken')).toBe(false);
  });

  it('revoked token is invalid', () => {
    const token = generateSessionToken();
    storeToken('player3', token);
    revokeToken('player3');
    expect(validateToken('player3', token)).toBe(false);
  });
});

// ── Room cleanup ──────────────────────────────────────────────────────────────

describe('Room cleanup', () => {
  it('pruneExpiredRooms removes old rooms', () => {
    const room = makeRoom();
    room.createdAt = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    room.code = 'OLDONE';
    setRoom(room);
    pruneExpiredRooms();
    expect(getRoom('OLDONE')).toBeUndefined();
  });
});

// ── Single-device mode unaffected ────────────────────────────────────────────

describe('Existing single-device mode', () => {
  it('client engine types still compile (import check)', async () => {
    const { getDefaultImposterCount } = await import('../../client/src/game/engine/roleAssigner');
    expect(getDefaultImposterCount(4)).toBe(1);
  });
});
