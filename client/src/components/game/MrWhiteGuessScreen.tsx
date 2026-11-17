import { useState } from 'react';
import { useLocalGame } from '../../game/local/LocalGameProvider';
import { PrimaryButton } from '../common/Buttons';
import { useI18n } from '../../context/i18nContext';
import { formatMessage } from '../../locales/format';

export function MrWhiteGuessScreen() {
  const { lastElimination, onSubmitMrWhiteGuess } = useLocalGame();
  const { t } = useI18n();
  const text = t.localGame;
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!lastElimination) return null;

  const handleSubmit = () => {
    if (!guess.trim() || submitted) return;
    setSubmitted(true);
    onSubmitMrWhiteGuess(guess.trim());
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '1.5rem', gap: '2rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
      {/* Fixed glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 35%, rgba(192,132,252,0.12), transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem', animation: 'pulse 2s ease-in-out infinite' }}>👻</div>
        <h2 style={{ fontSize: 'clamp(1.5rem, 7vw, 2rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          {formatMessage(text.mrWhiteLastChance, { name: lastElimination.player.name })}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {text.mrWhiteGuessPrompt}
        </p>
      </div>

      <div style={{ width: '100%', zIndex: 1 }}>
        <input
          className="input"
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={text.guessPlaceholder}
          disabled={submitted}
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.03em' }}
        />
      </div>

      <PrimaryButton fullWidth onClick={handleSubmit} disabled={!guess.trim() || submitted}>
        {submitted ? text.checking : text.submitGuess}
      </PrimaryButton>

      <style>{`
        @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.08) } }
      `}</style>
    </div>
  );
}
