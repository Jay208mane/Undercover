import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useI18n } from '../context/i18nContext';
import { AppHeader } from '../components/common/AppHeader';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { PlayerCounter } from '../components/common/PlayerCounter';
import { PlayerNameInput } from '../components/common/PlayerNameInput';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { CategorySelector } from '../components/common/CategorySelector';
import type { CategoryKey } from '../components/common/CategorySelector';
import { PrimaryButton } from '../components/common/Buttons';
import { GAME_RULES } from '../../../shared/game-rules';
import { getDefaultImposterCount } from '../game/engine/roleAssigner';
import { formatMessage } from '../locales/format';

const DEFAULT_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan',
  'Fiona', 'George', 'Hannah', 'Ivan', 'Julia',
];

function makeDefaultPlayers(count: number) {
  return Array.from({ length: count }, (_, i) => DEFAULT_NAMES[i] ?? `Player ${i + 1}`);
}

export default function LocalSetupPage() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const text = t.localGame;

  const [players, setPlayers] = useState<string[]>(() => makeDefaultPlayers(4));
  const [category, setCategory] = useState<CategoryKey>('random');
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [mrWhiteEnabled, setMrWhiteEnabled] = useState(false);
  const [imposterCountOverride, setImposterCountOverride] = useState<number | null>(null);
  const [discussionTimerSeconds, setDiscussionTimerSeconds] = useState<number>(
    GAME_RULES.DEFAULT_DISCUSSION_TIMER
  );
  const [customWordsEnabled, setCustomWordsEnabled] = useState(false);
  const [civilianWord, setCivilianWord] = useState('');
  const [imposterWord, setImposterWord] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const count = players.length;
  const maxImposterCount = Math.max(1, count - 1 - (mrWhiteEnabled ? 1 : 0));
  const imposterCount = Math.min(
    imposterCountOverride ?? getDefaultImposterCount(count),
    maxImposterCount
  );
  const civilianCount = count - imposterCount - (mrWhiteEnabled ? 1 : 0);
  const imposterLabel = imposterCount === 1 ? t.imposterRole : text.imposters;
  const civilianLabel = civilianCount === 1 ? t.civilianRole : text.civilians;

  const validate = useCallback(() => {
    const errs: Record<number, string> = {};
    const seen = new Set<string>();
    players.forEach((name, i) => {
      const trimmed = name.trim();
      if (!trimmed) {
        errs[i] = t.emptyName;
      } else if (seen.has(trimmed.toLowerCase())) {
        errs[i] = t.duplicateName;
      } else {
        seen.add(trimmed.toLowerCase());
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [players, t]);

  const handleIncrement = () => {
    if (count >= GAME_RULES.MAX_PLAYERS) return;
    setPlayers((p) => [...p, `Player ${p.length + 1}`]);
    setErrors({});
  };

  const handleDecrement = () => {
    if (count <= GAME_RULES.MIN_PLAYERS) return;
    setPlayers((p) => p.slice(0, -1));
    setErrors({});
  };

  const handleNameChange = (index: number, value: string) => {
    setPlayers((prev) => prev.map((n, i) => (i === index ? value : n)));
    setErrors((e) => { const copy = { ...e }; delete copy[index]; return copy; });
  };

  const handleRemove = (index: number) => {
    if (count <= GAME_RULES.MIN_PLAYERS) return;
    setPlayers((p) => p.filter((_, i) => i !== index));
    setErrors({});
  };

  const handleAddPlayer = () => {
    if (count >= GAME_RULES.MAX_PLAYERS) return;
    setPlayers((p) => [...p, `Player ${p.length + 1}`]);
    setErrors({});
  };

  const handleStart = () => {
    const namesValid = validate();
    if (count < GAME_RULES.MIN_PLAYERS || count > GAME_RULES.MAX_PLAYERS) {
      setFormError(formatMessage(text.choosePlayerRange, {
        min: GAME_RULES.MIN_PLAYERS,
        max: GAME_RULES.MAX_PLAYERS,
      }));
      return;
    }
    if (!namesValid) {
      setFormError(null);
      return;
    }
    if (customWordsEnabled) {
      if (!civilianWord.trim() || !imposterWord.trim()) {
        setFormError(text.enterBothWords);
        return;
      }
      if (civilianWord.trim().toLocaleLowerCase() === imposterWord.trim().toLocaleLowerCase()) {
        setFormError(text.wordsMustDiffer);
        return;
      }
    }
    setFormError(null);

    const config = {
      playerNames: players.map((n) => n.trim()),
      imposterCount,
      mrWhiteEnabled,
      language: lang,
      category,
      customWordPair: customWordsEnabled
        ? {
            civilian: civilianWord.trim(),
            imposter: imposterWord.trim(),
            category,
            language: lang,
          }
        : undefined,
      discussionTimerSeconds,
      votingTimerSeconds: GAME_RULES.DEFAULT_VOTING_TIMER,
    };

    navigate('/game/local', { state: { config } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppHeader title={t.playerSetup} />

      <ScreenContainer style={{ padding: '0.5rem 1rem 6rem', gap: '1.25rem' }}>

        {/* Player count row */}
        <section style={{ width: '100%' }}>
          <PlayerCounter
            count={count}
            min={GAME_RULES.MIN_PLAYERS}
            max={GAME_RULES.MAX_PLAYERS}
            label={t.players}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        </section>

        {/* Role preview */}
        <section style={{ width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text.roleDistribution}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <RolePill label={`${civilianCount} ${civilianLabel}`} color="var(--color-success)" />
            <RolePill label={`${imposterCount} ${imposterLabel}`} color="var(--color-danger)" />
            {mrWhiteEnabled && <RolePill label={`1 ${text.mrWhite}`} color="var(--color-accent-soft)" />}
          </div>
          <div style={{ marginTop: '0.875rem' }}>
            <label htmlFor="imposter-count" style={fieldLabelStyle}>
              {formatMessage(text.imposterCount, { count: imposterCount })}
            </label>
            <input
              id="imposter-count"
              type="range"
              min={1}
              max={maxImposterCount}
              step={1}
              value={imposterCount}
              onChange={(event) => setImposterCountOverride(Number(event.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              <span>1 {t.imposterRole}</span>
              <span>{formatMessage(text.maximum, { count: maxImposterCount })}</span>
            </div>
          </div>
          {/* Mr. White toggle */}
          <button
            type="button"
            aria-pressed={mrWhiteEnabled}
            onClick={() => setMrWhiteEnabled((v) => !v)}
            style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-text-muted)', padding: 0, minHeight: '2.75rem' }}
          >
            <span style={{ width: '2.5rem', height: '1.375rem', borderRadius: 'var(--radius-full)', background: mrWhiteEnabled ? 'linear-gradient(135deg, #7c5fe6, #5b8df5)' : 'var(--color-bg-elevated)', border: `1px solid ${mrWhiteEnabled ? 'transparent' : 'var(--color-border)'}`, position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
              <span style={{ position: 'absolute', top: '0.125rem', left: mrWhiteEnabled ? 'calc(100% - 1.1rem)' : '0.125rem', width: '1.0625rem', height: '1.0625rem', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.25s' }} />
            </span>
            {text.includeMrWhite}
          </button>
        </section>

        {/* Language picker */}
        <section style={{ width: '100%' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.language}
          </label>
          <LanguageSelector />
        </section>

        {/* Category picker */}
        <section style={{ width: '100%' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.category}
          </label>
          <CategorySelector value={category} onChange={setCategory} />
        </section>

        <section style={configurationCardStyle}>
          <button
            type="button"
            aria-pressed={customWordsEnabled}
            onClick={() => {
              setCustomWordsEnabled((enabled) => !enabled);
              setFormError(null);
            }}
            style={toggleRowStyle}
          >
            <span>{text.useCustomWords}</span>
            <span style={toggleTrackStyle(customWordsEnabled)}>
              <span style={toggleThumbStyle(customWordsEnabled)} />
            </span>
          </button>
          {customWordsEnabled && (
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
              <label style={{ ...fieldLabelStyle, marginBottom: 0 }}>
                {text.civilianWord}
                <input
                  className="input"
                  value={civilianWord}
                  onChange={(event) => setCivilianWord(event.target.value)}
                  placeholder={formatMessage(text.customWordExample, { word: 'APPLE' })}
                  maxLength={50}
                  style={{ marginTop: '0.375rem' }}
                />
              </label>
              <label style={{ ...fieldLabelStyle, marginBottom: 0 }}>
                {text.imposterWord}
                <input
                  className="input"
                  value={imposterWord}
                  onChange={(event) => setImposterWord(event.target.value)}
                  placeholder={formatMessage(text.customWordExample, { word: 'MANGO' })}
                  maxLength={50}
                  style={{ marginTop: '0.375rem' }}
                />
              </label>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>
                {text.ownWordOnly}
              </p>
            </div>
          )}
        </section>

        <section style={configurationCardStyle}>
          <label htmlFor="discussion-timer" style={fieldLabelStyle}>
            {formatMessage(text.discussionTimerValue, {
              time: discussionTimerSeconds === 0
                ? text.timerOff
                : `${discussionTimerSeconds}${text.seconds}`,
            })}
          </label>
          <input
            id="discussion-timer"
            type="range"
            min={0}
            max={600}
            step={30}
            value={discussionTimerSeconds}
            onChange={(event) => setDiscussionTimerSeconds(Number(event.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
            <span>{text.timerOff}</span>
            <span>{text.timerTenMinutes}</span>
          </div>
        </section>

        {/* Player name inputs */}
        <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.125rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.players} ({count})
            </label>
            {count < GAME_RULES.MAX_PLAYERS && (
              <button
                onClick={handleAddPlayer}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', background: 'rgba(124, 95, 230, 0.12)', border: '1px solid rgba(124, 95, 230, 0.25)', color: 'var(--color-accent-soft)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <UserPlus size={13} />
                {t.addPlayer}
              </button>
            )}
          </div>

          {players.map((name, i) => (
            <PlayerNameInput
              key={i}
              index={i}
              value={name}
              error={errors[i]}
              onChange={(v) => handleNameChange(i, v)}
              onRemove={() => handleRemove(i)}
              canRemove={count > GAME_RULES.MIN_PLAYERS}
              placeholder={t.playerNamePlaceholder}
            />
          ))}
          {formError && (
            <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.8125rem' }}>
              {formError}
            </p>
          )}
        </section>
      </ScreenContainer>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)', maxWidth: '480px', margin: '0 auto' }}>
        <PrimaryButton fullWidth onClick={handleStart}>
          {t.startGame} · {count} {t.players}
        </PrimaryButton>
      </div>
    </div>
  );
}

const configurationCardStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '0.875rem 1rem',
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  marginBottom: '0.5rem',
};

const toggleRowStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  border: 0,
  background: 'transparent',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
  textAlign: 'left',
  cursor: 'pointer',
};

const toggleTrackStyle = (enabled: boolean): React.CSSProperties => ({
  width: '3rem',
  height: '1.625rem',
  borderRadius: 'var(--radius-full)',
  background: enabled ? 'linear-gradient(135deg, #7c5fe6, #5b8df5)' : 'var(--color-bg-elevated)',
  border: `1px solid ${enabled ? 'transparent' : 'var(--color-border)'}`,
  position: 'relative',
  flexShrink: 0,
  transition: 'background 0.25s',
});

const toggleThumbStyle = (enabled: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '0.125rem',
  left: enabled ? 'calc(100% - 1.375rem)' : '0.125rem',
  width: '1.25rem',
  height: '1.25rem',
  borderRadius: '50%',
  background: '#fff',
  transition: 'left 0.25s',
});

function RolePill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', background: `${color}18`, color, border: `1px solid ${color}33`, fontSize: '0.8125rem', fontWeight: 600 }}>
      {label}
    </span>
  );
}
