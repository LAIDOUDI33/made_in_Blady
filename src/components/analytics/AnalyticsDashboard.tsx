'use client';

/**
 * Analytics Dashboard Component
 * Composant Tableau de bord analytique pour AlgeriaTrade
 * 
 * @module components/analytics/AnalyticsDashboard
 * @description A comprehensive analytics dashboard with reusable widgets,
 * KPI cards, charts, data tables, and export functionality.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Calendar,
  Settings,
  Maximize2,
  MoreHorizontal,
  Package,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  analyticsManager,
  WidgetConfig,
  KPICardData,
  DateRange,
  PresetDateRange,
  ExportFormat,
  formatCurrencyDZD,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  getTrendIndicator,
  getPresetDateRanges,
  getDateRangeForPreset,
  COLOR_PALETTES,
  generateColors,
  generateBackgroundColors,
} from '@/lib/analytics/widgets';
import { useTranslation } from '@/lib/i18n';

// ============================================
// Types
// ============================================

interface AnalyticsDashboardProps {
  /** Dashboard title */
  title?: string;
  /** Custom widget IDs to display (empty = all default) */
  widgetIds?: string[];
  /** Show date range selector */
  showDateRange?: boolean;
  /** Show export button */
  showExport?: boolean;
  /** Auto-refresh interval in seconds (0 = disabled) */
  autoRefreshInterval?: number;
  /** Additional CSS class name */
  className?: string;
}

