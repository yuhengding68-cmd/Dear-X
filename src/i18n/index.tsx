import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../types';
import { en, type Dictionary } from './en';
import { zhCN } from './zh-CN';

const dictionaries: Record<Locale, Dictionary> = { en, 'zh-CN': zhCN };
const STORAGE_KEY = 'dearx.locale';

function initialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'zh-CN' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const I18nContext = createContext<I18nValue | null>(null);

function lookup(dictionary: Dictionary, key: string): string {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
  return typeof value === 'string' ? value : key;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const value = useMemo<I18nValue>(() => {
    const t: Translate = (key, vars) => {
      const raw = lookup(dictionaries[locale], key);
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
    };
    return {
      locale,
      setLocale: (next) => {
        localStorage.setItem(STORAGE_KEY, next);
        setLocaleState(next);
      },
      t,
    };
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
