import { useNavigate } from 'react-router-dom';
import { Smartphone, Globe } from 'lucide-react';
import { useI18n } from '../context/i18nContext';
import { AppHeader } from '../components/common/AppHeader';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { GameModeCard } from '../components/common/GameModeCard';

export default function ModeSelectionPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppHeader title={t.chooseMode} />

      <ScreenContainer style={{ padding: '1rem 1rem 2rem', gap: '1.5rem' }}>
        {/* Section heading */}
        <div style={{ width: '100%', paddingBottom: '0.25rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.25rem, 5vw, 1.625rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '0.4rem',
            }}
          >
            How do you want to play?
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Choose a game mode to get started.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%' }}>
          <GameModeCard
            icon={<Smartphone size={22} />}
            title={t.singleDevice}
            description={t.singleDeviceDesc}
            onClick={() => navigate('/play/local')}
            accentColor="rgba(124, 95, 230, 0.15)"
          />
          <GameModeCard
            icon={<Globe size={22} />}
            title={t.online}
            description={t.onlineDesc}
            badge="Soon"
            onClick={() => navigate('/play/online')}
            accentColor="rgba(91, 141, 245, 0.15)"
          />
        </div>

        {/* Info callout */}
        <div
          style={{
            width: '100%',
            background: 'rgba(124, 95, 230, 0.07)',
            border: '1px solid rgba(124, 95, 230, 0.18)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}
        >
          💡 <strong style={{ color: 'var(--color-text)' }}>Tip:</strong> Single Device is great for
          in-person parties. Everyone passes the phone to see their secret role privately.
        </div>
      </ScreenContainer>
    </div>
  );
}
