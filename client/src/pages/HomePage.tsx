import { useNavigate } from 'react-router-dom';
import { BookOpen, Settings } from 'lucide-react';
import { useI18n } from '../context/i18nContext';
import { PrimaryButton, SecondaryButton, IconButton } from '../components/common/Buttons';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useLocalGame } from '../game/local/LocalGameProvider';
import { formatMessage } from '../locales/format';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { phase, currentGameLeaderboard } = useLocalGame();
  const hasUnfinishedGame = phase !== 'SETUP' && phase !== 'GAME_OVER';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow blobs */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-15vw',
          left: '-10vw',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 95, 230, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: '-10vw',
          right: '-10vw',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 141, 245, 0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <LanguageSelector compact />
        <IconButton onClick={() => navigate('/settings')} aria-label={t.settings}>
          <Settings size={16} />
        </IconButton>
      </div>

      {/* Hero content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem 1.5rem 2rem',
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          gap: '2.5rem',
        }}
      >
        {/* Logo area */}
        <div style={{ textAlign: 'center' }}>
          {/* Spy icon badge */}
          <div
            style={{
              width: '7rem',
              height: '7rem',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 0 40px rgba(124, 95, 230, 0.2)',
              position: 'relative',
            }}
          >
            🕵️
            {/* Animated ring */}
            <span
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: 'calc(var(--radius-xl) + 4px)',
                border: '1px solid rgba(124, 95, 230, 0.3)',
                animation: 'ringPulse 3s ease-in-out infinite',
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 10vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #fff 20%, #c084fc 60%, #5b8df5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t.appName}
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
              lineHeight: 1.5,
              maxWidth: '20rem',
              margin: '0 auto',
            }}
          >
            {t.tagline}
          </p>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '20rem',
          }}
        >
          <PrimaryButton fullWidth onClick={() => navigate('/mode')}>
            {t.playGame}
          </PrimaryButton>
          <SecondaryButton
            fullWidth
            icon={<BookOpen size={16} />}
            onClick={() => navigate('/how-to-play')}
          >
            {t.howToPlay}
          </SecondaryButton>
          {hasUnfinishedGame && (
            <SecondaryButton fullWidth onClick={() => navigate('/game/local')}>
              {t.localGame.continueCurrentGame}
            </SecondaryButton>
          )}
          <SecondaryButton fullWidth onClick={() => navigate('/leaderboard')}>
            🏆 {t.leaderboard}
            {currentGameLeaderboard && currentGameLeaderboard.entries.length > 0
              ? ` · ${formatMessage(t.localGame.playersStat, { count: currentGameLeaderboard.entries.length })}`
              : ''}
          </SecondaryButton>
        </div>

        {/* Decorative stat pills */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: '3-20', sub: t.players },
            { label: 'EN · MR · HI', sub: t.localGame.languagesStat },
            { label: '🏆', sub: t.leaderboard },
          ].map((s) => (
            <div
              key={s.sub}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s.label}</span>{' '}
              {s.sub}
            </div>
          ))}
        </div>
      </div>

      {/* Keyframe style */}
      <style>{`
        @keyframes ringPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
