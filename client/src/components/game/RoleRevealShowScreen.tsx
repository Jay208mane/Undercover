import { useLocalGame } from '../../game/local/LocalGameProvider';
import { useI18n } from '../../context/i18nContext';

export function RoleRevealShowScreen() {
  const { currentPlayerView, onHideClick } = useLocalGame();
  const { t } = useI18n();
  if (!currentPlayerView) return null;

  const { word, roleLabel } = currentPlayerView;
  const isMrWhite = roleLabel === 'Mr. White';
  const isCivilian = roleLabel === 'Civilian';
  const instructions = isMrWhite
    ? t.localGame.mrWhiteReveal
    : isCivilian
      ? t.localGame.civilianReveal
      : t.localGame.undercoverReveal;

  return (
    <main
      style={screenStyle}
      role="button"
      tabIndex={0}
      aria-label={t.localGame.privateRevealAria}
      onClick={onHideClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onHideClick();
        }
      }}
    >
      <div aria-hidden style={backgroundGlowStyle} />
      <div style={contentStyle}>
        <div className="picked-card" style={cardStyle}>
          <div style={cardInnerStyle}>
            <div style={iconStyle}>{isMrWhite ? '👻' : isCivilian ? '🧑' : '✦'}</div>
            {roleLabel && (
              <div style={roleLabelStyle}>
                {isMrWhite ? t.localGame.mrWhite : t.civilianRole}
              </div>
            )}
            {isMrWhite ? (
              <h1 style={messageStyle}>{t.localGame.youAreMrWhite}</h1>
            ) : (
              <>
                <p style={wordLabelStyle}>{t.localGame.secretWord}</p>
                <h1 style={wordStyle}>{word}</h1>
              </>
            )}
            <p style={instructionsStyle}>{instructions}</p>
          </div>
        </div>
        <p style={hideHintStyle}>{t.localGame.tapToHide}</p>
        <p style={privacyHintStyle}>{t.localGame.keepPrivate}</p>
      </div>
      <style>{`
        @keyframes privateCardFlip {
          from { opacity: 0; transform: rotateY(88deg) scale(.92); }
          to { opacity: 1; transform: rotateY(0) scale(1); }
        }
        .picked-card { animation: privateCardFlip 520ms cubic-bezier(.2,.72,.24,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .picked-card { animation: none; }
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
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  padding: 'calc(1.25rem + env(safe-area-inset-top)) 1rem calc(1.5rem + env(safe-area-inset-bottom))',
  cursor: 'pointer',
  outline: 'none',
};

const backgroundGlowStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background:
    'radial-gradient(ellipse at 50% 30%, rgba(124,95,230,.2), transparent 52%), radial-gradient(ellipse at 80% 80%, rgba(91,141,245,.13), transparent 45%)',
};

const contentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  position: 'relative',
  zIndex: 1,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 'min(68dvh, 500px)',
  display: 'flex',
  padding: '0.55rem',
  borderRadius: '1.5rem',
  background: 'linear-gradient(145deg, #9e83ff, #4d73e8 60%, #8a63e8)',
  boxShadow: '0 24px 70px rgba(0,0,0,.42), 0 0 46px rgba(124,95,230,.16)',
  transformStyle: 'preserve-3d',
};

const cardInnerStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: '1.1rem',
  border: '1px solid rgba(255,255,255,.25)',
  background:
    'radial-gradient(circle at 50% 24%, rgba(124,95,230,.16), transparent 45%), #171720',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(1.25rem, 7vw, 2rem)',
  textAlign: 'center',
  gap: '0.75rem',
};

const iconStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  lineHeight: 1,
  marginBottom: '0.25rem',
};

const roleLabelStyle: React.CSSProperties = {
  color: 'var(--color-success)',
  fontWeight: 800,
  fontSize: '0.9375rem',
  padding: '0.3rem 0.9rem',
  borderRadius: 'var(--radius-full)',
  border: '1px solid rgba(52,211,153,.3)',
  background: 'rgba(52,211,153,.09)',
};

const wordLabelStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginTop: '0.75rem',
};

const wordStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontSize: 'clamp(2rem, 10vw, 3.25rem)',
  fontWeight: 900,
  lineHeight: 1.12,
  overflowWrap: 'anywhere',
  textShadow: '0 0 30px rgba(155,127,240,.3)',
};

const messageStyle: React.CSSProperties = {
  color: 'var(--color-accent-soft)',
  fontSize: 'clamp(1.6rem, 8vw, 2.4rem)',
  fontWeight: 900,
  lineHeight: 1.15,
};

const instructionsStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
  lineHeight: 1.65,
  maxWidth: '18rem',
  marginTop: '0.75rem',
};

const hideHintStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  fontWeight: 700,
  marginTop: '0.25rem',
};

const privacyHintStyle: React.CSSProperties = {
  color: 'var(--color-text-dim)',
  fontSize: '0.75rem',
};
