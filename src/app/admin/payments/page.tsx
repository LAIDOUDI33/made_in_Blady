'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Building2,
  Bitcoin,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Settings,
  Shield,
  Webhook,
  ToggleLeft,
  ToggleRight,
  Server,
  Key,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  DollarSign,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Types
interface ProviderStatus {
  name: string
  icon: React.ReactNode
  status: 'configured' | 'partial' | 'missing' | 'error'
  enabled: boolean
  environment: string
  lastTest?: TestResult
}

interface TestResult {
  success: boolean
  message: string
  responseTime?: number
  error?: string
  testedAt: Date
}

interface ValidationData {
  isValid: boolean
  providers: Array<{
    name: string
    provider: string
    status: string
    missingFields: string[]
    warnings: string[]
    details?: Record<string, unknown>
  }>
  environment: string
}

interface WebhookConfig {
  provider: string
  url: string
  events: string[]
  setupUrl: string
  hasSecret: boolean
  status: string
}

// Icons for providers
const SatimIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
    <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
  </div>
)

const StripeIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
    <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
  </div>
)

const CryptoIcon = () => (
  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
    <Bitcoin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
  </div>
)

export default function AdminPaymentsSettingsPage() {
  const [validationData, setValidationData] = useState<ValidationData | null>(null)
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string>('overview')
  
  // Payment method toggles
  const [paymentMethods, setPaymentMethods] = useState({
    satim: true,
    stripe: true,
    crypto: false,
  })

  // Fetch validation data
  const fetchValidationData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/payments/config')
      if (response.ok) {
        const data = await response.json()
        setValidationData(data.validation)
        setWebhookConfigs(data.webhooks || [])
        setPaymentMethods(data.paymentMethods || paymentMethods)
      }
    } catch (error) {
      console.error('Failed to fetch validation data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchValidationData()
  }, [fetchValidationData])

  // Test connection to provider
  const testConnection = async (provider: string) => {
    setTestingProvider(provider)
    try {
      const response = await fetch(`/api/admin/payments/test?provider=${provider}`)
      if (response.ok) {
        const result = await response.json()
        // Update local state with test result
        if (validationData) {
          const updatedProviders = validationData.providers.map(p => 
            p.provider === provider 
              ? { ...p, lastTest: result }
              : p
          )
          setValidationData({ ...validationData, providers: updatedProviders })
        }
      }
    } catch (error) {
      console.error('Connection test failed:', error)
    } finally {
      setTestingProvider(null)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Configured</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" /> Partial</Badge>
      case 'missing':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Missing</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Get environment badge
  const getEnvironmentBadge = (env: string) => {
    const isProduction = env === 'production'
    return (
      <Badge variant={isProduction ? "default" : "secondary"} className={cn(
        isProduction ? "bg-red-500" : "bg-blue-500 text-white"
      )}>
        <Server className="w-3 h-3 mr-1" />
        {isProduction ? 'Production' : env === 'test' ? 'Sandbox/Test' : env}
      </Badge>
    )
  }

  // Toggle secret visibility
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Mask value for display
  const maskValue = (value: string | undefined, visible: boolean): string => {
    if (!value) return 'Not configured'
    if (visible) return value
    if (value.length <= 8) return '••••••••'
    return `${value.substring(0, 4)}${'•'.repeat(Math.min(value.length - 4, 24))}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading payment configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Payment Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage SATIM, Stripe, and cryptocurrency payment integrations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchValidationData}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => window.open('/api/admin/payments/validate', '_blank')}>
            <Shield className="w-4 h-4 mr-2" />
            Run Full Validation
          </Button>
        </div>
      </div>

      {/* Environment Banner */}
      <Card className={cn(
        "border-l-4",
        validationData?.environment === 'production' 
          ? "border-l-red-500 bg-red-50 dark:bg-red-950/20" 
          : "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Current Environment:</span>
            {getEnvironmentBadge(validationData?.environment || 'unknown')}
            <span className="text-sm text-muted-foreground ml-auto">
              App URL: {process.env.NEXT_PUBLIC_APP_URL || 'https://algeriatrade.dz'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SATIM Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <SatimIcon />
              <Switch 
                checked={paymentMethods.satim}
                onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, satim: checked }))}
              />
            </div>
            <CardTitle className="text-lg mt-3">SATIM / CIB</CardTitle>
            <CardDescription>Algerian local card payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(validationData?.providers.find(p => p.provider === 'satim')?.status || 'missing')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Environment</span>
                {getEnvironmentBadge(validationData?.providers.find(p => p.provider === 'satim')?.details?.environment as string || 'test')}
              </div>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => testConnection('satim')}
                disabled={testingProvider === 'satim'}
              >
                {testingProvider === 'satim' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setSelectedProvider(selectedProvider === 'satim' ? null : 'satim')}
              >
                {selectedProvider === 'satim' ? 'Hide Details' : 'View Details'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <StripeIcon />
              <Switch 
                checked={paymentMethods.stripe}
                onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, stripe: checked }))}
              />
            </div>
            <CardTitle className="text-lg mt-3">Stripe</CardTitle>
            <CardDescription>International card payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(validationData?.providers.find(p => p.provider === 'stripe')?.status || 'missing')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Currencies</span>
                <Badge variant="outline">EUR, USD, GBP +3</Badge>
              </div>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => testConnection('stripe')}
                disabled={testingProvider === 'stripe'}
              >
                {testingProvider === 'stripe' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setSelectedProvider(selectedProvider === 'stripe' ? null : 'stripe')}
              >
                {selectedProvider === 'stripe' ? 'Hide Details' : 'View Details'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Crypto Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CryptoIcon />
              <Switch 
                checked={paymentMethods.crypto}
                onCheckedChange={(checked) => setPaymentMethods(prev => ({ ...prev, crypto: checked }))}
              />
            </div>
            <CardTitle className="text-lg mt-3">Cryptocurrency</CardTitle>
            <CardDescription>USDT, BTC, ETH payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(validationData?.providers.find(p => p.provider === 'crypto')?.status || 'missing')}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Supported</span>
                <Badge variant="outline">USDT, BTC, ETH, USDC</Badge>
              </div>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => testConnection('crypto')}
                disabled={testingProvider === 'crypto'}
              >
                {testingProvider === 'crypto' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setSelectedProvider(selectedProvider === 'crypto' ? null : 'crypto')}
              >
                {selectedProvider === 'crypto' ? 'Hide Details' : 'View Details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Provider Configuration */}
      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              {selectedProvider === 'satim' ? 'SATIM/CIB Configuration' : 
               selectedProvider === 'stripe' ? 'Stripe Configuration' : 
               'Cryptocurrency Configuration'}
            </CardTitle>
            <CardDescription>
              API keys and credentials. Click the eye icon to reveal values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProvider === 'satim' && (
                  <>
                    <TableRow>
                      <TableCell className="font-medium">Merchant ID</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.SATIM_MERCHANT_ID, showSecrets['satim_merchant'])}
                      </TableCell>
                      <TableCell>{process.env.SATIM_MERCHANT_ID ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('satim_merchant')}>
                          {showSecrets['satim_merchant'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">API Key</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.SATIM_API_KEY, showSecrets['satim_apikey'])}
                      </TableCell>
                      <TableCell>{process.env.SATIM_API_KEY ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('satim_apikey')}>
                          {showSecrets['satim_apikey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">API Secret</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.SATIM_API_SECRET, showSecrets['satim_secret'])}
                      </TableCell>
                      <TableCell>{process.env.SATIM_API_SECRET ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('satim_secret')}>
                          {showSecrets['satim_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Webhook Secret</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.SATIM_WEBHOOK_SECRET, showSecrets['satim_webhook'])}
                      </TableCell>
                      <TableCell>{process.env.SATIM_WEBHOOK_SECRET ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('satim_webhook')}>
                          {showSecrets['satim_webhook'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </>
                )}
                {selectedProvider === 'stripe' && (
                  <>
                    <TableRow>
                      <TableCell className="font-medium">Secret Key</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.STRIPE_SECRET_KEY, showSecrets['stripe_secret'])}
                      </TableCell>
                      <TableCell>{process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?
                        <AlertTriangle className="w-4 h-4 text-yellow-500" /> :
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('stripe_secret')}>
                          {showSecrets['stripe_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Publishable Key</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.STRIPE_PUBLISHABLE_KEY, showSecrets['stripe_publishable'])}
                      </TableCell>
                      <TableCell>{process.env.STRIPE_PUBLISHABLE_KEY ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('stripe_publishable')}>
                          {showSecrets['stripe_publishable'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Webhook Secret</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.STRIPE_WEBHOOK_SECRET, showSecrets['stripe_webhook'])}
                      </TableCell>
                      <TableCell>{process.env.STRIPE_WEBHOOK_SECRET ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('stripe_webhook')}>
                          {showSecrets['stripe_webhook'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </>
                )}
                {selectedProvider === 'crypto' && (
                  <>
                    <TableRow>
                      <TableCell className="font-medium">USDT TRC20 Wallet</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.USDT_TRC20_WALLET_ADDRESS, showSecrets['usdt_trc20'])}
                      </TableCell>
                      <TableCell>{process.env.USDT_TRC20_WALLET_ADDRESS ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('usdt_trc20')}>
                          {showSecrets['usdt_trc20'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">USDT ERC20 Wallet</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.USDT_ERC20_WALLET_ADDRESS, showSecrets['usdt_erc20'])}
                      </TableCell>
                      <TableCell>{process.env.USDT_ERC20_WALLET_ADDRESS ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('usdt_erc20')}>
                          {showSecrets['usdt_erc20'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">BTC Wallet</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.BTC_WALLET_ADDRESS, showSecrets['btc_wallet'])}
                      </TableCell>
                      <TableCell>{process.env.BTC_WALLET_ADDRESS ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('btc_wallet')}>
                          {showSecrets['btc_wallet'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ETH Wallet</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.ETH_WALLET_ADDRESS, showSecrets['eth_wallet'])}
                      </TableCell>
                      <TableCell>{process.env.ETH_WALLET_ADDRESS ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('eth_wallet')}>
                          {showSecrets['eth_wallet'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Crypto Webhook Secret</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(process.env.CRYPTO_WEBHOOK_SECRET, showSecrets['crypto_webhook'])}
                      </TableCell>
                      <TableCell>{process.env.CRYPTO_WEBHOOK_SECRET ? 
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                        <XCircle className="w-4 h-4 text-red-500" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleSecretVisibility('crypto_webhook')}>
                          {showSecrets['crypto_webhook'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Webhook Configuration Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer select-none"
          onClick={() => setExpandedSection(expandedSection === 'webhooks' ? '' : 'webhooks')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Webhook className="w-5 h-5" />
              <div>
                <CardTitle>Webhook Endpoints</CardTitle>
                <CardDescription>Configure webhook URLs in each provider dashboard</CardDescription>
              </div>
            </div>
            {expandedSection === 'webhooks' ? 
              <ChevronUp className="w-5 h-5" /> : 
              <ChevronDown className="w-5 h-5" />
            }
          </div>
        </CardHeader>
        {expandedSection === 'webhooks' && (
          <CardContent>
            <div className="space-y-4">
              {webhookConfigs.map((webhook, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold">
                      {webhook.provider === 'SATIM / CIB' && <SatimIcon />}
                      {webhook.provider === 'Stripe' && <StripeIcon />}
                      {webhook.provider === 'Crypto Payments' && <CryptoIcon />}
                      <span>{webhook.provider}</span>
                    </div>
                    <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                      {webhook.status}
                    </Badge>
                  </div>
                  
                  <div className="bg-muted/50 rounded-md p-3 flex items-center justify-between gap-2">
                    <code className="text-sm break-all">{webhook.url}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(webhook.url)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Events:</span>
                    {webhook.events.map((event, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{event}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Webhook Secret: {webhook.hasSecret ? 
                        <span className="text-green-600">Configured</span> : 
                        <span className="text-red-500">Not configured</span>}
                    </span>
                    <Button variant="link" size="sm" asChild>
                      <a href={webhook.setupUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Setup Guide
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Exchange Rate Providers */}
      <Card>
        <CardHeader 
          className="cursor-pointer select-none"
          onClick={() => setExpandedSection(expandedSection === 'exchange' ? '' : 'exchange')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" />
              <div>
                <CardTitle>Exchange Rate Providers</CardTitle>
                <CardDescription>DZD/USD/EUR conversion rate APIs</CardDescription>
              </div>
            </div>
            {expandedSection === 'exchange' ? 
              <ChevronUp className="w-5 h-5" /> : 
              <ChevronDown className="w-5 h-5" />
            }
          </div>
        </CardHeader>
        {expandedSection === 'exchange' && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Fixer.io</TableCell>
                  <TableCell>
                    {process.env.FIXER_API_KEY && !process.env.FIXER_API_KEY.includes('your_') ? 
                      <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge> : 
                      <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Not Set</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {maskValue(process.env.FIXER_API_KEY, showSecrets['fixer_key'])}
                  </TableCell>
                  <TableCell><Badge variant="outline">Free/Paid</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CoinGecko</TableCell>
                  <TableCell>
                    <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                    <span className="text-xs text-muted-foreground ml-2">(Free tier)</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {maskValue(process.env.COINGECKO_API_KEY, showSecrets['coingecko_key']) || 'Optional'}
                  </TableCell>
                  <TableCell><Badge variant="outline">Free</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ExchangeRate-API</TableCell>
                  <TableCell>
                    {process.env.EXCHANGERATE_API_KEY && !process.env.EXCHANGERATE_API_KEY.includes('your_') ? 
                      <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge> : 
                      <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Not Set</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {maskValue(process.env.EXCHANGERATE_API_KEY, showSecrets['exchangerate_key'])}
                  </TableCell>
                  <TableCell><Badge variant="outline">Free/Paid</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                At least one exchange rate API should be configured for accurate currency conversion. 
                CoinGecko works without an API key for basic usage but has rate limits.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Warnings & Issues */}
      {validationData && validationData.providers.some(p => p.warnings.length > 0 || p.missingFields.length > 0) && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Configuration Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationData.providers.map((provider, index) => (
                <div key={index}>
                  {provider.missingFields.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium text-red-600">{provider.name} - Missing:</span>
                      <ul className="list-disc list-inside ml-4 text-sm text-red-600">
                        {provider.missingFields.map((field, i) => (
                          <li key={i}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {provider.warnings.length > 0 && (
                    <div>
                      <span className="font-medium text-yellow-600">{provider.name} - Warnings:</span>
                      <ul className="list-disc list-inside ml-4 text-sm text-yellow-600">
                        {provider.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/docs/payment-webhooks">
                <Webhook className="w-6 h-6" />
                <span>View Webhook Docs</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Run: bun scripts/rotate-keys.sh --provider satim') }}>
                <Key className="w-6 h-6" />
                <span>Rotate Keys</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-6 h-6" />
                <span>Stripe Dashboard</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="https://www.cib.dz" target="_blank" rel="noopener noreferrer">
                <Globe className="w-6 h-6" />
                <span>CIB Portal</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
