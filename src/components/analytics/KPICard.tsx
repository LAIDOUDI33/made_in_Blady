'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  type LucideIcon 
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number; // Percentage change
  changeLabel?: string;
  icon?: LucideIcon;
  color?: 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'default';
  sparklineData?: number[];
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  isLoading?: boolean;
}

// ============================================
// Animated Number Counter
// ============================================

function AnimatedNumber({ 
  value, 
  format = 'number',
  prefix = '',
  suffix = '',
}: { 
  value: number | string; 
  format?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  useEffect(() => {
    if (typeof value === 'string') {
      setDisplayValue(numericValue);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;
    
    const startValue = displayValue;
    const increment = (numericValue - startValue) / steps;

    const timer = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        setDisplayValue(numericValue);
        clearInterval(timer);
        return;
      }
      
      setDisplayValue(prev => prev + increment);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numericValue, format, prefix, suffix]);

  // Format the displayed value
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return `${prefix}${val.toLocaleString('fr-DZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${suffix}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'decimal':
        return val.toFixed(2);
      default:
        return `${prefix}${Math.round(val).toLocaleString('fr-DZ')}${suffix}`;
    }
  };

  return <span>{formatValue(displayValue)}</span>;
}

// ============================================
// Mini Sparkline
// ============================================

function MiniSparkline({ 
  data, 
  color = '#006233',
  height = 32,
  width = 80,
}: { 
  data: number[]; 
  color?: string;
  height?: number;
  width?: number;
}) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg 
      width={width} 
      height={height} 
      className="overflow-visible"
      aria-hidden="true"
    >
      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill={`${color}15`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
 );
}

// ============================================
// Main KPI Card Component
// ============================================

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'default',
  sparklineData,
  prefix = '',
  suffix = '',
  format = 'number',
  isLoading = false,
}: KPICardProps) {
  const colorMap = {
    green: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      sparkColor: '#006233', // Algeria green
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      sparkColor: '#D52B1E', // Algeria red
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      sparkColor: '#2563eb',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      sparkColor: '#ea580c',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      sparkColor: '#9333ea',
    },
    default: {
      bg: 'bg-gray-50 dark:bg-gray-800/30',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
      sparkColor: '#6b7280',
    },
  };

  const colors = colorMap[color];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  if (isLoading) {
    return (
      <Card className={cn('border', colors.border)}>
        <CardContent className="p-4 md:p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'border transition-all hover:shadow-md',
        colors.bg,
        colors.border
      )}
      role="region"
      aria-label={`Métrique ${title}`}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground truncate mb-1">
              {title}
            </p>
            
            {/* Value */}
            <div className={cn(
              'text-2xl md:text-3xl font-bold tracking-tight',
              colors.text
            )}>
              <AnimatedNumber 
                value={value} 
                format={format}
                prefix={prefix}
                suffix={suffix}
              />
            </div>

            {/* Change indicator */}
            {(change !== undefined || changeLabel) && (
              <div className="flex items-center gap-1.5 mt-2">
                {!isNeutral && (
                  <span className={cn(
                    'inline-flex items-center justify-center rounded-full p-0.5',
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </span>
                )}
                {isNeutral && (
                  <Minus className="h-4 w-4 text-gray-400" />
                )}
                
                {change !== undefined && (
                  <span className={cn(
                    'text-sm font-medium',
                    isPositive ? 'text-green-600 dark:text-green-400' :
                    isNegative ? 'text-red-600 dark:text-red-400' :
                    'text-gray-500'
                  )}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                )}
                
                {changeLabel && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Icon and Sparkline container */}
          <div className="flex flex-col items-end gap-2">
            {Icon && (
              <div className={cn(
                'p-2 rounded-lg',
                colors.iconBg
              )}>
                <Icon className={cn('h-5 w-5', colors.text)} />
              </div>
            )}
            
            {sparklineData && sparklineData.length > 1 && (
              <MiniSparkline 
                data={sparklineData} 
                color={colors.sparkColor}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default KPICard;
