/**
 * AlgeriaTrade.dz - Dynamic Import & Code Splitting Configuration
 * 
 * Features:
 * - Automatic route-based code splitting
 * - Heavy component lazy loading
 * - Third-party library optimization
 * - Preloading strategies
 * - Bundle size monitoring
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// ===========================================
// Configuration
// ===========================================

interface DynamicImportConfig {
  /** Show loading component while loading */
  loading?: boolean | ComponentType;
  /** Disable SSR for client-only components */
  ssr?: boolean;
  /** Import only on client side */
  clientOnly?: boolean;
}

const DEFAULT_LOADING = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
  </div>
);

// ===========================================
// Heavy Components (Lazy Loaded)
// ===========================================

/** Rich Text Editor - Only loaded when needed */
export const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    loading: DEFAULT_LOADING,
    ssr: false,
  }
);

/** Data Table with sorting/filtering - Admin pages */
export const DataTable = dynamic(
  () => import('@/components/tables/DataTable'),
  {
    loading: DEFAULT_LOADING,
  }
);

/** Chart components - Dashboard only */
export const Charts = {
  LineChart: dynamic(() => import('@/components/charts/LineChart')),
  BarChart: dynamic(() => import('@/components/charts/BarChart')),
  PieChart: dynamic(() => import('@/components/charts/PieChart')),
  AreaChart: dynamic(() => import('@/components/charts/AreaChart')),
};

/** Map integration - Contact/Supplier pages */
export const MapComponent = dynamic(
  () => import('@/components/maps/InteractiveMap'),
  {
    loading: () => (
      <div className="bg-gray-100 dark:bg-gray-800 h-64 flex items-center justify-center">
        <span className="text-gray-500">Loading map...</span>
      </div>
    ),
    ssr: false,
  }
);

/** Image Gallery - Product detail page */
export const ImageGallery = dynamic(
  () => import('@/components/gallery/ImageGallery'),
  {
    loading: () => (
      <div className="grid grid-cols-4 gap-2 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded aspect-square"></div>
        ))}
      </div>
    ),
  }
);

/** PDF Viewer - Documents page */
export const PdfViewer = dynamic(
  () => import('@/components/documents/PdfViewer'),
  {
    loading: DEFAULT_LOADING,
    ssr: false,
  }
);

/** Video Player - Product demos */
export const VideoPlayer = dynamic(
  () => import('@/components/media/VideoPlayer'),
  {
    loading: () => (
      <div className="bg-black aspect-video flex items-center justify-center">
        <span className="text-white">Loading video...</span>
      </div>
    ),
    ssr: false,
  }
);

/** Chat Widget - Customer support */
export const ChatWidget = dynamic(
  () => import('@/components/chat/ChatWidget'),
  {
    loading: null, // No loading indicator for chat
    ssr: false,
  }
);

/** Notification Panel - Header dropdown */
export const NotificationPanel = dynamic(
  () => import('@/components/notifications/NotificationPanel'),
  {
    loading: null,
    ssr: false,
  }
);

/** Search Modal - Global search */
export const SearchModal = dynamic(
  () => import('@/components/search/SearchModal'),
  {
    loading: null,
    ssr: false,
  }
);

/** AI Assistant - Floating widget */
export const AIAssistant = dynamic(
  () => import('@/components/ai/AIAssistant'),
  {
    loading: null,
    ssr: false,
  }
);

// ===========================================
// Page-Level Code Splitting (Route-based)
// ===========================================

/** Admin Pages - All lazy loaded */
export const AdminPages = {
  Dashboard: dynamic(() => import('@/app/admin/dashboard/page')),
  Users: dynamic(() => import('@/app/admin/users/page')),
  Products: dynamic(() => import('@/app/admin/products/page')),
  Orders: dynamic(() => import('@/app/admin/orders/page')),
  Analytics: dynamic(() => import('@/app/admin/analytics/page')),
  Settings: dynamic(() => import('@/app/admin/settings/page')),
  Reports: dynamic(() => import('@/app/admin/reports/page')),
  AISettings: dynamic(() => import('@/app/admin/ai/settings/page')),
};

/** Supplier Portal Pages */
export const SupplierPages = {
  Dashboard: dynamic(() => import('@/app/supplier/dashboard/page')),
  Products: dynamic(() => import('@/app/supplier/products/page')),
  Orders: dynamic(() => import('@/app/supplier/orders/page')),
  Messages: dynamic(() => import('@/app/supplier/messages/page')),
  Profile: dynamic(() => import('@/app/supplier/profile/page')),
};

/** Buyer Portal Pages */
export const BuyerPages = {
  Dashboard: dynamic(() => import('@/app/buyer/dashboard/page')),
  RFQs: dynamic(() => import('@/app/buyer/rfqs/page')),
  Orders: dynamic(() => import('@/app/buyer/orders/page')),
  Favorites: dynamic(() => import('@/app/buyer/favorites/page')),
  Messages: dynamic(() => import('@/app/buyer/messages/page')),
};

