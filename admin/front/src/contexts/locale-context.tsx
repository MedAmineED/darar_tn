'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setCurrentLocale } from '@/lib/locale';
import { Toaster } from 'sonner';
import {
  frenchStrings,
  strings as arabicStrings,
  type InterfaceStrings,
} from '@/config/strings';

export type Locale = 'ar' | 'fr';
const storageKey = 'darya-admin-locale';
interface LocaleContextValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  strings: InterfaceStrings;
  setLocale: (locale: Locale) => void;
  t: (ar: string, fr: string) => string;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>('ar');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === 'ar' || saved === 'fr') {
        setCurrentLocale(saved);
        updateLocale(saved);
      }
    } catch {
      /* Language switching still works when storage is unavailable. */
    }
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === storageKey &&
        (event.newValue === 'ar' || event.newValue === 'fr')
      ) {
        setCurrentLocale(event.newValue);
        updateLocale(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const setLocale = useCallback((next: Locale) => {
    setCurrentLocale(next);
    updateLocale(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      /* Keep the in-memory choice. */
    }
  }, []);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.title =
      locale === 'ar' ? 'داريا — لوحة الإدارة' : 'Darya — Administration';
  }, [locale, dir]);
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      strings: locale === 'ar' ? arabicStrings : frenchStrings,
      t: (ar, fr) => (locale === 'ar' ? ar : fr),
    }),
    [locale, dir, setLocale],
  );
  return (
    <LocaleContext.Provider value={value}>
      {children}
      <Toaster position="top-center" richColors dir={dir} />
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
}
