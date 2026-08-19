'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Brain,
  Activity,
  Zap,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Info,
} from 'lucide-react';

// Import AI engines
import {
  generateDemandForecast,
  generatePriceOptimization,
  predictBuyerBehavior,
  calculateSupplierRisk,
  analyzeMarketTrends,
  generateBIDashboard,
  type DemandForecast,
  type PriceOptimization,
  type BuyerBehavior,
  type SupplierRiskScore,
  type MarketTrend,
} from '@/lib/ai/business-intelligence';

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
  primary: '#16a34a', // green-600
  secondary: '#2563eb', // blue-600
  warning: '#ca8a04', // yellow-600
  danger: '#dc2626', // red-600
  info: '#0891b2', // cyan-600
  purple: '#9333ea',
  orange: '#ea580c',
};

const CHART_COLORS = [
  '#16a34a',
  '#2563eb',
  '#ca8a04',
  '#dc2626',
  '#0891b2',
  '#9333ea',
  '#ea580c',
  '#db2777',
];

// ============================================================================
// Types
// ============================================================================

interface DashboardData {
  demandForecasts: DemandForecast[];
  priceOptimizations: PriceOptimization[];
  atRiskBuyers: BuyerBehavior[];
  supplierRisks: SupplierRiskScore[];
  marketTrends: MarketTrend[];
}

// ============================================================================
// Sub-Components
// ============================================================================

