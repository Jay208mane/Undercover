import { useLocalGame } from '../../game/local/LocalGameProvider';
import { PrimaryButton } from '../common/Buttons';
import { useI18n } from '../../context/i18nContext';

export function EliminationResultScreen() {
  const { lastElimination, onContinueAfterElimination } = useLocalGame();
  const { t } = useI18n();
  const text = t.localGame;
  if (!lastElimination) return null;

  const { player, revealedRole, revealedWord } = lastElimination;

  const roleColor =
    revealedRole === 'CIVILIAN' ? 'var(--color-success)'
    : revealedRole === 'IMPOSTER' ? 'var(--color-danger)'
    : 'var(--color-accent-soft)';

  const roleLabel =
    revealedRole === 'CIVILIAN' ? `🧑 ${t.civilianRole}`
    : revealedRole === 'IMPOSTER' ? `🕵️ ${t.imposterRole}`
    : `👻 ${text.mrWhite}`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '1.5rem',
        gap: '1.75rem',
        maxWidth: '420px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated bg */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at 50% 40%, ${roleColor}18, transparent 60%)`, pointerEvents: 'none', animation: 'fadeIn 0.6s ease' }} />

      {/* Badge */}
      <div style={{ textAlign: 'center', animation: 'dropIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>
          {revealedRole === 'IMPOSTER' ? '💀' : revealedRole === 'MR_WHITE' ? '👻' : '😇'}
        </div>
        <div style={{ padding: '0.375rem 1.25rem', borderRadius: 'var(--radius-full)', background: `${roleColor}22`, color: roleColor, fontWeight: 700, fontSize: '1rem', border: `1px solid ${roleColor}44`, display: 'inline-block' }}>
          {roleLabel}
        </div>
      </div>

      {/* Player name */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>{text.eliminated}</p>
        <h2 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: 900 }}>{player.name}</h2>
      </div>

      {/* Word reveal */}
      {revealedWord && (
        <div style={{ width: '100%', background: 'var(--color-bg-card)', border: `1px solid ${roleColor}33`, borderRadius: 'var(--radius-xl)', padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{text.theirWord}</p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: roleColor }}>{revealedWord}</p>
        </div>
      )}

      {revealedRole === 'MR_WHITE' && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-accent-soft)', textAlign: 'center' }}>
          {text.mrWhiteGuessPrompt}
        </p>
      )}

      <PrimaryButton fullWidth onClick={onContinueAfterElimination}>
        {text.continueNextRound}
      </PrimaryButton>

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform: scale(0.4) translateY(-20px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  );
}
