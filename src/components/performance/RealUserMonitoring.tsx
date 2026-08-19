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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  Signal,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Video,
  RefreshCw,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react';

// Types
interface RUMDataPoint {
  timestamp: Date;
  pageLoad: number;
  domInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  connectionType: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  country: string;
  city: string;
  browser: string;
  os: string;
}

interface ConnectionTypeStats {
  type: string;
  count: number;
  percentage: number;
  avgPageLoad: number;
  p95PageLoad: number;
  bounceRate: number;
}

interface DeviceCategoryStats {
  device: 'desktop' | 'mobile' | 'tablet';
  count: number;
  percentage: number;
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  bounceRate: number;
  conversionRate: number;
}

interface GeographicPerformance {
  country: string;
  city?: string;
  countryCode: string;
  sessions: number;
  avgPageLoad: number;
  p95PageLoad: number;
  bounceRate: number;
  errorRate: number;
  satisfaction: number; // 1-5
}

interface SessionReplaySample {
  id: string;
  sessionId: string;
  page: string;
  duration: number;
  rageClicks: number;
  deadClicks: number;
  errors: number;
  rating: 'good' | 'poor' | 'frustrated';
  recordedAt: Date;
  deviceType: string;
  location: string;
}

interface RealUserMonitoringProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Mock data generators
const generateRUMData = (): RUMDataPoint[] => {
  const data: RUMDataPoint[] = [];
  const now = new Date();
  
  for (let i = 0; i < 1000; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 3600000); // Last hour
    const isMobile = Math.random() > 0.45;
    const connectionTypes = ['4g', '3g', 'wifi', '2g', '4g', 'wifi', '4g'];
    const countries = [
      { code: 'DZ', name: 'Algeria', cities: ['Algiers', 'Oran', 'Constantine', 'Blida', 'Batna'] },
      { code: 'FR', name: 'France', cities: ['Paris', 'Marseille', 'Lyon'] },
      { code: 'TN', name: 'Tunisia', cities: ['Tunis', 'Sfax'] },
      { code: 'MA', name: 'Morocco', cities: ['Casablanca', 'Rabat'] },
      { code: 'AE', name: 'UAE', cities: ['Dubai', 'Abu Dhabi'] },
    ];
    
    const countryData = countries[Math.floor(Math.random() * (countries.length * 0.7))]; // Bias towards Algeria
    const city = countryData.cities[Math.floor(Math.random() * countryData.cities.length)];
    const connectionType = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
    
    // Performance varies by connection and device
    const baseLoadTime = connectionType === 'wifi' ? 1200 : 
                        connectionType === '4g' ? 2000 :
                        connectionType === '3g' ? 4000 : 6000;
    
    const deviceMultiplier = isMobile ? 1.3 : 1;
    
    data.push({
      timestamp,
      pageLoad: baseLoadTime + Math.random() * baseLoadTime * deviceMultiplier,
      domInteractive: baseLoadTime * 0.6 + Math.random() * 500,
      firstContentfulPaint: baseLoadTime * 0.4 + Math.random() * 300,
      largestContentfulPaint: baseLoadTime * 0.85 + Math.random() * baseLoadTime * 0.3,
      firstInputDelay: 15 + Math.random() * (connectionType === '3g' || connectionType === '2g' ? 150 : 50),
      cumulativeLayoutShift: 0.01 + Math.random() * 0.12,
      connectionType,
      deviceType: isMobile ? 'mobile' : Math.random() > 0.9 ? 'tablet' : 'desktop',
      country: countryData.name,
      city,
      browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
      os: ['Windows', 'macOS', 'iOS', 'Android'][Math.floor(Math.random() * 4)],
    });
  }
  
  return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const generateConnectionStats = (rumData: RUMDataPoint[]): ConnectionTypeStats[] => {
  const grouped = rumData.reduce((acc, point) => {
    if (!acc[point.connectionType]) {
      acc[point.connectionType] = [];
    }
    acc[point.connectionType].push(point);
    return acc;
  }, {} as Record<string, RUMDataPoint[]>);

  return Object.entries(grouped).map(([type, points]) => ({
    type: type.toUpperCase(),
    count: points.length,
    percentage: (points.length / rumData.length) * 100,
    avgPageLoad: points.reduce((sum, p) => sum + p.pageLoad, 0) / points.length,
    p95PageLoad: points.map(p => p.pageLoad).sort((a, b) => a - b)[Math.floor(points.length * 0.95)],
    bounceRate: 0.25 + Math.random() * 0.35, // Simulated
  })).sort((a, b) => b.count - a.count);
};

