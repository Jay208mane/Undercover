import { useI18n } from '../context/i18nContext';
import { AppHeader } from '../components/common/AppHeader';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { RoleInfoCard } from '../components/common/RoleInfoCard';

export default function HowToPlayPage() {
  const { t } = useI18n();

  const roles = [
    {
      icon: '🧑',
      roleName: t.civilianRole,
      description: t.civilianDesc,
      color: '#34d399',
      bgColor: 'rgba(52, 211, 153, 0.06)',
      borderColor: 'rgba(52, 211, 153, 0.2)',
    },
    {
      icon: '🕵️',
      roleName: t.imposterRole,
      description: t.imposterDesc,
      color: '#f87171',
      bgColor: 'rgba(248, 113, 113, 0.06)',
      borderColor: 'rgba(248, 113, 113, 0.2)',
    },
    {
      icon: '👻',
      roleName: t.mrWhiteRole,
      description: t.mrWhiteDesc,
      color: '#c084fc',
      bgColor: 'rgba(192, 132, 252, 0.06)',
      borderColor: 'rgba(192, 132, 252, 0.2)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppHeader title={t.howToPlayTitle} />

      <ScreenContainer style={{ padding: '0.5rem 1rem 2rem', gap: '1.5rem' }}>

        {/* Roles */}
        <section style={{ width: '100%' }}>
          <SectionLabel>{t.rolesTitle}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {roles.map((r) => (
              <RoleInfoCard key={r.roleName} {...r} />
            ))}
          </div>
        </section>

        {/* Imposter notice */}
        <div
          style={{
            width: '100%',
            background: 'rgba(248, 113, 113, 0.07)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            lineHeight: 1.6,
            color: 'var(--color-text-muted)',
          }}
        >
          <span style={{ fontWeight: 700, color: '#f87171' }}>⚠️ Remember:</span> The Imposter is
          never told that they are the Imposter. They simply receive their word and play normally.
        </div>

        {/* Game flow */}
        <section style={{ width: '100%' }}>
          <SectionLabel>{t.gameFlowTitle}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {t.gameFlowSteps.map((step: string, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #7c5fe6 0%, #5b8df5 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0.0625rem',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Win conditions */}
        <section style={{ width: '100%' }}>
          <SectionLabel>{t.winConditionsTitle}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {t.winConditions.map((cond: string, i: number) => {
              const colors = ['var(--color-success)', 'var(--color-danger)', 'var(--color-accent-soft)'];
              const icons = ['🧑', '🕵️', '👻'];
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--color-bg-card)',
                    border: `1px solid var(--color-border)`,
                    borderLeft: `3px solid ${colors[i]}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icons[i]}</span>
                  <span style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                    {cond}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
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
        marginBottom: '0.75rem',
      }}
    >
      {children}
    </div>
  );
}
