'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Gauge,
  Clock,
  MousePointerClick,
  Layout,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  Target,
  Lightbulb,
  ArrowRight,
  Eye,
  FileText,
} from 'lucide-react';

// Types
interface CoreWebVital {
  name: string;
  metric: string;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  percentile: number; // p75 or similar
}

interface PagePerformance {
  path: string;
  lcp: CoreWebVital;
  fid: CoreWebVital;
  cls: CoreWebVital;
  inp: CoreWebVital;
  overallScore: number;
  sampleSize: number;
}

interface LighthouseResult {
  category: string;
  score: number; // 0-100
  audits: {
    name: string;
    score: number;
    title: string;
    description: string;
  }[];
}

interface HistoricalDataPoint {
  date: string;
  lcp: number;
  fid: number;
  cls: number;
  inp: number;
  overall: number;
}

interface OptimizationSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'easy' | 'moderate' | 'complex';
  estimatedImprovement: string;
}

interface PerformanceScorecardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Mock data generators
const generateCWVData = (): CoreWebVital[] => [
  {
    name: 'Largest Contentful Paint',
    metric: 'LCP',
    value: 2.1 + Math.random() * 0.8,
    unit: 's',
    rating: 'good',
    threshold: { good: 2.5, poor: 4.0 },
    percentile: 75,
  },
  {
    name: 'First Input Delay',
    metric: 'FID',
    value: 28 + Math.random() * 35,
    unit: 'ms',
    rating: 'good',
    threshold: { good: 100, poor: 300 },
    percentile: 75,
  },
  {
    name: 'Cumulative Layout Shift',
    metric: 'CLS',
    value: 0.04 + Math.random() * 0.08,
    unit: '',
    rating: 'good',
    threshold: { good: 0.1, poor: 0.25 },
    percentile: 75,
  },
  {
    name: 'Interaction to Next Paint',
    metric: 'INP',
    value: 120 + Math.random() * 80,
    unit: 'ms',
    rating: 'needs-improvement',
    threshold: { good: 200, poor: 500 },
    percentile: 75,
  },
];

const generatePageData = (): PagePerformance[] => [
  {
    path: '/',
    lcp: { ...generateCWVData()[0], value: 1.8 + Math.random() * 0.5, rating: 'good' },
    fid: { ...generateCWVData()[1], value: 20 + Math.random() * 25, rating: 'good' },
    cls: { ...generateCWVData()[2], value: 0.02 + Math.random() * 0.05, rating: 'good' },
    inp: { ...generateCWVData()[3], value: 100 + Math.random() * 60, rating: 'good' },
    overallScore: 92 + Math.round(Math.random() * 6),
    sampleSize: 12500 + Math.round(Math.random() * 3000),
  },
  {
    path: '/products',
    lcp: { ...generateCWVData()[0], value: 2.4 + Math.random() * 0.8, rating: 'needs-improvement' },
    fid: { ...generateCWVData()[1], value: 35 + Math.random() * 40, rating: 'good' },
    cls: { ...generateCWVData()[2], value: 0.08 + Math.random() * 0.12, rating: 'needs-improvement' },
    inp: { ...generateCWVData()[3], value: 150 + Math.random() * 90, rating: 'needs-improvement' },
    overallScore: 78 + Math.round(Math.random() * 10),
    sampleSize: 8500 + Math.round(Math.random() * 2000),
  },
  {
    path: '/products/[slug]',
    lcp: { ...generateCWVData()[0], value: 2.8 + Math.random() * 1.0, rating: 'needs-improvement' },
    fid: { ...generateCWVData()[1], value: 45 + Math.random() * 50, rating: 'good' },
    cls: { ...generateCWVData()[2], value: 0.06 + Math.random() * 0.10, rating: 'needs-improvement' },
    inp: { ...generateCWVData()[3], value: 180 + Math.random() * 100, rating: 'needs-improvement' },
    overallScore: 72 + Math.round(Math.random() * 12),
    sampleSize: 6200 + Math.round(Math.random() * 1800),
  },
  {
    path: '/search',
    lcp: { ...generateCWVData()[0], value: 3.2 + Math.random() * 1.2, rating: 'poor' },
    fid: { ...generateCWVData()[1], value: 60 + Math.random() * 60, rating: 'needs-improvement' },
    cls: { ...generateCWVData()[2], value: 0.15 + Math.random() * 0.15, rating: 'poor' },
    inp: { ...generateCWVData()[3], value: 250 + Math.random() * 120, rating: 'poor' },
    overallScore: 58 + Math.round(Math.random() * 14),
    sampleSize: 4200 + Math.round(Math.random() * 1200),
  },
  {
    path: '/dashboard/buyer',
    lcp: { ...generateCWVData()[0], value: 2.5 + Math.random() * 0.9, rating: 'needs-improvement' },
    fid: { ...generateCWVData()[1], value: 55 + Math.random() * 55, rating: 'needs-improvement' },
    cls: { ...generateCWVData()[2], value: 0.10 + Math.random() * 0.12, rating: 'needs-improvement' },
    inp: { ...generateCWVData()[3], value: 200 + Math.random() * 110, rating: 'needs-improvement' },
    overallScore: 68 + Math.round(Math.random() * 13),
    sampleSize: 3800 + Math.round(Math.random() * 1000),
  },
  {
    path: '/companies/[slug]',
    lcp: { ...generateCWVData()[0], value: 2.6 + Math.random() * 0.8, rating: 'needs-improvement' },
    fid: { ...generateCWVData()[1], value: 38 + Math.random() * 42, rating: 'good' },
    cls: { ...generateCWVData()[2], value: 0.07 + Math.random() * 0.09, rating: 'needs-improvement' },
    inp: { ...generateCWVData()[3], value: 165 + Math.random() * 85, rating: 'needs-improvement' },
    overallScore: 74 + Math.round(Math.random() * 11),
    sampleSize: 5100 + Math.round(Math.random() * 1400),
  },
];