// ===========================================
// Third-Party Library Optimization
// ===========================================

/** Date Picker - react-datepicker (~200KB) */
export const DatePicker = dynamic(
  () => import('react-datepicker'),
  {
    loading: () => <input type="date" className="border rounded px-3 py-2" />,
    ssr: false,
  }
);

/** Select with Search - react-select (~150KB) */
export const SelectSearch = dynamic(
  () => import('react-select'),
  {
    loading: () => (
      <select className="border rounded px-3 py-2 w-full">
        <option>Loading options...</option>
      </select>
    ),
    ssr: false,
  }
);

/** File Upload - react-dropzone (~50KB) */
export const FileUpload = dynamic(
  () => import('react-dropzone'),
  {
    ssr: false,
  }
);

/** Syntax Highlighting - prism-react-renderer (~100KB) */
export const SyntaxHighlighter = dynamic(
  () => import('prism-react-renderer').then((mod) => mod.default),
  {
    loading: () => <pre className="bg-gray-100 p-4"><code>Loading...</code></pre>,
    ssr: false,
  }
);

/** Markdown Editor - react-markdown + plugins (~80KB) */
export const MarkdownEditor = dynamic(
  () => import('@uiw/react-markdown-editor'),
  {
    loading: DEFAULT_LOADING,
    ssr: false,
  }
);

// ===========================================
// Preloading Utilities
// ===========================================

/**
 * Preload a component bundle before user navigates to it
 * Call this on hover or when component becomes likely needed
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback for non-critical preloads
    const preload = () => {
      importFn().catch(() => {
        // Silently fail - will retry on actual navigation
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 200);
    }
  }
}

/**
 * Preload critical route bundles based on user behavior
 */
export function preloadLikelyRoutes(): void {
  if (typeof window === 'undefined') return;

  // Analyze current path to predict next routes
  const currentPath = window.location.pathname;

  // If on product listing, preload detail page
  if (currentPath.includes('/products')) {
    preloadComponent(() => import('@/app/products/[id]/page'));
  }

  // If on supplier list, preload supplier profile
  if (currentPath.includes('/suppliers')) {
    preloadComponent(() => import('@/app/suppliers/[id]/page'));
  }

  // Always preload search modal (used frequently)
  preloadComponent(() => import('@/components/search/SearchModal'));
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResources(urls: string[]): void {
  if (typeof document === 'undefined' || !('link' in document)) return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

// ===========================================
# Bundle Size Monitoring
// ===========================================

interface BundleInfo {
  name: string;
  size: number;
  gzippedSize: number;
  loaded: boolean;
  loadTime?: number;
}

class BundleMonitor {
  private bundles: Map<string, BundleInfo> = new Map();

  track(name: string, importFn: () => Promise<any>): () => Promise<any> {
    return async () => {
      const startTime = performance.now();
      
      try {
        const module = await importFn();
        const endTime = performance.now();
        
        // Estimate size (rough approximation)
        const size = this.estimateBundleSize(module);
        
        this.bundles.set(name, {
          name,
          size,
          gzippedSize: Math.round(size * 0.3), // Rough gzip ratio
          loaded: true,
          loadTime: endTime - startTime,
        });

        console.log(`📦 Bundle "${name}" loaded in ${(endTime - startTime).toFixed(0)}ms`);
        
        return module;
      } catch (error) {
        this.bundles.set(name, {
          name,
          size: 0,
          gzippedSize: 0,
          loaded: false,
        });
        throw error;
      }
    };
  }

  getReport(): Array<BundleInfo & { percentage: number }> {
    const totalSize = Array.from(this.bundles.values()).reduce((sum, b) => sum + b.size, 0);
    
    return Array.from(this.bundles.values()).map(bundle => ({
      ...bundle,
      percentage: totalSize > 0 ? (bundle.size / totalSize) * 100 : 0,
    }));
  }

  private estimateBundleSize(module: any): number {
    // Very rough estimation based on module keys count
    try {
      return JSON.stringify(module).length;
    } catch {
      return 0;
    }
  }
}

export const bundleMonitor = new BundleMonitor();

// ===========================================
// Export All
// ===========================================

export default {
  // Components
  RichTextEditor,
  DataTable,
  Charts,
  MapComponent,
  ImageGallery,
  PdfViewer,
  VideoPlayer,
  ChatWidget,
  NotificationPanel,
  SearchModal,
  AIAssistant,
  
  // Pages
  AdminPages,
  SupplierPages,
  BuyerPages,
  
  // Libraries
  DatePicker,
  SelectSearch,
  FileUpload,
  SyntaxHighlighter,
  MarkdownEditor,
  
  // Utilities
  preloadComponent,
  preloadLikelyRoutes,
  prefetchResources,
  bundleMonitor,
};
