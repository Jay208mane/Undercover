import type { Language } from '../../../../shared/types';
import { useI18n } from '../../context/i18nContext';

const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: 'en', flag: '🇬🇧', label: 'English' },
  { value: 'mr', flag: '🇮🇳', label: 'मराठी' },
  { value: 'hi', flag: '🇮🇳', label: 'हिंदी' },
];

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact }: LanguageSelectorProps) {
  const { lang, setLang } = useI18n();

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      {LANGUAGES.map((l) => {
        const active = lang === l.value;
        return (
          <button
            key={l.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(l.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: compact ? '0.375rem 0.625rem' : '0.5rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: active ? 'rgba(124, 95, 230, 0.15)' : 'var(--color-bg-elevated)',
              color: active ? 'var(--color-accent-soft)' : 'var(--color-text-muted)',
              fontWeight: active ? 600 : 400,
              fontSize: compact ? '0.8125rem' : '0.875rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
