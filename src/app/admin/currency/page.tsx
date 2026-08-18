'use client'

import React, { useState } from 'react'
import { 
  DollarSign,
  RefreshCw,
  Download,
  Upload,
  Settings,
  History,
  Globe2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Save,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  FileText,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

// Types
interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  rateToDZD: number
  previousRate: number
  status: 'ACTIVE' | 'DISABLED' | 'MAINTENANCE'
  isManualOverride: boolean
  lastUpdated: string
  updatedBy: string
  decimalPlaces: number
}

interface RateProvider {
  name: string
  fullName: string
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN'
  lastSync: string
  latency: string
}

interface ConversionLog {
  id: number
  timestamp: string
  fromCurrency: string
  toCurrency: string
  amount: number
  result: number
  rateUsed: number
  userId: string
}

interface AuditLog {
  id: number
  timestamp: string
  action: string
  user: string
  details: string
  previousValue?: string
  newValue?: string
}

// Mock Data - 8 currencies with realistic rates to DZD
const mockCurrencies: Currency[] = [
  {
    code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿',
    rateToDZD: 1, previousRate: 1, status: 'ACTIVE',
    isManualOverride: false, lastUpdated: '2025-01-20T10:00:00',
    updatedBy: 'System', decimalPlaces: 2
  },
  {
    code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸',
    rateToDZD: 135.45, previousRate: 134.82, status: 'ACTIVE',
    isManualOverride: false, lastUpdated: '2025-01-20T10:00:00',
    updatedBy: 'Auto (Fixer)', decimalPlaces: 2
  },
  {
    code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺',
    rateToDZD: 146.78, previousRate: 145.93, status: 'ACTIVE',
    isManualOverride: false, lastUpdated: '2025-01-20T10:00:00',
    updatedBy: 'Auto (ECB)', decimalPlaces: 2
  },
  {
    code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧',
    rateToDZD: 170.23, previousRate: 169.15, status: 'ACTIVE',
    isManualOverride: false, lastUpdated: '2025-01-20T10:00:00',
    updatedBy: 'Auto (Fixer)', decimalPlaces: 2
  },
  {
    code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳',
    rateToDZD: 43.56, previousRate: 43.48, status: 'ACTIVE',
    isManualOverride: false, lastUpdated: '2025-01-20T10:00:00',
    updatedBy: 'Auto (Fixer)', decimalPlaces: 3
  },
  {
    code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', flag: '🇲🇦',
    rateToDZD: 13.42, previousRate: 13.38, status: 'ACTIVE',
    isManualOverride: false, lastUpdated: '2025-01-20T10:00:00',
    updatedBy: 'Auto (Fixer)', decimalPlaces: 3
  },
  {
    code: 'XAF', name: 'CFA Franc BEAC', symbol: 'FCFA', flag: '🇨🇲',
    rateToDZD: 0.224, previousRate: 0.223, status: 'DISABLED',
    isManualOverride: true, lastUpdated: '2025-01-18T14:30:00',
    updatedBy: 'Admin User', decimalPlaces: 3
  },
  {
    code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦',
    rateToDZD: 36.12, previousRate: 35.98, status: 'MAINTENANCE',
    isManualOverride: false, lastUpdated: '2025-01-19T08:00:00',
    updatedBy: 'Auto (OER)', decimalPlaces: 2
  }
]

const mockRateProviders: RateProvider[] = [
  { name: 'Fixer.io', fullName: 'Fixer.io API', status: 'OPERATIONAL', lastSync: '2 min ago', latency: '45ms' },
  { name: 'ECB', fullName: 'European Central Bank', status: 'OPERATIONAL', lastSync: '5 min ago', latency: '120ms' },
  { name: 'OER', fullName: 'Open Exchange Rates', status: 'DEGRADED', lastSync: '15 min ago', latency: '890ms' }
]

