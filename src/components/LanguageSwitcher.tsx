'use client';

import React from 'react';
import { useLanguage, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons';
  size?: 'sm' | 'default' | 'lg';
  showFlag?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  size = 'sm',
  showFlag = true,
  showLabel = false,
  className = '',
}: LanguageSwitcherProps) {
  const { currentLanguage, setCurrentLanguage, availableLanguages } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  const currentLangConfig = availableLanguages.find(l => l.code === currentLanguage);

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {availableLanguages.map((lang) => (
          <Button
            key={lang.code}
            variant={lang.isActive ? 'default' : 'outline'}
            size={size === 'sm' ? 'icon' : size === 'lg' ? 'lg' : 'default'}
            onClick={() => handleLanguageChange(lang.code)}
            className={`min-w-[40px] ${
              lang.isActive 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'hover:bg-green-50 hover:text-green-600'
            }`}
            title={lang.nativeName}
          >
            <span className="text-base">{lang.flag}</span>
            {(showLabel || size === 'lg') && (
              <span className="ml-1 hidden sm:inline">{lang.nativeName}</span>
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 hover:bg-accent ${className}`}
        >
          <Globe className="h-4 w-4" />
          {showFlag && (
            <span className="text-base leading-none">
              {currentLangConfig?.flag}
            </span>
          )}
          {showLabel && (
            <span className="hidden sm:inline text-sm font-medium">
              {currentLangConfig?.nativeName}
            </span>
          )}
          {!showFlag && !showLabel && (
            <span className="text-sm font-medium uppercase">
              {currentLanguage}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-3 py-2.5 cursor-pointer ${
              lang.isActive ? 'bg-green-50 text-green-700' : ''
            }`}
          >
            <span className="text-lg leading-none">{lang.flag}</span>
            <div className="flex-1 flex flex-col">
              <span className="font-medium text-sm">{lang.nativeName}</span>
              <span className="text-xs opacity-60">{lang.name}</span>
            </div>
            {lang.isActive && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for header top bar
export function CompactLanguageSwitcher({ className = '' }: { className?: string }) {
  const { currentLanguage, setCurrentLanguage, availableLanguages } = useLanguage();
  const currentLangConfig = availableLanguages.find(l => l.code === currentLanguage);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {availableLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setCurrentLanguage(lang.code)}
          className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
            lang.isActive
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={`${lang.nativeName} (${lang.name})`}
        >
          <span className="mr-1">{lang.flag}</span>
          <span className="hidden md:inline">{lang.nativeName}</span>
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
