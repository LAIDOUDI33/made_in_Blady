'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  isLoading?: boolean;
  minDuration?: number;
  onComplete?: () => void;
  logoSrc?: string;
}

export function SplashScreen({ 
  isLoading = true, 
  minDuration = 1500,
  onComplete,
  logoSrc = '/icons/icon-192x192.png'
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Random increment for realistic feel
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    // Minimum display time
    const minTimeout = setTimeout(() => {
      setShowContent(true);
    }, minDuration * 0.6);

    // Auto-hide when loading complete
    if (!isLoading && progress >= 80) {
      setProgress(100);
      
      const hideTimeout = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 500);

      return () => {
        clearTimeout(hideTimeout);
        clearInterval(interval);
        clearTimeout(minTimeout);
      };
    }

    // Force complete after max duration
    const maxTimeout = setTimeout(() => {
      if (isLoading) {
        setProgress(100);
        setShowContent(true);
        
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 500);
      }
    }, minDuration * 2);

    return () => {
      clearInterval(interval);
      clearTimeout(minTimeout);
      clearTimeout(maxTimeout);
    };
  }, [isLoading, minDuration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#006233] via-[#007a3d] to-[#008f47]"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated circles */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.05, 0.1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white"
            />
            <motion.div
              animate={{
                scale: [1.5, 1, 1.5],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1
              }}
              className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-white"
            />
            
            {/* Grid pattern overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-5">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo container */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: showContent ? [0.9, 1.05, 1] : 1,
                opacity: 1,
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                type: 'spring',
                stiffness: 200
              }}
              className="relative mb-8"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 blur-3xl bg-white/30 rounded-full scale-150" />
              
              {/* Logo */}
              <div className="relative w-28 h-28 md:w-36 md:h-36 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="AlgeriaTrade"
                    className="w-20 h-20 md:w-24 md:h-24 object-contain"
                  />
                ) : (
                  <span className="text-4xl md:text-5xl font-bold text-[#006233]">AT</span>
                )}
                
                {/* Animated border */}
                <motion.div
                  className="absolute inset-0 border-2 border-white/50 rounded-3xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </div>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                AlgeriaTrade
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-white/70 text-sm md:text-base mt-2"
              >
                Plateforme B2B Algérie
              </motion.p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-12 w-64 max-w-[80vw]"
            >
              {/* Progress bar background */}
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              
              {/* Progress text */}
              <p className="text-center text-white/60 text-xs mt-3">
                {progress < 100 ? 'Chargement...' : 'Prêt !'}
              </p>
            </motion.div>

            {/* Tagline (appears after loading) */}
            <AnimatePresence>
              {showContent && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-8 text-white/50 text-xs text-center max-w-xs"
                >
                  Sourcez auprès de +2500 fournisseurs algériens vérifiés
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Version info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-6 left-0 right-0 text-center"
          >
            <p className="text-white/30 text-xs">v1.0.0 • PWA</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing splash screen state
export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  const completeSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  const markAppReady = useCallback(() => {
    setAppReady(true);
  }, []);

  return {
    showSplash,
    appReady,
    completeSplash,
    markAppReady
  };
}

export default SplashScreen;
