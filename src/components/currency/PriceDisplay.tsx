'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { CurrencyCode, getCurrencyConfig } from '@/lib/currency/config'
import { formatCurrency, formatWithCode } from '@/lib/currency/formatter'
import { quickConvert } from '@/lib/currency/converter'
import { getCachedRates } from '@/lib/currency/rate-provider'
import { cn } from '@/lib/utils'
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PriceDisplayProps {
  amount: number
  currency: CurrencyCode
  displayCurrency?: CurrencyCode // If different from base currency, show converted price
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'xl'
  variant?: 'default' | 'strikethrough' | 'highlight' | 'muted'
  showOriginal?: boolean // Show original currency alongside
  compact?: boolean // Compact mode for lists
  animate?: boolean // Animate on change
  showTooltip?: boolean // Show conversion details in tooltip
}

interface PriceChangeProps {
  oldPrice: number
  newPrice: number
  currency: CurrencyCode
  className?: string
}

export function PriceDisplay({
  amount,
  currency,
  displayCurrency,
  className,
  size = 'default',
  variant = 'default',
  showOriginal = false,
  compact = false,
  animate = true,
  showTooltip = true,
}: PriceDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [rates, setRates] = useState<Map<string, number> | null>(null)
  const [prevAmount, setPrevAmount] = useState(amount)

  // Get cached rates for conversion
  useEffect(() => {
    const cachedRates = getCachedRates()
    if (cachedRates) {
      setRates(cachedRates)
    }
  }, [])

  // Convert to display currency if needed
  useEffect(() => {
    if (displayCurrency && displayCurrency !== currency && rates) {
      const converted = quickConvert(amount, currency, displayCurrency, rates)
      if (converted !== null) {
        setConvertedAmount(converted)
      }
    } else if (!displayCurrency || displayCurrency === currency) {
      setConvertedAmount(null)
    }
  }, [amount, currency, displayCurrency, rates])

  // Track changes for animation
  useEffect(() => {
    if (amount !== prevAmount) {
      setPrevAmount(amount)
    }
  }, [amount, prevAmount])

  const config = getCurrencyConfig(currency)
  const displayConfig = displayCurrency ? getCurrencyConfig(displayCurrency) : null

  // Determine which amount to show
  const primaryAmount = convertedAmount ?? amount
  const primaryCurrency = displayCurrency ?? currency

  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl font-semibold',
  }

  const variantClasses = {
    default: '',
    strikethrough: 'line-through text-muted-foreground',
    highlight: 'text-primary font-medium',
    muted: 'text-muted-foreground',
  }

  const formattedPrimary = formatCurrency(primaryAmount, primaryCurrency, {
    compact,
  })

  const formattedOriginal = formatCurrency(amount, currency, {
    compact,
  })

  const tooltipContent = useMemo(() => {
    if (!showTooltip) return null
    
    const parts = []
    
    // Original price
    parts.push(`Original: ${formatWithCode(amount, currency)}`)
    
    // Converted price info
    if (convertedAmount !== null && displayCurrency) {
      parts.push(`Converted: ${formatWithCode(convertedAmount, displayCurrency)}`)
      
      if (rates) {
        const rate = rates.get(currency) && rates.get(displayCurrency)
          ? (rates.get(displayCurrency)! / rates.get(currency)!).toFixed(4)
          : 'N/A'
        parts.push(`Rate: 1 ${currency} = ${rate} ${displayCurrency}`)
      }
    }
    
    return parts.join('\n')
  }, [showTooltip, amount, currency, convertedAmount, displayCurrency, rates])

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        sizeClasses[size],
        variantClasses[variant],
        animate && amount !== prevAmount && 'transition-all duration-300 ease-out',
        className
      )}
      dir={currency === 'DZD' || currency === 'TND' || currency === 'MAD' ? 'rtl' : 'ltr'}
    >
      {compact && config && (
        <span className="mr-0.5">{config.flag}</span>
      )}
      
      <span>{formattedPrimary}</span>
      
      {showOriginal && convertedAmount !== null && (
        <span className="text-muted-foreground text-xs ml-1">
          ({formattedOriginal})
        </span>
      )}
      
      {variant === 'highlight' && (
        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
          BEST
        </Badge>
      )}
    </span>
  )

  if (tooltipContent && !compact) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[250px]">
            <pre className="whitespace-pre-wrap font-mono">{tooltipContent}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

// Component to show price change/difference
export function PriceChange({
  oldPrice,
  newPrice,
  currency,
  className,
}: PriceChangeProps) {
  const diff = newPrice - oldPrice
  const percentChange = ((diff / oldPrice) * 100).toFixed(2)
  const isIncrease = diff > 0
  const isDecrease = diff < 0

  const iconClass = isIncrease 
    ? 'text-green-600' 
    : isDecrease 
    ? 'text-red-600' 
    : 'text-gray-500'

  const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', className)}>
      <Icon className={cn('h-3 w-3', iconClass)} />
      <span className={cn(
        'font-medium',
        isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-gray-500'
      )}>
        {isIncrease ? '+' : ''}{percentChange}%
      </span>
      <span className="text-muted-foreground">
        ({formatCurrency(Math.abs(diff), currency, { hideSymbol: true })})
      </span>
    </span>
  )
}

// Compact price component for product cards and lists
export function CompactPrice({
  amount,
  currency,
  className,
}: {
  amount: number
  currency: CurrencyCode
  className?: string
}) {
  return (
    <PriceDisplay
      amount={amount}
      currency={currency}
      size="sm"
      compact
      className={className}
    />
  )
}

// Strikethrough price for discounts/sales
export function SalePrice({
  originalPrice,
  salePrice,
  currency,
  className,
}: {
  originalPrice: number
  salePrice: number
  currency: CurrencyCode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <PriceDisplay
        amount={originalPrice}
        currency={currency}
        variant="strikethrough"
        size="sm"
      />
      <PriceDisplay
        amount={salePrice}
        currency={currency}
        variant="highlight"
      />
    </div>
  )
}
