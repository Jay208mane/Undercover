import { useLocalGame } from '../../game/local/LocalGameProvider';
import { useI18n } from '../../context/i18nContext';
import { formatMessage } from '../../locales/format';

export function RoleRevealQueueScreen() {
  const {
    currentRevealPlayer,
    revealIndex,
    revealPlayerCount,
    remainingCards,
    availableRoleCardIds,
    onPickRoleCard,
  } = useLocalGame();
  const { t } = useI18n();
  const text = t.localGame;

  if (!currentRevealPlayer) return null;

  return (
    <main style={screenStyle}>
      <div aria-hidden style={backgroundGlowStyle} />

      <div style={contentStyle}>
        <div style={eyebrowStyle}>{text.privateCardPick}</div>
        <h1 style={titleStyle}>{text.passPhoneTo}</h1>
        <p style={playerNameStyle}>{currentRevealPlayer.name}</p>
        <p style={subtitleStyle}>{text.chooseCard}</p>

        <div style={counterStyle} aria-live="polite">
          <strong>{remainingCards}</strong>
          <span>{remainingCards === 1 ? text.cardRemaining : text.cardsRemaining}</span>
        </div>

        <div style={cardGridStyle} aria-label={text.availableCards}>
          {availableRoleCardIds.map((cardId, index) => (
            <button
              key={cardId}
              type="button"
              aria-label={formatMessage(text.pickCardAria, { number: index + 1 })}
              onClick={() => onPickRoleCard(cardId)}
              style={cardButtonStyle}
            >
              <span className="role-card-back" aria-hidden style={cardBackStyle}>
                <span style={cardInnerBorderStyle}>
                  <span style={cardMarkStyle}>✦</span>
                  <span style={cardBackCaptionStyle}>UNDERCOVER</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <p style={privacyHintStyle}>
          🔒 {text.protectScreen}
        </p>
        <p style={progressStyle}>
          {formatMessage(text.playerProgress, { current: revealIndex + 1, total: revealPlayerCount })}
        </p>
      </div>

      <style>{`
        @keyframes cardDealIn {
          from { opacity: 0; transform: translateY(14px) rotateY(-12deg) scale(.96); }
          to { opacity: 1; transform: translateY(0) rotateY(0) scale(1); }
        }
        .role-card-back {
          animation: cardDealIn 360ms cubic-bezier(.2,.8,.2,1) both;
          transition: transform 180ms ease, filter 180ms ease;
        }
        .role-card-back:hover, .role-card-back:focus-visible {
          transform: translateY(-4px) rotateY(5deg);
          filter: brightness(1.16);
        }
        @media (prefers-reduced-motion: reduce) {
          .role-card-back { animation: none; transition: none; }
        }
      `}</style>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: '100dvh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  padding: 'calc(1.25rem + env(safe-area-inset-top)) 1rem calc(1.5rem + env(safe-area-inset-bottom))',
};

const backgroundGlowStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background:
    'radial-gradient(ellipse at 50% 12%, rgba(124,95,230,.2), transparent 48%), radial-gradient(ellipse at 90% 80%, rgba(91,141,245,.12), transparent 42%)',
};

const contentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
  position: 'relative',
  zIndex: 1,
};

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--color-accent-soft)',
  fontSize: '0.6875rem',
  fontWeight: 800,
  letterSpacing: '0.16em',
};

const titleStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 'clamp(1rem, 4vw, 1.125rem)',
  fontWeight: 600,
  marginTop: '0.25rem',
};

const playerNameStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontSize: 'clamp(1.75rem, 8vw, 2.5rem)',
  fontWeight: 900,
  lineHeight: 1.12,
  textAlign: 'center',
  overflowWrap: 'anywhere',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
  textAlign: 'center',
};

const counterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.4rem',
  marginTop: '0.75rem',
  padding: '0.5rem 1rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(30,30,40,.8)',
  color: 'var(--color-text-muted)',
  fontSize: '0.8125rem',
};

const cardGridStyle: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
  gap: '0.625rem',
  marginTop: '0.75rem',
};

const cardButtonStyle: React.CSSProperties = {
  appearance: 'none',
  border: 0,
  background: 'transparent',
  padding: 0,
  minWidth: 0,
  aspectRatio: '0.72',
  cursor: 'pointer',
  perspective: '900px',
};

const cardBackStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.35rem',
  borderRadius: '0.875rem',
  background: 'linear-gradient(145deg, #32235e 0%, #252d66 52%, #183b70 100%)',
  border: '1px solid rgba(178,160,255,.55)',
  boxShadow: '0 8px 18px rgba(0,0,0,.32), inset 0 1px rgba(255,255,255,.14)',
};

const cardInnerBorderStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: '1px solid rgba(216,204,255,.34)',
  borderRadius: '0.625rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
  color: '#e2dcff',
  background:
    'radial-gradient(circle at 50% 40%, rgba(171,145,255,.22), transparent 55%), repeating-linear-gradient(45deg, transparent 0 7px, rgba(255,255,255,.025) 7px 8px)',
};

const cardMarkStyle: React.CSSProperties = {
  fontSize: 'clamp(1.1rem, 6vw, 1.7rem)',
  lineHeight: 1,
  textShadow: '0 0 14px rgba(204,188,255,.8)',
};

const cardBackCaptionStyle: React.CSSProperties = {
  fontSize: 'clamp(0.38rem, 1.8vw, 0.52rem)',
  fontWeight: 800,
  letterSpacing: '0.12em',
};

const privacyHintStyle: React.CSSProperties = {
  color: 'var(--color-text-dim)',
  fontSize: '0.75rem',
  textAlign: 'center',
  marginTop: '0.75rem',
};

const progressStyle: React.CSSProperties = {
  color: 'var(--color-text-dim)',
  fontSize: '0.6875rem',
  fontVariantNumeric: 'tabular-nums',
};
