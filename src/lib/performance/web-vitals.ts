/**
 * AlgeriaTrade.dz - Web Vitals Monitoring & Reporting
 * 
 * Features:
 * - Core Web Vitals tracking (LCP, FID, INP, CLS, TTFB, FCP)
 * - Custom metrics tracking
 * - Real User Monitoring (RUM) integration
 * - Performance score calculation
 * - Alerting on threshold violations
 * - Analytics integration (GA4)
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries: PerformanceEntry[];
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
  deviceId: string;
}

export interface WebVitalsReport {
  lcp: Metric | null;
  inp: Metric | null; // Interaction to Next Paint (replaces FID)
  cls: Metric | null;
  ttfb: Metric | null;
  fcp: Metric | null;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

interface VitalThresholds {
  good: number;
  poor: number;
}

// ===========================================
// Web Vitals Thresholds (2024 standards)
// ===========================================

const VITAL_THRESHOLDS: Record<string, VitalThresholds> = {
  lcp: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
  fid: { good: 100, poor: 300 },         // First Input Delay (ms) - legacy
  inp: { good: 200, poor: 500 },         // Interaction to Next Paint (ms)
  cls: { good: 0.1, poor: 0.25 },        // Cumulative Layout Shift
  ttfb: { good: 800, poor: 1800 },       // Time to First Byte (ms)
  fcp: { good: 1800, poor: 3000 },       // First Contentful Paint (ms),
  tbt: { good: 200, poor: 500 },         // Total Blocking Time (ms)
};

// ===========================================
// Rating Calculation
// ===========================================

function getRating(name: string, value: string | number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITAL_THRESHOLDS[name];
  if (!thresholds) return 'good';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (numValue <= thresholds.good) return 'good';
  if (numValue <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function calculateScore(report: WebVitalsReport): number {
  const metrics = [report.lcp, report.inp, report.cls, report.ttfb, report.fcp].filter(Boolean);
  
  if (metrics.length === 0) return 100;
  
  const totalScore = metrics.reduce((sum, metric) => {
    if (!metric) return sum;
    
    const thresholds = VITAL_THRESHOLDS[metric.name];
    if (!thresholds) return sum + 100;
    
    // Calculate 0-100 score based on thresholds
    if (metric.rating === 'good') return sum + 100;
    if (metric.rating === 'needs-improvement') {
      const ratio = (metric.value - thresholds.good) / (thresholds.poor - thresholds.good);
      return sum + Math.round(100 - ratio * 50); // 50-99 range
    }
    
    // Poor rating - calculate how far beyond poor
    const excessRatio = Math.min((metric.value - thresholds.poor) / thresholds.poor, 1);
    return sum + Math.round(50 - excessRatio * 50); // 0-49 range
  }, 0);
  
  return Math.round(totalScore / metrics.length);
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// ===========================================
// Navigation Type Detection
// ===========================================

function getNavigationType(): string {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!nav) return 'unknown';
  
  switch (nav.type) {
    case 'navigate': return 'normal';
    case 'reload': return 'reload';
    case 'back_forward': return 'back-forward';
    case 'prerender': return 'prerender';
    default: return nav.type;
  }
}

// ===========================================
// Device Identification
// ===========================================

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let deviceId = sessionStorage.getItem('at_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('at_device_id', deviceId);
  }
  
  return deviceId;
}

// ===========================================
// Main WebVitals Tracker Class
// ===========================================

class WebVitalsTracker {
  private metrics: Map<string, Metric> = new Map();
  private listeners: Array<(metric: Metric) => void> = [];
  private reportListeners: Array<(report: WebVitalsReport) => void> = [];
  private hasReported = false;
  private sampleRate: number;

  constructor(sampleRate: number = 1) {
    this.sampleRate = sampleRate;
  }

  /**
   * Initialize all vital tracking
   */
  async init(): Promise<void> {
    if (typeof document === 'undefined') return;

    // Check if we should sample this session
    if (Math.random() > this.sampleRate) return;

    // Track all vitals
    this.trackLCP();
    this.trackINP();
    this.trackCLS();
    this.trackTTFB();
    this.trackFCP();
    this.trackTBT();

    // Generate report when page load completes
    if (document.readyState === 'complete') {
      this.generateReport();
    } else {
      window.addEventListener('load', () => {
        // Wait for all metrics to be collected
        setTimeout(() => this.generateReport(), 3000);
      });
    }
  }

  /**
   * Track Largest Contentful Paint
   */
  private trackLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;

      const metric: Metric = {
        name: 'lcp',
        value: lastEntry.startTime,
        rating: getRating('lcp', lastEntry.startTime),
        entries: [lastEntry],
        navigationType: getNavigationType(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceId: getDeviceId(),
      };

      this.metrics.set('lcp', metric);
      this.notify(metric);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  /**
   * Track Interaction to Next Paint (new standard replacing FID)
   */
  private trackINP(): void {
    if (!('PerformanceObserver' in window)) return;

    // Check if INP is supported (Chrome 96+)
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        
        // Find the worst interaction (highest duration)
        const worstEntry = entries.reduce((worst, entry) => {
          if (!worst || entry.duration > worst.duration) return entry;
          return worst;
        }, null);

        if (worstEntry) {
          const metric: Metric = {
            name: 'inp',
            value: worstEntry.duration,
            rating: getRating('inp', worstEntry.duration),
            entries: entries,
            navigationType: getNavigationType(),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            deviceId: getDeviceId(),
          };

          this.metrics.set('inp', metric);
          this.notify(metric);
        }
      });

      observer.observe({ type: 'interaction', buffered: true });
    } catch {
      // Fall back to FID tracking
      this.trackFID();
    }
  }

  /**
   * Legacy FID tracking fallback
   */
  private trackFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as any;

      const metric: Metric = {
        name: 'fid',
        value: entry.processingStart - entry.startTime,
        rating: getRating('fid', entry.processingStart - entry.startTime),
        entries: [entry],
        navigationType: getNavigationType(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceId: getDeviceId(),
      };

      // Store as inp if not already set
      if (!this.metrics.has('inp')) {
        this.metrics.set('inp', { ...metric, name: 'inp' } as Metric);
      }
      
      this.notify(metric);
    });

    observer.observe({ type: 'first-input', buffered: true });
  }

  /**
   * Track Cumulative Layout Shift
   */
  private trackCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];
    let lastSessionTime = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // Only count layout shifts without recent user input
        if (!entry.hadRecentInput) {
          const firstSessionTime = entry.startTime;
          
          // If new session (gap > 1 second), reset session value
          if (firstSessionTime - lastSessionTime > 1000) {
            sessionValue += clsValue;
            sessionEntries = [...sessionEntries, ...([entry] as PerformanceEntry[])];
            clsValue = 0;
          }
          
          lastSessionTime = firstSessionTime;
          clsValue += entry.value;
        }
      }

      const totalCLS = sessionValue + clsValue;
      
      const metric: Metric = {
        name: 'cls',
        value: totalCLS,
        rating: getRating('cls', totalCLS),
        entries: sessionEntries,
        navigationType: getNavigationType(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceId: getDeviceId(),
      };

      this.metrics.set('cls', metric);
      this.notify(metric);
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  }

  /**
   * Track Time to First Byte
   */
  private trackTTFB(): void {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!nav) return;

    const ttfb = nav.responseStart - nav.requestStart;
    
    const metric: Metric = {
      name: 'ttfb',
      value: ttfb,
      rating: getRating('ttfb', ttfb),
      entries: [nav],
      navigationType: getNavigationType(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceId: getDeviceId(),
    };

    this.metrics.set('ttfb', metric);
    this.notify(metric);
  }

  /**
   * Track First Contentful Paint
   */
  private trackFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        const entry = entries[0];

        const metric: Metric = {
          name: 'fcp',
          value: entry.startTime,
          rating: getRating('fcp', entry.startTime),
          entries: [entry],
          navigationType: getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          deviceId: getDeviceId(),
        };

        this.metrics.set('fcp', metric);
        this.notify(metric);
      }
    });

    paintObserver.observe({ type: 'paint', buffered: true });
  }

  /**
   * Track Total Blocking Time
   */
  private trackTBT(): void {
    if (!('PerformanceObserver' in window)) return;

    // TBT requires long task observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const longTasks = list.getEntries();
        let tbt = 0;
        const fcp = this.metrics.get('fcp');
        const fcpTime = fcp?.value || 0;

        for (const task of longTasks) {
          // Only count tasks after FCP
          if (task.startTime >= fcpTime) {
            const blockingTime = Math.max(task.duration - 50, 0);
            tbt += blockingTime;
          }
        }

        const metric: Metric = {
          name: 'tbt',
          value: tbt,
          rating: getRating('tbt', tbt),
          entries: longTasks,
          navigationType: getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          deviceId: getDeviceId(),
        };

        this.metrics.set('tbt', metric);
        this.notify(metric);
      });

      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      // Long Task API not supported
    }
  }

  /**
   * Add listener for individual metrics
   */
  onMetric(listener: (metric: Metric) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Add listener for complete reports
   */
  onReport(listener: (report: WebVitalsReport) => void): () => void {
    this.reportListeners.push(listener);
    return () => {
      this.reportListeners = this.reportListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of new metric
   */
  private notify(metric: Metric): void {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Web Vitals listener error:', error);
      }
    });
  }

  /**
   * Generate complete performance report
   */
  generateReport(): WebVitalsReport {
    if (this.hasReported && this.metrics.size >= 5) {
      // Return cached report if all metrics collected
    }
    
    const report: WebVitalsReport = {
      lcp: this.metrics.get('lcp') || null,
      inp: this.metrics.get('inp') || null,
      cls: this.metrics.get('cls') || null,
      ttfb: this.metrics.get('ttfb') || null,
      fcp: this.metrics.get('fcp') || null,
      overallScore: 0,
      grade: 'F',
      recommendations: [],
    };

    // Calculate score and grade
    report.overallScore = calculateScore(report);
    report.grade = getGrade(report.overallScore);
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // Notify report listeners
    this.reportListeners.forEach(listener => {
      try {
        listener(report);
      } catch (error) {
        console.error('Web Vitals report listener error:', error);
      }
    });

    // Send to analytics
    this.sendToAnalytics(report);
    
    this.hasReported = true;
    return report;
  }

  /**
   * Generate performance recommendations based on metrics
   */
  private generateRecommendations(report: WebVitalsReport): string[] {
    const recommendations: string[] = [];

    // LCP Recommendations
    if (report.lcp?.rating !== 'good') {
      recommendations.push(
        'LCP is slow. Optimize hero images with next/image and priority loading.',
        'Consider using CDN for static assets.',
        'Preload critical fonts and stylesheets.'
      );
    }

    // INP/FID Recommendations
    if (report.inp?.rating !== 'good') {
      recommendations.push(
        'Interaction response is slow. Review main thread blocking tasks.',
        'Break up long JavaScript tasks with scheduler.postTask().',
        'Use web workers for heavy computations.'
      );
    }

    // CLS Recommendations
    if (report.cls?.rating !== 'good') {
      recommendations.push(
        'Layout shifts detected. Add explicit dimensions to images and videos.',
        'Avoid inserting content above existing content.',
        'Use CSS aspect-ratio for responsive containers.'
      );
    }

    // TTFB Recommendations
    if (report.ttfb?.rating !== 'good') {
      recommendations.push(
        'Server response time is slow. Consider edge caching.',
        'Optimize database queries and API responses.',
        'Implement server-side caching strategies.'
      );
    }

    // FCP Recommendations
    if (report.fcp?.rating !== 'good') {
      recommendations.push(
        'First paint is slow. Reduce render-blocking resources.',
        'Inline critical CSS above the fold.',
        'Defer non-critical JavaScript.'
      );
    }

    return recommendations;
  }

  /**
   * Send metrics to analytics (GA4)
   */
  private sendToAnalytics(report: WebVitalsReport): void {
    if (typeof window === 'undefined') return;

    // Send to GA4 custom event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance Metrics',
        event_label: `Score: ${report.overallScore} (${report.grade})`,
        value: report.overallScore,
        custom_params: {
          lcp_value: report.lcp?.value,
          lcp_rating: report.lcp?.rating,
          inp_value: report.inp?.value,
          inp_rating: report.inp?.rating,
          cls_value: report.cls?.value,
          cls_rating: report.cls?.rating,
          ttfb_value: report.ttfb?.value,
          fcp_value: report.fcp?.value,
          page_url: window.location.pathname,
          device_type: this.getDeviceType(),
        },
      });
    }

    // Also send to our internal API for monitoring
    this.sendToInternalAPI(report);
  }

  /**
   * Send to internal monitoring API
   */
  private async sendToInternalAPI(report: WebVitalsReport): Promise<void> {
    try {
      await fetch('/api/analytics/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...report,
          timestamp: Date.now(),
          connectionType: (navigator as any)?.connection?.effectiveType,
          memoryLimit: (navigator as any)?.deviceMemory,
          cpuCores: navigator.hardwareConcurrency,
        }),
      });
    } catch (error) {
      // Silently fail - don't affect user experience
      console.debug('Failed to send web vitals:', error);
    }
  }

  /**
   * Get device type for analytics
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  /**
   * Reset all tracked metrics
   */
  reset(): void {
    this.metrics.clear();
    this.hasReported = false;
  }
}

// ===========================================
// Singleton Instance
// ===========================================

let trackerInstance: WebVitalsTracker | null = null;

export function getWebVitalsTracker(sampleRate: number = 1): WebVitalsTracker {
  if (!trackerInstance) {
    trackerInstance = new WebVitalsTracker(sampleRate);
  }
  return trackerInstance;
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  const tracker = getWebVitalsTracker(
    process.env.NODE_ENV === 'production' ? 0.1 : 1 // Sample 10% in production
  );
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tracker.init());
  } else {
    tracker.init();
  }
}

export { WebVitalsTracker };
export default getWebVitalsTracker;
