'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronUp,
  Info,
  TrendingDown
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface FunnelStage {
  name: string;
  nameFr?: string; // French label
  value: number;
  percentage: number; // Percentage of original (first stage)
  conversionRate?: number; // Conversion from previous stage
  dropOffRate?: number; // Drop off from previous stage
}

interface FunnelChartProps {
  title: string;
  stages: FunnelStage[];
  height?: number;
  showPercentages?: boolean;
  showConversionRates?: boolean;
  color?: string;
  onStageClick?: (stage: FunnelStage, index: number) => void;
  className?: string;
  animate?: boolean;
}

// ============================================
// Single Funnel Stage Component
// ============================================

function FunnelBar({
  stage,
  index,
  maxValue,
  color,
  showPercentage,
  showConversion,
  isExpanded,
  onToggle,
  onClick,
}: {
  stage: FunnelStage;
  index: number;
  maxValue: number;
  color: string;
  showPercentage: boolean;
  showConversion: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
  const isFirst = index === 0;

  return (
    <div 
      className="group cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${stage.nameFr || stage.name}: ${stage.value} utilisateurs (${stage.percentage.toFixed(1)}%)`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-center gap-3 mb-1">
        {/* Stage number */}
        <span className="text-xs font-medium text-muted-foreground w-6 text-center">
          {index + 1}
        </span>
        
        {/* Stage name */}
        <span className="text-sm font-medium flex-1 truncate">
          {stage.nameFr || stage.name}
        </span>
        
        {/* Value */}
        <span className="text-sm font-bold tabular-nums">
          {stage.value.toLocaleString('fr-DZ')}
        </span>
        
        {/* Percentage */}
        {showPercentage && (
          <span className={cn(
            'text-xs font-medium w-14 text-right',
            stage.percentage >= 50 ? 'text-green-600 dark:text-green-400' :
            stage.percentage >= 20 ? 'text-orange-500' :
            'text-red-500'
          )}>
            {stage.percentage.toFixed(1)}%
          </span>
        )}
        
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={isExpanded ? "Réduire" : "Détails"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Bar */}
      <div className="relative h-10 bg-muted rounded-md overflow-hidden ml-9 mr-20">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-3',
            animate && 'animate-in slide-in-from-left'
          )}
          style={{ 
            width: `${Math.max(width, isFirst ? 100 : 5)}%`,
            backgroundColor: color,
          }}
        >
          {!isFirst && (
            <span className="text-xs font-semibold text-white drop-shadow-sm">
              {width.toFixed(0)}%
            </span>
          )}
        </div>
        
        {/* Drop-off indicator for non-first stages */}
        {!isFirst && showConversion && stage.dropOffRate !== undefined && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <div className="flex items-center gap-1 bg-background/90 dark:bg-gray-900/90 px-2 py-0.5 rounded-full">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                -{stage.dropOffRate.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="ml-9 mt-2 p-3 bg-muted/50 rounded-md space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Utilisateurs</p>
              <p className="font-semibold">{stage.value.toLocaleString('fr-DZ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Taux de conversion</p>
              <p className="font-semibold">
                {stage.conversionRate !== undefined ? `${stage.conversionRate.toFixed(1)}%` : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Abandon</p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                {stage.dropOffRate !== undefined ? `-${stage.dropOffRate.toFixed(1)}%` : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Par rapport au départ</p>
              <p className="font-semibold">{stage.percentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Funnel Chart Component
// ============================================

export function FunnelChart({
  title,
  stages,
  height = 350,
  showPercentages = true,
  showConversionRates = true,
  color = '#006233', // Algeria green by default
  onStageClick,
  className,
  animate = true,
}: FunnelChartProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  // Calculate max value for bar widths
  const maxValue = useMemo(() => {
    return Math.max(...stages.map(s => s.value), 1);
  }, [stages]);

  // Handle stage click
  const handleStageClick = (stage: FunnelStage, index: number) => {
    onStageClick?.(stage, index);
  };

  // Toggle expanded state
  const handleToggle = (index: number) => {
    setExpandedStage(prev => prev === index ? null : index);
  };

  // Calculate overall conversion rate
  const overallConversion = stages.length > 1 
    ? ((stages[stages.length - 1].value / stages[0].value) * 100)
    : 100;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Conversion totale: <strong className={cn(
                overallConversion >= 5 ? 'text-green-600' :
                overallConversion >= 2 ? 'text-orange-500' :
                'text-red-500'
              )}>{overallConversion.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="space-y-3" 
          style={{ minHeight: height }}
          role="list"
          aria-label="Étapes du tunnel de conversion"
        >
          {stages.map((stage, index) => (
            <FunnelBar
              key={stage.name}
              stage={stage}
              index={index}
              maxValue={maxValue}
              color={color}
              showPercentage={showPercentages}
              showConversion={showConversionRates}
              isExpanded={expandedStage === index}
              onToggle={() => handleToggle(index)}
              onClick={() => handleStageClick(stage, index)}
            />
          ))}
          
          {stages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground py-8">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FunnelChart;
