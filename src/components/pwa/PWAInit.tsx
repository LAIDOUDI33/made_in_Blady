'use client';

import { useEffect } from 'react';
import { initializePWA } from '@/lib/pwa';

export default function PWAInit() {
  useEffect(() => {
    // Initialize PWA - register service worker, setup listeners
    initializePWA({
      onInstallable: () => {
        console.log('[PWA] App can be installed');
      },
      onInstalled: () => {
        console.log('[PWA] App was installed');
      },
      onUpdateAvailable: () => {
        console.log('[PWA] Update available');
      },
    });
  }, []);

  return null;
}
