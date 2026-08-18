'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CurrencyCode,
  getCurrencyConfig,
  BASE_CURRENCY,
} from '@/lib/currency/config'
import { formatCurrency } from '@/lib/currency/formatter'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  RefreshCw,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RateInfo {
  currency: CurrencyCode
  rate: number
  previousRate?: number
  change?: number // percentage change
}

interface ExchangeRateBannerProps {
  className?: string
  dismissible?: boolean
  showTrends?: boolean
  onDismiss?: () => void
  compact?: boolean
  majorCurrencies?: CurrencyCode[]
}

export function ExchangeRateBanner({
  className,
  dismissible = true,
  showTrends = true,
  onDismiss,
  compact = false,
  majorCurrencies = ['EUR', 'USD', 'GBP', 'CHF'],
}: ExchangeRateBannerProps) {
  const [rates, setRates] = useState<RateInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!dismissed) {
      fetchRates()
    }
  }, [dismissed])

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/currency/rates')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.rates) {
          const rateInfos: RateInfo[] = majorCurrencies.map(code => ({
            currency: code,
            rate: data.data.rates[code] || 0,
          }))
          setRates(rateInfos)
          setLastUpdated(new Date(data.data.lastUpdated || Date.now()))
        }
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
    
    // Save dismissal to localStorage
    try {
      localStorage.setItem('currency-banner-dismissed', new Date().toISOString())
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Check if previously dismissed today
  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem('currency-banner-dismissed')
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt)
        const now = new Date()
        const hoursSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60)
        
        // Auto-show again after 24 hours
        if (hoursSinceDismissal < 24) {
          setDismissed(true)
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [])

  if (dismissed) return null

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Simulated trend data (in real app, this would come from rate history API)
  const getTrendIcon = (rate: number) => {
    // Random trend for demo - in production, compare with historical data
    const changePercent = (Math.random() - 0.5) * 2 // -1% to +1%
    
    if (changePercent > 0.3) {
      return <TrendingUp className="h-3 w-3 text-green-600" />
    } else if (changePercent < -0.3) {
      return <TrendingDown className="h-3 w-3 text-red-600" />
    }
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  if (compact) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Today's Rates:
              </span>
              
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading...
                </div>
              ) : (
                rates.map((rate) => {
                  const config = getCurrencyConfig(rate.currency)
                  return (
                    <div key={rate.currency} className="flex items-center gap-1 whitespace-nowrap">
                      <span>{config?.flag}</span>
                      <span className="text-xs font-mono">
                        {rate.rate.toFixed(2)}
                      </span>
                      {showTrends && getTrendIcon(rate.rate)}
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lastUpdated && (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {formatTime(lastUpdated)}
                </span>
              )}
              {dismissible && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full border-dashed', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Live Rates
            </Badge>
            <span className="text-sm text-muted-foreground">
              Base: {getCurrencyConfig(BASE_CURRENCY)?.flag} {BASE_CURRENCY}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(lastUpdated)}
              </span>
            )}
            
            <Button variant="ghost" size="sm" onClick={fetchRates} disabled={loading}>
              <RefreshCw className={cn('h-3 w-3 mr-1', loading && 'animate-spin')} />
              Refresh
            </Button>

            {dismissible && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Rate Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted/50 rounded-md animate-pulse"
              />
            ))
          ) : (
            rates.map((rate) => {
              const config = getCurrencyConfig(rate.currency)
              return (
                <div
                  key={rate.currency}
                  className="flex flex-col p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{config?.flag}</span>
                      <span className="font-medium text-sm">{rate.currency}</span>
                    </div>
                    {showTrends && getTrendIcon(rate.rate)}
                  </div>
                  
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono font-semibold">
                      {rate.rate.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      per {config?.symbol}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Link */}
        <div className="mt-3 pt-3 border-t flex justify-end">
          <Button variant="link" size="sm" className="text-xs h-auto p-0" asChild>
            <a href="#converter">
              Open full converter
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
