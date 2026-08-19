'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface WaterfallItem {
  name: string;
  value: number;
  previousValue?: number;
  isTotal?: boolean;
  isPositive?: boolean;
  color?: string;
}

interface RevenueWaterfallProps {
  data?: WaterfallItem[];
  title?: string;
  description?: string;
  height?: number;
  currency?: string;
}

// Default Algerian B2B market revenue waterfall data
const defaultData: WaterfallItem[] = [
  { name: 'Gross Revenue', value: 3152345678, isPositive: true },
  { name: 'Returns & Refunds', value: -156789123, isPositive: false },
  { name: 'Discounts', value: -89456789, isPositive: false },
  { name: 'Net Revenue', value: 2906099766, isTotal: true },
  { name: 'Platform Costs', value: -145304988, isPositive: false },
  { name: 'Operations', value: -98765432, isPositive: false },
  { name: 'Marketing', value: -54321098, isPositive: false },
  { name: 'Operating Profit', value: 2607691248, isTotal: true },
  { name: 'Taxes (19% IBR)', value: -495461337, isPositive: false },
  { name: 'Net Profit', value: 2112229911, isTotal: true }
];

const formatCurrency = (value: number, currency: string = 'DZD'): string => {
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B ${currency}`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M ${currency}`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(0)}K ${currency}`;
  }
  return `${value} ${currency}`;
};

const CustomTooltip = ({ active, payload, label, currency }: { 
  active?: boolean; 
  payload?: Array<{ value: number; payload: WaterfallItem }>; 
  label?: string | number;
  currency?: string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground mb-1">{data.name}</p>
        <p className={`text-lg font-bold ${data.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatCurrency(data.value, currency)}
        </p>
        {!data.isTotal && !data.isPositive && data.value < 0 && (
          <p className="text-xs text-muted-foreground mt-1">Deduction</p>
        )}
        {data.isTotal && (
          <Badge variant="outline" className="mt-1 text-xs">Subtotal</Badge>
        )}
      </div>
    );
  }
  return null;
};

export function RevenueWaterfall({ 
  data = defaultData, 
  title = 'Revenue Waterfall Analysis',
  description = 'Breakdown of revenue streams and deductions',
  height = 400,
  currency = 'DZD'
}: RevenueWaterfallProps) {
  // Process data for waterfall chart
  const chartData = useMemo(() => {
    let cumulative = 0;
    
    return data.map((item, index) => {
      let startValue = 0;
      let endValue = item.value;
      
      if (!item.isTotal) {
        if (item.value >= 0) {
          startValue = cumulative;
          endValue = cumulative + item.value;
          cumulative = endValue;
        } else {
          startValue = cumulative + item.value;
          endValue = cumulative;
          cumulative = endValue;
        }
      } else {
        // For totals, calculate from scratch or use the value directly
        if (index === 0 || data[index - 1]?.isTotal) {
          startValue = 0;
          endValue = item.value;
          cumulative = item.value;
        } else {
          startValue = 0;
          endValue = item.value;
          cumulative = item.value;
        }
      }
      
      return {
        ...item,
        start: 0,
        end: item.value,
        barHeight: Math.abs(item.value),
        displayValue: item.value
      };
    });
  }, [data]);

  // Summary statistics
  const summary = useMemo(() => {
    const grossRevenue = data.find(d => d.name === 'Gross Revenue')?.value || 0;
    const netProfit = data.find(d => d.name === 'Net Profit')?.value || 0;
    const profitMargin = grossRevenue !== 0 ? (netProfit / grossRevenue) * 100 : 0;
    const totalDeductions = data.filter(d => d.value < 0 && !d.isTotal).reduce((sum, d) => sum + d.value, 0);
    
    return { grossRevenue, netProfit, profitMargin, totalDeductions };
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Margin: {summary.profitMargin.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Gross Revenue</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(summary.grossRevenue, currency)}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Deductions</p>
            <p className="text-base font-bold text-red-700 dark:text-red-400">
              {formatCurrency(summary.totalDeductions, currency)}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <p className="text-base font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(summary.netProfit, currency)}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Profit Margin</p>
            <p className="text-base font-bold text-purple-700 dark:text-purple-400">
              {summary.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Waterfall Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              angle={-40} 
              textAnchor="end" 
              fontSize={11}
              interval={0}
              tick={{ fill: '#64748b' }}
              height={70}
            />
            <YAxis 
              tickFormatter={(v) => formatCurrency(v, currency)}
              tick={{ fill: '#64748b', fontSize: 10 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            
            {/* Zero reference line */}
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            
            <Bar dataKey="displayValue" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => {
                let fillColor = '#3b82f6'; // Default blue
                
                if (entry.isTotal) {
                  fillColor = '#8b5cf6'; // Purple for totals
                } else if (entry.value >= 0) {
                  fillColor = '#22c55e'; // Green for positive
                } else {
                  fillColor = '#ef4444'; // Red for negative/deductions
                }
                
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Deductions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-violet-500" />
            <span className="text-muted-foreground">Totals</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Detailed Breakdown</h4>
          <div className="grid gap-1">
            {data.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {item.value > 0 && !item.isTotal ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  ) : item.value < 0 && !item.isTotal ? (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-violet-500" />
                  )}
                  <span className="text-sm">{item.name}</span>
                  {item.isTotal && (
                    <Badge variant="secondary" className="text-xs ml-1">Total</Badge>
                  )}
                </div>
                <span className={`text-sm font-mono font-medium ${
                  item.value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  {item.value >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.value), currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueWaterfall;
