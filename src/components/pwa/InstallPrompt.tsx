'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className = '' }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if app is already installed or in standalone mode
  useEffect(() => {
    const checkInstallStatus = () => {
      // Check if running as standalone PWA
      const standalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      
      if (standalone) {
        setIsInstalled(true);
        setShowBanner(false);
      }

      // Detect iOS Safari
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);

      // Check if previously dismissed
      const dismissedTime = localStorage.getItem('pwa-install-dismissed');
      if (dismissedTime) {
        const dismissedDate = new Date(dismissedTime);
        const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          setDismissed(true);
        }
      }
    };

    checkInstallStatus();
  }, []);

  // Listen for install prompt event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner after a delay if not dismissed and not installed
      setTimeout(() => {
        if (!dismissed && !isInstalled && !isStandalone) {
          setShowBanner(true);
        }
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      
      // Track installation
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_installed', {
          event_category: 'PWA',
          event_label: 'app_installed',
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed, isInstalled, isStandalone]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
        
        // Track acceptance
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'pwa_install_accepted', {
            event_category: 'PWA',
            event_label: 'install_accepted',
          });
        }
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Install error:', error);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback((permanent: boolean = false) => {
    setShowBanner(false);
    
    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
      setDismissed(true);
      
      // Track dismissal
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_install_dismissed', {
          event_category: 'PWA',
          event_label: 'install_dismissed_permanent',
        });
      }
    }
  }, []);

  // Don't render if installed, standalone, or no prompt available and not iOS
  if (isInstalled || isStandalone) return null;

  // For iOS, show instructions instead of install button
  if (isIOS && !isStandalone && !dismissed) {
    return <IOSInstallInstructions onDismiss={() => handleDismiss(false)} className={className} />;
  }

  // Show install button even if banner is hidden (for manual trigger)
  if (!showBanner && deferredPrompt) {
    return (
      <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setShowBanner(true)}
          size="sm"
          className="bg-[#006233] hover:bg-[#004d28] text-white shadow-lg rounded-full px-4 py-2"
        >
          <Download className="w-4 h-4 mr-2" />
          Installer l'app
        </Button>
      </div>
    );
  }

  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${className}`}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006233] to-[#008040] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Installer AlgeriaTrade</h3>
                <p className="text-sm opacity-90">Accès rapide hors ligne</p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss()}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
              Accès instantané depuis votre écran d'accueil
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
              Fonctionne même sans connexion internet
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
              Notifications en temps réel
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
              Interface optimisée pour mobile
            </li>
          </ul>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Installer maintenant
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleDismiss(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// iOS Install Instructions Component
function IOSInstallInstructions({ onDismiss, className }: { onDismiss: () => void; className?: string }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${className}`}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-r from-[#006233] to-[#008040] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Apple className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Ajouter à l'écran d'accueil</h3>
                <p className="text-sm opacity-90">iPhone / iPad</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {!showDetails ? (
            <div className="text-center py-2">
              <p className="text-gray-600 mb-4">
                Installez AlgeriaTrade comme une application native sur votre iPhone ou iPad.
              </p>
              <Button
                onClick={() => setShowDetails(true)}
                variant="outline"
                className="border-[#006233] text-[#006233] hover:bg-[#006233] hover:text-white"
              >
                Voir les instructions
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-6 h-6 bg-[#006233] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <p className="text-sm text-gray-700">
                  Appuyez sur l'icône <strong>Partager</strong> <span className="inline-block w-5 h-5 align-middle">⎋</span> en bas de l'écran
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-6 h-6 bg-[#006233] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <p className="text-sm text-gray-700">
                  Faites défiler et appuyez sur <strong>&quot;Sur l'écran d'accueil&quot;</strong>
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-6 h-6 bg-[#006233] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <p className="text-sm text-gray-700">
                  Appuyez sur <strong>&quot;Ajouter&quot;</strong> en haut à droite
                </p>
              </div>
              
              <Button
                onClick={onDismiss}
                className="w-full mt-2 bg-[#006233] hover:bg-[#004d28] text-white"
              >
                J'ai compris !
              </Button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default InstallPrompt;
