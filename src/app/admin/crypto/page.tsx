'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bitcoin,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  QrCode,
  Activity,
  Wifi,
  TrendingUp,
  ExternalLink,
  Eye,
  Copy,
  MoreVertical,
  Zap,
  Globe,
  Server
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface CryptoPayment {
  id: string
  paymentId: string
  cryptoType: 'USDT' | 'BTC' | 'ETH' | 'USDC' | 'DAI'
  network: 'TRC20' | 'ERC20' | 'BEP20' | 'BITCOIN'
  amountCrypto: number
  amountDZD: number
  confirmations: number
  requiredConfirmations: number
  status: 'PENDING' | 'CONFIRMING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
  createdAt: string
  expiresAt: string
  walletAddress: string
  txHash?: string
  buyerName: string
  orderId: string
}

interface ExchangeRate {
  crypto: string
  rate: number
  change24h: number
}

interface NetworkFee {
  network: string
  avgFee: number
  unit: string
  estimatedTime: string
}

// Mock Data - 22 crypto payments
const mockPayments: CryptoPayment[] = [
  {
    id: '1', paymentId: 'CPY-2025-001', cryptoType: 'USDT', network: 'TRC20',
    amountCrypto: 150, amountDZD: 22500, confirmations: 12, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-20T10:30:00', expiresAt: '2025-01-20T11:30:00',
    walletAddress: 'TXxxxxxxxxxxxxxx...abc123', txHash: '0x8f2a3b4c...',
    buyerName: 'Ahmed Benali', orderId: 'ORD-2025-001'
  },
  {
    id: '2', paymentId: 'CPY-2025-002', cryptoType: 'BTC', network: 'BITCOIN',
    amountCrypto: 0.0045, amountDZD: 28000, confirmations: 3, requiredConfirmations: 6,
    status: 'CONFIRMING', createdAt: '2025-01-20T14:15:00', expiresAt: '2025-01-20T17:15:00',
    walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    buyerName: 'Fatima Zerhouni', orderId: 'ORD-2025-002'
  },
  {
    id: '3', paymentId: 'CPY-2025-003', cryptoType: 'USDT', network: 'ERC20',
    amountCrypto: 200, amountDZD: 30000, confirmations: 18, requiredConfirmations: 15,
    status: 'COMPLETED', createdAt: '2025-01-19T09:45:00', expiresAt: '2025-01-19T10:45:00',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8bE8F', txHash: '0x9c3b4d5e...',
    buyerName: 'Mohamed Amine', orderId: 'ORD-2025-003'
  },
  {
    id: '4', paymentId: 'CPY-2025-004', cryptoType: 'ETH', network: 'BITCOIN',
    amountCrypto: 0.025, amountDZD: 52000, confirmations: 0, requiredConfirmations: 24,
    status: 'PENDING', createdAt: '2025-01-20T16:00:00', expiresAt: '2025-01-20T19:00:00',
    walletAddress: '0xAb5801a7D398351b8bE11C439e05C5B3ae9b6aB8',
    buyerName: 'Nadia Bouazza', orderId: 'ORD-2025-004'
  },
  {
    id: '5', paymentId: 'CPY-2025-005', cryptoType: 'USDC', network: 'BEP20',
    amountCrypto: 180, amountDZD: 27000, confirmations: 10, requiredConfirmations: 12,
    status: 'CONFIRMING', createdAt: '2025-01-20T13:30:00', expiresAt: '2025-01-20T14:30:00',
    walletAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    buyerName: 'Rachid Hamadi', orderId: 'ORD-2025-005'
  },
  {
    id: '6', paymentId: 'CPY-2025-006', cryptoType: 'USDT', network: 'TRC20',
    amountCrypto: 500, amountDZD: 75000, confirmations: 0, requiredConfirmations: 12,
    status: 'PENDING', createdAt: '2025-01-20T17:45:00', expiresAt: '2025-01-20T18:45:00',
    walletAddress: 'TXxxxxxxxxxxxxxx...def456',
    buyerName: 'Samira Khelifi', orderId: 'ORD-2025-006'
  },
  {
    id: '7', paymentId: 'CPY-2025-007', cryptoType: 'DAI', network: 'ERC20',
    amountCrypto: 120, amountDZD: 18000, confirmations: 15, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-18T11:20:00', expiresAt: '2025-01-18T12:20:00',
    walletAddress: '0x4fAAmE91aC1a55EaC38D24b9c2F3eB145Ad81595', txHash: '0xa4c5d6e7...',
    buyerName: 'Kamel Djellouli', orderId: 'ORD-2025-007'
  },
  {
    id: '8', paymentId: 'CPY-2025-008', cryptoType: 'BTC', network: 'BITCOIN',
    amountCrypto: 0.008, amountDZD: 49800, confirmations: 0, requiredConfirmations: 6,
    status: 'EXPIRED', createdAt: '2025-01-19T08:00:00', expiresAt: '2025-01-19T09:00:00',
    walletAddress: 'bc1qcr70te3x5elr5k5nqlum3sc7tjf5mx2spvwvmz',
    buyerName: 'Amina Toubal', orderId: 'ORD-2025-008'
  },
  {
    id: '9', paymentId: 'CPY-2025-009', cryptoType: 'USDT', network: 'TRC20',
    amountCrypto: 75, amountDZD: 11250, confirmations: 12, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-20T07:15:00', expiresAt: '2025-01-20T08:15:00',
    walletAddress: 'TXxxxxxxxxxxxxxx...ghi789', txHash: '0xb5d6e7f8...',
    buyerName: 'Youssef Brahimi', orderId: 'ORD-2025-009'
  },
  {
    id: '10', paymentId: 'CPY-2025-010', cryptoType: 'ETH', network: 'ERC20',
    amountCrypto: 0.015, amountDZD: 31200, confirmations: 8, requiredConfirmations: 24,
    status: 'CONFIRMING', createdAt: '2025-01-20T15:00:00', expiresAt: '2025-01-20T18:00:00',
    walletAddress:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    buyerName: 'Lina Messaoudi', orderId: 'ORD-2025-010'
  },
  {
    id: '11', paymentId: 'CPY-2025-011', cryptoType: 'USDT', network: 'BEP20',
    amountCrypto: 320, amountDZD: 48000, confirmations: 14, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-19T14:30:00', expiresAt: '2025-01-19T15:30:00',
    walletAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', txHash: '0xc6e7f8g9...',
    buyerName: 'Omar Fettouhi', orderId: 'ORD-2025-011'
  },
  {
    id: '12', paymentId: 'CPY-2025-012', cryptoType: 'USDC', network: 'TRC20',
    amountCrypto: 250, amountDZD: 37500, confirmations: 0, requiredConfirmations: 12,
    status: 'PENDING', createdAt: '2025-01-20T18:20:00', expiresAt: '2025-01-20T19:20:00',
    walletAddress: 'TXxxxxxxxxxxxxxx...jkl012',
    buyerName: 'Hafsa Amrani', orderId: 'ORD-2025-012'
  },
  {
    id: '13', paymentId: 'CPY-2025-013', cryptoType: 'BTC', network: 'BITCOIN',
    amountCrypto: 0.012, amountDZD: 74700, confirmations: 5, requiredConfirmations: 6,
    status: 'CONFIRMING', createdAt: '2025-01-20T12:00:00', expiresAt: '2025-01-20T15:00:00',
    walletAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    buyerName: 'Bilal Charef', orderId: 'ORD-2025-013'
  },
  {
    id: '14', paymentId: 'CPY-2025-014', cryptoType: 'USDT', network: 'ERC20',
    amountCrypto: 90, amountDZD: 13500, confirmations: 12, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-19T16:45:00', expiresAt: '2025-01-19T17:45:00',
    walletAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', txHash: '0xd7f8g9h0...',
    buyerName: 'Meriem Kaced', orderId: 'ORD-2025-014'
  },
  {
    id: '15', paymentId: 'CPY-2025-015', cryptoType: 'DAI', network: 'BEP20',
    amountCrypto: 400, amountDZD: 60000, confirmations: 0, requiredConfirmations: 12,
    status: 'FAILED', createdAt: '2025-01-19T10:00:00', expiresAt: '2025-01-19T11:00:00',
    walletAddress: '0x1AF3F329e8BE1541474aDeC6c323945085bE6F90',
    buyerName: 'Abdelkrim Haddad', orderId: 'ORD-2025-015'
  },
  {
    id: '16', paymentId: 'CPY-2025-016', cryptoType: 'ETH', network: 'ERC20',
    amountCrypto: 0.038, amountDZD: 78960, confirmations: 20, requiredConfirmations: 24,
    status: 'CONFIRMING', createdAt: '2025-01-20T11:30:00', expiresAt: '2025-01-20T14:30:00',
    walletAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    buyerName: 'Nourhane Sadki', orderId: 'ORD-2025-016'
  },
  {
    id: '17', paymentId: 'CPY-2025-017', cryptoType: 'USDT', network: 'TRC20',
    amountCrypto: 175, amountDZD: 26250, confirmations: 12, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-20T06:00:00', expiresAt: '2025-01-20T07:00:00',
    walletAddress: 'TXxxxxxxxxxxxxxx...mno345', txHash: '0xe8g9h0i1...',
    buyerName: 'Imene Boudjelida', orderId: 'ORD-2025-017'
  },
  {
    id: '18', paymentId: 'CPY-2025-018', cryptoType: 'USDC', network: 'ERC20',
    amountCrypto: 280, amountDZD: 42000, confirmations: 0, requiredConfirmations: 12,
    status: 'PENDING', createdAt: '2025-01-20T19:00:00', expiresAt: '2025-01-20T20:00:00',
    walletAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    buyerName: 'Tarek Boussaid', orderId: 'ORD-2025-018'
  },
  {
    id: '19', paymentId: 'CPY-2025-019', cryptoType: 'BTC', network: 'BITCOIN',
    amountCrypto: 0.006, amountDZD: 37350, confirmations: 6, requiredConfirmations: 6,
    status: 'COMPLETED', createdAt: '2025-01-19T13:00:00', expiresAt: '2025-01-19T16:00:00',
    walletAddress: 'bc1qm3ld0x2zplnque2z0zqtuye2x2fzy6ylyv0nfq', txHash: 'f9h0i1j2...',
    buyerName: 'Sara Mellal', orderId: 'ORD-2025-019'
  },
  {
    id: '20', paymentId: 'CPY-2025-020', cryptoType: 'USDT', network: 'BEP20',
    amountCrypto: 450, amountDZD: 67500, confirmations: 11, requiredConfirmations: 12,
    status: 'CONFIRMING', createdAt: '2025-01-20T09:00:00', expiresAt: '2025-01-20T10:00:00',
    walletAddress: '0xe9e7CEA3DedcAc5963C8D5Ef8DF8B4120d294069',
    buyerName: 'Leila Mansouri', orderId: 'ORD-2025-020'
  },
  {
    id: '21', paymentId: 'CPY-2025-021', cryptoType: 'ETH', network: 'BEP20',
    amountCrypto: 0.02, amountDZD: 41600, confirmations: 0, requiredConfirmations: 15,
    status: 'PENDING', createdAt: '2025-01-20T19:30:00', expiresAt: '2025-01-20T21:30:00',
    walletAddress: '0x2170Ed0880ac9A755fd29B6AC4c99113e169bf41',
    buyerName: 'Farid Meziane', orderId: 'ORD-2025-021'
  },
  {
    id: '22', paymentId: 'CPY-2025-022', cryptoType: 'DAI', network: 'TRC20',
    amountCrypto: 160, amountDZD: 24000, confirmations: 12, requiredConfirmations: 12,
    status: 'COMPLETED', createdAt: '2025-01-18T15:30:00', expiresAt: '2025-01-18T16:30:00',
    walletAddress: 'TXxxxxxxxxxxxxxx...pqr678', txHash: '0xg0i1j2k3...',
    buyerName: 'Wassila Laifa', orderId: 'ORD-2025-022'
  }
]

