import { Minus, Plus } from 'lucide-react';

interface PlayerCounterProps {
  count: number;
  min?: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label?: string;
}

export function PlayerCounter({
  count,
  min = 3,
  max = 20,
  onIncrement,
  onDecrement,
  label,
}: PlayerCounterProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.875rem 1rem',
      }}
    >
      {label && (
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {label}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
        <button
          onClick={onDecrement}
          disabled={count <= min}
          aria-label="Remove player"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--radius-md)',
            background: count <= min ? 'var(--color-bg-card)' : 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: count <= min ? 'var(--color-text-dim)' : 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: count <= min ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Minus size={16} />
        </button>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.5rem',
            color: 'var(--color-text)',
            minWidth: '2rem',
            textAlign: 'center',
          }}
        >
          {count}
        </span>
        <button
          onClick={onIncrement}
          disabled={count >= max}
          aria-label="Add player"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--radius-md)',
            background: count >= max ? 'var(--color-bg-card)' : 'var(--color-accent)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: count >= max ? 'not-allowed' : 'pointer',
            opacity: count >= max ? 0.4 : 1,
            transition: 'all var(--transition-fast)',
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
