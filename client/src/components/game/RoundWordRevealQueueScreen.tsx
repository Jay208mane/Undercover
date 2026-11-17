import { useLocalGame } from '../../game/local/LocalGameProvider';
import { useI18n } from '../../context/i18nContext';
import { PrimaryButton } from '../common/Buttons';
import { formatMessage } from '../../locales/format';

export function RoundWordRevealQueueScreen() {
  const {
    currentRevealPlayer,
    revealIndex,
    revealPlayerCount,
    round,
    onShowNextRoundWord,
  } = useLocalGame();
  const { t } = useI18n();
  const text = t.localGame;

  if (!currentRevealPlayer) return null;

  return (
    <main style={screenStyle}>
      <div aria-hidden style={glowStyle} />
      <div style={contentStyle}>
        <p style={eyebrowStyle}>{formatMessage(text.round, { round })}</p>
        <h1 style={titleStyle}>{text.passPhoneTo}</h1>
        <p style={nameStyle}>{currentRevealPlayer.name}</p>
        <p style={instructionStyle}>{text.newRoundWord}</p>
        <PrimaryButton fullWidth onClick={onShowNextRoundWord}>
          {text.revealMyWord}
        </PrimaryButton>
        <p style={progressStyle}>
          {formatMessage(text.playerProgress, { current: revealIndex + 1, total: revealPlayerCount })}
        </p>
      </div>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: '100dvh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  padding: 'calc(1.25rem + env(safe-area-inset-top)) 1rem calc(1.5rem + env(safe-area-inset-bottom))',
};

const glowStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background: 'radial-gradient(ellipse at 50% 20%, rgba(124,95,230,.2), transparent 52%)',
};

const contentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  position: 'relative',
};

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--color-accent-soft)',
  fontSize: '0.75rem',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const titleStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '1rem',
  fontWeight: 600,
};

const nameStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontSize: 'clamp(1.75rem, 8vw, 2.5rem)',
  fontWeight: 900,
  lineHeight: 1.12,
  textAlign: 'center',
  overflowWrap: 'anywhere',
};

const instructionStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  fontSize: '0.875rem',
  lineHeight: 1.55,
  marginBottom: '0.75rem',
};

const progressStyle: React.CSSProperties = {
  color: 'var(--color-text-dim)',
  fontSize: '0.75rem',
  fontVariantNumeric: 'tabular-nums',
};
