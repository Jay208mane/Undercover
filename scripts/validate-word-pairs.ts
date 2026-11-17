import { wordPairs } from '../shared/data/wordPairs';
import { validateMultilingualWordPairs } from '../shared/data/wordPairsValidation';

const errors = validateMultilingualWordPairs(wordPairs);
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Validated 250 multilingual pairs, 500 unique English concepts, and all category counts.');
}
