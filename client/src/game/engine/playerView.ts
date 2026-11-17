import type { InternalPlayer, PlayerView } from './types';

/**
 * Build the player-visible view from an internal player.
 *
 * CRITICAL SECURITY RULE:
 *   - CIVILIAN  → roleLabel = 'Civilian', word = civilian word
 *   - IMPOSTER  → roleLabel = null (no label shown), word = imposter word
 *   - MR_WHITE  → roleLabel = 'Mr. White', word = null
 *
 * The Imposter NEVER sees an Imposter label, badge or any hint that
 * their word differs from other players.
 */
export function buildPlayerView(player: InternalPlayer): PlayerView {
  if (!player.role) {
    throw new Error('Cannot build a player view before a card has been selected.');
  }

  switch (player.role) {
    case 'CIVILIAN':
      return {
        word: player.word,
        roleLabel: 'Civilian',
        instructions:
          "You are a Civilian. Remember your word. Give a clue that only Civilians would understand — without saying the word directly.",
      };

    case 'IMPOSTER':
      return {
        word: player.word,
        roleLabel: null,          // ← INTENTIONALLY null: no Imposter label shown
        instructions:
          "Remember your word. Give a clue without revealing it directly.",
      };

    case 'MR_WHITE':
      return {
        word: null,
        roleLabel: 'Mr. White',
        instructions:
          "You are Mr. White. You have no secret word. Listen carefully to everyone's clues and try to blend in. If you are eliminated, you get one chance to guess the Civilian word.",
      };
  }
}
