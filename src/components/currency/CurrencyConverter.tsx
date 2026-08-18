'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencySelector } from './CurrencySelector'
import { PriceDisplay } from './PriceDisplay'
import {
  CurrencyCode,
  getCurrencyConfig,
  getSortedCurrencies,
  BASE_CURRENCY,
} from '@/lib/currency/config'
import { formatCurrency, formatWithCode } from '@/lib/currency/formatter'
import { convert, batchConvert } from '@/lib/currency/converter'
import { ArrowRightLeft, Copy, Check, RefreshCw, History, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ConversionResult {
  fromAmount: number
  fromCurrency: CurrencyCode
  toAmount: number
  toCurrency: CurrencyCode
  rate: number
  formattedFrom: string
  formattedTo: string
  timestamp: Date
}

interface CurrencyConverterProps {
  className?: string
  defaultFrom?: CurrencyCode
  defaultTo?: CurrencyCode
  initialAmount?: number
  showHistory?: boolean
  compact?: boolean
}

export function CurrencyConverter({
  className,
  defaultFrom = BASE_CURRENCY,
  defaultTo = 'EUR',
  initialAmount = 1000,
  showHistory = false,
  compact = false,
}: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(defaultFrom)
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(defaultTo)
  const [amount, setAmount] = useState(initialAmount)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [allRates, setAllRates] = useState<Record<string, { amount: number; formatted: string }> | null>(null)

  // Perform conversion when inputs change
  const performConversion = useCallback(async () => {
    if (amount <= 0 || !fromCurrency || !toCurrency) {
      return
    }

    setLoading(true)
    try {
      // Call API for conversion
      const response = await fetch('/api/currency/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, from: fromCurrency, to: toCurrency }),
      })

      if (!response.ok) throw new Error('Conversion failed')

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
        
        // Also get all rates for display
        const allCurrencies = getSortedCurrencies().map(c => c.code).filter(c => c !== fromCurrency)
        try {
          const batchResponse = await fetch('/api/currency/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              from: fromCurrency,
              targets: allCurrencies,
              batch: true,
            }),
          })
          if (batchResponse.ok) {
            const batchData = await batchResponse.json()
            if (batchData.success) {
              setAllRates(batchData.data.conversions)
            }
          }
        } catch (e) {
          console.error('Batch conversion failed:', e)
        }
      }
    } catch (error) {
      console.error('Conversion error:', error)
      toast.error('Failed to convert currency')
    } finally {
      setLoading(false)
    }
  }, [amount, fromCurrency, toCurrency])

  // Auto-convert on mount and when values change
  useEffect(() => {
    const timer = setTimeout(() => {
      performConversion()
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [performConversion])

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    if (result) {
      setAmount(result.toAmount)
    }
  }

  // Copy result to clipboard
  const copyResult = async () => {
    if (!result) return
    
    const text = `${result.formattedFrom} = ${result.formattedTo}`
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  // Format current time
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
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-32"
              min="0"
              step="any"
            />
            <CurrencySelector value={fromCurrency} onChange={setFromCurrency} size="sm" />
            <Button variant="ghost" size="icon" onClick={handleSwap}>
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
            <CurrencySelector value={toCurrency} onChange={setToCurrency} size="sm" />
            
            {result && (
              <span className="font-semibold text-primary">
                {result.formattedTo}
              </span>
            )}
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
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Currency Converter
            </CardTitle>
            <CardDescription>
              Convert between major world currencies
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={performConversion}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Converter */}
        <div className="space-y-4">
          {/* From */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">From</label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="text-lg font-medium flex-1"
                min="0"
                step="any"
              />
              <CurrencySelector 
                value={fromCurrency} 
                onChange={setFromCurrency} 
                showRate={false}
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="rounded-full h-10 w-10"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">To</label>
            <div className="flex gap-3">
              <CurrencySelector 
                value={toCurrency} 
                onChange={setToCurrency}
                showRate={false}
              />
          
              {/* Result Display */}
              <div className="flex-1 bg-muted/50 rounded-md px-4 py-2 min-w-[150px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : result ? (
                  <PriceDisplay
                    amount={result.toAmount}
                    currency={result.toCurrency}
                    size="lg"
                    highlight
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Rate Info & Actions */}
          {result && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground space-x-4">
                <span>Rate: 1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}</span>
                <span>Updated: {formatTime(new Date(result.timestamp))}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyResult}
                className="text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* All Currencies Table */}
        {allRates && !compact && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              All Rates for {formatCurrency(amount, fromCurrency)}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(allRates).map(([code, data]) => (
                <div
                  key={code}
                  className={cn(
                    "p-2 rounded-md border text-center",
                    code === toCurrency && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{code}</div>
                  <div className="font-medium text-sm">{data.formatted}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mini converter for inline use in product pages
export function MiniConverter({
  amount,
  currency,
  className,
}: {
  amount: number
  currency: CurrencyCode
  className?: string
}) {
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>('EUR')
  const [converted, setConverted] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const doConvert = async () => {
      try {
        const response = await fetch(`/api/currency/convert?amount=${amount}&from=${currency}&to=${targetCurrency}`)
        if (response.ok) {
          const data = await response.json()
          if (!cancelled && data.success) {
            setConverted(data.data.converted.amount)
          }
        }
      } catch (error) {
        console.error('Mini conversion failed:', error)
      }
    }

    doConvert()
    return () => { cancelled = true }
  }, [amount, currency, targetCurrency])

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">≈</span>
      {converted !== null ? (
        <PriceDisplay amount={converted} currency={targetCurrency} size="sm" />
      ) : (
        <span className="text-sm text-muted-foreground">...</span>
      )}
      <CurrencySelector value={targetCurrency} onChange={setTargetCurrency} size="sm" showRate={false} />
    </div>
  )
}
