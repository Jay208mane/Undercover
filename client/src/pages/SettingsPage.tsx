import { Volume2, Vibrate, Palette, Info } from 'lucide-react';
import { useI18n } from '../context/i18nContext';
import { useSettings } from '../context/settingsContext';
import { AppHeader } from '../components/common/AppHeader';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ToggleSetting } from '../components/common/ToggleSetting';
import { LanguageSelector } from '../components/common/LanguageSelector';
import type { Theme } from '../context/settingsContext';

export default function SettingsPage() {
  const { t } = useI18n();
  const { sound, vibration, theme, toggleSound, toggleVibration, setTheme } = useSettings();

  const themes: { value: Theme; label: string }[] = [
    { value: 'dark', label: t.themeOptions.dark },
    { value: 'midnight', label: t.themeOptions.midnight },
    { value: 'neon', label: t.themeOptions.neon },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppHeader title={t.settingsTitle} />

      <ScreenContainer style={{ padding: '0.5rem 1rem 2rem', gap: '1.25rem' }}>

        {/* Language */}
        <section style={{ width: '100%' }}>
          <SectionLabel>{t.language}</SectionLabel>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
            }}
          >
            <LanguageSelector />
          </div>
        </section>

        {/* Sound & Vibration */}
        <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SectionLabel>Audio &amp; Feedback</SectionLabel>
          <ToggleSetting
            icon={<Volume2 size={16} />}
            label={t.soundLabel}
            description={t.soundDesc}
            checked={sound}
            onChange={toggleSound}
          />
          <ToggleSetting
            icon={<Vibrate size={16} />}
            label={t.vibrationLabel}
            description={t.vibrationDesc}
            checked={vibration}
            onChange={toggleVibration}
          />
        </section>

        {/* Theme */}
        <section style={{ width: '100%' }}>
          <SectionLabel>{t.themeLabel}</SectionLabel>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.875rem',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            {themes.map((th) => (
              <button
                key={th.value}
                onClick={() => setTheme(th.value)}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${theme === th.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background:
                    theme === th.value
                      ? 'rgba(124, 95, 230, 0.15)'
                      : 'var(--color-bg-elevated)',
                  color:
                    theme === th.value ? 'var(--color-accent-soft)' : 'var(--color-text-muted)',
                  fontWeight: theme === th.value ? 600 : 400,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {th.label}
              </button>
            ))}
          </div>
        </section>

        {/* Palette preview */}
        <div
          style={{
            width: '100%',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Palette size={15} color="var(--color-text-dim)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Active theme: <strong style={{ color: 'var(--color-text)' }}>{theme}</strong>
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(251, 191, 36, 0.12)',
              color: 'var(--color-warning)',
            }}
          >
            Preview only
          </span>
        </div>

        {/* About */}
        <section style={{ width: '100%' }}>
          <SectionLabel>{t.about}</SectionLabel>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(124, 95, 230, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}
            >
              🕵️
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                {t.appName}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                {t.aboutDesc}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                {t.version}
              </p>
            </div>
          </div>
        </section>

        {/* Health check */}
        <HealthBadge />
      </ScreenContainer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: '0.625rem',
      }}
    >
      {children}
    </div>
  );
}

import { useState, useEffect } from 'react';
function HealthBadge() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [db, setDb] = useState<string>('—');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => { setStatus(d.success ? 'ok' : 'error'); setDb(d.data?.database ?? '—'); })
      .catch(() => setStatus('error'));
  }, []);

  const color = status === 'ok' ? 'var(--color-success)' : status === 'error' ? 'var(--color-danger)' : 'var(--color-text-dim)';

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.875rem 1rem',
        display: 'flex',
        gap: '0.625rem',
        alignItems: 'center',
      }}
    >
      <Info size={14} color="var(--color-text-dim)" />
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        Server:{' '}
        <strong style={{ color }}>
          {status === 'ok' ? 'connected' : status === 'error' ? 'unreachable' : 'checking…'}
        </strong>
        {status === 'ok' && (
          <> · DB: <strong style={{ color: 'var(--color-success)' }}>{db}</strong></>
        )}
      </span>
    </div>
  );
}
