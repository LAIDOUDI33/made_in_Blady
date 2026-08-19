'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CohortData } from '@/lib/analytics/engine';
import { Users, TrendingUp, Calendar } from 'lucide-react';

interface CohortAnalysisChartProps {
  data: CohortData[];
  height?: number;
  showTable?: boolean;
}

// Generate realistic cohort colors
const getCohortColor = (index: number): string => {
  const colors = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
    '#6366f1', '#a855f7'
  ];
  return colors[index % colors.length];
};

const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ value: number; color: string; dataKey: string }>; 
  label?: string | number 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
        <p className="font-semibold text-foreground mb-2">Month {label}</p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.dataKey}</span>
              </div>
              <span className="font-medium">{entry.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function CohortAnalysisChart({ 
  data, 
  height = 400,
  showTable = true 
}: CohortAnalysisChartProps) {
  // Transform cohort data into retention matrix format for line chart
  const lineChartData = useMemo(() => {
    const months: Array<{ month: number; [key: string]: number | string }> = [];
    
    // Find the maximum month across all cohorts
    const maxMonth = Math.max(...data.flatMap(c => c.retentionRates.map(r => r.month)));
    
    for (let m = 0; m <= maxMonth; m++) {
      const point: { month: number; [key: string]: number | string } = { month: m };
      
      data.forEach(cohort => {
        const rate = cohort.retentionRates.find(r => r.month === m);
        point[cohort.cohort] = rate?.rate ?? null;
      });
      
      months.push(point);
    }
    
    return months;
  }, [data]);

  // Transform data for heatmap/table view
  const tableData = useMemo(() => {
    return data.map(cohort => {
      const row: Record<string, string | number> = { cohort: cohort.cohort, size: cohort.cohortSize };
      
      cohort.retentionRates.forEach(rate => {
        row[`m${rate.month}`] = rate.rate;
      });
      
      return row;
    });
  }, [data]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const avgRetentionByMonth: Record<number, number> = {};
    
    data.forEach(cohort => {
      cohort.retentionRates.forEach(({ month, rate }) => {
        if (!avgRetentionByMonth[month]) {
          avgRetentionByMonth[month] = 0;
        }
        avgRetentionByMonth[month] += rate;
      });
    });

    Object.keys(avgRetentionByMonth).forEach(month => {
      const m = parseInt(month);
      avgRetentionByMonth[m] /= data.filter(c => c.retentionRates.some(r => r.month === m)).length;
    });

    // Average 30-day, 60-day, 90-day retention
    const day30 = avgRetentionByMonth[1] || 0;
    const day60 = avgRetentionByMonth[2] || 0;
    const day90 = avgRetentionByMonth[3] || 0;

    // Best performing cohort
    const bestCohort = data.reduce((best, current) => {
      const bestAvg = best.retentionRates.length > 0 
        ? best.retentionRates.reduce((sum, r) => sum + r.rate, 0) / best.retentionRates.length 
        : 0;
      const currAvg = current.retentionRates.length > 0 
        ? current.retentionRates.reduce((sum, r) => sum + r.rate, 0) / current.retentionRates.length 
        : 0;
      return currAvg > bestAvg ? current : best;
    }, data[0]);

    return { avgRetentionByMonth, day30, day60, day90, bestCohort };
  }, [data]);

  // Get unique months for table headers
  const months = useMemo(() => {
    const monthSet = new Set<number>();
    data.forEach(cohort => {
      cohort.retentionRates.forEach(rate => monthSet.add(rate.month));
    });
    return Array.from(monthSet).sort((a, b) => a - b);
  }, [data]);

  const getRetentionColor = (rate: number): string => {
    if (rate >= 70) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (rate >= 50) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (rate >= 30) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Customer Retention Analysis
            </CardTitle>
            <CardDescription>Cohort-based user retention over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" /> 30-Day Retention
            </p>
            <p className="text-xl font-bold text-foreground">{summary.day30.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" /> 60-Day Retention
            </p>
            <p className="text-xl font-bold text-foreground">{summary.day60.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" /> 90-Day Retention
            </p>
            <p className="text-xl font-bold text-foreground">{summary.day90.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> Best Cohort
            </p>
            <p className="text-sm font-semibold text-foreground truncate px-1">
              {summary.bestCohort?.cohort}
            </p>
          </div>
        </div>

        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Retention Curves</TabsTrigger>
            <TabsTrigger value="table">Cohort Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#64748b' }}
                  label={{ value: 'Months Since Signup', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#64748b' }}
                  label={{ value: 'Retention Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Reference lines at key thresholds */}
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label="" />
                <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" label="" />
                
                {data.slice(0, 8).map((cohort, idx) => (
                  <Line
                    key={cohort.cohort}
                    type="monotone"
                    dataKey={cohort.cohort}
                    name={cohort.cohort}
                    stroke={getCohortColor(idx)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-yellow-500" style={{ borderTop: '2px dashed #f59e0b' }} />
                <span>50% threshold</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }} />
                <span>25% threshold</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-foreground">Cohort</th>
                    <th className="text-center py-2 px-3 font-semibold text-foreground">Size</th>
                    {months.slice(0, 12).map(m => (
                      <th key={m} className="text-center py-2 px-2 font-semibold text-foreground">
                        M{m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={row.cohort as string} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: getCohortColor(idx) }}
                          />
                          {row.cohort as string}
                        </div>
                      </td>
                      <td className="text-center py-2 px-3 text-muted-foreground">
                        {row.size as number}
                      </td>
                      {months.slice(0, 12).map(m => {
                        const value = row[`m${m}`] as number | undefined;
                        return (
                          <td key={m} className="text-center py-1 px-2">
                            {value !== undefined ? (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono ${getRetentionColor(value)}`}>
                                {value.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CohortAnalysisChart;
