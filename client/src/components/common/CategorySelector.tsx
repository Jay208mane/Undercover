import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../context/i18nContext';
import type { Translations } from '../../locales/types';

export type CategoryKey = keyof Translations['categories'];

interface CategorySelectorProps {
  value: CategoryKey;
  onChange: (value: CategoryKey) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const keys = Object.keys(t.categories) as CategoryKey[];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.875rem',
          background: 'var(--color-bg-input)',
          border: open ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text)',
          fontSize: '0.9375rem',
          cursor: 'pointer',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        <span>{t.categories[value]}</span>
        <ChevronDown
          size={16}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.375rem)',
            left: 0,
            right: 0,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => { onChange(k); setOpen(false); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem 1rem',
                background: k === value ? 'rgba(124, 95, 230, 0.12)' : 'transparent',
                color: k === value ? 'var(--color-accent-soft)' : 'var(--color-text)',
                border: 'none',
                fontSize: '0.9375rem',
                fontWeight: k === value ? 600 : 400,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (k !== value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-elevated)';
              }}
              onMouseLeave={(e) => {
                if (k !== value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {t.categories[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
