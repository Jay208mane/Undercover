import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { en } from '../locales/en';
import { mr } from '../locales/mr';
import { hi } from '../locales/hi';
import type { Translations } from '../locales/types';
import type { Language } from '../../../shared/types';

const locales: Record<Language, Translations> = { en, mr, hi };
const LANGUAGE_STORAGE_KEY = 'undercover.language.v1';

interface I18nContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readSavedLanguage);
  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch (error) {
      console.error('Unable to save the selected language.', error);
    }
  }, []);
  return (
    <I18nContext.Provider value={{ lang, setLang, t: locales[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

function readSavedLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'mr' || saved === 'hi' || saved === 'en' ? saved : 'en';
  } catch (error) {
    console.error('Unable to load the saved language.', error);
    return 'en';
  }
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
