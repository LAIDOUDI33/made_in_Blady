'use client';

/**
 * Language Switcher Component
 * Composant de sélection de langue pour AlgeriaTrade
 * 
 * @module components/i18n/LanguageSwitcher
 * @description A language switcher component with French, Arabic, and English support.
 * Includes RTL detection and proper locale handling for the Algerian market.
 */

import React from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n';
import {
  LOCALES,
  LocaleCode,
  LocaleConfig,
  isRTL,
  getDirection,
} from '@/lib/i18n/locales';

// ============================================
// Types
// ============================================

interface LanguageSwitcherProps {
  /** Additional CSS class name */
  className?: string;
  /** Display variant */
  variant?: 'dropdown' | 'buttons' | 'compact';
  /** Show flag icons */
  showFlag?: boolean;
  /** Show language name */
  showName?: boolean;
  /** Size */
  size?: 'sm' | 'default' | 'lg';
  /** Callback when language changes */
  onLanguageChange?: (locale: LocaleCode) => void;
}

// ============================================
// Sub-Components
// ============================================

interface LanguageOptionProps {
  config: LocaleConfig;
  isActive: boolean;
  showFlag: boolean;
  showName: boolean;
  onClick: () => void;
}

function LanguageOption({ config, isActive, showFlag, showName, onClick }: LanguageOptionProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer ${isActive ? 'bg-accent' : ''}`}
    >
      {showFlag && <span className="text-lg">{config.flag}</span>}
      {showName && <span>{config.nativeName}</span>}
      {isActive && <Check className="h-4 w-4 ml-auto text-primary" />}
    </DropdownMenuItem>
  );
}

// ============================================
// Main Component
// ============================================

export function LanguageSwitcher({
  className = '',
  variant = 'dropdown',
  showFlag = true,
  showName = true,
  size = 'default',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const { currentLanguage, setCurrentLanguage, availableLanguages } = useLanguage();
  
  // Get current locale config
  const currentConfig = LOCALES[currentLanguage];
  const isRtl = isRTL(currentLanguage);
  const direction = getDirection(currentLanguage);

  // Handle language change
  const handleLanguageChange = (locale: LocaleCode) => {
    setCurrentLanguage(locale);
    onLanguageChange?.(locale);
    
    // Update HTML dir and lang attributes
    if (typeof document !== 'undefined') {
      const newConfig = LOCALES[locale];
      document.documentElement.lang = locale;
      document.documentElement.dir = newConfig.direction;
      
      // Add/remove Arabic font class
      if (newConfig.direction === 'rtl') {
        document.documentElement.classList.add('font-arabic');
      } else {
        document.documentElement.classList.remove('font-arabic');
      }
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    default: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  // Render based on variant
  if (variant === 'buttons') {
    return (
      <div 
        className={`inline-flex rounded-md border bg-background p-1 gap-1 ${className}`}
        role="radiogroup"
        aria-label="Sélection de la langue"
        dir={direction}
      >
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              lang.isActive
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            role="radio"
            aria-checked={lang.isActive}
          >
            {showFlag && <span className="mr-1.5">{lang.flag}</span>}
            {showName && <span>{lang.nativeName}</span>}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${sizeClasses[size]} ${className}`}
            aria-label={`Langue actuelle: ${currentConfig.nativeName}`}
            dir={direction}
          >
            {showFlag && <span>{currentConfig.flag}</span>}
            {showName && <span className="hidden sm:inline">{currentConfig.name}</span>}
            {!showName && <Globe className="h-4 w-4" />}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-40">
          {availableLanguages.map((lang) => (
            <LanguageOption
              key={lang.code}
              config={LOCALES[lang.code]}
              isActive={lang.isActive}
              showFlag={showFlag}
              showName={showName}
              onClick={() => handleLanguageChange(lang.code)}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 ${sizeClasses[size]} ${className}`}
          aria-label={`Langue actuelle: ${currentConfig.nativeName}`}
          dir={direction}
        >
          {showFlag && <span>{currentConfig.flag}</span>}
          {showName && <span>{currentConfig.nativeName}</span>}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-48">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>Langue / اللغة</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableLanguages.map((lang) => (
          <LanguageOption
            key={lang.code}
            config={LOCALES[lang.code]}
            isActive={lang.isActive}
            showFlag={showFlag}
            showName={showName}
            onClick={() => handleLanguageChange(lang.code)}
          />
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="p-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Direction:</span>
            <span className="capitalize">{direction}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Devise:</span>
            <span>{currentConfig.currency.symbol} ({currentConfig.currency.code})</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// Language Badge Component (for display only)
// ============================================

interface LanguageBadgeProps {
  locale: LocaleCode;
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export function LanguageBadge({
  locale,
  showFlag = true,
  showName = true,
  className = '',
}: LanguageBadgeProps) {
  const config = LOCALES[locale];
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs font-medium ${className}`}
      dir={getDirection(locale)}
    >
      {showFlag && <span>{config.flag}</span>}
      {showName && <span>{config.nativeName}</span>}
    </span>
  );
}

// ============================================
// RTL Wrapper Component
// ============================================

interface RTLWrapperProps {
  children: React.ReactNode;
  locale: LocaleCode;
  className?: string;
}

/**
 * Wrapper component that applies proper direction based on locale
 */
export function RTLWrapper({ children, locale, className = '' }: RTLWrapperProps) {
  const direction = getDirection(locale);
  
  return (
    <div dir={direction} className={className}>
      {children}
    </div>
  );
}

// Export components
export { LanguageBadge, RTLWrapper };

export default LanguageSwitcher;
