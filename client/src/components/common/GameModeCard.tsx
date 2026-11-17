import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface GameModeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
  accentColor?: string;
}

export function GameModeCard({
  icon,
  title,
  description,
  badge,
  onClick,
  disabled,
  accentColor = 'rgba(124, 95, 230, 0.15)',
}: GameModeCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--transition-normal)',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 8px 30px rgba(124, 95, 230, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
        (e.currentTarget as HTMLButtonElement).style.transform = 'none';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at top left, ${accentColor}, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: '3rem',
          height: '3rem',
          borderRadius: 'var(--radius-lg)',
          background: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            {title}
          </span>
          {badge && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(251, 191, 36, 0.15)',
                color: 'var(--color-warning)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      <ChevronRight size={16} color="var(--color-text-dim)" style={{ flexShrink: 0, position: 'relative' }} />
    </button>
  );
}