const generateLighthouseData = (): LighthouseResult[] => [
  {
    category: 'Performance',
    score: 82 + Math.round(Math.random() * 14),
    audits: [
      { name: 'first-contentful-paint', score: 85, title: 'First Contentful Paint', description: 'Time to first content paint' },
      { name: 'largest-contentful-paint', score: 78, title: 'Largest Contentful Paint', description: 'Largest image or text paint time' },
      { name: 'speed-index', score: 80, title: 'Speed Index', description: 'How quickly contents are visually displayed' },
      { name: 'total-blocking-time', score: 72, title: 'Total Blocking Time', description: 'Sum of all long task durations' },
      { name: 'cumulative-layout-shift', score: 88, title: 'Cumulative Layout Shift', description: 'Visual stability of the page' },
    ],
  },
  {
    category: 'Accessibility',
    score: 88 + Math.round(Math.random() * 10),
    audits: [],
  },
  {
    category: 'Best Practices',
    score: 92 + Math.round(Math.random() * 7),
    audits: [],
  },
  {
    category: 'SEO',
    score: 95 + Math.round(Math.random() * 4),
    audits: [],
  },
];

const generateHistoricalData = (): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      lcp: 2.4 - (i * 0.02) + Math.random() * 0.4,
      fid: 45 - (i * 0.3) + Math.random() * 15,
      cls: 0.08 - (i * 0.001) + Math.random() * 0.03,
      inp: 180 - (i * 1.2) + Math.random() * 30,
      overall: 70 + (i * 0.5) + Math.round(Math.random() * 8),
    });
  }
  
  return data;
};

const generateSuggestions = (): OptimizationSuggestion[] => [
  {
    id: '1',
    priority: 'high',
    category: 'Images',
    title: 'Implement lazy loading for product images',
    description: 'Product listing pages load many images above the fold. Implement native lazy loading with appropriate sizing to reduce initial LCP.',
    impact: '-0.8s LCP improvement',
    effort: 'easy',
    estimatedImprovement: '+8 points performance score',
  },
  {
    id: '2',
    priority: 'high',
    category: 'JavaScript',
    description: 'Reduce main thread blocking by code-splitting and deferring non-critical JavaScript bundles.',
    impact: '-120ms INP improvement',
    effort: 'moderate',
    estimatedImprovement: '+12 points performance score',
  },
  {
    id: '3',
    priority: 'medium',
    category: 'Layout',
    title: 'Fix layout shifts on search results page',
    description: 'Search results show significant CLS due to dynamic content loading and missing dimensions on images.',
    impact: '-0.08 CLS improvement',
    effort: 'easy',
    estimatedImprovement: '+5 points performance score',
  },
  {
    id: '4',
    priority: 'medium',
    category: 'Fonts',
    title: 'Preload critical fonts and use font-display: swap',
    description: 'Custom fonts cause FOUT/FOIT. Preload primary font and ensure fallback fonts have similar metrics.',
    impact: '-0.3s LCP improvement',
    effort: 'easy',
    estimatedImprovement: '+4 points performance score',
  },
  {
    id: '5',
    priority: 'low',
    category: 'Third Party',
    title: 'Audit and optimize third-party scripts',
    description: 'Analytics and chat widgets contribute to TBT. Consider loading them after interaction.',
    impact: '-50ms FID improvement',
    effort: 'moderate',
    estimatedImprovement: '+3 points performance score',
  },
  {
    id: '6',
    priority: 'high',
    category: 'CDN',
    title: 'Enable edge caching for API responses',
    description: 'API responses for product listings can be cached at edge with short TTL to reduce origin load.',
    impact: '-200ms server response time',
    effort: 'moderate',
    estimatedImprovement: '+6 points performance score',
  },
];

