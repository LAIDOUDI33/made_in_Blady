'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SupportedCurrency, CURRENCIES, formatCurrency, convertAmount } from '@/lib/currency'
import { Loader2, Info } from 'lucide-react'

interface MultiCurrencyPriceProps {
  amount: number
  originalCurrency?: SupportedCurrency
  displayCurrency?: SupportedCurrency
  showOriginal?: boolean
  showConverted?: boolean
  compact?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'sale' | 'range'
  // For range variant
  maxAmount?: number
}

export default function MultiCurrencyPrice({
  amount,
  originalCurrency = 'DZD',
  displayCurrency,
  showOriginal = true,
  showConverted = true,
  compact = false,
  size = 'md',
  className = '',
  variant = 'default',
  maxAmount,
}: MultiCurrencyPriceProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('DZD')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [maxConvertedAmount, setMaxConvertedAmount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detect user's preferred currency on mount
  useEffect(() => {
    if (displayCurrency) {
      setSelectedCurrency(displayCurrency)
    } else {
      detectUserCurrency()
    }
  }, [displayCurrency])

  // Convert amount when currency changes
  useEffect(() => {
    if (originalCurrency === selectedCurrency) {
      setConvertedAmount(amount)
      if (maxAmount) setMaxConvertedAmount(maxAmount)
      return
    }

    convertAndDisplay()
  }, [amount, selectedCurrency, originalCurrency, maxAmount])

  async function detectUserCurrency() {
    try {
      const response = await fetch('/api/currency/detect')
      const data = await response.json()
      
      if (data.success && data.data.detected) {
        setSelectedCurrency(data.data.detected)
      }
    } catch (error) {
      console.error('Error detecting currency:', error)
    }
  }

  async function convertAndDisplay() {
    setIsLoading(true)
    setError(null)

    try {
      const converted = await convertAmount(amount, originalCurrency, selectedCurrency)
      setConvertedAmount(converted)

      if (maxAmount) {
        const convertedMax = await convertAmount(maxAmount, originalCurrency, selectedCurrency)
        setMaxConvertedAmount(convertedMax)
      }
    } catch (err) {
      console.error('Error converting:', err)
      setError('Conversion unavailable')
      setConvertedAmount(amount) // Fallback to original
    } finally {
      setIsLoading(false)
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  }

  const originalInfo = CURRENCIES[originalCurrency]
  const displayInfo = CURRENCIES[selectedCurrency]

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${className}`}>
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  {convertedAmount !== null ? formatCurrency(convertedAmount, selectedCurrency) : formatCurrency(amount, originalCurrency)}
                  {selectedCurrency !== originalCurrency && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      ~{selectedCurrency}
                    </Badge>
                  )}
                </>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Original: {formatCurrency(amount, originalCurrency)}</p>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Range variant
  if (variant === 'range') {
    return (
      <div className={`${className}`}>
        <div className={`font-bold ${sizeClasses[size]}`}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Converting...
            </span>
          ) : convertedAmount !== null && maxConvertedAmount !== null ? (
            <>
              {formatCurrency(convertedAmount, selectedCurrency)} - {formatCurrency(maxConvertedAmount!, selectedCurrency)}
              {selectedCurrency !== originalCurrency && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Est.
                </Badge>
              )}
            </>
          ) : (
            `${formatCurrency(amount, originalCurrency)} - ${formatCurrency(maxAmount || amount, originalCurrency)}`
          )}
        </div>
        
        {showOriginal && selectedCurrency !== originalCurrency && !isLoading && (
          <p className="text-xs text-muted-foreground mt-1">
            Original: {formatCurrency(amount, originalCurrency)} - {formatCurrency(maxAmount || amount, originalCurrency)}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <Info className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    )
  }

  // Sale variant (with strikethrough for original price)
  if (variant === 'sale') {
    return (
      <div className={`${className}`}>
        {/* Converted/Sale Price */}
        <div className={`font-bold text-green-600 dark:text-green-400 ${sizeClasses[size]}`}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Converting...
            </span>
          ) : convertedAmount !== null ? (
            <>
              {formatCurrency(convertedAmount, selectedCurrency)}
              {selectedCurrency !== originalCurrency && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Est.
                </Badge>
              )}
            </>
          ) : (
            formatCurrency(amount, originalCurrency)
          )}
        </div>

        {/* Original Price */}
        {showOriginal && (
          <p className={`text-sm text-muted-foreground line-through`}>
            {formatCurrency(amount, originalCurrency)}
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <Info className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={`${className}`}>
      {/* Primary Display (in user's preferred currency or converted) */}
      <div className={`font-semibold ${sizeClasses[size]}`}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Converting...
          </span>
        ) : convertedAmount !== null ? (
          <>
            {formatCurrency(convertedAmount, selectedCurrency)}
            {selectedCurrency !== originalCurrency && (
              <Badge 
                variant="outline" 
                className="ml-2 text-xs font-normal"
                title="Estimated conversion"
              >
                ≈
              </Badge>
            )}
          </>
        ) : (
          formatCurrency(amount, originalCurrency)
        )}
      </div>

      {/* Show original DZD price as reference when different currency is displayed */}
      {showOriginal && selectedCurrency !== originalCurrency && !isLoading && (
        <p className="text-xs text-muted-foreground mt-0.5">
          ({formatCurrency(amount, originalCurrency)})
        </p>
      )}

      {/* Error state */}
      {error && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// Simplified version that auto-detects and converts
export function AutoPrice({ 
  amount, 
  size = 'md', 
  className = '' 
}: { 
  amount: number; 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string;
}) {
  return (
    <MultiCurrencyPrice
      amount={amount}
      originalCurrency="DZD"
      showOriginal={true}
      size={size}
      className={className}
    />
  )
}

// Price comparison component (shows multiple currencies)
export function PriceComparison({ 
  amount, 
  originalCurrency = 'DZD' 
}: { 
  amount: number; 
  originalCurrency?: SupportedCurrency;
}) {
  const [prices, setPrices] = useState<Record<SupportedCurrency, string>>({} as Record<SupportedCurrency, string>)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAllConversions() {
      setIsLoading(true)
      const newPrices = {} as Record<SupportedCurrency, string>

      for (const code of Object.keys(CURRENCIES) as SupportedCurrency[]) {
        if (code === originalCurrency) {
          newPrices[code] = formatCurrency(amount, originalCurrency)
        } else {
          try {
            const converted = await convertAmount(amount, originalCurrency, code)
            newPrices[code] = formatCurrency(converted, code)
          } catch {
            newPrices[code] = 'N/A'
          }
        }
      }

      setPrices(newPrices)
      setIsLoading(false)
    }

    fetchAllConversions()
  }, [amount, originalCurrency])

  if (isLoading) {
    return (
      <div className="space-y-2 p-4 bg-muted rounded-lg">
        <div className="animate-pulse space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4 bg-muted rounded-lg">
      <h4 className="font-medium text-sm mb-3">Price in Different Currencies</h4>
      {(Object.keys(CURRENCIES) as SupportedCurrency[]).map((code) => {
        const info = CURRENCIES[code]
        return (
          <div 
            key={code} 
            className={`flex items-center justify-between px-2 py-1 rounded ${
              code === originalCurrency ? 'bg-primary/10 font-medium' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{info.flagEmoji}</span>
              <span className="text-sm">{info.name}</span>
            </span>
            <span className="font-mono text-sm">{prices[code]}</span>
          </div>
        )
      })}
      <p className="text-xs text-muted-foreground pt-2 border-t">
        * Prices are estimates based on current exchange rates. Actual payment will be in DZD.
      </p>
    </div>
  )
}
