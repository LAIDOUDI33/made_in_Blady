'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Copy,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  QrCode,
  RefreshCw,
  Shield,
  Zap,
  HelpCircle,
  Timer,
  Send,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { QRCodeDisplay } from './QRCodeDisplay'
import { CryptoWalletSelector } from './CryptoWalletSelector'
import type { SupportedCrypto } from '@/lib/payments/crypto/config'

// Types
interface CryptoPaymentFormProps {
  orderId: string
  amountDZD: number
  userId?: string
  onPaymentComplete?: (paymentId: string) => void
  onPaymentError?: (error: string) => void
}

interface PaymentData {
  paymentId: string
  receivingAddress: string
  expectedAmount: number
  amountInDZD: number
  exchangeRate: number
  cryptocurrency: SupportedCrypto
  network?: string
  expiresAt: string
  qrCodeData: string
  status: string
  requiredConfirmations: number
  networkFeeEstimate?: string
}

interface PaymentStatus {
  status: 'PENDING' | 'AWAITING_CONFIRMATION' | 'CONFIRMING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
  confirmations: number
  requiredConfirmations: number
  txHash?: string
  remainingTimeMs: number
  confirmationProgress: number
  isExpired: boolean
  isCompleted: boolean
}

interface ExchangeRateData {
  rateToDZD: number
  rateToUSD: number
  source: string
  fetchedAt: string
}

// Crypto metadata for display
const CRYPTO_OPTIONS = [
  { value: 'USDT', label: 'USDT (Tether)', icon: '💵', color: '#26A17B', isStablecoin: true },
  { value: 'BTC', label: 'Bitcoin', icon: '₿', color: '#F7931A', isStablecoin: false },
  { value: 'ETH', label: 'Ethereum', icon: 'Ξ', color: '#627EEA', isStablecoin: false },
  { value: 'USDC', label: 'USDC', icon: '$', color: '#2775CA', isStablecoin: true },
]

