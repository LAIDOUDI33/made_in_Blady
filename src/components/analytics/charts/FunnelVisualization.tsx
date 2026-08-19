'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Funnel, ArrowDown, TrendingDown, Users, MousePointerClick, ShoppingCart, CheckCircle } from 'lucide-react';
import { FunnelStage } from '@/lib/analytics/engine';

interface FunnelVisualizationProps {
  data: FunnelStage[];
  title?: string;
  description?: string;
  height?: number;
  showProgressBars?: boolean;
}

// Default B2B conversion funnel for AlgeriaTrade
const defaultFunnelData: FunnelStage[] = [
  { stage: 'visitors', label: 'Website Visitors', count: 1256789, percentage: 100 },
  { stage: 'registered', label: 'Registered Users', count: 187456, percentage: 14.91, dropoff: 85.09 },
  { stage: 'active', label: 'Active Users', count: 128456, percentage: 10.22, dropoff: 31.47 },
  { stage: 'inquiry', label: 'Product Inquiries', count: 45234, percentage: 3.6, dropoff: 64.79 },
  { stage: 'rfq', label: 'RFQ Submitted', count: 12847, percentage: 1.02, dropoff: 71.61 },
  { stage: 'negotiation', label: 'In Negotiation', count: 5632, percentage: 0.45, dropoff: 56.16 },
  { stage: 'order', label: 'Orders Placed', count: 3245, percentage: 0.26, dropoff: 42.39 },
  { stage: 'completed', label: 'Completed Orders', count: 2891, percentage: 0.23, dropoff: 10.94 }
];

const stageIcons: Record<string, React.ReactNode> = {
  visitors: <MousePointerClick className="w-4 h-4" />,
  registered: <Users className="w-4 h-4" />,
  active: <TrendingDown className="w-4 h-4" />,
  inquiry: <MousePointerClick className="w-4 h-4" />,
  rfq: <ShoppingCart className="w-4 h-4" />,
  negotiation: <Funnel className="w-4 h-4" />,
  order: <ShoppingCart className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />
};

const stageColors = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6'  // Purple
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: FunnelStage }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[220px]">
        <div className="flex items-center gap-2 mb-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: stageColors[data.stage === 'completed' ? 7 : data.stage === 'order' ? 6 : data.stage === 'negotiation' ? 5 : data.stage === 'rfq' ? 4 : data.stage === 'inquiry' ? 3 : data.stage === 'active' ? 2 : data.stage === 'registered' ? 1 : 0] }}
          />
          <p className="font-semibold text-foreground">{data.label}</p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Count:</span>
            <span className="font-medium">{data.count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conversion:</span>
            <span className="font-medium">{data.percentage}%</span>
          </div>
          {data.dropoff !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drop-off:</span>
              <Badge variant="destructive" className="text-xs">
                -{data.dropoff}%
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function FunnelVisualization({ 
  data = defaultFunnelData, 
  title = 'Conversion Funnel Analysis',
  description = 'User journey from visitor to completed order',
  height = 350,
  showProgressBars = true 
}: FunnelVisualizationProps) {
  // Calculate conversion metrics
  const metrics = useMemo(() => {
    const visitors = data[0]?.count || 1;
    const completed = data[data.length - 1]?.count || 0;
    const overallConversion = (completed / visitors) * 100;
    
    // Find biggest drop-off
    let biggestDropoff = { stage: '', rate: 0 };
    data.forEach(stage => {
      if (stage.dropoff && stage.dropoff > biggestDropoff.rate) {
        biggestDropoff = { stage: stage.label, rate: stage.dropoff };
      }
    });

    // Average drop-off rate
    const avgDropoff = data
      .filter(s => s.dropoff)
      .reduce((sum, s) => sum + (s.dropoff || 0), 0) / (data.length - 1);

    return { overallConversion, biggestDropoff, avgDropoff };
  }, [data]);

  // Prepare horizontal bar chart data (reversed for funnel effect)
  const chartData = useMemo(() => {
    return [...data].reverse().map((stage, idx) => ({
      ...stage,
      width: stage.percentage,
      color: stageColors[data.length - 1 - idx]
    }));
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Funnel className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Overall: {metrics.overallConversion.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Visitors</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {formatNumber(data[0]?.count || 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Conversions</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">
              {formatNumber(data[data.length - 1]?.count || 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Biggest Drop-off</p>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 truncate px-1">
              {metrics.biggestDropoff.stage} (-{metrics.biggestDropoff.rate}%)
            </p>
          </div>
        </div>

        {/* Horizontal Funnel Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="opacity-20" />
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis 
              type="category" 
              dataKey="label" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              width={115}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar 
              dataKey="percentage" 
              radius={[0, 4, 4, 0]}
              barSize={28}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Progress Bars View */}
        {showProgressBars && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-muted-foreground" />
              Stage-by-Stage Breakdown
            </h4>
            {data.map((stage, idx) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: stageColors[idx] }}
                    />
                    <span className="font-medium text-foreground">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono">
                      {stage.count.toLocaleString()}
                    </span>
                    <span className="font-semibold text-foreground w-14 text-right">
                      {stage.percentage}%
                    </span>
                    {stage.dropoff !== undefined && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        -{stage.dropoff}%
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress 
                  value={stage.percentage} 
                  className="h-2"
                  // @ts-expect-error - custom style prop
                  style={{
                    '--progress-background': stageColors[idx]
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        )}

        {/* Conversion Insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-2">💡 Conversion Insights</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Only <strong className="text-foreground">{metrics.overallConversion.toFixed(2)}%</strong> of visitors complete a purchase</li>
            <li>• Biggest drop-off occurs at <strong className="text-foreground">{metrics.biggestDropoff.stage}</strong> stage ({metrics.biggestDropoff.rate}%)</li>
            <li>• Average stage-to-stage drop-off: <strong className="text-foreground">{metrics.avgDropoff.toFixed(1)}%</strong></li>
            <li>• Focus optimization efforts on early funnel stages for maximum impact</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default FunnelVisualization;
