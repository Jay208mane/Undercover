import { Trash2 } from 'lucide-react';
import { useI18n } from '../../context/i18nContext';
import { formatMessage } from '../../locales/format';

interface PlayerNameInputProps {
  index: number;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  placeholder?: string;
}

export function PlayerNameInput({
  index,
  value,
  error,
  onChange,
  onRemove,
  canRemove,
  placeholder = 'Enter name…',
}: PlayerNameInputProps) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Number badge */}
        <span
          style={{
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        {/* Input */}
        <input
          className="input"
          type="text"
          value={value}
          maxLength={20}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            borderColor: error ? 'var(--color-danger)' : undefined,
          }}
          aria-label={formatMessage(t.localGame.playerNameAria, { number: index + 1 })}
          autoComplete="off"
          autoCapitalize="words"
        />

        {/* Remove */}
        {canRemove && (
          <button
            onClick={onRemove}
            aria-label={formatMessage(t.localGame.removePlayerAria, { number: index + 1 })}
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              width: '2.25rem',
              height: '2.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background var(--transition-fast)',
            }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {error && (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-danger)',
            paddingLeft: '2.25rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