export function CryptoPaymentForm({
  orderId,
  amountDZD,
  userId = 'demo-user',
  onPaymentComplete,
  onPaymentError,
}: CryptoPaymentFormProps) {
  // State
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto>('USDT')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('TRC20')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showManualConfirm, setShowManualConfirm] = useState(false)
  const [manualTxHash, setManualTxHash] = useState('')
  const [isSubmittingTx, setIsSubmittingTx] = useState(false)
  
  // Refs
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const { toast } = useToast()

  // Fetch exchange rate when crypto changes
  useEffect(() => {
    fetchExchangeRate(selectedCrypto)
  }, [selectedCrypto])

  // Poll payment status when active
  useEffect(() => {
    if (paymentData && !['COMPLETED', 'EXPIRED', 'FAILED'].includes(paymentStatus?.status || '')) {
      startStatusPolling()
    }
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
      }
    }
  }, [paymentData, paymentStatus?.status])

  // Functions
  const fetchExchangeRate = async (crypto: SupportedCrypto) => {
    try {
      const response = await fetch(`/api/payments/crypto/rates?crypto=${crypto}`)
      const result = await response.json()
      
      if (result.success) {
        setExchangeRate({
          rateToDZD: result.data.rateToDZD,
          rateToUSD: result.data.rateToUSD,
          source: result.data.source,
          fetchedAt: result.data.fetchedAt,
        })
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
    }
  }

  const createPaymentOrder = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/payments/crypto/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId,
          amountInDZD: amountDZD,
          cryptocurrency: selectedCrypto,
          network: selectedNetwork,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPaymentData(result.data)
        
        toast({
          title: 'Payment Created',
          description: `Send ${result.data.expectedAmount} ${selectedCrypto} to the provided address`,
        })
      } else {
        throw new Error(result.error || 'Failed to create payment')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payment order',
        variant: 'destructive',
      })
      onPaymentError?.(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentData?.paymentId) return

    setIsCheckingStatus(true)
    
    try {
      const response = await fetch(`/api/payments/crypto/check-status/${paymentData.paymentId}`)
      const result = await response.json()

      if (result.success) {
        setPaymentStatus(result.data)

        if (result.data.isCompleted) {
          stopStatusPolling()
          onPaymentComplete?.(paymentData.paymentId)
          
          toast({
            title: 'Payment Completed! 🎉',
            description: 'Your cryptocurrency payment has been confirmed.',
          })
        }

        if (result.data.isExpired) {
          stopStatusPolling()
          toast({
            title: 'Payment Expired',
            description: 'The payment window has expired. Please create a new payment.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }, [paymentData?.paymentId, onPaymentComplete, toast])

  const startStatusPolling = () => {
    if (statusIntervalRef.current) return
    
    // Initial check
    checkPaymentStatus()
    
    // Poll every 15 seconds
    statusIntervalRef.current = setInterval(checkPaymentStatus, 15000)
  }

  const stopStatusPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      
      toast({
        title: 'Copied!',
        description: `${field} copied to clipboard`,
      })
      
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const submitManualConfirmation = async () => {
    if (!manualTxHash.trim() || !paymentData) return

    setIsSubmittingTx(true)
    
    try {
      const response = await fetch('/api/payments/crypto/manual-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          txHash: manualTxHash.trim(),
          userId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowManualConfirm(false)
        setManualTxHash('')
        
        toast({
          title: 'Transaction Submitted',
          description: 'Your transaction hash has been submitted for verification.',
        })

        // Refresh status
        checkPaymentStatus()
      } else {
        throw new Error(result.error || 'Submission failed')
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit transaction',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingTx(false)
    }
  }

  // Calculate formatted amounts
  const formatAmount = (amount: number, decimals = 6) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: Math.min(decimals, 4),
      maximumFractionDigits: decimals,
    })
  }

  const getRemainingTime = () => {
    if (!paymentStatus?.remainingTimeMs) return '--:--'
    
    const minutes = Math.floor(paymentStatus.remainingTimeMs / 60000)
    const seconds = Math.floor((paymentStatus.remainingTimeMs % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_CONFIRMATION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'CONFIRMING':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400'
      case 'EXPIRED':
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_CONFIRMATION':
        return <Clock className="h-4 w-4" />
      case 'CONFIRMING':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4" />
      case 'EXPIRED':
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  // Render helpers
  const selectedCryptoOption = CRYPTO_OPTIONS.find(c => c.value === selectedCrypto)

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Cryptocurrency Payment
                </CardTitle>
                <CardDescription>
                  Pay with Bitcoin, Ethereum, USDT, or USDC
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                International Buyers
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Step 1: Select Cryptocurrency */}
        {!paymentData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Choose Cryptocurrency</CardTitle>
              <CardDescription>
                Order Amount: <span className="font-semibold">{formatAmount(amountDZD, 2)} DZD</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Crypto Selector */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CRYPTO_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedCrypto(option.value as SupportedCrypto)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedCrypto === option.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-muted hover:border-muted-foreground/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <span className="text-2xl">{option.icon}</span>
                      <div className={`font-medium text-sm ${selectedCrypto === option.value ? 'text-primary' : ''}`}>
                        {option.label}
                      </div>
                      {option.isStablecoin && (
                        <Badge variant="secondary" className="text-xs">Stable</Badge>
                      )}
                      {exchangeRate && selectedCrypto === option.value && (
                        <div className="text-xs text-muted-foreground">
                          1 {option.value} ≈ {formatAmount(exchangeRate.rateToDZD, 2)} DZD
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Network Selector (for USDT/USDC) */}
              {(selectedCrypto === 'USDT' || selectedCrypto === 'USDC') && (
                <CryptoWalletSelector
                  cryptocurrency={selectedCrypto}
                  selectedNetwork={selectedNetwork}
                  onNetworkSelect={setSelectedNetwork}
                />
              )}

              {/* Exchange Rate Info */}
              {exchangeRate && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Exchange Rate</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">
                      1 {selectedCrypto} = {formatAmount(exchangeRate.rateToDZD, 4)} DZD
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Source: {exchangeRate.source} • Updated: {new Date(exchangeRate.fetchedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Calculated Amount */}
              {exchangeRate && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">You will send</p>
                    <p className="text-3xl font-bold" style={{ color: selectedCryptoOption?.color }}>
                      {formatAmount(amountDZD / exchangeRate.rateToDZD, 6)}
                    </p>
                    <p className="text-lg text-muted-foreground">{selectedCrypto}</p>
                  </div>
                </div>
              )}

              {/* Create Payment Button */}
              <Button
                onClick={createPaymentOrder}
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Payment Order
                  </>
                )}
              </Button>

              {/* Warning */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Crypto Risk Warning:</strong> Cryptocurrency prices are volatile. 
                    The exchange rate will be locked for 15 minutes after creating the payment.
                    Make sure to complete the transfer within this window.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Details (after creation) */}
        {paymentData && (
          <>
            {/* Status Bar */}
            <Card className={getStatusColor(paymentStatus?.status || paymentData.status)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(paymentStatus?.status || paymentData.status)}
                    <div>
                      <p className="font-semibold capitalize">
                        {paymentStatus?.status?.replace(/_/g, ' ') || paymentData.status.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs opacity-80">
                        Payment ID: {paymentData.paymentId}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {paymentStatus && !paymentStatus.isCompleted && !paymentStatus.isExpired && (
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="h-4 w-4" />
                        <span className="font-mono font-bold">{getRemainingTime()}</span>
                      </div>
                    )}
                    
                    {paymentStatus?.confirmations !== undefined && paymentStatus.status === 'CONFIRMING' && (
                      <div className="w-32">
                        <Progress value={paymentStatus.confirmationProgress} className="h-2" />
                        <p className="text-xs mt-1 text-center">
                          {paymentStatus.confirmations}/{paymentStatus.requiredConfirmations} confirmations
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="payment" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="payment">
                  <QrCode className="mr-2 h-4 w-4" />
                  Payment
                </TabsTrigger>
                <TabsTrigger value="details">
                  <Info className="mr-2 h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="history">
                  <Clock className="mr-2 h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Payment Tab - QR Code & Address */}
              <TabsContent value="payment" className="space-y-4">
                <QRCodeDisplay
                  value={paymentData.qrCodeData}
                  title={`Pay with ${paymentData.cryptocurrency}`}
                  amount={formatAmount(paymentData.expectedAmount, 6)}
                  cryptocurrency={paymentData.cryptocurrency}
                  address={paymentData.receivingAddress}
                  size={220}
                />

                {/* Wallet Address */}
                <Card>
                  <CardContent className="p-4">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Deposit Address ({paymentData.network || 'Mainnet'})
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={paymentData.receivingAddress}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(paymentData.receivingAddress, 'Address')}
                      >
                        {copiedField === 'Address' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Amount to Send */}
                <Card>
                  <CardContent className="p-4">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Exact Amount to Send
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={`${formatAmount(paymentData.expectedAmount, 8)} ${paymentData.cryptocurrency}`}
                        readOnly
                        className="font-mono text-lg font-bold"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(
                          `${formatAmount(paymentData.expectedAmount, 8)} ${paymentData.cryptocurrency}`,
                          'Amount'
                        )}
                      >
                        {copiedField === 'Amount' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {paymentData.networkFeeEstimate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        + Network fee: {paymentData.networkFeeEstimate}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Manual Confirmation */}
                {!paymentStatus?.isCompleted && !paymentStatus?.isExpired && (
                  <Card>
                    <CardContent className="p-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowManualConfirm(true)}
                        className="w-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        I've Sent the Payment - Submit TX Hash
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Explorer Link */}
                {paymentStatus?.txHash && (
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Transaction Confirmed!</p>
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                          {paymentStatus.txHash}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/payments/crypto/check-status/${paymentData.paymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono text-sm">{orderId}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Amount</span>
                      <span className="font-semibold">{formatAmount(paymentData.amountInDZD, 2)} DZD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crypto Amount</span>
                      <span className="font-semibold" style={{ color: selectedCryptoOption?.color }}>
                        {formatAmount(paymentData.expectedAmount, 6)} {paymentData.cryptocurrency}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <span>1 {paymentData.cryptocurrency} = {formatAmount(paymentData.exchangeRate, 4)} DZD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network</span>
                      <Badge variant="secondary">{paymentData.network || 'Mainnet'}</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Required Confirmations</span>
                      <span>{paymentData.requiredConfirmations}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires At</span>
                      <span>{new Date(paymentData.expiresAt).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Rate locked for 15 minutes from creation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Transaction monitored until confirmation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Funds held securely until confirmations complete</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <TimelineItem
                        status="completed"
                        title="Payment Order Created"
                        time={new Date().toLocaleString()}
                        description={`Payment ${paymentData.paymentId} created`}
                      />
                      
                      <TimelineItem
                        status={paymentStatus?.status === 'PENDING' ? 'current' : 
                               paymentStatus && ['AWAITING_CONFIRMATION', 'CONFIRMING', 'COMPLETED'].includes(paymentStatus.status) ? 'completed' : 'pending'}
                        title="Awaiting Payment"
                        description="Send crypto to the provided address"
                      />
                      
                      <TimelineItem
                        status={paymentStatus?.status === 'CONFIRMING' ? 'current' :
                               paymentStatus?.status === 'COMPLETED' ? 'completed' : 'pending'}
                        title="Confirming Transaction"
                        description="Waiting for blockchain confirmations"
                      />
                      
                      <TimelineItem
                        status={paymentStatus?.isCompleted ? 'completed' : 'pending'}
                        title="Payment Complete"
                        description="Order will be processed"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Manual Confirmation Dialog */}
        <Dialog open={showManualConfirm} onOpenChange={setShowManualConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Transaction Hash</DialogTitle>
              <DialogDescription>
                If you've already sent the payment, paste the transaction hash (TXID) here.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Hash (TXID)</label>
                <Input
                  placeholder="0x... or abc123..."
                  value={manualTxHash}
                  onChange={(e) => setManualTxHash(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  You can find this in your wallet's transaction history or on the blockchain explorer.
                </p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowManualConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitManualConfirmation}
                  disabled={!manualTxHash.trim() || isSubmittingTx}
                >
                  {isSubmittingTx ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

// Timeline component for payment history
function TimelineItem({ 
  status, 
  title, 
  description, 
  time 
}: { 
  status: 'completed' | 'current' | 'pending'
  title: string
  description: string
  time?: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          status === 'completed' ? 'bg-green-100 text-green-600' :
          status === 'current' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200' :
          'bg-gray-100 text-gray-400'
        }`}>
          {status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : status === 'current' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        {status !== 'pending' && <div className="w-0.5 h-full bg-border mt-1" />}
      </div>
      
      <div className="pb-6">
        <p className={`font-medium ${status === 'pending' ? 'text-muted-foreground' : ''}`}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {time && <p className="text-xs text-muted-foreground mt-1">{time}</p>}
      </div>
    </div>
  )
}

export default CryptoPaymentForm