const mockConversionLog: ConversionLog[] = [
  { id: 1, timestamp: '2025-01-20T17:45:12', fromCurrency: 'USD', toCurrency: 'DZD', amount: 1000, result: 135450, rateUsed: 135.45, userId: 'user_001' },
  { id: 2, timestamp: '2025-01-20T17:30:05', fromCurrency: 'EUR', toCurrency: 'DZD', amount: 500, result: 73390, rateUsed: 146.78, userId: 'user_002' },
  { id: 3, timestamp: '2025-01-20T17:15:33', fromCurrency: 'GBP', toCurrency: 'DZD', amount: 250, result: 42557.5, rateUsed: 170.23, userId: 'user_001' },
  { id: 4, timestamp: '2025-01-20T17:00:21', fromCurrency: 'DZD', toCurrency: 'USD', amount: 500000, result: 3691.73, rateUsed: 0.00738, userId: 'user_003' },
  { id: 5, timestamp: '2025-01-20T16:45:44', fromCurrency: 'TND', toCurrency: 'DZD', amount: 1000, result: 43560, rateUsed: 43.56, userId: 'user_004' },
  { id: 6, timestamp: '2025-01-20T16:30:18', fromCurrency: 'MAD', toCurrency: 'DZD', amount: 2000, result: 26840, rateUsed: 13.42, userId: 'user_002' },
  { id: 7, timestamp: '2025-01-20T16:15:09', fromCurrency: 'EUR', toCurrency: 'USD', amount: 300, result: 325.67, rateUsed: 1.0856, userId: 'user_005' },
  { id: 8, timestamp: '2025-01-20T16:00:55', fromCurrency: 'USD', toCurrency: 'EUR', amount: 150, result: 138.24, rateUsed: 0.9216, userId: 'user_001' }
]

const mockAuditLog: AuditLog[] = [
  { id: 1, timestamp: '2025-01-18T14:30:00', action: 'RATE_OVERRIDE', user: 'Admin User', details: 'XAF rate manually set', previousValue: '0.223', newValue: '0.224' },
  { id: 2, timestamp: '2025-01-17T10:15:00', action: 'CURRENCY_DISABLED', user: 'Admin User', details: 'XAF currency disabled for maintenance', previousValue: 'ACTIVE', newValue: 'DISABLED' },
  { id: 3, timestamp: '2025-01-16T09:00:00', action: 'AUTO_UPDATE', user: 'System', details: 'Scheduled rate update completed', newValue: '6 currencies updated' },
  { id: 4, timestamp: '2025-01-15T16:45:00', action: 'PROVIDER_SWITCH', user: 'System', details: 'Switched to backup provider', previousValue: 'OER Primary', newValue: 'Fixer.io Backup' },
  { id: 5, timestamp: '2025-01-14T11:20:00', action: 'RATE_OVERRIDE', user: 'Super Admin', details: 'SAR rate adjusted due to market volatility', previousValue: '35.50', newValue: '36.12' }
]

// Mock rate history data (last 30 days)
const generateRateHistory = () => {
  const data = []
  const baseDate = new Date('2025-01-20')
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      USD: 133 + Math.random() * 5,
      EUR: 144 + Math.random() * 5,
      GBP: 167 + Math.random() * 6,
      TND: 43 + Math.random() * 1,
      MAD: 13 + Math.random() * 0.8
    })
  }
  
  return data
}

const rateHistoryData = generateRateHistory()