const exchangeRates: ExchangeRate[] = [
  { crypto: 'USDT', rate: 150, change24h: 0.01 },
  { crypto: 'BTC', rate: 6225000, change24h: -2.34 },
  { crypto: 'ETH', rate: 2080000, change24h: 1.56 },
  { crypto: 'USDC', rate: 150, change24h: 0.00 },
  { crypto: 'DAI', rate: 149.85, change24h: -0.1 }
]

const networkFees: NetworkFee[] = [
  { network: 'TRC20 (USDT)', avgFee: 1, unit: 'USDT', estimatedTime: '< 1 min' },
  { network: 'ERC20 (USDT)', avgFee: 2.5, unit: 'USD', estimatedTime: '2-5 min' },
  { network: 'BEP20 (USDT)', avgFee: 0.2, unit: 'USD', estimatedTime: '< 1 min' },
  { network: 'Bitcoin', avgFee: 1500, unit: 'satoshi/byte', estimatedTime: '10-60 min' }
]

export default function CryptoAdminPage() {
  const [payments, setPayments] = useState<CryptoPayment[]>(mockPayments)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCrypto, setSelectedCrypto] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<CryptoPayment | null>(null)

  // Simulate real-time updates for confirming transactions
  useEffect(() => {
    const interval = setInterval(() => {
      setPayments(prev => prev.map(payment => {
        if (payment.status === 'CONFIRMING' && payment.confirmations < payment.requiredConfirmations) {
          return {
            ...payment,
            confirmations: Math.min(
              payment.confirmations + Math.floor(Math.random() * 2),
              payment.requiredConfirmations
            )
          }
        }
        // Auto-complete when confirmations reached
        if (payment.status === 'CONFIRMING' && payment.confirmations >= payment.requiredConfirmations) {
          return { ...payment, status: 'COMPLETED' as const }
        }
        return payment
      }))
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  // Calculate stats
  const todayVolume = payments
    .filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + p.amountDZD, 0)
  
  const pendingConfirmations = payments.filter(p => p.status === 'CONFIRMING').length
  
  const cryptoSplit = {
    USDT: payments.filter(p => p.cryptoType === 'USDT').reduce((sum, p) => sum + p.amountDZD, 0),
    BTC: payments.filter(p => p.cryptoType === 'BTC').reduce((sum, p) => sum + p.amountDZD, 0),
    ETH: payments.filter(p => p.cryptoType === 'ETH').reduce((sum, p) => sum + p.amountDZD, 0),
    Other: payments.filter(p => !['USDT', 'BTC', 'ETH'].includes(p.cryptoType)).reduce((sum, p) => sum + p.amountDZD, 0)
  }

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    if (selectedStatus !== 'all' && payment.status !== selectedStatus) return false
    if (selectedCrypto !== 'all' && payment.cryptoType !== selectedCrypto) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        payment.paymentId.toLowerCase().includes(query) ||
        payment.buyerName.toLowerCase().includes(query) ||
        payment.orderId.toLowerCase().includes(query) ||
        payment.walletAddress.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusBadge = (status: CryptoPayment['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'CONFIRMING':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 animate-pulse">Confirming</Badge>
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completed</Badge>
      case 'EXPIRED':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Expired</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCryptoIcon = (crypto: string) => {
    switch (crypto) {
      case 'BTC': return <Bitcoin className="w-5 h-5 text-orange-500" />
      case 'ETH': return <Coins className="w-5 h-5 text-indigo-500" />
      case 'USDT': return <Coins className="w-5 h-5 text-green-500" />
      case 'USDC': return <Coins className="w-5 h-5 text-blue-500" />
      case 'DAI': return <Coins className="w-5 h-5 text-yellow-600" />
      default: return <Coins className="w-5 h-5 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            Crypto Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage cryptocurrency payment transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Volume</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(todayVolume)}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +18.2% vs yesterday
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Coins className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Confirmations</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{pendingConfirmations}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting blockchain</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Payments Today</p>
                <p className="text-2xl font-bold mt-1">{payments.length}</p>
                <p className="text-xs text-gray-500 mt-1">All networks</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {((payments.filter(p => p.status === 'COMPLETED').length / payments.length) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Completion rate</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Payments Table */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                Active Transactions
                {pendingConfirmations > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 animate-pulse ml-2">
                    {pendingConfirmations} Confirming
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by ID, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMING">Confirming</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Expired</option>
                <option value="FAILED">Failed</option>
              </select>

              <select
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Cryptos</option>
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="DAI">DAI</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Crypto</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead className="text-right">Amount (Crypto)</TableHead>
                    <TableHead className="text-right">Amount (DZD)</TableHead>
                    <TableHead>Confirmations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.slice(0, 15).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <span className="font-mono text-xs">{payment.paymentId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCryptoIcon(payment.cryptoType)}
                          <span className="font-medium">{payment.cryptoType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{payment.network}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {payment.amountCrypto.toFixed(payment.cryptoType === 'BTC' || payment.cryptoType === 'ETH' ? 6 : 2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amountDZD)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(payment.confirmations / payment.requiredConfirmations) * 100} 
                            className="w-16 h-2"
                          />
                          <span className="text-xs text-gray-500">
                            {payment.confirmations}/{payment.requiredConfirmations}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${
                          getTimeRemaining(payment.expiresAt) === 'Expired' ? 'text-red-600' : ''
                        }`}>
                          {getTimeRemaining(payment.expiresAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedPayment(payment)
                              setShowQRDialog(true)
                            }}>
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(payment.walletAddress)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Address
                            </DropdownMenuItem>
                            {payment.txHash && (
                              <DropdownMenuItem>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View on Explorer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Crypto Split */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Volume by Crypto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(cryptoSplit).map(([crypto, volume]) => (
                <div key={crypto} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getCryptoIcon(crypto)}
                      <span className="font-medium">{crypto}</span>
                    </div>
                    <span className="text-gray-500">{formatCurrency(volume)}</span>
                  </div>
                  <Progress 
                    value={(volume / Object.values(cryptoSplit).reduce((a, b) => a + b, 0)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Exchange Rates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Exchange Rates
              </CardTitle>
              <CardDescription>Current rates to DZD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {exchangeRates.map((rate) => (
                <div key={rate.crypto} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    {getCryptoIcon(rate.crypto)}
                    <span className="font-medium text-sm">{rate.crypto}/DZD</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{rate.rate.toLocaleString()}</p>
                    <p className={`text-xs flex items-center justify-end gap-1 ${
                      rate.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {rate.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {rate.change24h >= 0 ? '+' : ''}{rate.change24h}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Network Fees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-500" />
                Network Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {networkFees.map((fee) => (
                <div key={fee.network} className="flex items-start justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{fee.network}</p>
                    <p className="text-xs text-gray-500">{fee.estimatedTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{fee.avgFee} {fee.unit}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Blockchain Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wifi className="w-5 h-5 text-green-500" />
                Blockchain Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-medium text-sm">Tron (TRC20)</span>
                </div>
                <span className="text-xs text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-medium text-sm">Ethereum (ERC20)</span>
                </div>
                <span className="text-xs text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-medium text-sm">BSC (BEP20)</span>
                </div>
                <span className="text-xs text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                  <span className="font-medium text-sm">Bitcoin</span>
                </div>
                <span className="text-xs text-yellow-600">Congested</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="bg-white p-4 rounded-lg border flex justify-center">
                <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID:</span>
                  <span className="font-mono font-medium">{selectedPayment.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{selectedPayment.amountCrypto} {selectedPayment.cryptoType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network:</span>
                  <span>{selectedPayment.network}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Wallet Address:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono flex-1 truncate">{selectedPayment.walletAddress}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(selectedPayment.walletAddress)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
