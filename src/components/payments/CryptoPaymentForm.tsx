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
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Bitcoin,
  Hexagon,
  DollarSign,
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
} from 'lucide-react'
import { CryptoCurrency, CRYPTO_INFO, getNetworkFeeInfo } from '@/lib/payments/crypto'

interface CryptoPaymentFormProps {
  orderId: string
  amountDZD: number
  onPaymentComplete?: (paymentId: string) => void
  onPaymentError?: (error: string) => void
}

interface PaymentData {
  paymentId: string
  depositAddress: string
  expectedAmount: number
  cryptoCurrency: CryptoCurrency
  exchangeRate: number
  expiresAt: string
  qrCodeData: string
}

interface PaymentStatus {
  status: 'PENDING' | 'PARTIAL' | 'CONFIRMED' | 'EXPIRED' | 'OVERPAID'
  confirmations: number
  requiredConfirmations: number
  actualAmount?: number
  txHash?: string
}

// Crypto currency icons mapping
const CRYPTO_ICONS: Record<CryptoCurrency, typeof Bitcoin> = {
  BTC: Bitcoin,
  ETH: Hexagon,
  USDT: DollarSign,
  USDC: DollarSign,
}

export default function CryptoPaymentForm({
  orderId,
  amountDZD,
  onPaymentComplete,
  onPaymentError,
}: CryptoPaymentFormProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDT')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [showQRCode, setShowQRCode] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Fetch exchange rate when crypto selection changes
  const fetchExchangeRate = useCallback(async (crypto: CryptoCurrency) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/crypto/rates')
      const data = await response.json()
      
      if (data.success && data.data.rates[crypto]) {
        setExchangeRate(data.data.rates[crypto])
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExchangeRate(selectedCrypto)
  }, [selectedCrypto, fetchExchangeRate])

  // Create crypto payment
  const handleCreatePayment = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/payments/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: amountDZD,
          currency: selectedCrypto,
          buyerWalletAddress: walletAddress || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentData(data.data)
        startCountdown(new Date(data.data.expiresAt))
        startStatusMonitoring(data.data.paymentId)
        
        toast({
          title: 'Payment Created',
          description: `Send ${data.data.expectedAmount} ${selectedCrypto} to the address below.`,
        })
      } else {
        throw new Error(data.error || 'Failed to create payment')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onPaymentError?.(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Countdown timer
  const startCountdown = (expiresAt: Date) => {
    const updateTimer = () => {
      const remaining = expiresAt.getTime() - Date.now()
      setTimeRemaining(Math.max(0, remaining))
      
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPaymentStatus(prev => prev ? { ...prev, status: 'EXPIRED' } : null)
      }
    }

    updateTimer()
    intervalRef.current = setInterval(updateTimer, 1000)
  }

  // Monitor payment status
  const startStatusMonitoring = async (paymentId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/crypto/${paymentId}/status`)
        const data = await response.json()

        if (data.success) {
          setPaymentStatus({
            status: data.data.status,
            confirmations: data.data.confirmations,
            requiredConfirmations: data.data.requiredConfirmations,
            actualAmount: data.data.actualAmount,
            txHash: data.data.txHash,
          })

          // Notify on confirmation
          if (data.data.status === 'CONFIRMED') {
            onPaymentComplete?.(paymentId)
            toast({
              title: 'Payment Confirmed! 🎉',
              description: 'Your cryptocurrency payment has been confirmed.',
            })
            if (intervalRef.current) clearInterval(intervalRef.current)
          }

          // Stop if expired or final state
          if (['CONFIRMED', 'EXPIRED'].includes(data.data.status)) {
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }

    // Initial check
    await checkStatus()
    
    // Poll every 10 seconds
    const statusInterval = setInterval(checkStatus, 10000)
    
    // Store reference for cleanup
    intervalRef.current = statusInterval
  }

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!paymentData) return
    
    try {
      await navigator.clipboard.writeText(paymentData.depositAddress)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Format time remaining
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'CONFIRMED': return 'bg-green-500'
      case 'EXPIRED': return 'bg-red-500'
      case 'PARTIAL': return 'bg-orange-500'
      case 'OVERPAID': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const currentCryptoInfo = CRYPTO_INFO[selectedCrypto]
  const CryptoIcon = CRYPTO_ICONS[selectedCrypto]
  const networkFee = getNetworkFeeInfo(selectedCrypto)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Cryptocurrency Payment
            </CardTitle>
            <CardDescription>
              Pay with Bitcoin, Ethereum, Tether, or USD Coin
            </CardDescription>
          </CardHeader>
        </Card>

        {!paymentData ? (
          /* Step 1: Select Currency & Create Payment */
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Amount Display */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-3xl font-bold">{amountDZD.toLocaleString('fr-DZ')} DZD</p>
              </div>

              {/* Crypto Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  Select Cryptocurrency
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>{currentCryptoInfo.description.en}</p>
                    </TooltipContent>
                  </Tooltip>
                </label>

                <Select value={selectedCrypto} onValueChange={(v) => setSelectedCrypto(v as CryptoCurrency)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CRYPTO_INFO) as CryptoCurrency[]).map((crypto) => {
                      const info = CRYPTO_INFO[crypto]
                      const Icon = CRYPTO_ICONS[crypto]
                      return (
                        <SelectItem key={crypto} value={crypto}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: info.color }} />
                            <span>{info.fullName}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                {/* Selected Crypto Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: currentCryptoInfo.color + '40' }}>
                  <div 
                    className="p-2 rounded-full"
                    style={{ backgroundColor: currentCryptoInfo.color + '20' }}
                  >
                    <CryptoIcon className="h-6 w-6" style={{ color: currentCryptoInfo.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{currentCryptoInfo.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {currentCryptoInfo.description.en}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Display */}
              {exchangeRate && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm text-muted-foreground">Exchange Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">
                      1 {selectedCrypto} = {Math.round(exchangeRate).toLocaleString()} DZD
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => fetchExchangeRate(selectedCrypto)}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Estimated Amount */}
              {exchangeRate && (
                <div className="text-center p-4 rounded-lg border-2 border-dashed" style={{ borderColor: currentCryptoInfo.color }}>
                  <p className="text-sm text-muted-foreground">You'll send approximately</p>
                  <p className="text-2xl font-bold" style={{ color: currentCryptoInfo.color }}>
                    {(amountDZD / exchangeRate).toFixed(8)} {selectedCrypto}
                  </p>
                </div>
              )}

              {/* Optional Wallet Address for Refund */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Your Wallet Address (Optional)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Provide your wallet address for potential refunds.</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <Input
                  placeholder="0x... or bc1..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>

              {/* Network Fee Disclosure */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg space- y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Network Fee Notice</p>
                    <p>
                      Additional network fees apply (~{networkFee.estimate} {networkFee.currency}). 
                      This is paid to miners/validators, not AlgeriaTrade.
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Payment Button */}
              <Button
                onClick={handleCreatePayment}
                disabled={isCreating || !exchangeRate}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Create Payment Address
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Step 2: Payment Details & QR Code */
          <div className="space-y-6">
            {/* Status Badge */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(paymentStatus?.status || 'PENDING')} text-white`}
                    >
                      {paymentStatus?.status || 'PENDING'}
                    </Badge>
                    {paymentStatus?.status === 'PENDING' && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono font-bold">
                          {formatTime(timeRemaining)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {paymentStatus?.txHash && (
                    <a
                      href={`${CRYPTO_INFO[paymentData.cryptoCurrency].explorerUrl}${paymentStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      View Transaction
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Confirmations Progress */}
                {paymentStatus && paymentStatus.confirmations > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confirmations</span>
                      <span>
                        {paymentStatus.confirmations} / {paymentStatus.requiredConfirmations}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (paymentStatus.confirmations / paymentStatus.requiredConfirmations) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code and Address */}
            <Tabs defaultValue="qrcode" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qrcode" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Address
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qrcode" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 flex flex-col items-center">
                    {/* QR Code Placeholder - In production, generate real QR code */}
                    <div className="w-64 h-64 bg-white border-2 rounded-lg p-4 flex items-center justify-center mb-4">
                      <div className="text-center space-y-2">
                        <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                        <p className="text-xs text-gray-500">Scan with your wallet</p>
                      </div>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground mb-4">
                      Scan this QR code with your cryptocurrency wallet app
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => setShowQRCode(!showQRCode)}
                    >
                      {showQRCode ? 'Hide' : 'Show'} QR Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Deposit Address</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={paymentData.depositAddress}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyAddress}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold font-mono">
                          {paymentData.expectedAmount} {paymentData.cryptoCurrency}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Currency</p>
                        <p className="font-semibold">{CRYPTO_INFO[paymentData.cryptoCurrency].name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Important Information */}
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="pt-6 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Important
                </h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                  <li>Send only <strong>{paymentData.cryptoCurrency}</strong> to this address</li>
                  <li>Minimum confirmations required: {CRYPTO_INFO[paymentData.cryptoCurrency].name === 'Bitcoin' ? '3' : '12'}</li>
                  <li>Payment expires in <strong>{formatTime(timeRemaining)}</strong></li>
                  <li>Do not send from an exchange wallet unless it supports refunds</li>
                </ul>
              </CardContent>
            </Card>

            {/* Educational Tooltips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Learn More
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      What is {CRYPTO_INFO[selectedCrypto].name}?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CryptoIcon style={{ color: currentCryptoInfo.color }} />
                        About {currentCryptoInfo.name}
                      </DialogTitle>
                      <DialogDescription className="space-y-3 pt-2">
                        <p>{currentCryptoInfo.description.en}</p>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <h5 className="font-medium">Key Facts:</h5>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Symbol: {currentCryptoInfo.symbol}</li>
                            <li>Network: {selectedCrypto === 'BTC' ? 'Bitcoin Network' : 'Ethereum (ERC-20)'}</li>
                            <li>Confirmation Time: ~{selectedCrypto === 'BTC' ? '10-60 minutes' : '2-10 minutes'}</li>
                            <li>Network Fee: ~{networkFee.estimate} {networkFee.currency}</li>
                          </ul>
                        </div>

                        <Separator />

                        <p className="text-xs text-muted-foreground">
                          AlgeriaTrade.dz supports cryptocurrency payments for international trade convenience.
                          All payments are converted to DZD at the current market rate.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Shield className="mr-2 h-4 w-4" />
                      How are payments secured?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Payment Security</DialogTitle>
                      <DialogDescription className="space-y-3 pt-2">
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-medium">Blockchain Confirmation</h5>
                              <p className="text-sm">
                                Payments are only confirmed after sufficient blockchain confirmations.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-medium">Time-Limited Window</h5>
                              <p className="text-sm">
                                Each payment has a 15-minute window to prevent price volatility issues.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Zap className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-medium">Real-Time Monitoring</h5>
                              <p className="text-sm">
                                We monitor the blockchain in real-time for instant confirmation.
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Success State */}
            {paymentStatus?.status === 'CONFIRMED' && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                    Payment Confirmed!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    Your cryptocurrency payment has been received and confirmed.
                  </p>
                  {paymentStatus.txHash && (
                    <p className="text-sm font-mono text-green-600 break-all">
                      TX: {paymentStatus.txHash}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Expired State */}
            {paymentStatus?.status === 'EXPIRED' && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-6 text-center space-y-3">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
                  <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">
                    Payment Expired
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    The payment window has expired. Please create a new payment.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentData(null)
                      setPaymentStatus(null)
                      if (intervalRef.current) clearInterval(intervalRef.current)
                    }}
                  >
                    Create New Payment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
