'use client';

import React from 'react';

interface FeatureGateWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component to avoid SWC parsing issues with inline fragments
 */
export function FeatureGateWrapper({ children, fallback = null }: FeatureGateWrapperProps) {
  return (
    <React.Fragment>
      {children || fallback}
    </React.Fragment>
  );
}

export default FeatureGateWrapper;
