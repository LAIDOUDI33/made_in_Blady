'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  initGA4,
  isGAEnabled,
  setUserId,
  setUserProperties,
  clearUserData,
  grantAllConsent,
  denyAllConsent,
  ConsentState,
} from '@/lib/analytics/ga4';

// ============================================
// Types
// ============================================

interface AnalyticsContextType {
  isInitialized: boolean;
  consentGiven: boolean;
  setConsent: (granted: boolean) => void;
  identifyUser: (userId: string, properties?: Record<string, unknown>) => void;
  clearUser: () => void;
}

interface UserProperties {
  userRole?: string;
  companyType?: string;
  wilaya?: string;
  membershipTier?: string;
  isVerified?: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface AnalyticsProviderProps {
  children: ReactNode;
  defaultConsent?: boolean;
}

export function AnalyticsProvider({ 
  children, 
  defaultConsent = false 
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [consentGiven, setConsentGiven] = useState(defaultConsent);

  // Initialize GA on mount
  useEffect(() => {
    if (!isGAEnabled()) {
      setIsInitialized(true);
      return;
    }

    // Set default consent state based on saved preference or default
    const savedConsent = localStorage.getItem('analytics_consent');
    if (savedConsent === 'granted') {
      grantAllConsent();
      setConsentGiven(true);
    } else if (savedConsent === 'denied') {
      denyAllConsent();
      setConsentGiven(false);
    } else if (!defaultConsent) {
      denyAllConsent(); // Default to denied for GDPR compliance
    }

    setIsInitialized(true);
  }, [defaultConsent]);

  // Handle consent changes
  const setConsent = useCallback((granted: boolean) => {
    if (granted) {
      grantAllConsent();
      localStorage.setItem('analytics_consent', 'granted');
    } else {
      denyAllConsent();
      localStorage.setItem('analytics_consent', 'denied');
    }
    setConsentGiven(granted);
  }, []);

  // Identify user for analytics
  const identifyUser = useCallback((userId: string, properties?: UserProperties) => {
    if (!isGAEnabled()) return;

    setUserId(userId);
    
    if (properties) {
      setUserProperties(properties as Parameters<typeof setUserProperties>[0]);
    }
  }, []);

  // Clear user data on logout
  const clearUser = useCallback(() => {
    clearUserData();
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        isInitialized,
        consentGiven,
        setConsent,
        identifyUser,
        clearUser,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
}

export default AnalyticsProvider;
