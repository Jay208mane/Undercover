import { useNavigate } from 'react-router-dom';
import { useLocalGame } from '../../game/local/LocalGameProvider';
import { PrimaryButton, SecondaryButton } from '../common/Buttons';
import { LeaderboardList, toAllTimeRows, toCurrentGameRows } from '../common/LeaderboardList';
import { useI18n } from '../../context/i18nContext';

export function GameOverScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const text = t.localGame;
  const {
    winResult,
    gameResults,
    round,
    restartGame,
    resetGame,
    civilianWord,
    allTimeLeaderboard,
    currentGameLeaderboard,
    leaderboardStorageError,
  } = useLocalGame();
  if (!winResult) return null;

  const winnerColor =
    winResult.winner === 'CIVILIANS' ? 'var(--color-success)'
    : winResult.winner === 'MR_WHITE' ? 'var(--color-accent-soft)'
    : 'var(--color-danger)';

  const winnerEmoji =
    winResult.winner === 'CIVILIANS' ? '🏆'
    : winResult.winner === 'MR_WHITE' ? '👻'
    : '🕵️';

  const roleLabel = (role: string) =>
    role === 'CIVILIAN' ? t.civilianRole
    : role === 'IMPOSTER' ? t.imposterRole
    : text.mrWhite;

  const roleColor = (role: string) =>
    role === 'CIVILIAN' ? 'var(--color-success)'
    : role === 'IMPOSTER' ? 'var(--color-danger)'
    : 'var(--color-accent-soft)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Fixed glow */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at 50% 25%, ${winnerColor}18, transparent 55%)`, pointerEvents: 'none' }} />

      <div style={{ flex: 1, padding: '2rem 1.25rem 1.25rem', maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 1, position: 'relative' }}>

        {/* Winner banner */}
        <div style={{ textAlign: 'center', animation: 'dropIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>{winnerEmoji}</div>
          <div style={{ padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', background: `${winnerColor}22`, color: winnerColor, fontWeight: 800, fontSize: '1.25rem', border: `1px solid ${winnerColor}44`, display: 'inline-block', marginBottom: '0.5rem' }}>
            {winResult.winner === 'CIVILIANS' ? text.civilianWin : winResult.winner === 'MR_WHITE' ? text.mrWhiteWin : text.imposterWin}
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {winResult.reason.startsWith('Two players remain')
              ? text.twoPlayerWinSummary
              : winResult.winner === 'CIVILIANS'
                ? text.civilianWinSummary
                : winResult.winner === 'MR_WHITE'
                  ? text.mrWhiteWinSummary
                  : text.imposterWinSummary}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {[
            { label: text.rounds, value: round },
            { label: text.totalPlayers, value: gameResults.length },
            { label: text.civilianWordLabel, value: civilianWord ?? '—' },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>{s.value}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Player reveal table */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.625rem' }}>{text.allRolesRevealed}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {gameResults.map((p) => (
              <div key={p.id} style={{ background: 'var(--color-bg-card)', border: `1px solid var(--color-border)`, borderLeft: `3px solid ${roleColor(p.role)}`, borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: p.isAlive ? 'var(--color-text)' : 'var(--color-text-dim)' }}>
                      {p.name}
                    </span>
                    {!p.isAlive && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{text.eliminatedLabel}</span>}
                  </div>
                  <div style={{ fontSize: '0.8125rem', marginTop: '0.2rem', color: roleColor(p.role), fontWeight: 600 }}>
                    {roleLabel(p.role)}
                    {p.word && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> · {p.word}</span>}
                    {!p.word && p.role === 'MR_WHITE' && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> · {text.noWord}</span>}
                  </div>
                </div>
                <span style={{ color: p.pointsEarned > 0 ? 'var(--color-success)' : 'var(--color-text-dim)', fontWeight: 800, flexShrink: 0 }}>
                  +{p.pointsEarned} {text.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        <section>
          <p style={sectionTitleStyle}>{text.currentRankings}</p>
          <LeaderboardList
            rows={toCurrentGameRows(currentGameLeaderboard).map((player) => ({
              ...player,
              pointsEarned: gameResults.find((result) => result.id === player.playerId)?.pointsEarned ?? player.pointsEarned,
            }))}
            emptyMessage={text.noCurrentGame}
            totalLabel={text.total}
            earnedLabel={text.pointsEarned}
          />
        </section>

        <section>
          <p style={sectionTitleStyle}>{text.allTimeRankings}</p>
          <LeaderboardList
            rows={toAllTimeRows(allTimeLeaderboard, currentGameLeaderboard)}
            emptyMessage={text.noAllTimeScores}
            totalLabel={text.total}
            earnedLabel={text.thisGame}
          />
        </section>
        {leaderboardStorageError && (
          <p role="status" style={{ color: 'var(--color-warning)', fontSize: '0.8125rem' }}>
            {leaderboardStorageError === 'reset'
              ? text.leaderboardResetError
              : leaderboardStorageError === 'saveScores'
                ? text.leaderboardScoreSaveError
                : text.leaderboardSavedError}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingBottom: '1rem' }}>
          <PrimaryButton fullWidth onClick={restartGame}>
            {text.playAgain}
          </PrimaryButton>
          <SecondaryButton fullWidth onClick={() => { resetGame(); navigate('/'); }}>
            {text.returnHome}
          </SecondaryButton>
          <SecondaryButton fullWidth onClick={() => navigate('/leaderboard?tab=all-time')}>
            {text.viewAllTime}
          </SecondaryButton>
        </div>
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform: scale(0.6) translateY(-20px); }
          to { opacity:1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 800,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.55rem',
};
