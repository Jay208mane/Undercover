import { Play, Pause, RotateCcw, Users } from 'lucide-react';
import { useLocalGame } from '../../game/local/LocalGameProvider';
import { PrimaryButton } from '../common/Buttons';
import { useTimer } from '../../hooks/useTimer';
import { useI18n } from '../../context/i18nContext';
import { formatMessage } from '../../locales/format';

export function DiscussionScreen() {
  const { alivePlayers, safeConfig, round, onStartVoting } = useLocalGame();
  const { t } = useI18n();
  const text = t.localGame;
  const timerSecs = safeConfig?.discussionTimerSeconds ?? 180;
  const { seconds, isRunning, isExpired, formatted, start, pause, reset } = useTimer({
    initialSeconds: timerSecs,
  });

  const pct = timerSecs > 0 ? (seconds / timerSecs) * 100 : 100;
  const timerColor = pct > 50 ? 'var(--color-success)' : pct > 20 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem 0', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{text.discussion}</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {formatMessage(text.round, { round })}
            </p>
          </div>
          <div style={{ padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            <Users size={12} style={{ display: 'inline', marginRight: '0.375rem' }} />
            {formatMessage(text.aliveCount, { count: alivePlayers.length })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '1.25rem 1.25rem 2rem', maxWidth: '480px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Timer */}
        {timerSecs > 0 && (
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>{text.discussionTimer}</p>

            {/* Circular progress */}
            <div style={{ position: 'relative', width: '7rem', height: '7rem', margin: '0 auto 1rem' }}>
              <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                <circle
                  cx="56" cy="56" r="48"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                  {formatted}
                </span>
              </div>
            </div>

            {isExpired ? (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem', fontWeight: 600 }}>⏰ {text.timeUp}</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
                {isRunning ? (
                  <button onClick={pause} style={timerBtn}>
                    <Pause size={15} /> {text.pause}
                  </button>
                ) : (
                  <button onClick={start} style={{ ...timerBtn, background: 'rgba(124,95,230,0.15)', color: 'var(--color-accent-soft)', border: '1px solid rgba(124,95,230,0.3)' }}>
                    <Play size={15} /> {seconds === timerSecs ? t.start : text.resume}
                  </button>
                )}
                <button onClick={reset} style={timerBtn}>
                  <RotateCcw size={14} /> {text.reset}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.65 }}>
            💬 {text.clueInstructions}
          </p>
        </div>

        {/* Player list */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>{text.activePlayers}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {alivePlayers.map((p) => (
              <div key={p.id} style={{ padding: '0.375rem 0.875rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 500 }}>
                {p.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <PrimaryButton fullWidth onClick={onStartVoting}>
          {text.proceedVoting}
        </PrimaryButton>
      </div>
    </div>
  );
}

const timerBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
  padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)', fontSize: '0.8125rem', cursor: 'pointer',
};
