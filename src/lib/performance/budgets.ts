/**
 * AlgeriaTrade.dz - Performance Budget Enforcement System
 * 
 * Features:
 * - Bundle size budgets per route
 * - Web Vitals thresholds
 * - Asset size limits
 * - Build-time budget validation
 * - Runtime budget monitoring
 * - Automated alerts on violations
 * - CI/CD integration
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface SizeBudget {
  maxSize: number; // bytes
  warningSize: number; // bytes (warn if exceeded)
  gzipSize?: number; // optional gzip target
}

export interface RouteBudget {
  pathname: string | RegExp;
  jsTotal: SizeBudget;
  cssTotal?: SizeBudget;
  firstPartyJS?: SizeBudget;
  thirdPartyJS?: SizeBudget;
  images?: {
    heroImage: SizeBudget;
    productImages: SizeBudget;
    totalPerPage: number; // KB
  };
  fonts?: {
    criticalSubset: number; // bytes
    totalInitial: number; // bytes
  };
  webVitals?: {
    lcp: { good: number; poor: number }; // ms
    fid: { good: number; poor: number }; // ms
    cls: { good: number; poor: number };
    ttfb: { good: number; poor: number }; // ms
  };
}

export interface BudgetReport {
  route: string;
  timestamp: number;
  status: 'pass' | 'warning' | 'fail';
  metrics: {
    name: string;
    actual: number;
    budget: number;
    unit: string;
    status: 'pass' | 'warning' | 'fail';
    percentage: number;
  }[];
  summary: {
    totalPassed: number;
    totalWarnings: number;
    totalFailed: number;
    overallScore: number;
  };
  recommendations: string[];
}

interface BudgetViolation {
  route: string;
  metric: string;
  actual: number;
  budget: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}

// ===========================================
// Default Performance Budgets
// ===========================================

const DEFAULT_WEB_VITALS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
};

export const ROUTE_BUDGETS: RouteBudget[] = [
  // ===========================================================
  // CRITICAL PAGES (Strictest budgets)
  // ===========================================================

  /**
   * Homepage - Must load instantly
   */
  {
    pathname: '/',
    jsTotal: { maxSize: 150 * 1024, warningSize: 120 * 1024 }, // 150KB max
    cssTotal: { maxSize: 50 * 1024, warningSize: 40 * 1024 }, // 50KB max
    firstPartyJS: { maxSize: 80 * 1024, warningSize: 60 * 1024 },
    thirdPartyJS: { maxSize: 70 * 1024, warningSize: 50 * 1024 },
    images: {
      heroImage: { maxSize: 200 * 1024, warningSize: 150 * 1024 }, // 200KB
      productImages: { maxSize: 50 * 1024, warningSize: 40 * 1024 }, // each
      totalPerPage: 500, // 500KB total images
    },
    fonts: {
      criticalSubset: 10 * 1024, // 10KB for critical characters
      totalInitial: 80 * 1024, // 80KB for all initial fonts
    },
    webVitals: {
      ...DEFAULT_WEB_VITALS,
      lcp: { good: 2000, poor: 3000 }, // Stricter for homepage
    },
  },

  /**
   * Product Detail Page - Critical for conversion
   */
  {
    pathname: /^\/products\/[^/]+$/,
    jsTotal: { maxSize: 200 * 1024, warningSize: 160 * 1024 },
    cssTotal: { maxSize: 60 * 1024, warningSize: 48 * 1024 },
    firstPartyJS: { maxSize: 120 * 1024, warningSize: 96 * 1024 },
    thirdPartyJS: { maxSize: 80 * 1024, warningSize: 64 * 1024 },
    images: {
      heroImage: { maxSize: 300 * 1024, warningSize: 240 * 1024 }, // Product gallery
      productImages: { maxSize: 100 * 1024, warningSize: 80 * 1024 },
      totalPerPage: 800,
    },
    webVitals: DEFAULT_WEB_VITALS,
  },

  /**
   * Checkout Page - Revenue critical
   */
  {
    pathname: '/checkout',
    jsTotal: { maxSize: 100 * 1024, warningSize: 80 * 1024 }, // Minimal JS
    cssTotal: { maxSize: 30 * 1024, warningSize: 24 * 1024 },
    firstPartyJS: { maxSize: 60 * 1024, warningSize: 48 * 1024 },
    thirdPartyJS: { maxSize: 50 * 1024, warningSize: 40 * 1024 }, // Payment provider only
    webVitals: {
      ...DEFAULT_WEB_VITALS,
      lcp: { good: 1500, poor: 2500 }, // Very fast checkout
      fid: { good: 50, poor: 200 }, // Responsive interactions
    },
  },

  // ===========================================================
  // HIGH-TRAFFIC PAGES (Moderate budgets)
  // ===========================================================

  /**
   * Product Listing Pages
   */
  {
    pathname: /^\/products/,
    jsTotal: { maxSize: 180 * 1024, warningSize: 144 * 1024 },
    cssTotal: { maxSize: 55 * 1024, warningSize: 44 * 1024 },
    firstPartyJS: { maxSize: 100 * 1024, warningSize: 80 * 1024 },
    thirdPartyJS: { maxSize: 80 * 1024, warningSize: 64 * 1024 },
    images: {
      productImages: { maxSize: 40 * 1024, warningSize: 32 * 1024 },
      totalPerPage: 600,
    },
    webVitals: DEFAULT_WEB_VITALS,
  },

  /**
   * Category Pages
   */
  {
    pathname: /^\/categories/,
    jsTotal: { maxSize: 170 * 1024, warningSize: 136 * 1024 },
    cssTotal: { maxSize: 50 * 1024, warningSize: 40 * 1024 },
    firstPartyJS: { maxSize: 90 * 1024, warningSize: 72 * 1024 },
    thirdPartyJS: { maxSize: 80 * 1024, warningSize: 64 * 1024 },
    webVitals: DEFAULT_WEB_VITALS,
  },

  /**
   * Search Results
   */
  {
    pathname: '/search',
    jsTotal: { maxSize: 160 * 1024, warningSize: 128 * 1024 },
    cssTotal: { maxSize: 45 * 1024, warningSize: 36 * 1024 },
    webVitals: {
      ...DEFAULT_WEB_VITALS,
      inp: { good: 150, poor: 400 }, // Fast search interaction
    },
  },

  // ===========================================================
  // STANDARD PAGES (Standard budgets)
  // ===========================================================

  /**
   * Dashboard Pages
   */
  {
    pathname: '/dashboard',
    jsTotal: { maxSize: 300 * 1024, warningSize: 240 * 1024 }, // More JS allowed for dashboard features
    cssTotal: { maxSize: 80 * 1024, warningSize: 64 * 1024 },
    firstPartyJS: { maxSize: 200 * 1024, warningSize: 160 * 1024 },
    thirdPartyJS: { maxSize: 100 * 1024, warningSize: 80 * 1024 }, // Charts library etc.
    webVitals: {
      ...DEFAULT_WEB_VITALS,
      lcp: { good: 3000, poor: 4500 }, // Slightly relaxed for dashboards
    },
  },

  /**
   * Auth Pages (Login/Register)
   */
  {
    pathname: /^(\/login|\/register)/,
    jsTotal: { maxSize: 80 * 1024, warningSize: 64 * 1024 }, // Very minimal
    cssTotal: { maxSize: 20 * 1024, warningSize: 16 * 1024 },
    webVitals: {
      ...DEFAULT_WEB_VITALS,
      lcp: { good: 1200, poor: 2000 }, // Auth pages must be fast
    },
  },

  // ===========================================================
  // INFO PAGES (Relaxed budgets)
  // ===========================================================

  /**
   * Static/Info Pages
   */
  {
    pathname: /^(\/about|\/contact|\/terms|\/privacy|\/faq)/,
    jsTotal: { maxSize: 60 * 1024, warningSize: 48 * 1024 },
    cssTotal: { maxSize: 15 * 1024, warningSize: 12 * 1024 },
    webVitals: DEFAULT_WEB_VITALS,
  },
];