const generateDeviceStats = (rumData: RUMDataPoint[]): DeviceCategoryStats[] => {
  const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'tablet'];
  
  return devices.map(device => {
    const points = rumData.filter(p => p.deviceType === device);
    return {
      device,
      count: points.length,
      percentage: (points.length / rumData.length) * 100,
      avgLCP: points.reduce((sum, p) => sum + p.largestContentfulPaint, 0) / (points.length || 1),
      avgFID: points.reduce((sum, p) => sum + p.firstInputDelay, 0) / (points.length || 1),
      avgCLS: points.reduce((sum, p) => sum + p.cumulativeLayoutShift, 0) / (points.length || 1),
      bounceRate: device === 'mobile' ? 0.38 + Math.random() * 0.18 : 0.22 + Math.random() * 0.12,
      conversionRate: device === 'mobile' ? 0.018 + Math.random() * 0.012 : 0.032 + Math.random() * 0.018,
    };
  }).sort((a, b) => b.count - a.count);
};

const generateGeoPerformance = (): GeographicPerformance[] => [
  {
    country: 'Algeria',
    city: 'Algiers',
    countryCode: 'DZ',
    sessions: 28500 + Math.round(Math.random() * 5000),
    avgPageLoad: 1450 + Math.round(Math.random() * 800),
    p95PageLoad: 2800 + Math.round(Math.random() * 1200),
    bounceRate: 0.28 + Math.random() * 0.10,
    errorRate: 0.008 + Math.random() * 0.008,
    satisfaction: 4.2 + Math.random() * 0.5,
  },
  {
    country: 'Algeria',
    city: 'Oran',
    countryCode: 'DZ',
    sessions: 12500 + Math.round(Math.random() * 2500),
    avgPageLoad: 1850 + Math.round(Math.random() * 900),
    p95PageLoad: 3400 + Math.round(Math.random() * 1400),
    bounceRate: 0.32 + Math.random() * 0.12,
    errorRate: 0.012 + Math.random() * 0.010,
    satisfaction: 3.9 + Math.random() * 0.5,
  },
  {
    country: 'Algeria',
    city: 'Constantine',
    countryCode: 'DZ',
    sessions: 8200 + Math.round(Math.random() * 1800),
    avgPageLoad: 2100 + Math.round(Math.random() * 1000),
    p95PageLoad: 3800 + Math.round(Math.random() * 1600),
    bounceRate: 0.35 + Math.random() * 0.14,
    errorRate: 0.015 + Math.random() * 0.012,
    satisfaction: 3.7 + Math.random() * 0.6,
  },
  {
    country: 'France',
    city: 'Paris',
    countryCode: 'FR',
    sessions: 9800 + Math.round(Math.random() * 2200),
    avgPageLoad: 1100 + Math.round(Math.random() * 500),
    p95PageLoad: 2100 + Math.round(Math.random() * 900),
    bounceRate: 0.24 + Math.random() * 0.08,
    errorRate: 0.005 + Math.random() * 0.005,
    satisfaction: 4.4 + Math.random() * 0.4,
  },
  {
    country: 'Tunisia',
    city: 'Tunis',
    countryCode: 'TN',
    sessions: 5200 + Math.round(Math.random() * 1200),
    avgPageLoad: 1950 + Math.round(Math.random() * 950),
    p95PageLoad: 3600 + Math.round(Math.random() * 1500),
    bounceRate: 0.34 + Math.random() * 0.13,
    errorRate: 0.014 + Math.random() * 0.010,
    satisfaction: 3.8 + Math.random() * 0.5,
  },
  {
    country: 'Morocco',
    city: 'Casablanca',
    countryCode: 'MA',
    sessions: 4200 + Math.round(Math.random() * 1000),
    avgPageLoad: 2050 + Math.round(Math.random() * 1000),
    p95PageLoad: 3700 + Math.round(Math.random() * 1600),
    bounceRate: 0.36 + Math.random() * 0.13,
    errorRate: 0.016 + Math.random() * 0.011,
    satisfaction: 3.6 + Math.random() * 0.6,
  },
  {
    country: 'Algeria',
    city: 'Blida',
    countryCode: 'DZ',
    sessions: 4800 + Math.round(Math.random() * 1000),
    avgPageLoad: 1650 + Math.round(Math.random() * 750),
    p95PageLoad: 3100 + Math.round(Math.random() * 1300),
    bounceRate: 0.30 + Math.random() * 0.11,
    errorRate: 0.010 + Math.random() * 0.008,
    satisfaction: 4.0 + Math.random() * 0.5,
  },
  {
    country: 'UAE',
    city: 'Dubai',
    countryCode: 'AE',
    sessions: 3200 + Math.round(Math.random() * 800),
    avgPageLoad: 1300 + Math.round(Math.random() * 600),
    p95PageLoad: 2400 + Math.round(Math.random() * 1000),
    bounceRate: 0.26 + Math.random() * 0.09,
    errorRate: 0.007 + Math.random() * 0.006,
    satisfaction: 4.3 + Math.random() * 0.5,
  },
];

