import type { WordPair } from './wordPairs';

export const WORD_PAIR_CATEGORY_COUNTS: Record<string, number> = {
  'food-drinks': 35,
  'animals-birds': 25,
  'countries-places': 25,
  'household-objects': 30,
  'technology-gadgets': 25,
  'movies-entertainment': 25,
  'sports-games': 25,
  professions: 20,
  'nature-geography': 20,
  'random-funny': 20,
};

const LANGUAGES = ['en', 'mr', 'hi'] as const;

export function validateMultilingualWordPairs(
  pairs: WordPair[],
  expectedCategories = WORD_PAIR_CATEGORY_COUNTS
): string[] {
  const errors: string[] = [];
  if (pairs.length !== 250) errors.push(`Expected 250 pairs, received ${pairs.length}.`);

  const ids = new Set<number>();
  const categoryCounts = new Map<string, number>();
  const englishConcepts = new Set<string>();
  const seenPairs = new Set<string>();

  for (const pair of pairs) {
    if (!Number.isInteger(pair.id) || pair.id < 1 || pair.id > 250) {
      errors.push(`Pair ID ${pair.id} is outside the expected 1-250 range.`);
    }
    if (ids.has(pair.id)) errors.push(`Duplicate pair ID ${pair.id}.`);
    ids.add(pair.id);
    categoryCounts.set(pair.category, (categoryCounts.get(pair.category) ?? 0) + 1);

    for (const language of LANGUAGES) {
      const civilian = pair.civilian?.[language]?.trim();
      const undercover = pair.undercover?.[language]?.trim();
      if (!civilian || !undercover) {
        errors.push(`Pair ${pair.id} is missing a ${language} word.`);
        continue;
      }
      if (civilian.toLocaleLowerCase() === undercover.toLocaleLowerCase()) {
        errors.push(`Pair ${pair.id} has identical ${language} words.`);
      }
      const normalized = [civilian, undercover].map((word) => word.toLocaleLowerCase());
      const key = `${language}:${normalized.slice().sort().join('\u0000')}`;
      if (seenPairs.has(key)) errors.push(`Duplicate or reversed ${language} pair at ID ${pair.id}.`);
      seenPairs.add(key);
    }

    englishConcepts.add(pair.civilian.en.trim().toLocaleLowerCase());
    englishConcepts.add(pair.undercover.en.trim().toLocaleLowerCase());
  }

  for (let id = 1; id <= 250; id++) {
    if (!ids.has(id)) errors.push(`Missing pair ID ${id}.`);
  }
  for (const [category, expected] of Object.entries(expectedCategories)) {
    const actual = categoryCounts.get(category) ?? 0;
    if (actual !== expected) {
      errors.push(`Category ${category} has ${actual} pairs; expected ${expected}.`);
    }
  }
  for (const category of categoryCounts.keys()) {
    if (!(category in expectedCategories)) errors.push(`Unexpected category ${category}.`);
  }
  if (englishConcepts.size !== 500) {
    errors.push(`Expected 500 unique English word concepts, received ${englishConcepts.size}.`);
  }
  return errors;
}
