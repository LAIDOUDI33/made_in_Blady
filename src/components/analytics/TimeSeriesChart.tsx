'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, 
  Download, 
  Maximize2,
  LineChart as LineIcon,
  BarChart3,
  AreaChart as AreaIcon
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'area' | 'bar';
}

interface TimeSeriesChartProps {
  title: string;
  data: DataPoint[];
  series: SeriesConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisFormat?: (value: string) => string;
  yAxisFormat?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  className?: string;
  defaultRange?: '7d' | '30d' | '90d' | '1y';
  onRangeChange?: (range: string) => void;
  allowExport?: boolean;
  chartType?: 'line' | 'area' | 'bar';
  stacked?: boolean;
}

// ============================================
// Custom Tooltip
// ============================================

function CustomTooltip({
  active,
  payload,
  label,
  series,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  series: SeriesConfig[];
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold">
              {formatter ? formatter(entry.value) : entry.value.toLocaleString('fr-DZ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main TimeSeriesChart Component
// ============================================

export function TimeSeriesChart({
  title,
  data,
  series,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  xAxisFormat,
  yAxisFormat,
  valueFormatter,
  className,
  defaultRange = '30d',
  onRangeChange,
  allowExport = false,
  chartType = 'line',
  stacked = false,
}: TimeSeriesChartProps) {
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [currentChartType, setCurrentChartType] = useState(chartType);

  // Filter data based on range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const rangeMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const daysToShow = rangeMap[selectedRange] || 30;
    return data.slice(-daysToShow);
  }, [data, selectedRange]);

  // Handle range change
  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onRangeChange?.(range);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    
    const headers = ['Date', ...series.map(s => s.name)];
    const rows = filteredData.map(d => [
      d.date,
      ...series.map(s => d[s.key] ?? ''),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_${selectedRange}.csv`;
    link.click();
  };

  // Format X axis labels
  const formatXAxis = (tickItem: string): string => {
    if (xAxisFormat) return xAxisFormat(tickItem);
    
    try {
      const date = new Date(tickItem);
      if (selectedRange === '7d') {
        return date.toLocaleDateString('fr-DZ', { weekday: 'short', day: 'numeric' });
      } else if (selectedRange === '30d') {
        return date.toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' });
      } else {
        return date.toLocaleDateString('fr-DZ', { month: 'short', year: '2-digit' });
      }
    } catch {
      return tickItem;
    }
  };

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 10, left: 10, bottom: 5 },
    };

    switch (currentChartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tickFormatter={yAxisFormat}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {showTooltip && (
              <Tooltip content={<CustomTooltip series={series} formatter={valueFormatter} />} />
            )}
            {showLegend && <Legend />}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.15}
                strokeWidth={2}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tickFormatter={yAxisFormat}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {showTooltip && (
              <Tooltip content={<CustomTooltip series={series} formatter={valueFormatter} />} />
            )}
            {showLegend && <Legend />}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        );
      
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tickFormatter={yAxisFormat}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {showTooltip && (
              <Tooltip content={<CustomTooltip series={series} formatter={valueFormatter} />} />
            )}
            {showLegend && <Legend />}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart Type Toggle */}
            <div className="flex items-center border rounded-md p-0.5">
              <Button
                variant={currentChartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentChartType('line')}
                className="h-8 px-2"
              >
                <LineIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={currentChartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentChartType('area')}
                className="h-8 px-2"
              >
                <AreaIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={currentChartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentChartType('bar')}
                className="h-8 px-2"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Range Selector */}
            <Select value={selectedRange} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-[80px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7j</SelectItem>
                <SelectItem value="30d">30j</SelectItem>
                <SelectItem value="90d">90j</SelectItem>
                <SelectItem value="1y">1an</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            {allowExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 px-2"
                aria-label="Exporter en CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default TimeSeriesChart;