export default function CurrencyAdminPage() {
  const [currencies, setCurrencies] = useState<Currency[]>(mockCurrencies)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [showRateDialog, setShowRateDialog] = useState(false)
  const [newRate, setNewRate] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleToggleStatus = (currencyCode: string) => {
    setCurrencies(prev => prev.map(c => 
      c.code === currencyCode 
        ? { ...c, status: c.status === 'ACTIVE' ? 'DISABLED' as const : 'ACTIVE' as const }
        : c
    ))
  }

  const handleRateOverride = () => {
    if (!selectedCurrency || !newRate) return
    
    setCurrencies(prev => prev.map(c =>
      c.code === selectedCurrency.code
        ? {
            ...c,
            rateToDZD: parseFloat(newRate),
            isManualOverride: true,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'Admin User'
          }
        : c
    ))
    
    setShowRateDialog(false)
    setNewRate('')
    setOverrideReason('')
    setSelectedCurrency(null)
  }

  const handleRefreshRates = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate rate updates
    setCurrencies(prev => prev.map(c => ({
      ...c,
      rateToDZD: c.rateToDZD * (1 + (Math.random() - 0.5) * 0.002), // Small random change
      previousRate: c.rateToDZD,
      lastUpdated: new Date().toISOString(),
      ...(c.isManualOverride ? {} : { updatedBy: 'Auto (Fixer)' })
    })))
    
    setIsRefreshing(false)
  }

  const getStatusBadge = (status: Currency['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
      case 'DISABLED':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Disabled</Badge>
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Maintenance</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getProviderStatusIcon = (status: RateProvider['status']) => {
    switch (status) {
      case 'OPERATIONAL':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'DEGRADED':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'DOWN':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getRateChangeIcon = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    if (change > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            Currency Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure exchange rates and supported currencies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshRates} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Updating...' : 'Refresh Rates'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="currencies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="history">Rate History</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Currencies Tab */}
        <TabsContent value="currencies" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Supported Currencies
              </CardTitle>
              <CardDescription>
                Manage which currencies are available on the platform
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flag & Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Rate to DZD</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.code}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{currency.flag}</span>
                          <code className="font-mono font-medium">{currency.code}</code>
                        </div>
                      </TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell className="font-mono">{currency.symbol}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(currency.rateToDZD, currency.decimalPlaces)}
                        {currency.isManualOverride && (
                          <Badge variant="outline" className="ml-2 text-xs text-orange-600 border-orange-300">
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getRateChangeIcon(currency.rateToDZD, currency.previousRate)}
                          <span className={`text-sm ${
                            currency.rateToDZD > currency.previousRate ? 'text-emerald-600' :
                            currency.rateToDZD < currency.previousRate ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {Math.abs(((currency.rateToDZD - currency.previousRate) / currency.previousRate) * 100).toFixed(3)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(currency.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(currency.lastUpdated)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedCurrency(currency)
                              setNewRate(String(currency.rateToDZD))
                              setShowRateDialog(true)
                            }}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Override Rate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(currency.code)}>
                              {currency.status === 'ACTIVE' ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exchange Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Rate Providers
                </CardTitle>
                <CardDescription>External exchange rate data sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRateProviders.map((provider) => (
                  <div key={provider.name} className={`p-4 rounded-lg border ${
                    provider.status === 'OPERATIONAL' ? 'bg-green-50 border-green-200' :
                    provider.status === 'DEGRADED' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getProviderStatusIcon(provider.status)}
                        <span className="font-medium">{provider.fullName}</span>
                      </div>
                      <Badge variant={
                        provider.status === 'OPERATIONAL' ? 'default' :
                        provider.status === 'DEGRADED' ? 'secondary' : 'destructive'
                      }>
                        {provider.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Last sync: {provider.lastSync}</span>
                      <span>Latency: {provider.latency}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Rate Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Base Currency</p>
                  <p className="text-2xl font-bold text-green-800">🇩🇿 DZD (Algerian Dinar)</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Active Currencies</p>
                    <p className="text-xl font-bold">{currencies.filter(c => c.status === 'ACTIVE').length}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Manual Overrides</p>
                    <p className="text-xl font-bold text-orange-600">
                      {currencies.filter(c => c.isManualOverride).length}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Last Update</p>
                    <p className="text-sm font-medium">Just now</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Update Frequency</p>
                    <p className="text-sm font-medium">Every 5 min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rate History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Rate History (Last 30 Days)
              </CardTitle>
              <CardDescription>Historical exchange rate data visualization</CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Simplified chart representation */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-end justify-between h-64 gap-2">
                  {rateHistoryData.slice(-14).map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col gap-0.5">
                        <div 
                          className="bg-blue-500 rounded-t"
                          style={{ height: `${(day.USD / 140) * 80}px`, opacity: 0.8 }}
                          title={`USD: ${day.USD.toFixed(2)}`}
                        ></div>
                        <div 
                          className="bg-purple-500"
                          style={{ height: `${(day.EUR / 155) * 70}px`, opacity: 0.8 }}
                          title={`EUR: ${day.EUR.toFixed(2)}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 transform -rotate-45 origin-left mt-2">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm">USD/DZD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-sm">EUR/DZD</span>
                  </div>
                </div>
              </div>
              
              {/* Recent rates table */}
              <div className="mt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">USD</TableHead>
                      <TableHead className="text-right">EUR</TableHead>
                      <TableHead className="text-right">GBP</TableHead>
                      <TableHead className="text-right">TND</TableHead>
                      <TableHead className="text-right">MAD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateHistoryData.slice(-7).map((day, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{day.date}</TableCell>
                        <TableCell className="text-right">{day.USD.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{day.EUR.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{day.GBP.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{day.TND.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{day.MAD.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-500" />
                Recent Conversions
              </CardTitle>
              <CardDescription>Latest currency conversion requests</CardDescription>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead className="text-right">Rate Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockConversionLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell><code className="text-xs">{log.userId}</code></TableCell>
                      <TableCell><Badge variant="outline">{log.fromCurrency}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{log.toCurrency}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{formatNumber(log.amount)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(log.result)}</TableCell>
                      <TableCell className="text-right text-sm text-gray-500">{formatNumber(log.rateUsed, 4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Audit Log
              </CardTitle>
              <CardDescription>Track all changes to exchange rates and settings</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {mockAuditLog.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">{log.action.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                          {(log.previousValue || log.newValue) && (
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              {log.previousValue && (
                                <span className="line-through text-red-600">{log.previousValue}</span>
                              )}
                              {log.previousValue && log.newValue && <span>→</span>}
                              {log.newValue && (
                                <span className="text-emerald-600 font-medium">{log.newValue}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium">{log.user}</p>
                          <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  Auto-Detection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Auto-detect user currency</p>
                    <p className="text-xs text-gray-500">Based on IP geolocation</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Browser language detection</p>
                    <p className="text-xs text-gray-500">Use Accept-Language header</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Remember user preference</p>
                    <p className="text-xs text-gray-500">Store in cookies/localStorage</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-blue-500" />
                  Regional Defaults
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-sm text-blue-800">🇩🇿 Algeria Region</p>
                  <p className="text-sm text-blue-600 mt-1">Default: DZD | Fallback: USD, EUR</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">🌍 International / Other</p>
                  <p className="text-sm text-gray-600 mt-1">Default: USD | Fallback: EUR, GBP</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">🇹🇳 Tunisia Region</p>
                  <p className="text-sm text-gray-600 mt-1">Default: TND | Fallback: DZD, EUR</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">🇲🇦 Morocco Region</p>
                  <p className="text-sm text-gray-600 mt-1">Default: MAD | Fallback: DZD, EUR</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rate Override Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Override Exchange Rate</DialogTitle>
          </DialogHeader>
          
          {selectedCurrency && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCurrency.flag}</span>
                  <div>
                    <p className="font-semibold">{selectedCurrency.name}</p>
                    <p className="text-sm text-gray-500">{selectedCurrency.code} • Current: {formatNumber(selectedCurrency.rateToDZD, selectedCurrency.decimalPlaces)}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="new-rate">New Rate to DZD</Label>
                <Input
                  id="new-rate"
                  type="number"
                  step="0.0001"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="Enter new rate..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason for Override</Label>
                <textarea
                  id="reason"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  placeholder="Explain why this override is necessary..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                ></textarea>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Manual overrides will be logged in the audit trail. Auto-updates will be paused until manually re-enabled.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRateOverride}>
                  <Save className="mr-2 h-4 w-4" />
                  Apply Override
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
