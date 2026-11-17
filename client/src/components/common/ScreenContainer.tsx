import { ReactNode } from 'react';

interface ScreenContainerProps {
  children: ReactNode;
  center?: boolean;
  noPad?: boolean;
  style?: React.CSSProperties;
}

export function ScreenContainer({ children, center = false, noPad = false, style }: ScreenContainerProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: center ? 'center' : 'flex-start',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        padding: noPad ? 0 : '0 1rem 2rem',
        overflowX: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
