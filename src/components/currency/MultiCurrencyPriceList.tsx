'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CurrencyCode, getSortedCurrencies, getCurrencyConfig, BASE_CURRENCY } from '@/lib/currency/config'
import { formatCurrency, formatWithCode } from '@/lib/currency/formatter'
import { batchConvert } from '@/lib/currency/converter'
import { Download, RefreshCw, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiCurrencyPriceListProps {
  amount: number
  baseCurrency?: CurrencyCode
  className?: string
  showBestValue?: boolean
  showExport?: boolean
  compact?: boolean
}

interface PriceEntry {
  currency: CurrencyCode
  amount: number
  formatted: string
  rate: number
  isBestValue?: boolean
}

export function MultiCurrencyPriceList({
  amount,
  baseCurrency = BASE_CURRENCY,
  className,
  showBestValue = true,
  showExport = true,
  compact = false,
}: MultiCurrencyPriceListProps) {
  const [prices, setPrices] = useState<PriceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch all conversions on mount and when amount changes
  useEffect(() => {
    fetchAllPrices()
  }, [amount, baseCurrency])

  const fetchAllPrices = async () => {
    setLoading(true)
    try {
      const allCurrencies = getSortedCurrencies()
        .map(c => c.code)
        .filter(c => c !== baseCurrency)

      const response = await fetch('/api/currency/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          from: baseCurrency,
          targets: allCurrencies,
          batch: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.conversions) {
          const entries: PriceEntry[] = []
          
          // Add base currency first
          entries.push({
            currency: baseCurrency,
            amount,
            formatted: formatCurrency(amount, baseCurrency),
            rate: 1,
          })

          // Add converted currencies
          for (const [code, conversion] of Object.entries(data.data.conversions)) {
            const conv = conversion as { amount: number; rate: number; formatted: string }
            entries.push({
              currency: code as CurrencyCode,
              amount: conv.amount,
              formatted: conv.formatted || formatCurrency(conv.amount, code as CurrencyCode),
              rate: conv.rate,
            })
          }

          // Find best value (highest amount when converting FROM base)
          if (showBestValue) {
            const maxAmount = Math.max(...entries.filter(e => e.currency !== baseCurrency).map(e => e.amount))
            entries.forEach(entry => {
              if (entry.currency !== baseCurrency && entry.amount === maxAmount) {
                entry.isBestValue = true
              }
            })
          }

          setPrices(entries)
          setLastUpdated(new Date())
        }
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Export as CSV
  const exportCSV = () => {
    const headers = ['Currency', 'Name', 'Symbol', 'Amount', 'Rate']
    const rows = prices.map(p => {
      const config = getCurrencyConfig(p.currency)
      return [
        p.currency,
        config?.name || '',
        config?.symbol || '',
        p.amount.toFixed(2),
        p.rate.toFixed(6),
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `currency-prices-${Date.now()}.csv`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  if (compact) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              {formatCurrency(amount, baseCurrency)} in all currencies
            </span>
            <Button variant="ghost" size="sm" onClick={fetchAllPrices}>
              <RefreshCw className={cn('h-3 w-3 mr-1', loading && 'animate-spin')} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {prices.map((price) => (
              <div
                key={price.currency}
                className={cn(
                  "p-2 rounded-md border text-center text-xs",
                  price.isBestValue && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                )}
              >
                <div className="font-medium">{price.formatted}</div>
                <div className="text-muted-foreground mt-0.5">
                  {getCurrencyConfig(price.currency)?.flag} {price.currency}
                  {price.isBestValue && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-3.5">
                      BEST
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3" />
            Updated: {formatTime(lastUpdated)}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Multi-Currency Pricing
            </CardTitle>
            <CardDescription>
              Showing {formatWithCode(amount, baseCurrency)} in all supported currencies
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllPrices}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
              Refresh
            </Button>
            {showExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                disabled={prices.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Last updated info */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last updated: {formatTime(lastUpdated)}</span>
          {showBestValue && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              Best value highlighted
            </Badge>
          )}
        </div>

        {/* Prices Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Currency</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right w-[120px]">Rate vs {baseCurrency}</TableHead>
              {showBestValue && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading rates...
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              prices.map((price) => {
                const config = getCurrencyConfig(price.currency)
                return (
                  <TableRow
                    key={price.currency}
                    className={cn(
                      price.isBestValue && "bg-green-50/50 dark:bg-green-950/10"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <span>{config?.flag}</span>
                        <span>{price.currency}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {config?.name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {price.formatted}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {price.rate.toFixed(6)}
                    </TableCell>
                    {showBestValue && (
                      <TableCell>
                        {price.isBestValue && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            BEST
                          </Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
