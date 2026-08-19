'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SectorAnalytics, INDUSTRY_SECTORS } from '@/lib/analytics/engine';
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChartIcon, Activity } from 'lucide-react';

interface SectorPerformanceChartProps {
  data: SectorAnalytics[];
  height?: number;
  showDetails?: boolean;
}

const COLORS = INDUSTRY_SECTORS.map(s => s.color);

interface CustomPieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  index: number;
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name
}: CustomPieLabelProps) => {
  if (percent < 0.05) return null; // Hide labels for small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#374151" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${name} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: SectorAnalytics }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[250px]">
        <div className="flex items-center gap-2 mb-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: COLORS.find(c => c === data.color) || '#666' }}
          />
          <p className="font-semibold text-foreground">{data.name}</p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Total Revenue</span>
            <span className="font-medium">{(data.totalRevenue / 1000000).toFixed(1)}M DZD</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Market Share</span>
            <span className="font-medium">{data.marketShare}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Companies</span>
            <span className="font-medium">{data.companyCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Transactions</span>
            <span className="font-medium">{data.transactionCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-6 items-center">
            <span className="text-muted-foreground">Growth Rate</span>
            <Badge variant={data.growthRate >= 0 ? 'default' : 'destructive'} className="gap-1">
              {data.growthRate >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : data.growthRate < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function SectorPerformanceChart({ 
  data, 
  height = 400,
  showDetails = true 
}: SectorPerformanceChartProps) {
  const [sortBy, setSortBy] = useState<'marketShare' | 'growthRate' | 'revenue'>('marketShare');
  
  // Prepare pie chart data
  const pieData = useMemo(() => {
    return data.map(sector => ({
      name: sector.name,
      value: sector.marketShare,
      ...sector
    }));
  }, [data]);
  
  // Prepare bar chart data sorted by selected metric
  const barData = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        switch (sortBy) {
          case 'marketShare': return b.marketShare - a.marketShare;
          case 'growthRate': return b.growthRate - a.growthRate;
          case 'revenue': return b.totalRevenue - a.totalRevenue;
          default: return 0;
        }
      })
      .map(sector => ({
        name: sector.name.length > 12 ? sector.name.substring(0, 12) + '...' : sector.name,
        fullName: sector.name,
        marketShare: sector.marketShare,
        growthRate: sector.growthRate,
        revenue: sector.totalRevenue / 1000000, // Convert to millions
        companies: sector.companyCount
      }));
  }, [data, sortBy]);
  
  // Prepare trend simulation data
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, idx) => {
      const entry: Record<string, string | number> = { month };
      
      // Take top 5 sectors and simulate monthly trends
      data.slice(0, 5).forEach(sector => {
        const baseValue = sector.totalRevenue / 12;
        const seasonalFactor = 1 + Math.sin((idx / 12) * Math.PI * 2) * 0.2;
        const randomFactor = 0.95 + Math.random() * 0.1;
        entry[sector.id] = Math.round(baseValue * seasonalFactor * randomFactor / 1000000 * 10) / 10;
      });
      
      return entry;
    });
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Industry Sector Performance
        </CardTitle>
        <CardDescription>Revenue breakdown by industry sector in Algeria</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pie" className="gap-1">
              <PieChartIcon className="w-4 h-4" />
              Market Share
            </TabsTrigger>
            <TabsTrigger value="bar" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="trend" className="gap-1">
              <Activity className="w-4 h-4" />
              Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pie" className="space-y-4">
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
              {data.slice(0, 10).map((sector, idx) => (
                <div key={sector.id} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[idx] }}
                  />
                  <span className="truncate">{sector.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="space-y-4">
            {/* Sort Controls */}
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'marketShare' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('marketShare')}
              >
                By Market Share
              </Button>
              <Button
                variant={sortBy === 'growthRate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('growthRate')}
              >
                By Growth
              </Button>
              <Button
                variant={sortBy === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('revenue')}
              >
                By Revenue
              </Button>
            </div>
            
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  fontSize={11}
                  interval={0}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#64748b' }}
                  label={{ value: sortBy === 'revenue' ? 'Revenue (M DZD)' : '%', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fill: '#64748b' }}
                  label={{ value: 'Growth %', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'growthRate') return [`${value.toFixed(1)}%`, 'Growth'];
                    if (name === 'revenue') return [`${value.toFixed(1)}M DZD`, 'Revenue'];
                    return [`${value}%`, 'Market Share'];
                  }}
                  labelFormatter={(label: string) => barData.find(d => d.name === label)?.fullName || label}
                />
                <Legend />
                <Bar yAxisId="left" dataKey={sortBy === 'revenue' ? 'revenue' : 'marketShare'} 
                     name={sortBy === 'revenue' ? 'Revenue (M DZD)' : 'Market Share (%)'}
                     fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="growthRate" name="Growth (%)" 
                     fill={sortBy === 'growthRate' ? '#22c55e' : '#94a3b8'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="trend" className="space-y-4">
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {data.slice(0, 5).map((sector, idx) => (
                    <linearGradient key={sector.id} id={`gradient-${sector.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[idx]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[idx]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} label={{ value: 'Revenue (M DZD)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {data.slice(0, 5).map((sector, idx) => (
                  <Area
                    key={sector.id}
                    type="monotone"
                    dataKey={sector.id}
                    name={sector.name}
                    stroke={COLORS[idx]}
                    fill={`url(#gradient-${sector.id})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SectorPerformanceChart;
