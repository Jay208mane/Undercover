import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../components/common/AppHeader';
import { LeaderboardList, toAllTimeRows, toCurrentGameRows } from '../components/common/LeaderboardList';
import { SecondaryButton } from '../components/common/Buttons';
import { useLocalGame } from '../game/local/LocalGameProvider';
import { useI18n } from '../context/i18nContext';

type BoardTab = 'all-time' | 'current-game';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const text = t.localGame;
  const [searchParams] = useSearchParams();
  const initialTab = ['current', 'current-game'].includes(searchParams.get('tab') ?? '')
    ? 'current-game'
    : 'all-time';
  const [tab, setTab] = useState<BoardTab>(initialTab);
  const {
    allTimeLeaderboard,
    currentGameLeaderboard,
    resetAllTimeLeaderboard,
    leaderboardStorageError,
  } = useLocalGame();

  const reset = () => {
    if (window.confirm(text.resetConfirmation)) {
      resetAllTimeLeaderboard();
    }
  };

  return (
    <div style={pageStyle}>
      <AppHeader title={t.leaderboard} />
      <main style={contentStyle}>
        <div role="tablist" aria-label={t.leaderboard} style={tabsStyle}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'all-time'}
            onClick={() => setTab('all-time')}
            style={tabButtonStyle(tab === 'all-time')}
          >
            {text.allTime}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'current-game'}
            onClick={() => setTab('current-game')}
            style={tabButtonStyle(tab === 'current-game')}
          >
            {text.currentGame}
          </button>
        </div>

        {tab === 'all-time' ? (
          <>
            <p style={descriptionStyle}>{text.allTimeDescription}</p>
            <LeaderboardList
              rows={toAllTimeRows(allTimeLeaderboard, currentGameLeaderboard)}
              emptyMessage={text.noAllTimeScores}
              totalLabel={text.total}
              earnedLabel={text.thisGame}
            />
            <SecondaryButton fullWidth onClick={reset}>{text.resetAllTime}</SecondaryButton>
          </>
        ) : (
          <>
            <p style={descriptionStyle}>{text.currentGameDescription}</p>
            <LeaderboardList
              rows={toCurrentGameRows(currentGameLeaderboard)}
              emptyMessage={text.noCurrentGame}
              totalLabel={text.total}
              earnedLabel={text.points}
            />
          </>
        )}
        <SecondaryButton fullWidth onClick={() => navigate('/')}>{text.returnHome}</SecondaryButton>
        {leaderboardStorageError && (
          <p role="status" style={{ color: 'var(--color-warning)', fontSize: '0.8125rem' }}>
            {leaderboardStorageError === 'reset'
              ? text.leaderboardResetError
              : leaderboardStorageError === 'saveScores'
                ? text.leaderboardScoreSaveError
                : text.leaderboardSavedError}
          </p>
        )}
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
};

const contentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
  padding: '1rem 1rem calc(1.5rem + env(safe-area-inset-bottom))',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
};

const tabsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.35rem',
  padding: '0.3rem',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
};

const tabButtonStyle = (selected: boolean): React.CSSProperties => ({
  minHeight: '2.75rem',
  border: 0,
  borderRadius: 'var(--radius-md)',
  background: selected ? 'linear-gradient(135deg, #7655df, #4e73df)' : 'transparent',
  color: selected ? '#fff' : 'var(--color-text-muted)',
  fontWeight: 750,
  cursor: 'pointer',
});

const descriptionStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.8125rem',
};