// ===========================================
// Budget Checker Class
// ===========================================

class PerformanceBudgetChecker {
  private violations: BudgetViolation[] = [];
  private alertCallbacks: Array<(violation: BudgetViolation) => void> = [];

  /**
   * Get budget configuration for a specific route
   */
  getRouteBudget(pathname: string): RouteBudget | null {
    return ROUTE_BUDGETS.find(budget => {
      if (typeof budget.pathname === 'string') {
        return pathname === budget.pathname || pathname.startsWith(budget.pathname);
      }
      return budget.pathname.test(pathname);
    }) || null;
  }

  /**
   * Check a metric against its budget
   */
  checkMetric(
    route: string,
    metricName: string,
    actualValue: number,
    budget: SizeBudget | { good: number; poor: number },
    unit: string = 'bytes'
  ): { status: 'pass' | 'warning' | 'fail'; percentage: number } {
    const budgetValue = 'maxSize' in budget ? budget.maxSize : budget.poor;
    const warningThreshold = 'warningSize' in budget ? budget.warningSize : ('good' in budget ? budget.good : budget.poor * 0.7);

    const percentage = Math.round((actualValue / budgetValue) * 100);

    let status: 'pass' | 'warning' | 'fail';
    
    if (actualValue <= warningThreshold) {
      status = 'pass';
    } else if (actualValue <= budgetValue) {
      status = 'warning';
    } else {
      status = 'fail';
      
      // Record violation
      this.violations.push({
        route,
        metric: metricName,
        actual: actualValue,
        budget: budgetValue,
        severity: percentage > 130 ? 'critical' : 'warning',
        timestamp: Date.now(),
      });

      // Trigger alerts
      this.alertViolations();
    }

    return { status, percentage };
  }

