/**
 * Server-authoritative game logic.
 * Mirrors the pure client engine but runs entirely on the server.
 * SECURITY: All roles/words are assigned here and NEVER broadcast wholesale.
 */

import type {
  ServerRoom,
  ServerInternalPlayer,
  SafeOnlinePlayer,
  PublicRoomState,
  PrivateRoleInfo,
  ServerVote,
} from './types';
import type { Language } from '../../../shared/types';
import { createWordPairDeck, getWordPairById } from '../../../shared/data/wordPairs';

export function pickWordPair(language: Language, category: string): { civilian: string; imposter: string } {
  const [id] = createWordPairDeck(category);
  return getServerWordPair(language, id);
}

export function getServerWordPair(language: Language, id: number): { civilian: string; imposter: string } {
  const pair = getWordPairById(id);
  return {
    civilian: pair.civilian[language],
    imposter: pair.undercover[language],
  };
}

export function resetServerWordPairCycle(room: ServerRoom): void {
  room.wordPairDeckIds = createWordPairDeck(room.wordPairCategory);
  room.wordPairDeckIndex = 0;
}

export function advanceServerWordPair(room: ServerRoom): void {
  if (room.wordPairDeckIds.length === 0 || room.wordPairDeckIndex >= room.wordPairDeckIds.length) {
    resetServerWordPairCycle(room);
  }
  const pairId = room.wordPairDeckIds[room.wordPairDeckIndex];
  const pair = getServerWordPair(room.language, pairId);
  room.wordPairCivilian = pair.civilian;
  room.wordPairImposter = pair.imposter;
  room.wordPairDeckIndex += 1;
  for (const player of room.gamePlayers) {
    player.word = player.role === 'CIVILIAN'
      ? pair.civilian
      : player.role === 'IMPOSTER'
        ? pair.imposter
        : null;
  }
}

export function getDefaultImposterCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 14) return 2;
  return 3;
}

/** Shuffle in-place */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Assign roles to lobby players and return ServerInternalPlayer[].
 * SECURITY: Returns secret-bearing objects — never broadcast directly.
 */
export function assignServerRoles(
  room: ServerRoom
): ServerInternalPlayer[] {
  const { lobbyPlayers, language, wordPairCivilian, wordPairImposter, mrWhiteEnabled } = room;
  const count = lobbyPlayers.length;
  const imposterCount = getDefaultImposterCount(count);

  // Validate
  const specialRoles = imposterCount + (mrWhiteEnabled ? 1 : 0);
  if (specialRoles >= count) {
    throw new Error('Not enough civilians for this configuration.');
  }

  const roles: Array<{ role: 'CIVILIAN' | 'IMPOSTER' | 'MR_WHITE'; word: string | null }> = [];
  for (let i = 0; i < imposterCount; i++) roles.push({ role: 'IMPOSTER', word: wordPairImposter });
  if (mrWhiteEnabled) roles.push({ role: 'MR_WHITE', word: null });
  while (roles.length < count) roles.push({ role: 'CIVILIAN', word: wordPairCivilian });
  shuffle(roles);

  return shuffle([...lobbyPlayers]).map((lp, i) => ({
    id: lp.id,
    name: lp.name,
    socketId: lp.socketId,
    role: roles[i].role,
    word: roles[i].word,
    isAlive: true,
    votesReceivedThisRound: 0,
    totalVotesReceived: 0,
  }));
}

/**
 * Build the private role info for a specific player.
 * This is the ONLY object sent to an individual socket during role reveal.
 * IMPOSTER gets roleLabel=null — no Imposter string ever touches the client.
 */
export function buildPrivateRoleInfo(player: ServerInternalPlayer): PrivateRoleInfo {
  switch (player.role) {
    case 'CIVILIAN':
      return {
        word: player.word,
        roleLabel: 'Civilian',
        instructions:
          'You are a Civilian. Remember your word and give a clue that only Civilians would understand.',
      };
    case 'IMPOSTER':
      return {
        word: player.word,
        roleLabel: null,         // ← NEVER 'Imposter'
        instructions: 'Remember your word. Give a clue without revealing it directly.',
      };
    case 'MR_WHITE':
      return {
        word: null,
        roleLabel: 'Mr. White',
        instructions:
          'You are Mr. White. You have no secret word. Listen carefully. If eliminated, you can guess the Civilian word to win.',
      };
  }
}

