'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, Users, Eye, ShoppingCart } from 'lucide-react';

// ============================================
// Types
// ============================================

interface RealTimeData {
  activeUsers: number;
  pageViews: number;
  orders: number;
  rfqs: number;
}

interface RealTimeCounterProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'default';
  description?: string;
  pulseColor?: string;
  updateInterval?: number; // in milliseconds
  onValueChange?: (newValue: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// Animated Counter with Pulse
// ============================================

function AnimatedValue({ 
  value, 
  previousValue,
  size = 'md',
}: { 
  value: number; 
  previousValue: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);
  
  useEffect(() => {
    if (value !== displayValue) {
      setIsIncreasing(value > displayValue);
      
      // Animate to new value
      const duration = 500;
      const steps = 20;
      const stepDuration = duration / steps;
      let currentStep = 0;
      const startValue = displayValue;
      const increment = (value - startValue) / steps;

      const timer = setInterval(() => {
        currentStep++;
        
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
          return;
        }
        
        setDisplayValue(prev => Math.round(prev + increment));
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [value, displayValue]);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <span 
      className={cn(
        'font-bold tabular-nums transition-colors duration-300',
        sizeClasses[size],
        isIncreasing ? 'text-green-600 dark:text-green-400' : 
        value < previousValue ? 'text-red-600 dark:text-red-400' : 
        ''
      )}
    >
      {displayValue.toLocaleString('fr-DZ')}
    </span>
  );
}

// ============================================
// Pulse Animation Component
// ============================================

function PulseIndicator({ 
  isPulsing, 
  color = '#006233',
}: { 
  isPulsing: boolean; 
  color?: string;
}) {
  return (
    <span className="relative flex h-3 w-3">
      <span 
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75',
          isPulsing && 'animate-ping'
        )}
        style={{ backgroundColor: color }}
      />
      <span 
        className="relative inline-flex rounded-full h-3 w-3"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

// ============================================
// Main RealTimeCounter Component
// ============================================

export function RealTimeCounter({
  label,
  value,
  icon: Icon,
  color = 'default',
  description,
  pulseColor,
  updateInterval = 10000,
  onValueChange,
  className,
  size = 'md',
}: RealTimeCounterProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Color configurations
  const colorConfig = {
    green: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      pulse: '#006233',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      pulse: '#D52B1E',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      pulse: '#2563eb',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      pulse: '#ea580c',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      pulse: '#9333ea',
    },
    default: {
      bg: 'bg-gray-50 dark:bg-gray-800/30',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      iconBg: 'bg-gray-100 dark:bg-gray-800',
      pulse: '#6b7280',
    },
  };

  const colors = colorConfig[color];

  // Simulate real-time updates
  useEffect(() => {
    setCurrentValue(value);
    setPreviousValue(value);
  }, [value]);

  // Set up polling for updates
  useEffect(() => {
    if (!onValueChange) return;

    intervalRef.current = setInterval(async () => {
      setIsUpdating(true);
      
      // Simulate fetching new data
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll just use the callback
        const randomChange = Math.floor(Math.random() * 5) - 2;
        const newValue = Math.max(0, currentValue + randomChange);
        
        setPreviousValue(currentValue);
        setCurrentValue(newValue);
        onValueChange(newValue);
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      } finally {
        setTimeout(() => setIsUpdating(false), 500);
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, onValueChange, currentValue]);

  return (
    <Card 
      className={cn(
        'border transition-all hover:shadow-md',
        colors.bg,
        colors.border,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${currentValue}`}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          {Icon && (
            <div className={cn(
              'p-2.5 rounded-lg relative',
              colors.iconBg
            )}>
              <Icon className={cn('h-5 w-5', colors.text)} />
              
              {/* Pulse indicator when updating */}
              <div className="absolute -top-1 -right-1">
                <PulseIndicator 
                  isPulsing={isUpdating} 
                  color={pulseColor || colors.pulse}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {label}
            </p>
            
            <AnimatedValue 
              value={currentValue} 
              previousValue={previousValue}
              size={size}
            />

            {description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {description}
              </p>
            )}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PulseIndicator isPulsing color={colors.pulse} />
            <span className="hidden sm:inline">En direct</span>
          </div>
        </div>

        {/* Mini activity bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isUpdating ? 'animate-pulse' : ''
            )}
            style={{
              width: `${Math.min((currentValue / 1000) * 100, 100)}%`,
              backgroundColor: colors.pulse,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Real-Time Dashboard Widget
// ============================================

interface RealTimeDashboardProps {
  className?: string;
  initialData?: Partial<RealTimeData>;
}

export function RealTimeDashboard({
  className,
  initialData,
}: RealTimeDashboardProps) {
  const [data, setData] = useState<RealTimeData>({
    activeUsers: initialData?.activeUsers ?? 127,
    pageViews: initialData?.pageViews ?? 1847,
    orders: initialData?.orders ?? 23,
    rfqs: initialData?.rfqs ?? 45,
  });

  const handleUpdate = (key: keyof RealTimeData) => (newValue: number) => {
    setData(prev => ({ ...prev, [key]: newValue }));
  };

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <RealTimeCounter
        label="Utilisateurs Actifs"
        value={data.activeUsers}
        icon={Users}
        color="green"
        description="Connectés maintenant"
        onValueChange={handleUpdate('activeUsers')}
        size="sm"
      />
      
      <RealTimeCounter
        label="Pages Vues"
        value={data.pageViews}
        icon={Eye}
        color="blue"
        description="Dernière heure"
        onValueChange={handleUpdate('pageViews')}
        size="sm"
      />
      
      <RealTimeCounter
        label="Commandes"
        value={data.orders}
        icon={ShoppingCart}
        color="orange"
        description="Aujourd'hui"
        onValueChange={handleUpdate('orders')}
        size="sm"
      />
      
      <RealTimeCounter
        label="Demandes de Devis"
        value={data.rfqs}
        icon={Activity}
        color="purple"
        description="Cette semaine"
        onValueChange={handleUpdate('rfqs')}
        size="sm"
      />
    </div>
  );
}

export default RealTimeCounter;