const generateSessionReplays = (): SessionReplaySample[] => Array.from({ length: 20 }, (_, i) => ({
  id: `replay-${i + 1}`,
  sessionId: `sess-${Math.random().toString(36).substring(2, 10)}`,
  page: ['/', '/products', '/products/[slug]', '/search', '/dashboard/buyer'][Math.floor(Math.random() * 5)],
  duration: 30 + Math.round(Math.random() * 300),
  rageClicks: Math.round(Math.random() * 8),
  deadClicks: Math.round(Math.random() * 5),
  errors: Math.round(Math.random() * 3),
  rating: Math.random() > 0.75 ? 'frustrated' : Math.random() > 0.4 ? 'poor' : 'good',
  recordedAt: new Date(Date.now() - Math.random() * 7200000), // Last 2 hours
  deviceType: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
  location: ['Algiers', 'Paris', 'Oran', 'Tunis', 'Casablanca'][Math.floor(Math.random() * 5)],
}));

export default function RealUserMonitoring({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000,
}: RealUserMonitoringProps) {
  const [rumData, setRumData] = useState<RUMDataPoint[]>(generateRUMData());
  const [connectionStats, setConnectionStats] = useState<ConnectionTypeStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceCategoryStats[]>([]);
  const [geoPerformance, setGeoPerformance] = useState<GeographicPerformance[]>([]);
  const [sessionReplays, setSessionReplays] = useState<SessionReplaySample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('hour');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const newRumData = generateRUMData();
      setRumData(newRumData);
      setConnectionStats(generateConnectionStats(newRumData));
      setDeviceStats(generateDeviceStats(newRumData));
      setGeoPerformance(generateGeoPerformance());
      setSessionReplays(generateSessionReplays());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch RUM data:', error);
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

  // Calculate aggregate metrics
  const totalSessions = rumData.length;
  const avgPageLoad = rumData.reduce((sum, d) => sum + d.pageLoad, 0) / totalSessions;
  const mobileSessions = rumData.filter(d => d.deviceType === 'mobile').length;
  const mobilePercentage = (mobileSessions / totalSessions) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-7 h-7 text-primary" />
            Real User Monitoring (RUM)
          </h2>
          <p className="text-muted-foreground mt-1">
            Live user experience metrics from actual visitors across MENA region
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 bg-blue-50 dark:bg-blue-950 rounded-lg p-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Page Load</p>
                <p className="text-2xl font-bold">{(avgPageLoad / 1000).toFixed(2)}s</p>
              </div>
              <Clock className="w-8 h-8 text-emerald-500 bg-emerald-50 dark:bg-emerald-950 rounded-lg p-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mobile Traffic</p>
                <p className="text-2xl font-bold">{mobilePercentage.toFixed(1)}%</p>
              </div>
              <Smartphone className="w-8 h-8 text-purple-500 bg-purple-50 dark:bg-purple-950 rounded-lg p-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{(0.29 + Math.random() * 0.08).toFixed(1)}%</p>
              </div>
              <Activity className="w-8 h-8 text-amber-500 bg-amber-50 dark:bg-amber-950 rounded-lg p-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{(0.008 + Math.random() * 0.006).toFixed(2)}%</p>
              </div>
              <Signal className="w-8 h-8 text-red-500 bg-red-50 dark:bg-red-950 rounded-lg p-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full max-w-lg">
          <TabsTrigger value="connections" className="gap-1">
            <Wifi className="w-4 h-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-1">
            <Monitor className="w-4 h-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="geographic" className="gap-1">
            <Globe className="w-4 h-4" />
            Geographic
          </TabsTrigger>
          <TabsTrigger value="replays" className="gap-1">
            <Video className="w-4 h-4" />
            Replays
          </TabsTrigger>
        </TabsList>

        {/* Connection Type Tab */}
        <TabsContent value="connections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Connection Type</CardTitle>
              <CardDescription>
                How network speed affects user experience - critical for MENA optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {connectionStats.slice(0, 4).map(conn => (
                    <div key={conn.type} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {conn.type === 'WIFI' && <Wifi className="w-5 h-5 text-blue-500" />}
                          {conn.type === '4G' && <Signal className="w-5 h-5 text-green-500" />}
                          {conn.type === '3G' && <Signal className="w-5 h-5 text-amber-500" />}
                          {(conn.type === '2G' || conn.type === 'OTHER') && <Signal className="w-5 h-5 text-red-500" />}
                          <span className="font-semibold">{conn.type}</span>
                        </div>
                        <Badge variant="outline">{conn.percentage.toFixed(1)}%</Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sessions</span>
                          <span className="font-mono">{conn.count.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Load Time</span>
                          <span className={`font-mono ${
                            conn.avgPageLoad < 2000 ? 'text-emerald-600' :
                            conn.avgPageLoad < 3500 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {(conn.avgPageLoad / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P95 Load Time</span>
                          <span className="font-mono text-muted-foreground">
                            {(conn.p95PageLoad / 1000).toFixed(2)}s
                          </span>
                        </div>
                      </div>

                      {/* Visual bar */}
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            conn.avgPageLoad < 2000 ? 'bg-emerald-500' :
                            conn.avgPageLoad < 3500 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (conn.avgPageLoad / 6000) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Connection Type</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">% of Traffic</TableHead>
                        <TableHead className="text-right">Avg Page Load</TableHead>
                        <TableHead className="text-right">P95 Page Load</TableHead>
                        <TableHead className="text-right">Bounce Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connectionStats.map(conn => (
                        <TableRow key={conn.type}>
                          <TableCell className="font-medium flex items-center gap-2">
                            {conn.type === 'WIFI' && <Wifi className="w-4 h-4 text-blue-500" />}
                            {conn.type === '4G' && <Signal className="w-4 h-4 text-green-500" />}
                            {conn.type === '3G' && <Signal className="w-4 h-4 text-amber-500" />}
                            {conn.type}
                          </TableCell>
                          <TableCell className="text-right font-mono">{conn.count.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{conn.percentage.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{(conn.avgPageLoad / 1000).toFixed(2)}s</TableCell>
                          <TableCell className="text-right font-mono">{(conn.p95PageLoad / 1000).toFixed(2)}s</TableCell>
                          <TableCell className="text-right font-mono">{(conn.bounceRate * 100).toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                conn.avgPageLoad < 2500 ? 'default' :
                                conn.avgPageLoad < 4000 ? 'secondary' : 'destructive'
                              }
                            >
                              {conn.avgPageLoad < 2500 ? 'Good' : conn.avgPageLoad < 4000 ? 'OK' : 'Slow'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Category Tab */}
        <TabsContent value="devices" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Category Breakdown</CardTitle>
                <CardDescription>
                  Performance comparison across desktop, mobile, and tablet devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {deviceStats.map(device => (
                    <div key={device.device} className="p-4 rounded-lg border space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {device.device === 'desktop' && <Monitor className="w-6 h-6 text-blue-500" />}
                          {device.device === 'mobile' && <Smartphone className="w-6 h-6 text-purple-500" />}
                          {device.device === 'tablet' && <Smartphone className="w-6 h-6 text-amber-500" />}
                          <span className="font-semibold capitalize">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{device.percentage.toFixed(1)}%</Badge>
                          <span className="text-sm text-muted-foreground">
                            ({device.count.toLocaleString()} users)
                          </span>
                        </div>
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg LCP</p>
                          <p className="font-mono font-semibold">{(device.avgLCP / 1000).toFixed(2)}s</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg FID</p>
                          <p className="font-mono font-semibold">{Math.round(device.avgFID)}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg CLS</p>
                          <p className="font-mono font-semibold">{device.avgCLS.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conv. Rate</p>
                          <p className="font-mono font-semibold text-emerald-600">
                            {(device.conversionRate * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Bounce rate bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Bounce Rate</span>
                          <span>{(device.bounceRate * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={device.bounceRate * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobile Optimization Insights</CardTitle>
                <CardDescription>
                  Key areas to improve mobile experience for Algerian users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg space-y-3">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      Mobile User Experience
                    </h4>
                    
                    <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                      <div className="flex justify-between">
                        <span>Avg Mobile LCP</span>
                        <strong>{deviceStats.find(d => d.device === 'mobile')?.avgLCP.toFixed(0) || '-'}ms</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile Bounce Rate</span>
                        <strong>{((deviceStats.find(d => d.device === 'mobile')?.bounceRate || 0) * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile Conversion</span>
                        <strong>{((deviceStats.find(d => d.device === 'mobile')?.conversionRate || 0) * 100).toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Recommendations</h4>
                    
                    {[
                      { title: 'Implement PWA features', impact: '+15% engagement', effort: 'Medium' },
                      { title: 'Optimize images for mobile', impact: '-40% LCP', effort: 'Easy' },
                      { title: 'Reduce JavaScript bundle', impact: '-25% FID', effort: 'Moderate' },
                      { title: 'Add service worker caching', impact: '-60% repeat load time', effort: 'Easy' },
                    ].map(rec => (
                      <div key={rec.title} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="text-sm">{rec.title}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{rec.impact}</Badge>
                          <Badge variant="outline" className="text-xs">{rec.effort}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Performance Tab */}
        <TabsContent value="geographic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Performance Comparison</CardTitle>
              <CardDescription>
                User experience by location with focus on Algerian cities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...geoPerformance]
                  .sort((a, b) => b.sessions - a.sessions)
                  .map((geo, index) => (
                    <div 
                      key={`${geo.country}-${geo.city}`} 
                      className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                        geo.countryCode === 'DZ' ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-5 h-5 ${geo.countryCode === 'DZ' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{geo.city || geo.country}</span>
                              <Badge variant="outline" className="text-xs">{geo.countryCode}</Badge>
                              {index < 3 && <Badge className="text-xs bg-primary">Top {index + 1}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {geo.sessions.toLocaleString()} sessions
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Satisfaction stars */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={i < Math.round(geo.satisfaction) ? 'text-amber-400' : 'text-gray-300'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-medium">{geo.satisfaction.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg Load</p>
                          <p className={`font-mono font-semibold ${
                            geo.avgPageLoad < 1800 ? 'text-emerald-600' :
                            geo.avgPageLoad < 2800 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {(geo.avgPageLoad / 1000).toFixed(2)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P95 Load</p>
                          <p className="font-mono">{(geo.p95PageLoad / 1000).toFixed(2)}s</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bounce Rate</p>
                          <p className={`font-mono ${geo.bounceRate < 0.3 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {(geo.bounceRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Error Rate</p>
                          <p className="font-mono">{(geo.errorRate * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge
                            variant={
                              geo.satisfaction >= 4.2 ? 'default' :
                              geo.satisfaction >= 3.7 ? 'secondary' : 'destructive'
                            }
                          >
                            {geo.satisfaction >= 4.2 ? 'Excellent' : geo.satisfaction >= 3.7 ? 'Good' : 'Needs Work'}
                          </Badge>
                        </div>
                      </div>

                      {/* Latency visualization */}
                      <div className="mt-3 relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                            geo.avgPageLoad < 1800 ? 'bg-emerald-500' :
                            geo.avgPageLoad < 2800 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (geo.avgPageLoad / 4500) * 100)}%` }}
                        />
                        {/* P95 marker */}
                        <div
                          className="absolute top-0 w-0.5 h-full bg-black dark:bg-white"
                          style={{ left: `${Math.min(98, (geo.p95PageLoad / 4500) * 100)}%` }}
                        />
                      </div>
                </div>
                ))}

                {/* Algeria summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-primary">Algeria Focus Region</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {geoPerformance.filter(g => g.countryCode === 'DZ').length} Algerian cities monitored •{' '}
                        {geoPerformance.filter(g => g.countryCode === 'DZ').reduce((sum, g) => sum + g.sessions, 0).toLocaleString()} total sessions •{' '}
                        Avg satisfaction:{' '}
                        <strong>
                          {(geoPerformance.filter(g => g.countryCode === 'DZ')
                            .reduce((sum, g) => sum + g.satisfaction, 0) / 
                            geoPerformance.filter(g => g.countryCode === 'DZ').length
                          ).toFixed(1)}
                        </strong>/5
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Replay Sampling Tab */}
        <TabsContent value="replays" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Session Replay Sampling</CardTitle>
                  <CardDescription>
                    Sampled session recordings for UX analysis (privacy-focused)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="frustrated">Frustrated Only</SelectItem>
                      <SelectItem value="errors">With Errors</SelectItem>
                      <SelectItem value="rage-clicks">Rage Clicks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessionReplays.map(replay => (
                  <div 
                    key={replay.id} 
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {/* Rating indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      replay.rating === 'good' ? 'bg-emerald-100 text-emerald-600' :
                      replay.rating === 'poor' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {replay.rating === 'good' ? '😊' : replay.rating === 'poor' ? '😐' : '😫'}
                    </div>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono truncate">
                          {replay.page}
                        </code>
                        <Badge 
                          variant={
                            replay.rating === 'good' ? 'default' :
                            replay.rating === 'poor' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {replay.rating}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(replay.duration / 60)}:{(replay.duration % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {replay.deviceType}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {replay.location}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 shrink-0">
                      {replay.rageClicks > 0 && (
                        <div className="text-center px-2 py-1 bg-red-50 dark:bg-red-950 rounded">
                          <p className="text-xs font-semibold text-red-600">{replay.rageClicks}</p>
                          <p className="text-xs text-red-500">rage</p>
                        </div>
                      )}
                      {replay.deadClicks > 0 && (
                        <div className="text-center px-2 py-1 bg-amber-50 dark:bg-amber-950 rounded">
                          <p className="text-xs font-semibold text-amber-600">{replay.deadClicks}</p>
                          <p className="text-xs text-amber-500">dead</p>
                        </div>
                      )}
                      {replay.errors > 0 && (
                        <div className="text-center px-2 py-1 bg-red-50 dark:bg-red-950 rounded">
                          <p className="text-xs font-semibold text-red-600">{replay.errors}</p>
                          <p className="text-xs text-red-500">errors</p>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <Button variant="outline" size="sm" className="shrink-0 gap-1">
                      <Video className="w-4 h-4" />
                      Watch
                    </Button>
                  </div>
                ))}

                {/* Sampling info */}
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center justify-between">
                  <span>
                    Showing {sessionReplays.length} sampled sessions from last 2 hours
                  </span>
                  <span>
                    Sampling rate: 1% of total sessions
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
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

export type { RealUserMonitoringProps };
