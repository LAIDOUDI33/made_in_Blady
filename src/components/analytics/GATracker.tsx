'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, isGAEnabled } from '@/lib/analytics/ga4';

// ============================================
// GA Tracker Component
// Tracks page views on route changes
// ============================================

interface GATrackerProps {
  userRole?: string;
  wilaya?: string;
  category?: string;
}

export function GATracker({ userRole, wilaya, category }: GATrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPath = useRef<string>(pathname);

  // Get page title from path
  const getPageTitle = useCallback((path: string): string => {
    const titleMap: Record<string, string> = {
      '/': "AlgeriaTrade - Marketplace B2B Algérie",
      '/products': "Produits - AlgeriaTrade",
      '/suppliers': "Fournisseurs - AlgeriaTrade",
      '/categories': "Catégories - AlgeriaTrade",
      '/search': "Recherche - AlgeriaTrade",
      '/rfqs/new': "Nouvelle Demande de Devis - AlgeriaTrade",
      '/login': "Connexion - AlgeriaTrade",
      '/register': "Inscription - AlgeriaTrade",
      '/checkout': "Paiement - AlgeriaTrade",
      '/dashboard': "Tableau de Bord - AlgeriaTrade",
    };

    // Check for dynamic routes
    if (path.startsWith('/products/')) return "Détail Produit - AlgeriaTrade";
    if (path.startsWith('/companies/')) return "Profil Fournisseur - AlgeriaTrade";
    if (path.startsWith('/categories/')) return "Catégorie - AlgeriaTrade";
    
    return titleMap[path] || `${path.split('/').pop() || 'Page'} - AlgeriaTrade`;
  }, []);

  useEffect(() => {
    if (!isGAEnabled()) return;

    // Only track if path changed
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    const fullUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    trackPageView({
      page_title: getPageTitle(pathname),
      page_location: fullUrl,
      userRole,
      wilaya,
      category,
    });
  }, [pathname, searchParams, getPageTitle, userRole, wilaya, category]);

  // Track initial page view
  useEffect(() => {
    if (!isGAEnabled()) return;

    const fullUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    trackPageView({
      page_title: getPageTitle(pathname),
      page_location: fullUrl,
      userRole,
      wilaya,
      category,
    });
  }, [getPageTitle, pathname, searchParams, userRole, wilaya, category]);

  return null; // This component doesn't render anything
}

// ============================================
// Visibility Tracker Component
// Tracks when components become visible
// ============================================

interface VisibilityTrackerProps {
  trackOnVisible: () => void;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function VisibilityTracker({
  trackOnVisible,
  threshold = 0.5,
  rootMargin = '0px',
  once = true,
}: VisibilityTrackerProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !hasTracked.current)) {
            hasTracked.current = true;
            trackOnVisible();
            
            if (once) {
              observerRef.current?.unobserve(element);
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [trackOnVisible, threshold, rootMargin, once]);

  return <div ref={elementRef} />;
}

// ============================================
// Event Tracker HOC
// Higher-order component for event tracking
// ============================================

interface EventTrackerProps {
  eventName: string;
  eventData?: Record<string, unknown>;
  children: React.ReactNode;
  onClick?: () => void;
}

export function EventTracker({ eventName, eventData, children, onClick }: EventTrackerProps) {
  const handleClick = useCallback(() => {
    // Track custom event to our database
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'custom',
        eventName,
        eventData,
      }),
    }).catch(() => {
      // Silently fail
    });

    onClick?.();
  }, [eventName, eventData, onClick]);

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}

export default GATracker;
