import { ReactNode } from 'react';

interface RoleInfoCardProps {
  icon: ReactNode;
  roleName: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function RoleInfoCard({
  icon,
  roleName,
  description,
  color,
  bgColor,
  borderColor,
}: RoleInfoCardProps) {
  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        display: 'flex',
        gap: '0.875rem',
      }}
    >
      <div
        style={{
          width: '3rem',
          height: '3rem',
          borderRadius: 'var(--radius-lg)',
          background: `${color}22`,
          border: `1px solid ${color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.375rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color, marginBottom: '0.375rem' }}>
          {roleName}
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
