'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs mois dernier',
  icon: Icon,
  iconColor = 'text-green-600',
  iconBgColor = 'bg-green-100',
  format = 'number',
  className,
}: KPICardProps) {
  const formattedValue = () => {
    if (format === 'currency') {
      return typeof value === 'number' 
        ? `${value.toLocaleString('fr-DZ')} DZD` 
        : value;
    }
    if (format === 'percentage') {
      return typeof value === 'number' ? `${value}%` : value;
    }
    return typeof value === 'number' ? value.toLocaleString('fr-DZ') : value;
  };

  const getTrendIcon = () => {
    if (change === undefined) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getTrendBg = () => {
    if (change === undefined) return 'bg-gray-100';
    if (change > 0) return 'bg-green-100';
    if (change < 0) return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', iconBgColor)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {formattedValue()}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
                getTrendBg(),
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