/** Strip secrets — produce safe player for broadcast */
export function toSafePlayer(p: ServerInternalPlayer, isConnected = true): SafeOnlinePlayer {
  return {
    id: p.id,
    name: p.name,
    isAlive: p.isAlive,
    isConnected,
    totalVotesReceived: p.totalVotesReceived,
  };
}

/** Build public room snapshot — no roles, no words */
export function buildPublicState(room: ServerRoom): PublicRoomState {
  const connectedIds = new Set(
    room.lobbyPlayers.filter((lp) => lp.isConnected).map((lp) => lp.id)
  );
  const players: SafeOnlinePlayer[] =
    room.phase === 'LOBBY'
      ? room.lobbyPlayers.map((lp) => ({
          id: lp.id,
          name: lp.name,
          isAlive: true,
          isConnected: lp.isConnected,
          totalVotesReceived: 0,
        }))
      : room.gamePlayers.map((gp) => toSafePlayer(gp, connectedIds.has(gp.id)));

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players,
    round: room.round,
    winnerFaction: room.winnerFaction,
    winReason: room.winReason,
    lastEliminatedId: room.lastEliminatedId,
    mrWhiteGuessPending: room.mrWhiteGuessPending,
    discussionTimerSeconds: room.discussionTimerSeconds,
  };
}

// ── Voting ────────────────────────────────────────────────────────────────────

export function validateServerVote(
  voterId: string,
  targetId: string,
  votes: ServerVote[],
  alivePlayers: ServerInternalPlayer[]
): string | null {
  if (voterId === targetId) return 'You cannot vote for yourself.';
  const voter = alivePlayers.find((p) => p.id === voterId);
  if (!voter || !voter.isAlive) return 'Voter is not active.';
  const target = alivePlayers.find((p) => p.id === targetId);
  if (!target || !target.isAlive) return 'Target is not active.';
  if (votes.some((v) => v.voterId === voterId)) return 'You have already voted.';
  return null;
}

export function tallyServerVotes(
  votes: ServerVote[],
  alivePlayers: ServerInternalPlayer[]
): Array<{ playerId: string; count: number }> {
  const counts = new Map<string, number>();
  alivePlayers.forEach((p) => counts.set(p.id, 0));
  votes.forEach((v) => {
    if (counts.has(v.targetId)) counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([playerId, count]) => ({ playerId, count }))
    .sort((a, b) => b.count - a.count);
}

export function resolveServerElimination(tally: Array<{ playerId: string; count: number }>): string {
  if (tally.length === 0) throw new Error('No players to eliminate.');
  const max = tally[0].count;
  const tied = tally.filter((t) => t.count === max);
  const pick = tied[Math.floor(Math.random() * tied.length)];
  return pick.playerId;
}

// ── Win conditions ────────────────────────────────────────────────────────────

export function evaluateServerWinCondition(
  players: ServerInternalPlayer[]
): { winner: 'CIVILIANS' | 'IMPOSTERS'; reason: string } | null {
  const alive = players.filter((p) => p.isAlive);
  const aliveCivilians = alive.filter((p) => p.role === 'CIVILIAN').length;
  const aliveImposters = alive.filter((p) => p.role === 'IMPOSTER').length;
  const aliveMrWhites  = alive.filter((p) => p.role === 'MR_WHITE').length;

  if (aliveImposters > 0 && aliveImposters >= aliveCivilians) {
    return { winner: 'IMPOSTERS', reason: 'The Imposters outnumber or equal the Civilians!' };
  }
  if (aliveImposters === 0 && aliveMrWhites === 0) {
    return { winner: 'CIVILIANS', reason: 'All threats eliminated. Civilians win!' };
  }
  return null;
}