  /**
   * Generate complete budget report for a route
   */
  async generateReport(
    route: string,
    actualMetrics: {
      jsTotal?: number;
      cssTotal?: number;
      firstPartyJS?: number;
      thirdPartyJS?: number;
      imageSizes?: number[];
      fontSizes?: { critical: number; total: number };
      webVitals?: {
        lcp?: number;
        fid?: number;
        cls?: number;
        ttfb?: number;
      };
    }
  ): Promise<BudgetReport> {
    const budget = this.getRouteBudget(route);
    const metrics: BudgetReport['metrics'] = [];
    let passedCount = 0;
    let warningCount = 0;
    let failCount = 0;

    if (!budget) {
      return {
        route,
        timestamp: Date.now(),
        status: 'pass',
        metrics: [],
        summary: { totalPassed: 0, totalWarnings: 0, totalFailed: 0, overallScore: 100 },
        recommendations: ['No budget configured for this route'],
      };
    }

    // Check JS bundle sizes
    if (actualMetrics.jsTotal !== undefined) {
      const result = this.checkMetric(route, 'JavaScript Total', actualMetrics.jsTotal, budget.jsTotal, 'KB');
      metrics.push({
        name: 'JavaScript Total',
        actual: actualMetrics.jsTotal,
        budget: budget.jsTotal.maxSize,
        unit: 'bytes',
        ...result,
        percentage: result.percentage,
      });
      if (result.status === 'pass') passedCount++;
      else if (result.status === 'warning') warningCount++;
      else failCount++;
    }

    // Check CSS bundle sizes
    if (actualMetrics.cssTotal !== undefined && budget.cssTotal) {
      const result = this.checkMetric(route, 'CSS Total', actualMetrics.cssTotal, budget.cssTotal, 'bytes');
      metrics.push({
        name: 'CSS Total',
        actual: actualMetrics.cssTotal,
        budget: budget.cssTotal.maxSize,
        unit: 'bytes',
        ...result,
        percentage: result.percentage,
      });
      if (result.status === 'pass') passedCount++;
      else if (result.status === 'warning') warningCount++;
      else failCount++;
    }

    // Check First Party JS
    if (actualMetrics.firstPartyJS !== undefined && budget.firstPartyJS) {
      const result = this.checkMetric(route, 'First-Party JS', actualMetrics.firstPartyJS, budget.firstPartyJS, 'bytes');
      metrics.push({
        name: 'First-Party JS',
        actual: actualMetrics.firstPartyJS,
        budget: budget.firstPartyJS.maxSize,
        unit: 'bytes',
        ...result,
        percentage: result.percentage,
      });
      if (result.status === 'pass') passedCount++;
      else if (result.status === 'warning') warningCount++;
      else failCount++;
    }

    // Check Third Party JS
    if (actualMetrics.thirdPartyJS !== undefined && budget.thirdPartyJS) {
      const result = this.checkMetric(route, 'Third-Party JS', actualMetrics.thirdPartyJS, budget.thirdPartyJS, 'bytes');
      metrics.push({
        name: 'Third-Party JS',
        actual: actualMetrics.thirdPartyJS,
        budget: budget.thirdPartyJS.maxSize,
        unit: 'bytes',
        ...result,
        percentage: result.percentage,
      });
      if (result.status === 'pass') passedCount++;
      else if (result.status === 'warning') warningCount++;
      else failCount++;
    }

    // Check Web Vitals
    if (actualMetrics.webVitals && budget.webVitals) {
      const vitalNames = ['lcp', 'fid', 'cls', 'ttfb'] as const;
      
      for (const vital of vitalNames) {
        const value = actualMetrics.webVitals[vital];
        const vitalBudget = budget.webVitals[vital];
        
        if (value !== undefined && vitalBudget) {
          const result = this.checkMetric(
            route,
            vital.toUpperCase(),
            value,
            vitalBudget,
            vital === 'cls' ? '' : 'ms'
          );
          metrics.push({
            name: vital.toUpperCase(),
            actual: value,
            budget: vitalBudget.poor,
            unit: vital === 'cls' ? '' : 'ms',
            ...result,
            percentage: result.percentage,
          });
          if (result.status === 'pass') passedCount++;
          else if (result.status === 'warning') warningCount++;
          else failCount++;
        }
      }
    }

    // Calculate overall score and status
    const overallScore = metrics.length > 0 
      ? Math.round((passedCount / metrics.length) * 100)
      : 100;
    
    const status = failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass';

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, budget);

