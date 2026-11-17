import type { WordPair, Language } from './types';
import { getWordPairs } from './wordData';
import { createWordPairDeck, getWordPairById } from '../../data/wordPairs';

/**
 * Select a word pair for a game.
 * - If a custom pair is supplied and both words differ, use it.
 * - Otherwise pick a random pair from the bank for the given language/category.
 * - Throws if no pair can be found (shouldn't happen with the built-in bank).
 */
export function selectWordPair(
  language: Language,
  category: string,
  customPair?: WordPair
): WordPair {
  if (customPair) {
    const { civilian, imposter } = customPair;
    if (!civilian?.trim() || !imposter?.trim()) {
      throw new Error('Custom word pair must have both civilian and imposter words.');
    }
    if (civilian.trim().toLowerCase() === imposter.trim().toLowerCase()) {
      throw new Error('Civilian and Imposter words must be different.');
    }
    return customPair;
  }

  const pool = getWordPairs(language, category);
  if (pool.length === 0) {
    throw new Error(`No word pairs found for language="${language}" category="${category}".`);
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function createWordPairCycle(category: string): number[] {
  return createWordPairDeck(category);
}

export function selectWordPairById(language: Language, id: number): WordPair {
  const pair = getWordPairById(id);
  return {
    id: pair.id,
    category: pair.category,
    civilian: pair.civilian[language],
    imposter: pair.undercover[language],
    language,
  };
}
