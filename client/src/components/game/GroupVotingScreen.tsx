import { Check } from 'lucide-react';
import { useState } from 'react';
import { useLocalGame } from '../../game/local/LocalGameProvider';
import { PrimaryButton, SecondaryButton } from '../common/Buttons';
import { useI18n } from '../../context/i18nContext';
import { formatMessage } from '../../locales/format';

export function GroupVotingScreen() {
  const {
    alivePlayers,
    onConfirmElimination,
    onReturnToDiscussion,
    groupVoteError,
  } = useLocalGame();
  const { t } = useI18n();
  const text = t.localGame;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPlayer = alivePlayers.find((player) => player.id === selectedId);

  const confirmSelection = () => {
    if (selectedPlayer) onConfirmElimination(selectedPlayer.id);
  };

  return (
    <main style={screenStyle}>
      <header style={headerStyle}>
        <p style={eyebrowStyle}>{text.groupDecision}</p>
        <h1 style={titleStyle}>{text.selectElimination}</h1>
        <p style={subtitleStyle}>{text.discussAndSelect}</p>
      </header>

      <section
        aria-label={text.activePlayers}
        style={playerGridStyle}
      >
        {alivePlayers.map((player, index) => {
          const isSelected = selectedId === player.id;
          return (
            <button
              key={player.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={isSelected
                ? formatMessage(text.selectedPlayer, { name: player.name })
                : player.name}
              onClick={() => setSelectedId(player.id)}
              className="group-vote-player"
              style={{
                ...playerButtonStyle,
                animationDelay: `${Math.min(index, 8) * 25}ms`,
              }}
            >
              <span
                style={{
                  ...avatarStyle,
                  ...(isSelected ? selectedAvatarStyle : {}),
                }}
              >
                {isSelected && <Check size={18} strokeWidth={3} style={checkStyle} />}
                <span style={initialsStyle}>{getInitials(player.name)}</span>
              </span>
              <span
                style={{
                  ...playerNameStyle,
                  color: isSelected ? 'var(--color-accent-soft)' : 'var(--color-text)',
                }}
              >
                {player.name}
              </span>
            </button>
          );
        })}
      </section>

      <footer style={footerStyle}>
        <p aria-live="polite" style={selectedTextStyle}>
          {selectedPlayer ? (
            <strong>{formatMessage(text.selectedPlayer, { name: selectedPlayer.name })}</strong>
          ) : (
            text.tapPlayer
          )}
        </p>
        {groupVoteError && (
          <p role="alert" style={errorStyle}>{text.selectionError}</p>
        )}
        <PrimaryButton
          fullWidth
          disabled={!selectedPlayer}
          onClick={confirmSelection}
        >
          {text.confirmElimination}
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={onReturnToDiscussion}>
          {text.noDecision}
        </SecondaryButton>
      </footer>

      <style>{`
        @keyframes playerIn {
          from { opacity: 0; transform: translateY(8px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes selectPulse {
          0% { transform: scale(.94); }
          65% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .group-vote-player { animation: playerIn 260ms ease both; }
        .group-vote-player:active > span:first-child { transform: scale(.95); }
        @media (prefers-reduced-motion: reduce) {
          .group-vote-player { animation: none; }
        }
      `}</style>
    </main>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.length === 1
    ? parts[0].slice(0, 2).toLocaleUpperCase()
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase();
}

const screenStyle: React.CSSProperties = {
  minHeight: '100dvh',
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: 'calc(1.25rem + env(safe-area-inset-top)) 1rem calc(1rem + env(safe-area-inset-bottom))',
  overflowX: 'hidden',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  flexShrink: 0,
};

const eyebrowStyle: React.CSSProperties = {
  color: 'var(--color-accent-soft)',
  fontSize: '0.6875rem',
  fontWeight: 800,
  letterSpacing: '0.16em',
  marginBottom: '0.375rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.25rem, 5vw, 1.65rem)',
  fontWeight: 900,
  lineHeight: 1.2,
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.8125rem',
  marginTop: '0.35rem',
};

const playerGridStyle: React.CSSProperties = {
  flex: 1,
  alignContent: 'center',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))',
  gap: 'clamp(0.5rem, 2.5vw, 0.875rem)',
  width: '100%',
  minWidth: 0,
  padding: '0.25rem 0',
};

const playerButtonStyle: React.CSSProperties = {
  minWidth: 0,
  minHeight: '5.25rem',
  padding: '0.25rem 0.1rem',
  border: 0,
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  color: 'var(--color-text)',
  cursor: 'pointer',
  borderRadius: 'var(--radius-lg)',
};

const avatarStyle: React.CSSProperties = {
  width: 'clamp(2.8rem, 13vw, 3.5rem)',
  height: 'clamp(2.8rem, 13vw, 3.5rem)',
  flexShrink: 0,
  borderRadius: '50%',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(145deg, #30244f, #202b50)',
  border: '2px solid rgba(164,145,255,.4)',
  color: 'var(--color-text)',
  boxShadow: '0 6px 16px rgba(0,0,0,.24)',
  transition: 'transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
};

const selectedAvatarStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #7655df, #4e73df)',
  border: '2px solid #c4b5fd',
  boxShadow: '0 0 0 4px rgba(124,95,230,.2), 0 0 22px rgba(124,95,230,.48)',
  animation: 'selectPulse 220ms ease-out',
};

const checkStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-0.3rem',
  right: '-0.3rem',
  boxSizing: 'content-box',
  padding: '0.15rem',
  borderRadius: '50%',
  background: 'var(--color-success)',
  color: '#101318',
};

const initialsStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 800,
  letterSpacing: '0.02em',
};

const playerNameStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '5.5rem',
  fontSize: 'clamp(0.6875rem, 3vw, 0.8rem)',
  lineHeight: 1.15,
  fontWeight: 650,
  textAlign: 'center',
  overflowWrap: 'anywhere',
};

const footerStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
  paddingTop: '0.25rem',
};

const selectedTextStyle: React.CSSProperties = {
  minHeight: '1.1rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.8125rem',
};

const errorStyle: React.CSSProperties = {
  color: 'var(--color-danger)',
  fontSize: '0.8125rem',
  textAlign: 'center',
};
