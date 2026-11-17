import { createContext, useContext, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'midnight' | 'neon';

interface SettingsState {
  sound: boolean;
  vibration: boolean;
  theme: Theme;
}

interface SettingsContextValue extends SettingsState {
  toggleSound: () => void;
  toggleVibration: () => void;
  setTheme: (t: Theme) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [theme, setThemeState] = useState<Theme>('dark');

  return (
    <SettingsContext.Provider
      value={{
        sound,
        vibration,
        theme,
        toggleSound: () => setSound((s) => !s),
        toggleVibration: () => setVibration((v) => !v),
        setTheme: setThemeState,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