    return {
      route,
      timestamp: Date.now(),
      status,
      metrics,
      summary: {
        totalPassed: passedCount,
        totalWarnings: warningCount,
        totalFailed: failCount,
        overallScore,
      },
      recommendations,
    };
  }

  /**
   * Generate recommendations based on failed/warning metrics
   */
  private generateRecommendations(
    metrics: BudgetReport['metrics'],
    _budget: RouteBudget
  ): string[] {
    const recommendations: string[] = [];

    for (const metric of metrics) {
      if (metric.status === 'fail' || metric.status === 'warning') {
        switch (metric.name) {
          case 'JavaScript Total':
          case 'First-Party JS':
            recommendations.push(
              `JavaScript bundle is ${this.formatSize(metric.actual)} (${metric.percentage}% of budget). Consider code splitting or tree shaking.`,
              'Review dynamic imports for heavy components.',
              'Check for unused dependencies that can be removed.'
            );
            break;

          case 'Third-Party JS':
            recommendations.push(
              `Third-party JavaScript is ${this.formatSize(metric.actual)}. Evaluate if all libraries are necessary.`,
              'Consider using lighter alternatives or loading them lazily.',
              'Check if any scripts can be loaded with async/defer attributes.'
            );
            break;

          case 'CSS Total':
            recommendations.push(
              `CSS bundle is ${this.formatSize(metric.actual)}. Review for unused styles.`,
              'Enable CSS code splitting in Next.js config.',
              'Purge unused CSS classes with tools like PurgeCSS.'
            );
            break;

          case 'LCP':
            recommendations.push(
              `Largest Contentful Paint is ${metric.actual}ms. Optimize hero images and critical resources.`,
              'Use next/image with priority attribute for above-fold images.',
              'Preload critical fonts and stylesheets.'
            );
            break;

          case 'FID':
            recommendations.push(
              `First Input Delay is ${metric.actual}ms. Reduce main thread blocking.`,
              'Break up long tasks using scheduler.postTask() or requestIdleCallback().',
              'Move heavy computations to Web Workers.'
            );
            break;

          case 'CLS':
            recommendations.push(
              `Cumulative Layout Shift is ${metric.value}. Add explicit dimensions to dynamic content.`,
              'Ensure images have width and height attributes.',
              'Avoid inserting content above existing content.'
            );
            break;

          case 'TTFB':
            recommendations.push(
              `Time to First Byte is ${metric.actual}ms. Optimize server response time.`,
              'Implement or review server-side caching strategies.',
              'Check database query performance.'
            );
            break;
        }
      }
    }

    // Deduplicate recommendations
    return [...new Set(recommendations)];
  }

  /**
   * Format bytes to human-readable string
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Register alert callback for violations
   */
  onViolation(callback: (violation: BudgetViolation) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Alert on recent violations
   */
  private alertViolations(): void {
    const recentViolations = this.violations.filter(
      v => Date.now() - v.timestamp < 5000 // Last 5 seconds
    );

    recentViolations.forEach(violation => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(violation);
        } catch (error) {
          console.error('Budget alert callback error:', error);
        }
      });
    });
  }

  /**
   * Get violation history
   */
  getViolations(since?: number): BudgetViolation[] {
    if (!since) return [...this.violations];
    return this.violations.filter(v => v.timestamp >= since);
  }

  /**
   * Clear old violations
   */
  clearViolations(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.violations = this.violations.filter(v => v.timestamp >= cutoff);
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let budgetCheckerInstance: PerformanceBudgetChecker | null = null;

export function getBudgetChecker(): PerformanceBudgetChecker {
  if (!budgetCheckerInstance) {
    budgetCheckerInstance = new PerformanceBudgetChecker();

    // Default console logger for violations
    budgetCheckerInstance.onViolation((violation) => {
      const emoji = violation.severity === 'critical' ? '🚨' : '⚠️';
      console.warn(
        `${emoji} [Performance Budget Violation] ${violation.route}: ${violation.metric} = ${violation.actual} (budget: ${violation.budget})`
      );
    });

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      budgetCheckerInstance.onViolation(async (violation) => {
        try {
          await fetch('/api/analytics/budget-violation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(violation),
          });
        } catch {
          // Silently fail
        }
      });
    }
  }

  return budgetCheckerInstance;
}

// ===========================================
// CI/CD Integration Helpers
// ===========================================

/**
 * Generate GitHub Actions annotation for budget failure
 */
export function generateCIAnnotation(violation: BudgetViolation): string {
  const severity = violation.severity === 'critical' ? 'error' : 'warning';
  const message = `[Budget] ${violation.route}: ${violation.metric} exceeded budget (${violation.actual}/${violation.budget})`;
  
  return `::${severity} file=performance-budgets.ts,line=1::${message}`;
}

/**
 * Check if build should fail based on budget violations
 */
export function shouldBuildFail(violations: BudgetViolation[], options: {
  failOnCriticalOnly?: boolean;
  allowedWarnings?: number;
} = {}): boolean {
  const { failOnCriticalOnly = true, allowedWarnings = 5 } = options;

  if (failOnCriticalOnly) {
    return violations.some(v => v.severity === 'critical');
  }

  return violations.length > allowedWarnings;
}

// Export all
export {
  PerformanceBudgetChecker,
};

export default {
  getBudgetChecker,
  generateCIAnnotation,
  shouldBuildFail,
  ROUTE_BUDGETS,
};
