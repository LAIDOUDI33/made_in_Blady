'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { CurrencyCode, getSortedCurrencies, getCurrencyConfig, BASE_CURRENCY } from '@/lib/currency/config'
import { formatCurrency } from '@/lib/currency/formatter'
import { getCachedRates } from '@/lib/currency/rate-provider'
import { ChevronDown, Search, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrencySelectorProps {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  className?: string
  showRate?: boolean // Show current rate vs DZD
  disabled?: boolean
  size?: 'sm' | 'default' | 'lg'
}

interface CurrencyOption {
  code: CurrencyCode
  name: string
  symbol: string
  flag: string
  rate?: number
}

export function CurrencySelector({
  value,
  onChange,
  className,
  showRate = true,
  disabled = false,
  size = 'default',
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [rates, setRates] = useState<Map<string, number> | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])

  // Load currencies and rates on mount
  useEffect(() => {
    const sortedCurrencies = getSortedCurrencies()
    const options: CurrencyOption[] = sortedCurrencies.map(c => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      flag: c.flag,
    }))
    setCurrencies(options)
    
    // Get cached rates for display
    const cachedRates = getCachedRates()
    if (cachedRates) {
      setRates(cachedRates)
    }
  }, [])

  // Fetch rates when popover opens
  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch('/api/currency/rates')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.rates) {
          setRates(new Map(Object.entries(data.data.rates)))
        }
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error)
    }
  }, [])

  useEffect(() => {
    if (open && !rates) {
      fetchRates()
    }
  }, [open, rates, fetchRates])

  const selectedCurrency = getCurrencyConfig(value)

  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (code: string) => {
    onChange(code as CurrencyCode)
    setOpen(false)
    setSearchQuery('')
    
    // Save preference to cookie via API
    fetch('/api/currency/user-preference', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: code }),
    }).catch(console.error)
  }

  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    default: 'h-10 text-sm',
    lg: 'h-12 text-base px-4',
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between gap-2 font-normal',
            sizeClasses[size],
            className
          )}
          disabled={disabled}
        >
          {selectedCurrency ? (
            <span className="flex items-center gap-2">
              <span className="text-base">{selectedCurrency.flag}</span>
              <span>{selectedCurrency.code}</span>
              <span className="text-muted-foreground">{selectedCurrency.symbol}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Select currency</span>
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
            />
          </div>
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {filteredCurrencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={() => handleSelect(currency.code)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg shrink-0">{currency.flag}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{currency.code}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {currency.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {currency.symbol}
                    </Badge>
                  </div>
                  {showRate && rates && currency.code !== BASE_CURRENCY && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      1 {currency.code} = {(rates.get(currency.code) || 0).toFixed(2)} د.ج
                    </span>
                  )}
                  {value === currency.code && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Simpler dropdown version for inline use
export function CurrencyDropdown({
  value,
  onChange,
  className,
}: {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  className?: string
}) {
  const currencies = getSortedCurrencies()

  return (
    <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)}>
      <SelectTrigger className={cn('w-[140px]', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span>{c.flag}</span>
              <span>{c.code}</span>
              <span className="text-muted-foreground">({c.symbol})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
