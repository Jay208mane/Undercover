import { describe, expect, it } from 'vitest';
import { wordPairs } from '../../client/src/data/wordPairs';
import {
  validateMultilingualWordPairs,
  WORD_PAIR_CATEGORY_COUNTS,
} from '../../shared/data/wordPairsValidation';
import { createWordPairDeck } from '../../shared/data/wordPairs';
import {
  advanceServerWordPair,
  getServerWordPair,
  type ServerRoom,
} from '../../server/src/game/gameLogic';

function createServerRoom(): ServerRoom {
  return {
    code: 'ABC123',
    hostId: 'host',
    phase: 'DISCUSSION',
    lobbyPlayers: [],
    gamePlayers: [
      {
        id: 'civilian',
        name: 'Civilian',
        socketId: 'socket-civilian',
        role: 'CIVILIAN',
        word: null,
        isAlive: true,
        votesReceivedThisRound: 0,
        totalVotesReceived: 0,
      },
      {
        id: 'undercover',
        name: 'Undercover',
        socketId: 'socket-undercover',
        role: 'IMPOSTER',
        word: null,
        isAlive: true,
        votesReceivedThisRound: 0,
        totalVotesReceived: 0,
      },
      {
        id: 'white',
        name: 'White',
        socketId: 'socket-white',
        role: 'MR_WHITE',
        word: null,
        isAlive: true,
        votesReceivedThisRound: 0,
        totalVotesReceived: 0,
      },
    ],
    votes: [],
    round: 1,
    wordPairCivilian: '',
    wordPairImposter: '',
    wordPairCategory: 'random',
    wordPairDeckIds: [],
    wordPairDeckIndex: 0,
    language: 'mr',
    mrWhiteEnabled: true,
    discussionTimerSeconds: 180,
    revealQueueIndex: 0,
    winnerFaction: null,
    winReason: '',
    lastEliminatedId: null,
    mrWhiteGuessPending: false,
    createdAt: 0,
  };
}

describe('multilingual word database', () => {
  it('contains exactly 250 validated pairs with all required category counts', () => {
    expect(wordPairs).toHaveLength(250);
    expect(validateMultilingualWordPairs(wordPairs)).toEqual([]);
    expect(Object.values(WORD_PAIR_CATEGORY_COUNTS).reduce((sum, count) => sum + count, 0)).toBe(
      250
    );
  });

  it.each(['en', 'mr', 'hi'] as const)(
    'serves server-authoritative %s words from the selected pair',
    (language) => {
      const [id] = createWordPairDeck('random', () => 0);
      const pair = wordPairs.find((candidate) => candidate.id === id)!;
      expect(getServerWordPair(language, id)).toEqual({
        civilian: pair.civilian[language],
        imposter: pair.undercover[language],
      });
    }
  );

  it('shuffles each full cycle without repeating an ID before exhaustion', () => {
    const ids = createWordPairDeck('random');
    expect(ids).toHaveLength(250);
    expect(new Set(ids).size).toBe(250);
    expect(new Set(createWordPairDeck('random')).size).toBe(250);
  });

  it('prefers the selected category for the first pair and still includes all 250 pairs', () => {
    const ids = createWordPairDeck('food-drinks');
    const firstPair = wordPairs.find((pair) => pair.id === ids[0]);
    expect(firstPair?.category).toBe('food-drinks');
    expect(ids).toHaveLength(250);
    expect(new Set(ids).size).toBe(250);
  });

  it('keeps the online word cycle server-authoritative and updates only role-appropriate words', () => {
    const room = createServerRoom();
    const usedIds: number[] = [];
    for (let index = 0; index < 250; index++) {
      advanceServerWordPair(room);
      usedIds.push(room.wordPairDeckIds[room.wordPairDeckIndex - 1]);
      expect(room.gamePlayers[0].word).toBe(room.wordPairCivilian);
      expect(room.gamePlayers[1].word).toBe(room.wordPairImposter);
      expect(room.gamePlayers[2].word).toBeNull();
    }
    expect(new Set(usedIds).size).toBe(250);

    advanceServerWordPair(room);
    expect(room.wordPairDeckIndex).toBe(1);
    expect(room.wordPairDeckIds).toHaveLength(250);
  });
});
