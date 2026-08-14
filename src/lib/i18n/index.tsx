'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// Language types
export type Language = 'fr' | 'ar' | 'en';
export type Direction = 'ltr' | 'rtl';

// Translation keys structure
export interface Translations {
  [key: string]: string | Translations;
}

// Import translations
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

const translations: Record<Language, Translations> = { fr, ar, en };

// Language configuration
export const languageConfig: Record<Language, {
  name: string;
  nativeName: string;
  flag: string;
  direction: Direction;
  fontClass?: string;
}> = {
  fr: {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇩🇿',
    direction: 'rtl',
    fontClass: 'font-arabic',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
};

interface I18nContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'algeriatrade-language';
const DEFAULT_LANGUAGE: Language = 'fr';

function getNestedValue(obj: Translations, path: string): string | Translations | undefined {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key] as Translations;
    }
    return undefined;
  }, obj);
}

function getInitialLanguage(defaultLang?: Language): Language {
  // Check for default language first
  if (defaultLang && defaultLang in translations) {
    return defaultLang;
  }
  
  // Then check localStorage (only on client)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in translations) {
        return stored as Language;
      }
      
      // Finally check browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ar')) return 'ar';
      if (browserLang.startsWith('fr')) return 'fr';
      if (browserLang.startsWith('en')) return 'en';
    } catch {
      // Ignore localStorage errors
    }
  }
  
  return DEFAULT_LANGUAGE;
}

function applyLanguageToDocument(lang: Language): void {
  if (typeof window === 'undefined') return;
  
  document.documentElement.lang = lang;
  document.documentElement.dir = languageConfig[lang].direction;
  
  const config = languageConfig[lang];
  if (config.fontClass) {
    document.documentElement.classList.add(config.fontClass);
  } else {
    document.documentElement.classList.remove('font-arabic');
  }
}

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage }: I18nProviderProps) {
  // Use lazy initializer to get initial language without effect
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage(defaultLanguage));
  const isInitializedRef = useRef(true); // Already initialized with initial value

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    
    // Update localStorage and DOM immediately
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Ignore storage errors
      }
      applyLanguageToDocument(lang);
    }
  }, []);

  // Apply language to document when it changes
  useEffect(() => {
    applyLanguageToDocument(language);
  }, [language]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations[language], key);
    
    let text: string;
    if (typeof value === 'string') {
      text = value;
    } else if (value === undefined) {
      // Fallback to French
      const fallbackValue = getNestedValue(translations.fr, key);
      text = typeof fallbackValue === 'string' ? fallbackValue : key;
    } else {
      text = key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return text;
  }, [language]);

  const direction = languageConfig[language].direction;
  const isRTL = direction === 'rtl';

  return (
    <I18nContext.Provider value={{ language, direction, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function useLanguage() {
  const { language, setLanguage, direction, isRTL } = useTranslation();
  
  const availableLanguages = Object.entries(languageConfig).map(([code, config]) => ({
    code: code as Language,
    ...config,
    isActive: code === language,
  }));

  return {
    currentLanguage: language,
    setCurrentLanguage: setLanguage,
    direction,
    isRTL,
    availableLanguages,
    config: languageConfig,
  };
}

export function getDirection(lang: Language): Direction {
  return languageConfig[lang].direction;
}

export { translations };