export default function PerformanceScorecard({
  className = '',
  autoRefresh = false,
  refreshInterval = 60000,
}: PerformanceScorecardProps) {
  const [cwvData, setCwvData] = useState<CoreWebVital[]>(generateCWVData());
  const [pageData, setPageData] = useState<PagePerformance[]>(generatePageData());
  const [lighthouseData, setLighthouseData] = useState<LighthouseResult[]>(generateLighthouseData());
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(generateHistoricalData());
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>(generateSuggestions());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCwvData(generateCWVData());
      setPageData(generatePageData());
      setLighthouseData(generateLighthouseData());
      setHistoricalData(generateHistoricalData());
      setSuggestions(generateSuggestions());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  // Calculate overall score
  const overallScore = Math.round(
    (cwvData.reduce((sum, vital) => {
      if (vital.rating === 'good') return sum + 100;
      if (vital.rating === 'needs-improvement') return sum + 66;
      return sum + 33;
    }, 0)) / cwvData.length
  );

  // Count ratings
  const goodCount = cwvData.filter(v => v.rating === 'good').length;
  const needsImprovementCount = cwvData.filter(v => v.rating === 'needs-improvement').length;
  const poorCount = cwvData.filter(v => v.rating === 'poor').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="w-7 h-7 text-primary" />
            Performance Scorecard
          </h2>
          <p className="text-muted-foreground mt-1">
            Core Web Vitals & Lighthouse scores for AlgeriaTrade.dz
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score Circle */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${overallScore * 2.64} 264`}
                  className={
                    overallScore >= 90 ? 'text-emerald-500' :
                    overallScore >= 70 ? 'text-amber-500' : 'text-red-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{overallScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>

            {/* CWV Summary */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* LCP */}
              <div className="text-center p-3 rounded-lg bg-background">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium">LCP</span>
                </div>
                <p className="text-lg font-bold">{cwvData[0].value.toFixed(1)}s</p>
                <Badge variant={cwvData[0].rating === 'good' ? 'default' : cwvData[0].rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {cwvData[0].rating}
                </Badge>
              </div>

              {/* FID */}
              <div className="text-center p-3 rounded-lg bg-background">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MousePointerClick className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium">FID</span>
                </div>
                <p className="text-lg font-bold">{Math.round(cwvData[1].value)}ms</p>
                <Badge variant={cwvData[1].rating === 'good' ? 'default' : cwvData[1].rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {cwvData[1].rating}
                </Badge>
              </div>

              {/* CLS */}
              <div className="text-center p-3 rounded-lg bg-background">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Layout className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium">CLS</span>
                </div>
                <p className="text-lg font-bold">{cwvData[2].value.toFixed(3)}</p>
                <Badge variant={cwvData[2].rating === 'good' ? 'default' : cwvData[2].rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {cwvData[2].rating}
                </Badge>
              </div>

              {/* INP */}
              <div className="text-center p-3 rounded-lg bg-background">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-medium">INP</span>
                </div>
                <p className="text-lg font-bold">{Math.round(cwvData[3].value)}ms</p>
                <Badge variant={cwvData[3].rating === 'good' ? 'default' : cwvData[3].rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {cwvData[3].rating}
                </Badge>
              </div>
            </div>

            {/* Status Summary */}
            <div className="space-y-2 min-w-[160px]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Good</span>
                </div>
                <span className="font-semibold">{goodCount}/4</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Needs Work</span>
                </div>
                <span className="font-semibold">{needsImprovementCount}/4</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Poor</span>
                </div>
                <span className="font-semibold">{poorCount}/4</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="web-vitals" className="w-full">
        <TabsList className="grid w-full max-w-xl">
          <TabsTrigger value="web-vitals" className="gap-1">
            <Target className="w-4 h-4" />
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="lighthouse" className="gap-1">
            <BarChart3 className="w-4 h-4" />
            Lighthouse
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-1">
            <FileText className="w-4 h-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1">
            <Lightbulb className="w-4 h-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        {/* Core Web Vitals Tab */}
        <TabsContent value="web-vitals" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {cwvData.map((vital) => (
              <Card key={vital.metric}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{vital.name}</CardTitle>
                    <Badge
                      variant={
                        vital.rating === 'good' ? 'default' :
                        vital.rating === 'needs-improvement' ? 'secondary' : 'destructive'
                      }
                      className={
                        vital.rating === 'good' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                        vital.rating === 'needs-improvement' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                        undefined
                      }
                    >
                      {vital.rating.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{vital.metric} - P{vital.percentile}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Value Display */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {vital.unit === 's' 
                          ? vital.value.toFixed(2)
                          : vital.unit === ''
                            ? vital.value.toFixed(3)
                            : Math.round(vital.value)
                        }
                      </span>
                      <span className="text-xl text-muted-foreground">{vital.unit}</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="relative">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            vital.rating === 'good' ? 'bg-emerald-500' :
                            vital.rating === 'needs-improvement' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (vital.value / vital.threshold.poor) * 100)}%`
                          }}
                        />
                      </div>
                      
                      {/* Threshold markers */}
                      <div className="relative mt-1">
                        <div
                          className="absolute w-0.5 h-2 bg-emerald-400"
                          style={{ left: `${(vital.threshold.good / vital.threshold.poor) * 100}%` }}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span className="text-emerald-600">Good ({vital.threshold.good}{vital.unit})</span>
                          <span className="text-red-600">Poor ({vital.threshold.poor}{vital.unit})</span>
                        </div>
                      </div>
                    </div>

                    {/* Description based on metric */}
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {vital.metric === 'LCP' && (
                        <p>
                          Measures loading performance. The time when the largest content element 
                          is visible in the viewport.
                        </p>
                      )}
                      {vital.metric === 'FID' && (
                        <p>
                          Measures interactivity. The time from user first interaction until 
                          the browser responds.
                        </p>
                      )}
                      {vital.metric === 'CLS' && (
                        <p>
                          Measures visual stability. The sum of all unexpected layout shifts 
                          during the page lifecycle.
                        </p>
                      )}
                      {vital.metric === 'INP' && (
                        <p>
                          Measures responsiveness. The time from user interaction until the 
                          next paint, observing all interactions.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lighthouse Scores Tab */}
        <TabsContent value="lighthouse" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {lighthouseData.map(category => (
              <Card key={category.category} className="text-center">
                <CardContent className="pt-6">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${category.score * 2.64} 264`}
                        className={
                          category.score >= 90 ? 'text-emerald-500' :
                          category.score >= 70 ? 'text-amber-500' : 'text-red-500'
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{category.score}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold">{category.category}</h3>
                  
                  {/* Audits breakdown for Performance */}
                  {category.audits.length > 0 && (
                    <div className="mt-3 space-y-2 text-left">
                      {category.audits.slice(0, 3).map(audit => (
                        <div key={audit.name} className="flex items-center justify-between text-xs">
                          <span className="truncate mr-2">{audit.title}</span>
                          <Badge variant={audit.score >= 90 ? 'default' : audit.score >= 70 ? 'secondary' : 'destructive'} className="text-xs px-1.5 py-0">
                            {audit.score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pages Breakdown Tab */}
        <TabsContent value="pages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Page-by-Page Performance Breakdown</CardTitle>
              <CardDescription>
                Core Web Vitals metrics for each major page route
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...pageData]
                  .sort((a, b) => a.overallScore - b.overallScore)
                  .map(page => (
                    <div key={page.path} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {page.path}
                          </code>
                          <Badge
                            variant={
                              page.overallScore >= 90 ? 'default' :
                              page.overallScore >= 70 ? 'secondary' : 'destructive'
                            }
                          >
                            {page.overallScore}/100
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          n={page.sampleSize.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        {/* LCP */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">LCP</p>
                          <p className={`font-mono font-semibold ${
                            page.lcp.rating === 'good' ? 'text-emerald-600' :
                            page.lcp.rating === 'needs-improvement' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {page.lcp.value.toFixed(1)}s
                          </p>
                        </div>
                        
                        {/* FID */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">FID</p>
                          <p className={`font-mono font-semibold ${
                            page.fid.rating === 'good' ? 'text-emerald-600' :
                            page.fid.rating === 'needs-improvement' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {Math.round(page.fid.value)}ms
                          </p>
                        </div>
                        
                        {/* CLS */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">CLS</p>
                          <p className={`font-mono font-semibold ${
                            page.cls.rating === 'good' ? 'text-emerald-600' :
                            page.cls.rating === 'needs-improvement' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {page.cls.value.toFixed(3)}
                          </p>
                        </div>
                        
                        {/* INP */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">INP</p>
                          <p className={`font-mono font-semibold ${
                            page.inp.rating === 'good' ? 'text-emerald-600' :
                            page.inp.rating === 'needs-improvement' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {Math.round(page.inp.value)}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historical Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Performance Trends</CardTitle>
              <CardDescription>
                Historical Core Web Vitals data showing improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Simple trend visualization */}
                <div className="space-y-4">
                  {[
                    { label: 'Overall Score', dataKey: 'overall' as const, color: 'bg-blue-500', unit: '' },
                    { label: 'LCP (seconds)', dataKey: 'lcp' as const, color: 'bg-cyan-500', unit: 's', inverse: true },
                    { label: 'FID (milliseconds)', dataKey: 'fid' as const, color: 'bg-green-500', unit: 'ms', inverse: true },
                    { label: 'INP (milliseconds)', dataKey: 'inp' as const, color: 'bg-orange-500', unit: 'ms', inverse: true },
                  ].map(metric => {
                    const values = historicalData.map(d => d[metric.dataKey]);
                    const latest = values[values.length - 1];
                    const oldest = values[0];
                    const change = ((latest - oldest) / oldest) * 100;
                    const isPositiveChange = metric.inverse ? change < 0 : change > 0;

                    return (
                      <div key={metric.dataKey} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${metric.color}`} />
                            <span className="font-medium">{metric.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {typeof latest === 'number' 
                                ? metric.dataKey === 'overall' 
                                  ? latest 
                                  : latest.toFixed(metric.dataKey === 'cls' ? 3 : 1)
                                : latest
                              }
                              {metric.unit}
                            </span>
                            <div className={`flex items-center gap-1 text-xs ${
                              isPositiveChange ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Mini bar chart */}
                        <div className="h-8 flex items-end gap-0.5">
                          {historicalData.slice(-28).map((point, i) => {
                            const value = point[metric.dataKey];
                            const maxVal = Math.max(...values);
                            const minVal = Math.min(...values);
                            const range = maxVal - minVal || 1;
                            const height = ((value - minVal) / range) * 100;
                            
                            return (
                              <div
                                key={i}
                                className={`flex-1 ${metric.color} opacity-70 hover:opacity-100 transition-opacity rounded-t`}
                                style={{ height: `${Math.max(5, height)}%` }}
                                title={`${point.date}: ${value}${metric.unit}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Period Start</p>
                    <p className="font-medium">{historicalData[0]?.date}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Period End</p>
                    <p className="font-medium">{historicalData[historicalData.length - 1]?.date}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Avg Score Change</p>
                    <p className="font-medium text-emerald-600">+{(historicalData[historicalData.length - 1]?.overall - historicalData[0]?.overall).toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Best Day</p>
                    <p className="font-medium">
                      {historicalData.reduce((best, curr) => 
                        curr.overall > best.overall ? curr : best
                      ).date}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <div className="space-y-4">
            {suggestions
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map(suggestion => (
                <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Priority indicator */}
                      <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                        suggestion.priority === 'high' ? 'bg-red-500' :
                        suggestion.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{suggestion.title}</h3>
                              <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                              <Badge
                                variant={
                                  suggestion.priority === 'high' ? 'destructive' :
                                  suggestion.priority === 'medium' ? 'secondary' : 'default'
                                }
                                className="text-xs"
                              >
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-emerald-600">
                              {suggestion.estimatedImprovement}
                            </p>
                            <p className="text-xs text-muted-foreground">{suggestion.impact}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Effort:</span>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.effort}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="ml-auto text-xs gap-1">
                            View Details
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Summary card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Quick Wins Available
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      There are <strong>{suggestions.filter(s => s.effort === 'easy').length}</strong> easy fixes that could improve your score by an estimated{' '}
                      <strong>+17 points</strong>. Focus on image optimization and layout stability for the biggest impact.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Last updated: {lastUpdated.toLocaleTimeString()}
        {autoRefresh && ` • Auto-refreshing every ${(refreshInterval / 1000)}s`}
      </div>
    </div>
  );
}

export type { PerformanceScorecardProps };
