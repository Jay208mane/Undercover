import type { Language, WordPair as GameWordPair } from './types';
import { wordPairs } from '../../data/wordPairs';
import {
  validateMultilingualWordPairs,
  WORD_PAIR_CATEGORY_COUNTS,
} from '../../../../shared/data/wordPairsValidation';

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  food: 'food-drinks',
  animals: 'animals-birds',
  places: 'countries-places',
  sports: 'sports-games',
  movies: 'movies-entertainment',
  objects: 'household-objects',
  nature: 'nature-geography',
};

export function getWordPairs(language: Language, category: string): GameWordPair[] {
  const resolvedCategory = LEGACY_CATEGORY_MAP[category] ?? category;
  return wordPairs
    .filter((pair) => category === 'random' || pair.category === resolvedCategory)
    .map((pair) => ({
      id: pair.id,
      category: pair.category,
      civilian: pair.civilian[language],
      imposter: pair.undercover[language],
      language,
    }));
}

export function getAllPairs(): GameWordPair[] {
  return getWordPairs('en', 'random');
}

export function validateWordBank(): string[] {
  return validateMultilingualWordPairs(wordPairs, WORD_PAIR_CATEGORY_COUNTS);
}
