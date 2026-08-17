'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { 
  SupportedCurrency, 
  CURRENCIES, 
  getCurrencyInfo,
  formatCurrency
} from '@/lib/currency'

interface CurrencySelectorProps {
  value?: SupportedCurrency
  onChange?: (currency: SupportedCurrency) => void
  showFlag?: boolean
  showSymbol?: boolean
  compact?: boolean
  className?: string
}

interface CurrencyOption {
  code: SupportedCurrency
  name: string
  symbol: string
  flagEmoji: string
}

export default function CurrencySelector({
  value: propValue,
  onChange,
  showFlag = true,
  showSymbol = true,
  compact = false,
  className = '',
}: CurrencySelectorProps) {
  // Initialize with prop value or default to DZD
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(propValue || 'DZD')
  const [detected, setDetected] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Get currency options
  const currencies: CurrencyOption[] = Object.values(CURRENCIES).map(c => ({
    code: c.code,
    name: c.nameLocalized.en || c.name,
    symbol: c.symbol,
    flagEmoji: c.flagEmoji,
  }))

  // Detect user's preferred currency on mount (only runs once)
  useEffect(() => {
    if (!propValue && !detected) {
      let isMounted = true
      const detect = async () => {
        try {
          const response = await fetch('/api/currency/detect')
          if (isMounted) {
            const data = await response.json()
            if (data.success && data.data.detected) {
              setSelectedCurrency(data.data.detected)
              onChange?.(data.data.detected)
            }
            setDetected(true)
          }
        } catch (error) {
          console.error('Error detecting currency:', error)
          setDetected(true)
        }
      }
      detect()
      return () => { isMounted = false }
    }
  }, [propValue, detected, onChange])

  // Handle currency change
  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    setSelectedCurrency(newCurrency as SupportedCurrency)
    
    // Save preference to server (sets cookie)
    try {
      await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      })
      
      onChange?.(newCurrency as SupportedCurrency)
      
      toast({
        title: 'Currency Updated',
        description: `Prices now displayed in ${CURRENCIES[newCurrency as SupportedCurrency].name}`,
        duration: 2000,
      })
    } catch (error) {
      console.error('Error saving currency preference:', error)
    }
    
    setIsOpen(false)
  }, [onChange, toast])

  const currentInfo = getCurrencyInfo(selectedCurrency)

  if (compact) {
    return (
      <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
        <SelectTrigger className={`w-[140px] ${className}`}>
          <SelectValue>
            <span className="flex items-center gap-1">
              {showFlag && <span>{currentInfo.flagEmoji}</span>}
              <span>{selectedCurrency}</span>
              {showSymbol && <span className="text-muted-foreground">{currentInfo.symbol}</span>}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-2">
                {showFlag && <span>{currency.flagEmoji}</span>}
                <span>{currency.code}</span>
                <span className="text-muted-foreground text-xs">({currency.symbol})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 ${className}`}
        >
          {showFlag && <span className="text-lg">{currentInfo.flagEmoji}</span>}
          <span className="font-medium">{selectedCurrency}</span>
          {showSymbol && (
            <span className="text-muted-foreground">{currentInfo.symbol}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Select Currency</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Prices will be converted for display purposes
          </p>
        </div>
        
        <div className="max-h-64 overflow-y-auto p-2">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                selectedCurrency === currency.code ? 'bg-accent' : ''
              }`}
            >
              <span className="text-xl">{currency.flagEmoji}</span>
              
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{currency.name}</div>
                <div className="text-xs text-muted-foreground">
                  {currency.code} • {currency.symbol}
                </div>
              </div>
              
              {selectedCurrency === currency.code && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            ⚠️ Non-DZD prices are estimates based on current exchange rates.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Hook to use selected currency in components
export function useSelectedCurrency() {
  const [currency, setCurrency] = useState<SupportedCurrency>('DZD')

  useEffect(() => {
    // Load saved preference
    const loadPreference = async () => {
      try {
        const response = await fetch('/api/currency/detect')
        const data = await response.json()
        
        if (data.success && data.data.detected) {
          setCurrency(data.data.detected)
        }
      } catch (error) {
        console.error('Error loading currency:', error)
      }
    }

    loadPreference()
  }, [])

  const changeCurrency = async (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency)
    
    try {
      await fetch('/api/currency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      })
    } catch (error) {
      console.error('Error saving currency:', error)
    }
  }

  return { currency, setCurrency: changeCurrency }
}
