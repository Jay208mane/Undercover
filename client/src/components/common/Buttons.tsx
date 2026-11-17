import { ReactNode, ButtonHTMLAttributes } from 'react';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

const sizeStyles = {
  sm: { padding: '0.4rem 0.875rem', fontSize: '0.875rem', minHeight: '2rem' },
  md: { padding: '0.625rem 1.25rem', fontSize: '0.9375rem', minHeight: '2.625rem' },
  lg: { padding: '0.875rem 1.75rem', fontSize: '1rem', minHeight: '3rem' },
};

export function PrimaryButton({ children, fullWidth, size = 'lg', icon, style, ...props }: BtnProps) {
  return (
    <button
      className="btn btn-primary"
      style={{
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #7c5fe6 0%, #5b8df5 100%)',
        boxShadow: '0 4px 20px rgba(124, 95, 230, 0.35)',
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, fullWidth, size = 'lg', icon, style, ...props }: BtnProps) {
  return (
    <button
      className="btn btn-ghost"
      style={{
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        borderRadius: 'var(--radius-lg)',
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

export function DangerButton({ children, fullWidth, size = 'md', style, ...props }: BtnProps) {
  return (
    <button
      className="btn"
      style={{
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        borderRadius: 'var(--radius-md)',
        background: 'rgba(248, 113, 113, 0.12)',
        color: 'var(--color-danger)',
        border: '1px solid rgba(248, 113, 113, 0.25)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-muted)',
        width: '2.25rem',
        height: '2.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
