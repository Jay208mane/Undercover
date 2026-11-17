interface ToggleSettingProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}

export function ToggleSetting({ label, description, checked, onChange, icon }: ToggleSettingProps) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        padding: '1rem',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color var(--transition-fast)',
      }}
    >
      {icon && (
        <span
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
            {description}
          </div>
        )}
      </div>

      {/* Toggle pill */}
      <div
        style={{
          position: 'relative',
          width: '3rem',
          height: '1.625rem',
          borderRadius: 'var(--radius-full)',
          background: checked
            ? 'linear-gradient(135deg, #7c5fe6 0%, #5b8df5 100%)'
            : 'var(--color-bg-elevated)',
          border: checked ? 'none' : '1px solid var(--color-border)',
          transition: 'background var(--transition-normal)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '0.1875rem',
            left: checked ? 'calc(100% - 1.25rem)' : '0.1875rem',
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left var(--transition-normal)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </button>
  );
}
