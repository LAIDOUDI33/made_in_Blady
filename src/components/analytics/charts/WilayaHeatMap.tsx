'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WilayaAnalytics } from '@/lib/analytics/engine';

interface WilayaHeatMapProps {
  data: WilayaAnalytics[];
  onWilayaClick?: (wilayaCode: number) => void;
  height?: number;
  showLegend?: boolean;
}

// Color scale for transaction density (light to dark)
const getDensityColor = (value: number, min: number, max: number): string => {
  if (max === min) return '#e0f2fe'; // Light blue for equal values
  
  const normalized = (value - min) / (max - min);
  
  // Color gradient from light blue to deep emerald
  if (normalized < 0.2) return '#e0f2fe'; // Very light blue
  if (normalized < 0.4) return '#7dd3fc'; // Light blue
  if (normalized < 0.6) return '#38bdf8'; // Medium blue
  if (normalized < 0.8) return '#0ea5e9'; // Dark blue
  return '#0369a1'; // Very dark blue
};

interface TreemapNode {
  name: string;
  size: number;
  code: number;
  revenue: number;
  transactions: number;
  companies: number;
  growthRate: number;
  color: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TreemapNode }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
        <p className="font-semibold text-foreground">{data.name} ({data.code})</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Revenue:</span>
            <span className="font-medium">{data.revenue.toLocaleString('fr-DZ')} DZD</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transactions:</span>
            <span className="font-medium">{data.transactions.toLocaleString()}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Companies:</span>
            <span className="font-medium">{data.companies}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Growth:</span>
            <Badge variant={data.growthRate >= 0 ? 'default' : 'destructive'} className="text-xs">
              {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
            </Badge>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function WilayaHeatMap({ 
  data, 
  onWilayaClick, 
  height = 500,
  showLegend = true 
}: WilayaHeatMapProps) {
  const treemapData = useMemo(() => {
    const revenues = data.map(d => d.totalRevenue);
    const min = Math.min(...revenues);
    const max = Math.max(...revenues);
    
    return data.map(wilaya => ({
      name: wilaya.name,
      size: wilaya.totalRevenue,
      code: wilaya.code,
      revenue: wilaya.totalRevenue,
      transactions: wilaya.totalTransactions,
      companies: wilaya.activeCompanies,
      growthRate: wilaya.growthRate,
      color: getDensityColor(wilaya.totalRevenue, min, max)
    })).sort((a, b) => b.size - a.size) as TreemapNode[];
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, w) => sum + w.totalRevenue, 0);
    const topWilaya = data.reduce((max, w) => w.totalRevenue > max.totalRevenue ? w : max, data[0]);
    const avgGrowth = data.reduce((sum, w) => sum + w.growthRate, 0) / data.length;
    
    return { totalRevenue, topWilaya, avgGrowth };
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Algeria Transaction Heatmap</CardTitle>
            <CardDescription>Revenue distribution across 58 wilayas</CardDescription>
          </div>
          {showLegend && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 rounded-sm bg-[#e0f2fe]" />
                <div className="w-4 h-4 rounded-sm bg-[#7dd3fc]" />
                <div className="w-4 h-4 rounded-sm bg-[#38bdf8]" />
                <div className="w-4 h-4 rounded-sm bg-[#0ea5e9]" />
                <div className="w-4 h-4 rounded-sm bg-[#0369a1]" />
              </div>
              <span>High</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-sm font-semibold truncate">
              {(stats.totalRevenue / 1000000000).toFixed(2)}B DZD
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Top Wilaya</p>
            <p className="text-sm font-semibold truncate">{stats.topWilaya?.name}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg Growth</p>
            <p className={`text-sm font-semibold ${stats.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.avgGrowth >= 0 ? '+' : ''}{stats.avgGrowth.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Treemap Visualization */}
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            data={ treemapData }
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            strokeWidth={2}
            content={({ x, y, width, height, name, code, ...rest }: Record<string, unknown>) => {
              const node = rest as unknown as Omit<TreemapNode, 'name'> & { name: string };
              if ((width as number) < 20 || (height as number) < 15) return null;
              
              return (
                <g onClick={() => onWilayaClick?.(node.code)}
                    style={{ cursor: 'pointer' }}>
                  <rect
                    x={x as number}
                    y={y as number}
                    width={width as number}
                    height={height as number}
                    fill={node.color || '#e0f2fe'}
                    stroke="#fff"
                    strokeWidth={1}
                    rx={Math.min((width as number), (height as number)) * 0.05}
                    className="hover:opacity-80 transition-opacity"
                  />
                  {(width as number) > 50 && (height as number) > 25 && (
                    <>
                      <text
                        x={(x as number) + (width as number) / 2}
                        y={(y as number) + (height as number) / 2 - 6}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={Math.min(12, (width as number) / 8)}
                        fontWeight={600}
                      >
                        {name}
                      </text>
                      <text
                        x={(x as number) + (width as number) / 2}
                        y={(y as number) + (height as number) / 2 + 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={Math.min(10, (width as number) / 10)}
                        opacity={0.9}
                      >
                        {code}
                      </text>
                    </>
                  )}
                </g>
              );
            }}
          />
        </ResponsiveContainer>
        
        <Tooltip content={<CustomTooltip />} />
        
        {/* Interactive hint */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Click on any wilaya to view detailed analytics
        </p>
      </CardContent>
    </Card>
  );
}

export default WilayaHeatMap;
