import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function AppHeader({ title, showBack = true, onBack, right }: AppHeaderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(to bottom, var(--color-bg) 80%, transparent)',
        padding: '0.875rem 1rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text)',
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
          <ChevronLeft size={18} />
        </button>
      )}
      {title && (
        <h1
          style={{
            flex: 1,
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>
      )}
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </header>
  );
}