function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${
            changeType === 'positive' ? 'text-green-600' :
            changeType === 'negative' ? 'text-red-600' :
            'text-muted-foreground'
          }`}>
            {changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
            {changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
            {changeType === 'neutral' && <Minus className="h-3 w-3" />}
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueForecastChart({ data, isLoading }: { data: DemandForecast[]; isLoading: boolean }) {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    // Combine historical and forecast data for first category
    const forecast = data[0];
    const allData = [
      ...forecast.historicalData.slice(-30).map(d => ({
        ...d,
        type: 'Historical' as const,
      })),
      ...forecast.forecastData.slice(0, 90).map(d => ({
        ...d,
        type: 'Forecast' as const,
      })),
    ];
    
    return allData.map(d => ({
      date: d.date.slice(5), // MM-DD format
      value: d.value,
      type: d.type,
    }));
  }, [data]);

  const chartConfig: ChartConfig = {
    value: { label: 'Demand', color: COLORS.primary },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>30/60/90 day demand projection</CardDescription>
          </div>
          <Badge variant={data[0]?.trend === 'increasing' ? 'default' : data[0]?.trend === 'decreasing' ? 'destructive' : 'secondary'}>
            {data[0]?.trend === 'increasing' && <TrendingUp className="h-3 w-3 mr-1" />}
            {data[0]?.trend === 'decreasing' && <TrendingDown className="h-3 w-3 mr-1" />}
            {data[0]?.trend || 'stable'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={Math.ceil(chartData.length / 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorValue)"
                name="Demand"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">30 Days</p>
            <p className="text-lg font-semibold">{data[0]?.forecast30Days?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">60 Days</p>
            <p className="text-lg font-semibold">{data[0]?.forecast60Days?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">90 Days</p>
            <p className="text-lg font-semibold">{data[0]?.forecast90Days?.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DemandByCategoryChart({ data, isLoading }: { data: DemandForecast[]; isLoading: boolean }) {
  const chartData = useMemo(() => {
    return data.map(f => ({
      category: f.category.split(' ')[0], // First word of category
      current: f.currentDemand,
      forecast90: f.forecast90Days,
      growth: ((f.forecast90Days - f.currentDemand) / f.currentDemand * 100).toFixed(1),
    }));
  }, [data]);

  const chartConfig: ChartConfig = {
    current: { label: 'Current', color: COLORS.secondary },
    forecast90: { label: '90-Day Forecast', color: COLORS.primary },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demand Prediction by Category</CardTitle>
        <CardDescription>Current vs forecasted demand across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="current" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
              <Bar dataKey="forecast90" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function PriceTrendAnalysis({ data, isLoading }: { data: PriceOptimization[]; isLoading: boolean }) {
  const chartData = useMemo(() => {
    return data.map(p => ({
      name: p.productName.split(' ').slice(0, 3).join(' '), // Shorten name
      current: p.currentPrice / 1000, // Convert to thousands
      suggested: p.suggestedPrice / 1000,
      optimal: p.optimalPrice / 1000,
      competitor: p.competitorAvgPrice / 1000,
      change: p.revenueProjection.changePercent,
    }));
  }, [data]);

  const chartConfig: ChartConfig = {
    current: { label: 'Current Price (K DZD)', color: COLORS.secondary },
    suggested: { label: 'Suggested Price (K DZD)', color: COLORS.primary },
    optimal: { label: 'Optimal Price (K DZD)', color: COLORS.purple },
    competitor: { label: 'Competitor Avg (K DZD)', color: COLORS.warning },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Optimization Analysis</CardTitle>
        <CardDescription>Current prices vs AI-recommended optimizations</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="current" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="suggested" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Price optimization table */}
        <div className="mt-4 max-h-48 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Suggested</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 5).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium max-w-[150px] truncate">{item.productName}</TableCell>
                  <TableCell>{item.currentPrice.toLocaleString()} DZD</TableCell>
                  <TableCell>{item.suggestedPrice.toLocaleString()} DZD</TableCell>
                  <TableCell>
                    <span className={item.revenueProjection.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.revenueProjection.changePercent >= 0 ? '+' : ''}{item.revenueProjection.changePercent}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.marketPosition === 'underpriced' ? 'destructive' :
                      item.marketPosition === 'competitive' ? 'default' :
                      item.marketPosition === 'premium' ? 'secondary' : 'outline'
                    }>
                      {item.marketPosition}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ChurnPredictionChart({ buyers, isLoading }: { buyers: BuyerBehavior[]; isLoading: boolean }) {
  const riskDistribution = useMemo(() => {
    const buckets = { low: 0, medium: 0, high: 0, critical: 0 };
    buyers.forEach(b => {
      if (b.churnRisk < 0.25) buckets.low++;
      else if (b.churnRisk < 0.5) buckets.medium++;
      else if (b.churnRisk < 0.75) buckets.high++;
      else buckets.critical++;
    });
    return [
      { name: 'Low Risk (<25%)', value: buckets.low, color: COLORS.primary },
      { name: 'Medium Risk (25-50%)', value: buckets.medium, color: COLORS.info },
      { name: 'High Risk (50-75%)', value: buckets.high, color: COLORS.warning },
      { name: 'Critical (>75%)', value: buckets.critical, color: COLORS.danger },
    ].filter(d => d.value > 0);
  }, [buyers]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-[200px] w-[200px]" />
            <Skeleton className="flex-1 h-[200px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Buyer Churn Prediction</CardTitle>
            <CardDescription>AI-predicted churn risk distribution</CardDescription>
          </div>
          <Badge variant={buyers.some(b => b.churnRisk > 0.7) ? 'destructive' : 'default'}>
            {buyers.filter(b => b.churnRisk > 0.7).length} High Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-3">
            {riskDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.value}</span>
                  <Progress 
                    value={(item.value / buyers.length) * 100} 
                    className="w-24 h-2"
                  />
                </div>
              </div>
            ))}
            
            {/* At-risk buyer list */}
            {buyers.filter(b => b.churnRisk > 0.5).slice(0, 3).map((buyer, idx) => (
              <div key={buyer.buyerId} className="flex items-start justify-between p-2 bg-muted/50 rounded-md">
                <div>
                  <p className="text-sm font-medium">Buyer-{buyer.buyerId.split('-')[1]}</p>
                  <p className="text-xs text-muted-foreground">{buyer.segment} • {buyer.preferredCategories[0]}</p>
                </div>
                <div className="text-right">
                  <Badge variant={buyer.churnRisk > 0.7 ? 'destructive' : 'secondary'}>
                    {(buyer.churnRisk * 100).toFixed(0)}% risk
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierPerformanceScoring({ suppliers, isLoading }: { suppliers: SupplierRiskScore[]; isLoading: boolean }) {
  const radarData = suppliers.slice(0, 5).map(s => ({
    name: s.companyName.split(' ')[0],
    financial: s.financialHealth,
    delivery: s.deliveryReliability,
    quality: s.qualityScore,
    compliance: s.complianceScore,
    reputation: s.marketReputation,
  }));

  const chartConfig: ChartConfig = {
    financial: { label: 'Financial Health', color: COLORS.primary },
    delivery: { label: 'Delivery Reliability', color: COLORS.secondary },
    quality: { label: 'Quality Score', color: COLORS.warning },
    compliance: { label: 'Compliance', color: COLORS.info },
    reputation: { label: 'Reputation', color: COLORS.purple },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Performance Scoring</CardTitle>
        <CardDescription>Multi-dimensional supplier risk assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Radar
                name="Financial"
                dataKey="financial"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.15}
              />
              <Radar
                name="Delivery"
                dataKey="delivery"
                stroke={COLORS.secondary}
                fill={COLORS.secondary}
                fillOpacity={0.15}
              />
              <Radar
                name="Quality"
                dataKey="quality"
                stroke={COLORS.warning}
                fill={COLORS.warning}
                fillOpacity={0.15}
              />
              <Legend />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Supplier risk table */}
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {suppliers.map((supplier, idx) => (
            <div key={supplier.supplierId} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${
                  supplier.riskLevel === 'low' ? 'bg-green-500' :
                  supplier.riskLevel === 'medium' ? 'bg-yellow-500' :
                  supplier.riskLevel === 'high' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium text-sm">{supplier.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {supplier.yearsInBusiness} yrs • {supplier.verificationStatus}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={
                  supplier.riskLevel === 'low' ? 'default' :
                  supplier.riskLevel === 'medium' ? 'secondary' :
                  supplier.riskLevel === 'high' ? 'outline' : 'destructive'
                }>
                  {supplier.overallRiskScore}/100
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{supplier.riskLevel}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarketTrendsWidget({ trends, isLoading }: { trends: MarketTrend[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Trends - Algeria/MENA</CardTitle>
            <CardDescription>AI-analyzed market movements and opportunities</CardDescription>
          </div>
          <Brain className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {trends.map((trend) => (
            <div key={trend.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{trend.title}</h4>
                    <Badge variant={trend.impact === 'high' ? 'default' : trend.impact === 'medium' ? 'secondary' : 'outline'}>
                      {trend.impact} impact
                    </Badge>
                    <Badge variant={trend.growthRate > 20 ? 'default' : trend.growthRate > 0 ? 'secondary' : 'destructive'}>
                      +{trend.growthRate}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{trend.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {trend.relatedCategories.slice(0, 3).map(cat => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    trend.region === 'algeria' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    trend.region === 'mena' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {trend.region.toUpperCase()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{trend.timeframe}</p>
                </div>
              </div>
              
              {/* Mini sparkline */}
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.dataPoints}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={trend.growthRate > 0 ? COLORS.primary : COLORS.danger}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Confidence indicator */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Confidence: {Math.round(trend.confidence * 100)}%
                  </span>
                </div>
                <div className="flex gap-1">
                  {trend.keyDrivers.slice(0, 2).map(driver => (
                    <span key={driver} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {driver}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main PredictiveDashboard Component
// ============================================================================

interface PredictiveDashboardProps {
  className?: string;
  selectedCategory?: string;
  selectedRegion?: string;
}

export function PredictiveDashboard({
  className,
  selectedCategory = 'All Categories',
  selectedRegion = 'Algeria',
}: PredictiveDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch/generate dashboard data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        const data = generateBIDashboard(
          selectedCategory === 'All Categories' 
            ? ['Construction Materials', 'Electronics & Technology', 'Textiles & Apparel', 'Agriculture & Food', 'Machinery & Equipment']
            : [selectedCategory],
          selectedRegion
        );
        
        setDashboardData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, selectedRegion]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (dashboardData) {
      const newData = generateBIDashboard(
        selectedCategory === 'All Categories'
          ? ['Construction Materials', 'Electronics & Technology', 'Textiles & Apparel', 'Agriculture & Food', 'Machinery & Equipment']
          : [selectedCategory],
        selectedRegion
      );
      setDashboardData(newData);
      setLastUpdated(new Date());
    }
    
    setIsLoading(false);
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!dashboardData) return null;

    const avgForecastGrowth = dashboardData.demandForecasts.reduce((sum, f) => 
      sum + ((f.forecast90Days - f.currentDemand) / f.currentDemand), 0
    ) / dashboardData.demandForecasts.length * 100;

    const totalRevenueOpportunity = dashboardData.priceOptimizations.reduce((sum, p) =>
      sum + Math.max(0, p.revenueProjection.optimized - p.revenueProjection.current), 0
    );

    const highRiskSuppliers = dashboardData.supplierRisks.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
    const avgSupplierScore = Math.round(
      dashboardData.supplierRisks.reduce((sum, s) => sum + (100 - s.overallRiskScore), 0) / dashboardData.supplierRisks.length
    );

    const atRiskBuyers = dashboardData.atRiskBuyers.filter(b => b.churnRisk > 0.6).length;

    return {
      forecastGrowth: Math.round(avgForecastGrowth),
      revenueOpportunity: totalRevenueOpportunity,
      highRiskSuppliers,
      avgSupplierScore,
      atRiskBuyers,
    };
  }, [dashboardData]);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            AI Business Intelligence
          </h2>
          <p className="text-muted-foreground">
            Predictive analytics and insights for AlgeriaTrade.dz marketplace
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={() => {}}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="construction">Construction Materials</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Forecast Growth"
          value={`${kpis?.forecastGrowth || 0}%`}
          change={kpis?.forecastGrowth}
          changeType={kpis?.forecastGrowth && kpis.forecastGrowth >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          description="90-day projected growth"
          isLoading={isLoading}
        />
        <KPICard
          title="Revenue Opportunity"
          value={`${((kpis?.revenueOpportunity || 0) / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          description="Potential via price optimization"
          isLoading={isLoading}
        />
        <KPICard
          title="At-Risk Buyers"
          value={kpis?.atRiskBuyers || 0}
          change={kpis?.atRiskBuyers ? -(kpis.atRiskBuyers % 10) : undefined}
          changeType="negative"
          icon={Users}
          description="Churn probability >60%"
          isLoading={isLoading}
        />
        <KPICard
          title="Supplier Score"
          value={`${kpis?.avgSupplierScore || 0}/100`}
          icon={Shield}
          description="Average performance rating"
          isLoading={isLoading}
        />
        <KPICard
          title="Active Models"
          value="6"
          icon={Brain}
          description="AI models running"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueForecastChart 
              data={dashboardData?.demandForecasts || []} 
              isLoading={isLoading}
            />
            <DemandByCategoryChart 
              data={dashboardData?.demandForecasts || []} 
              isLoading={isLoading}
            />
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <ChurnPredictionChart 
              buyers={dashboardData?.atRiskBuyers || []} 
              isLoading={isLoading}
            />
            <SupplierPerformanceScoring 
              suppliers={dashboardData?.supplierRisks || []} 
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <PriceTrendAnalysis 
            data={dashboardData?.priceOptimizations || []} 
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ChurnPredictionChart 
              buyers={dashboardData?.atRiskBuyers || []} 
              isLoading={isLoading}
            />
            <SupplierPerformanceScoring 
              suppliers={dashboardData?.supplierRisks || []} 
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <MarketTrendsWidget 
            trends={dashboardData?.marketTrends || []} 
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Predictions are generated by AI models and should be used as guidance only.</span>
        </div>
        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

export default PredictiveDashboard;