interface KPICardProps {
  config: WidgetConfig;
  data: KPICardData;
  language: 'fr' | 'ar';
  isArabic: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// ============================================
// Sub-Components
// ============================================

/**
 * KPI Card Component
 */
function KPICard({ config, data, language, isArabic, onRefresh, isLoading }: KPICardProps) {
  const trend = useMemo(() => {
    if (data.previousValue !== undefined && typeof data.value === 'number') {
      return getTrendIndicator(data.value, Number(data.previousValue), language);
    }
    return null;
  }, [data, language]);

  const formattedValue = useMemo(() => {
    const value = typeof data.value === 'number' ? data.value : 0;
    
    switch (data.format) {
      case 'currency':
        return formatCurrencyDZD(value, language);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return formatCompactNumber(value, language);
      default:
        return formatNumber(value, language);
    }
  }, [data, language]);

  const title = isArabic ? (config.titleAr || config.titleFr) : config.titleFr;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Maximize2 className="h-4 w-4 mr-2" />
                {isArabic ? 'تكبير' : 'Agrandir'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                {isArabic ? 'تصدير' : 'Exporter'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex items-baseline justify-between">
          <div className={`text-2xl font-bold ${trend?.direction === 'up' ? 'text-green-600' : trend?.direction === 'down' ? 'text-red-600' : ''}`}>
            {formattedValue}
          </div>
          
          {trend && (
            <Badge
              variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
              className="gap-1 text-xs"
            >
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
              {trend.label}
            </Badge>
          )}
        </div>

        {/* Mini sparkline would go here in production */}
        {data.target !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{data.targetLabel || (isArabic ? 'الهدف' : 'Objectif')}</span>
              <span>{formatPercentage((data.value as number) / data.target * 100)}</span>
            </div>
            <Progress value={Math.min(100, (data.value as number) / data.target * 100)} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple Chart Placeholder (would use recharts/chart.js in production)
 */
function ChartWidget({
  config,
  data,
  language,
  isArabic,
  onExport,
}: {
  config: WidgetConfig;
  data: any;
  language: 'fr' | 'ar';
  isArabic: boolean;
  onExport: (format: ExportFormat) => void;
}) {
  const title = isArabic ? (config.titleAr || config.titleFr) : config.titleFr;

  // This is a simplified chart representation
  // In production, integrate with recharts or chart.js
  
  const maxValue = Math.max(...(data.datasets?.[0]?.data || [0]));
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {config.description && (
            <CardDescription>
              {isArabic ? (config.descriptionAr || config.descriptionFr) : config.descriptionFr}
            </CardDescription>
          )}
        </div>
        
        {config.allowExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                {isArabic ? 'تصدير' : 'Exporter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(config.exportFormats || ['csv', 'json', 'png']).map(format => (
                <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                  {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Simplified bar/line chart visualization */}
        <div className="space-y-2">
          {data.labels?.map((label: string, index: number) => {
            const value = data.datasets?.[0]?.data[index] || 0;
            const percentage = (value / maxValue) * 100;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 truncate" dir={isArabic ? 'rtl' : 'ltr'}>
                  {label}
                </span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 15 && (
                      <span className="text-xs text-primary-foreground font-medium">
                        {formatNumber(value, language)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {data.datasets && data.datasets.length > 1 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            {data.datasets.map((dataset: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: dataset.borderColor || COLOR_PALETTES.default[index] }}
                />
                <span className="text-xs text-muted-foreground">{dataset.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Data Table Widget
 */
function TableWidget({
  config,
  data,
  language,
  isArabic,
  onExport,
}: {
  config: WidgetConfig;
  data: any;
  language: 'fr' | 'ar';
  isArabic: boolean;
  onExport: (format: ExportFormat) => void;
}) {
  const title = isArabic ? (config.titleAr || config.titleFr) : config.titleFr;

  const statusColors: Record<string, string> = {
    confirmée: 'bg-green-100 text-green-800',
    'en cours': 'bg-blue-100 text-blue-800',
    expédiée: 'bg-orange-100 text-orange-800',
    livrée: 'bg-green-100 text-green-900',
    annulée: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {config.description && (
            <CardDescription>
              {isArabic ? (config.descriptionAr || config.descriptionFr) : config.descriptionFr}
            </CardDescription>
          )}
        </div>
        
        {config.allowExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                {isArabic ? 'تصدير' : 'Exporter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(config.exportFormats || ['csv', 'xlsx', 'pdf']).map(format => (
                <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                  {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir={isArabic ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b">
                {data.headers?.map((header: any, index: number) => (
                  <th
                    key={index}
                    className={`text-left p-3 font-medium text-muted-foreground ${
                      header.align === 'center' ? 'text-center' : header.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {isArabic ? (header.labelAr || header.labelFr) : header.labelFr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows?.map((row: any, rowIndex: number) => (
                <tr key={row.id || rowIndex} className="border-b hover:bg-muted/50 transition-colors">
                  {data.headers?.map((header: any, colIndex: number) => {
                    const value = row[header.key];
                    
                    if (header.type === 'currency') {
                      return (
                        <td key={colIndex} className="p-3">
                          {formatCurrencyDZD(value, language)}
                        </td>
                      );
                    }
                    
                    if (header.type === 'badge') {
                      return (
                        <td key={colIndex} className="p-3">
                          <Badge variant="secondary" className={statusColors[value] || ''}>
                            {value}
                          </Badge>
                        </td>
                      );
                    }
                    
                    if (header.type === 'date') {
                      return (
                        <td key={colIndex} className="p-3 text-muted-foreground">
                          {new Date(value).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </td>
                      );
                    }
                    
                    return (
                      <td key={colIndex} className="p-3">{value}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {isArabic 
                ? `عرض ${(data.pagination.page - 1) * data.pagination.pageSize + 1}-${Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} من ${data.pagination.total}`
                : `Affichage de ${(data.pagination.page - 1) * data.pagination.pageSize + 1}-${Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} sur ${data.pagination.total}`
              }
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={data.pagination.page <= 1}>
                {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <span className="text-sm">
                {isArabic ? `صفحة ${data.pagination.page}` : `Page ${data.pagination.page}`}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={data.pagination.page * data.pagination.pageSize >= data.pagination.total}>
                {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function AnalyticsDashboard({
  title,
  widgetIds = [],
  showDateRange = true,
  showExport = true,
  autoRefreshInterval = 0,
  className = '',
}: AnalyticsDashboardProps) {
  const { t, language } = useTranslation();
  const isArabic = language === 'ar';

  // State
  const [datePreset, setDatePreset] = useState<PresetDateRange>('last_30_days');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: undefined,
    end: undefined,
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Get widgets to display
  const widgets = useMemo(() => {
    const allWidgets = analyticsManager.getWidgets();
    if (widgetIds.length > 0) {
      return allWidgets.filter(w => widgetIds.includes(w.id));
    }
    return allWidgets;
  }, [widgetIds]);

  // Current date range
  const dateRange = useMemo(() => {
    return getDateRangeForPreset(datePreset, customDateRange.start, customDateRange.end);
  }, [datePreset, customDateRange]);

  // Load widget data
  const loadWidgetData = useCallback(async (widgetId: string) => {
    setIsLoading(prev => ({ ...prev, [widgetId]: true }));
    
    try {
      const data = await analyticsManager.fetchWidgetData(widgetId, dateRange);
      setWidgetData(prev => ({ ...prev, [widgetId]: data }));
    } catch (error) {
      console.error(`Failed to load data for widget ${widgetId}:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [widgetId]: false }));
      setLastUpdated(new Date());
    }
  }, [dateRange]);

  // Load all widget data when date range changes
  useEffect(() => {
    widgets.forEach(widget => {
      loadWidgetData(widget.id);
    });
  }, [widgets, loadWidgetData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      widgets.forEach(widget => {
        loadWidgetData(widget.id);
      });
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, widgets, loadWidgetData]);

  // Handle export
  const handleExport = async (widgetId: string, format: ExportFormat) => {
    await analyticsManager.exportWidgetData(widgetId, format, dateRange);
  };

  // Get preset options
  const presetOptions = getPresetDateRanges();

  // Group widgets by type for layout
  const kpiWidgets = widgets.filter(w => w.type === 'kpi_card');
  const chartWidgets = widgets.filter(w => ['line_chart', 'bar_chart', 'pie_chart', 'doughnut_chart', 'area_chart'].includes(w.type));
  const tableWidgets = widgets.filter(w => w.type === 'table');

  return (
    <div className={`space-y-6 ${className}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {title || (isArabic ? 'لوحة التحليلات' : 'Tableau de bord analytique')}
          </h2>
          <p className="text-muted-foreground">
            {isArabic 
              ? `آخر تحديث: ${lastUpdated.toLocaleTimeString('ar-DZ')}`
              : `Dernière mise à jour : ${lastUpdated.toLocaleTimeString('fr-FR')}`
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          {showDateRange && (
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {presetOptions.find(p => p.value === datePreset)?.[isArabic ? 'labelAr' : 'label'] || datePreset}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    {presetOptions.map(option => (
                      <button
                        key={option.value}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted ${
                          datePreset === option.value ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                        }`}
                        onClick={() => {
                          setDatePreset(option.value);
                          if (option.value !== 'custom') {
                            setShowCalendar(false);
                          }
                        }}
                      >
                        {isArabic ? option.labelAr : option.label}
                      </button>
                    ))}
                  </div>
                  
                  {datePreset === 'custom' && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {isArabic ? 'اختر نطاق التاريخ' : 'Sélectionnez une période'}
                        </p>
                        <CalendarComponent
                          mode="range"
                          selected={{
                            from: customDateRange.start,
                            to: customDateRange.end,
                          }}
                          onSelect={(range) => {
                            setCustomDateRange({
                              start: range?.from,
                              end: range?.to,
                            });
                            if (range?.from && range?.to) {
                              setShowCalendar(false);
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => widgets.forEach(w => loadWidgetData(w.id))}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {kpiWidgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiWidgets.map(widget => (
            <KPICard
              key={widget.id}
              config={widget}
              data={widgetData[widget.id] || { value: 0, format: 'number' }}
              language={language}
              isArabic={isArabic}
              isLoading={isLoading[widget.id]}
              onRefresh={() => loadWidgetData(widget.id)}
            />
          ))}
        </div>
      )}

      {/* Charts Grid */}
      {chartWidgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartWidgets.map(widget => (
            <ChartWidget
              key={widget.id}
              config={widget}
              data={widgetData[widget.id]}
              language={language}
              isArabic={isArabic}
              onExport={(format) => handleExport(widget.id, format)}
            />
          ))}
        </div>
      )}

      {/* Tables */}
      {tableWidgets.length > 0 && (
        <div className="space-y-6">
          {tableWidgets.map(widget => (
            <TableWidget
              key={widget.id}
              config={widget}
              data={widgetData[widget.id]}
              language={language}
              isArabic={isArabic}
              onExport={(format) => handleExport(widget.id, format)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Export sub-components for reuse
export { KPICard, ChartWidget, TableWidget };

export default AnalyticsDashboard;
