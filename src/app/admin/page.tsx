'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Wallet,
  Bitcoin,
  Calendar,
  AddressBook,
  MessageSquare,
  FileText,
  Receipt,
  Database,
  Video,
  Box,
  RefreshCw,
  Activity,
  Bell,
  Settings,
  Search,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  Globe,
  Package,
  BarChart3,
  PieChart,
  LineChart,
  LayoutDashboard,
  UserCheck,
  CreditCardIcon,
  HandshakeIcon,
  FileSpreadsheet,
  Link2,
  FileBarChart,
  MoreHorizontal,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Star,
  Filter
} from 'lucide-react'
import Link from 'next/link'

// Types
interface KPICard {
  title: string
  value: string
  change?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  status?: string
}

interface ActivityItem {
  id: string
  type: 'payment' | 'negotiation' | 'order' | 'user' | 'system' | 'contract' | 'invoice' | 'erp'
  description: string
  details: string
  timestamp: string
  amount?: string
  status: 'success' | 'pending' | 'warning' | 'error'
}

interface QuickLink {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  count?: number
}

// KPI Data - Comprehensive Phase 8 Features
const kpiCards: KPICard[] = [
  // Primary Business Metrics
  { title: "Today's Revenue", value: "2,345,678 د.ج", change: "+12.5%", icon: DollarSign, color: "green" },
  { title: "Active Users", value: "1,234", change: "+23", icon: Users, color: "blue" },
  { title: "Pending Orders", value: "89", change: "-5", icon: ShoppingCart, color: "yellow" },
  { title: "Conversion Rate", value: "4.56%", change: "+0.3%", icon: TrendingUp, color: "purple" },
  
  // Payment Methods Status (Phase 8)
  { title: "SATIM Transactions", value: "234", status: "active", icon: CreditCard, color: "emerald" },
  { title: "Stripe Payments", value: "89", status: "active", icon: Wallet, color: "indigo" },
  { title: "Crypto Payments", value: "45", status: "active", icon: Bitcoin, color: "orange" },
  { title: "DPA Plans Active", value: "12", status: "active", icon: Calendar, color: "teal" },
  
  // Business Tools (Phase 8)
  { title: "CRM Contacts", value: "1,567", icon: AddressBook, color: "rose" },
  { title: "Active Negotiations", value: "34", icon: MessageSquare, color: "amber" },
  { title: "Contracts Pending", value: "23", icon: FileText, color: "cyan" },
  { title: "Invoices Issued", value: "456", icon: Receipt, color: "lime" },
  
  // Technical Integrations (Phase 8)
  { title: "ERP Connectors", value: "8", status: "synced", icon: Database, color: "violet" },
  { title: "Active Calls", value: "12", icon: Video, color: "fuchsia" },
  { title: "AR Models", value: "234", icon: Box, color: "sky" },
  { title: "Currency Rates", value: "8", status: "current", icon: RefreshCw, color: "stone" }
]

// Revenue by Payment Method Data
const revenueByPaymentMethod = [
  { name: 'SATIM/CIB', value: 1245000, percentage: 52, color: '#006233' },
  { name: 'Stripe', value: 567000, percentage: 24, color: '#635BFF' },
  { name: 'CCP/BaridiMob', value: 356000, percentage: 15, color: '#00A651' },
  { name: 'Crypto', value: 178000, percentage: 7, color: '#F7931A' },
  { name: 'Bank Transfer', value: 156000, percentage: 2, color: '#3B82F6' }
]

// Orders trend data (30 days)
const ordersTrendData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  orders: Math.floor(Math.random() * 50) + 20 + (i * 0.5),
  revenue: Math.floor(Math.random() * 100000) + 50000
}))

// Currency Distribution Data
const currencyDistribution = [
  { currency: 'DZD', amount: 2845000, transactions: 1234, flag: '🇩🇿' },
  { currency: 'USD', amount: 18900, transactions: 89, flag: '🇺🇸' },
  { currency: 'EUR', amount: 15600, transactions: 67, flag: '🇪🇺' },
  { currency: 'USDT', value: 45000, transactions: 45, flag: '💱' },
  { currency: 'BTC', value: 0.85, transactions: 12, flag: '₿' }
]

// CRM Pipeline Funnel Data
const crmPipelineStages = [
  { stage: 'Leads', count: 456, conversion: 100, color: '#94a3b8' },
  { stage: 'Qualified', count: 234, conversion: 51, color: '#3b82f6' },
  { stage: 'Proposal', count: 123, conversion: 27, color: '#8b5cf6' },
  { stage: 'Negotiation', count: 67, conversion: 15, color: '#f59e0b' },
  { stage: 'Closed Won', count: 34, conversion: 7.5, color: '#22c55e' }
]

// Recent Activity Data
const recentActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'payment',
    description: 'SATIM Payment Received',
    details: 'Order #ORD-2024-1234 from Cevital Group',
    timestamp: '2 minutes ago',
    amount: '125,000 د.ج',
    status: 'success'
  },
  {
    id: '2',
    type: 'negotiation',
    description: 'New Negotiation Started',
    details: 'Ifri Industries ↔ Sonatrach - Steel Pipes Contract',
    timestamp: '15 minutes ago',
    status: 'pending'
  },
  {
    id: '3',
    type: 'order',
    description: 'Bulk Order Placed',
    details: 'Condor Algeria - 500 units Home Appliances',
    timestamp: '32 minutes ago',
    amount: '890,000 د.ج',
    status: 'success'
  },
  {
    id: '4',
    type: 'contract',
    description: 'Contract Awaiting Signature',
    details: 'Nassel Motors - Distribution Agreement #CT-789',
    timestamp: '1 hour ago',
    status: 'warning'
  },
  {
    id: '5',
    type: 'erp',
    description: 'SAP Sync Completed',
    details: 'Inventory sync: 1,234 products updated',
    timestamp: '1 hour ago',
    status: 'success'
  },
  {
    id: '6',
    type: 'invoice',
    description: 'Invoice Generated',
    details: 'INV-2024-0567 for Saidal Group - Pharmaceuticals',
    timestamp: '2 hours ago',
    amount: '456,000 د.ج',
    status: 'success'
  },
  {
    id: '7',
    type: 'user',
    description: 'New Supplier Verified',
    details: 'Groupe Vitall - Pharmaceutical Distributor (Algiers)',
    timestamp: '3 hours ago',
    status: 'success'
  },
  {
    id: '8',
    type: 'crypto',
    description: 'USDT Payment Confirmed',
    details: 'International order #INT-456 - Blockchain verified',
    timestamp: '4 hours ago',
    amount: '$2,450 USDT',
    status: 'success'
  },
  {
    id: '9',
    type: 'system',
    description: 'Currency Rate Updated',
    details: 'EUR/DZD: 145.23 (+0.12%)',
    timestamp: '5 hours ago',
    status: 'success'
  },
  {
    id: '10',
    type: 'payment',
    description: 'DPA Installment Due',
    details: 'Plan #DPA-123 - Naftal Corporation',
    timestamp: '6 hours ago',
    amount: '67,000 د.ج',
    status: 'warning'
  }
]

// Quick Links
const quickLinks: QuickLink[] = [
  { title: 'Manage Products', href: '/admin/products', icon: Package, color: 'bg-blue-500', count: 1234 },
  { title: 'View Orders', href: '/admin/orders', icon: ShoppingCart, color: 'bg-green-500', count: 89 },
  { title: 'Users Management', href: '/admin/users', icon: Users, color: 'bg-purple-500', count: 1567 },
  { title: 'Payment Settings', href: '/admin/payments', icon: CreditCard, color: 'bg-emerald-500' },
  { title: 'CRM Dashboard', href: '/admin/crm', icon: AddressBook, color: 'bg-rose-500', count: 34 },
  { title: 'Invoices', href: '/admin/invoices', icon: Receipt, color: 'bg-amber-500', count: 456 },
  { title: 'ERP Connectors', href: '/admin/erp', icon: Database, color: 'bg-cyan-500', count: 8 },
  { title: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3, color: 'bg-indigo-500' }
]

// Helper functions
const getColorClasses = (color: string): string => {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    lime: 'bg-lime-50 border-lime-200 text-lime-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    fuchsia: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    stone: 'bg-stone-50 border-stone-200 text-stone-700'
  }
  return colors[color] || 'bg-gray-50 border-gray-200 text-gray-700'
}

const getIconColor = (color: string): string => {
  const colors: Record<string, string> = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    orange: 'text-orange-600 bg-orange-100',
    teal: 'text-teal-600 bg-teal-100',
    rose: 'text-rose-600 bg-rose-100',
    amber: 'text-amber-600 bg-amber-100',
    cyan: 'text-cyan-600 bg-cyan-100',
    lime: 'text-lime-600 bg-lime-100',
    violet: 'text-violet-600 bg-violet-100',
    fuchsia: 'text-fuchsia-600 bg-fuchsia-100',
    sky: 'text-sky-600 bg-sky-100',
    stone: 'text-stone-600 bg-stone-100'
  }
  return colors[color] || 'text-gray-600 bg-gray-100'
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    payment: CreditCard,
    negotiation: MessageSquare,
    order: ShoppingCart,
    user: Users,
    system: Settings,
    contract: FileText,
    invoice: Receipt,
    erp: Database,
    crypto: Bitcoin
  }
  return icons[type] || Activity
}

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    payment: 'bg-green-100 text-green-600',
    negotiation: 'bg-blue-100 text-blue-600',
    order: 'bg-purple-100 text-purple-600',
    user: 'bg-indigo-100 text-indigo-600',
    system: 'bg-gray-100 text-gray-600',
    contract: 'bg-amber-100 text-amber-600',
    invoice: 'bg-cyan-100 text-cyan-600',
    erp: 'bg-violet-100 text-violet-600',
    crypto: 'bg-orange-100 text-orange-600'
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'warning':
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>
    case 'error':
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

// Donut Chart Component (SVG-based)
function DonutChart({ data }: { data: typeof revenueByPaymentMethod }) {
  const radius = 80
  const innerRadius = 50
  const centerX = 100
  const centerY = 100

  // Calculate cumulative angles without mutation
  const calculateArcs = () => {
    let cumulativeAngle = 0
    return data.map((item) => {
      const angle = (item.percentage / 100) * 360
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + angle
      cumulativeAngle = endAngle

      const startRad = (startAngle - 90) * Math.PI / 180
      const endRad = (endAngle - 90) * Math.PI / 180

      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)

      const ix1 = centerX + innerRadius * Math.cos(startRad)
      const iy1 = centerY + innerRadius * Math.sin(startRad)
      const ix2 = centerX + innerRadius * Math.cos(endRad)
      const iy2 = centerY + innerRadius * Math.sin(endRad)

      const largeArc = angle > 180 ? 1 : 0

      return {
        color: item.color,
        pathD: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
      }
    })
  }

  const arcs = calculateArcs()

  return (
    <div className="flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {arcs.map((arc, index) => (
          <g key={index}>
            <path
              d={arc.pathD}
              fill={arc.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          </g>
        ))}
        <text x={centerX} y={centerY - 5} textAnchor="middle" className="fill-gray-700 font-bold text-sm">Total</text>
        <text x={centerX} y={centerY + 15} textAnchor="middle" className="fill-gray-500 text-xs">2.5M د.ج</text>
      </svg>
    </div>
  )
}

// Simple Bar Chart Component
function MiniBarChart({ data }: { data: typeof ordersTrendData }) {
  const maxValue = Math.max(...data.map(d => d.orders))
  const displayData = data.slice(-14) // Last 14 days

  return (
    <div className="flex items-end gap-1 h-40 px-2">
      {displayData.map((item, index) => {
        const height = (item.orders / maxValue) * 100
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm hover:from-emerald-500 hover:to-emerald-300 transition-colors cursor-pointer min-h-[4px]"
              style={{ height: `${height}%` }}
              title={`Day ${item.day}: ${item.orders} orders`}
            />
            <span className="text-[9px] text-gray-500">{item.day}</span>
          </div>
        )
      })}
    </div>
  )
}

// Currency Bar Chart Component
function CurrencyBarChart({ data }: { data: typeof currencyDistribution }) {
  const maxAmount = Math.max(...data.map(d => d.amount || d.value || 0))

  return (
    <div className="space-y-3 p-2">
      {data.map((item, index) => {
        const value = item.amount || item.value || 0
        const percentage = (value / maxAmount) * 100
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{item.flag}</span>
                <span className="font-medium">{item.currency}</span>
              </span>
              <span className="text-gray-500">{item.transactions} txns</span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Pipeline Funnel Component
function PipelineFunnel({ stages }: { stages: typeof crmPipelineStages }) {
  const maxWidth = 100
  
  return (
    <div className="space-y-2 p-4">
      {stages.map((stage, index) => {
        const width = (stage.conversion / 100) * maxWidth
        const colors = ['bg-slate-400', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-green-500']
        
        return (
          <div key={index} className="relative">
            <div 
              className={`${colors[index]} h-10 rounded-lg flex items-center justify-between px-4 text-white font-medium mx-auto transition-all duration-300 hover:brightness-110 cursor-pointer`}
              style={{ width: `${width}%` }}
            >
              <span>{stage.stage}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{stage.count}</span>
            </div>
            {index < stages.length - 1 && (
              <div className="flex justify-center my-1">
                <ArrowDownRight className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Main Dashboard Component
export default function AdminDashboardPage() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Algerian timezone (UTC+1)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Algiers',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Algiers',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
      setCurrentTime(now.toLocaleTimeString('fr-FR', options))
      setCurrentDate(now.toLocaleDateString('fr-FR', dateOptions))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">AlgeriaTrade.dz - Phase 8 Enterprise Control Center</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Date/Time Display */}
          <div className="bg-white border rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-lg font-semibold text-gray-900 font-mono">{currentTime}</p>
                <p className="text-xs text-gray-500 capitalize">{currentDate}</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">All Systems Operational</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <Settings className="w-4 h-4" />
              Quick Actions
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - 16 Cards in 4 Columns */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <HandshakeIcon className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-2">
            <Database className="w-4 h-4" />
            Technical
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Main KPIs */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.slice(0, 4).map((kpi, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      {kpi.change && (
                        <div className="flex items-center gap-1">
                          {kpi.change.startsWith('+') ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {kpi.change}
                          </span>
                          <span className="text-xs text-gray-400">vs yesterday</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl ${getIconColor(kpi.color)}`}>
                      <kpi.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payments Tab - Payment Methods Status */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.slice(4, 8).map((kpi, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      <Badge 
                        variant="outline" 
                        className={
                          kpi.status === 'active' 
                            ? 'border-green-200 bg-green-50 text-green-700' 
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {kpi.status === 'active' ? 'Active' : kpi.status}
                      </Badge>
                    </div>
                    <div className={`p-3 rounded-xl ${getIconColor(kpi.color)}`}>
                      <kpi.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Payment Methods Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Gateway Health</CardTitle>
              <CardDescription>Real-time status of all payment integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">SATIM Gateway</p>
                    <p className="text-sm text-green-600">Latency: 45ms • Uptime: 99.98%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Stripe API</p>
                    <p className="text-sm text-blue-600">Latency: 120ms • Uptime: 99.95%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Bitcoin className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Crypto Node</p>
                    <p className="text-sm text-orange-600">Confirmations: 3/3 • Synced</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab - CRM & Contracts */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.slice(8, 12).map((kpi, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${getIconColor(kpi.color)}`}>
                      <kpi.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Technical Tab - ERP, AR, etc. */}
        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.slice(12, 16).map((kpi, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      {kpi.status && (
                        <Badge 
                          variant="outline"
                          className={
                            kpi.status === 'synced' || kpi.status === 'current'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          }
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {kpi.status}
                        </Badge>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl ${getIconColor(kpi.color)}`}>
                      <kpi.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Charts Section - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue by Payment Method (Donut) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-600" />
                  Revenue by Payment Method
                </CardTitle>
                <CardDescription>Distribution of today's revenue</CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                Today
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <DonutChart data={revenueByPaymentMethod} />
              <div className="space-y-3 flex-1">
                {revenueByPaymentMethod.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{(item.value / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-gray-400 ml-2">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Orders Trend (Line/Bar) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-600" />
                  Orders Trend (Last 30 Days)
                </CardTitle>
                <CardDescription>Daily order volume</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  +18.5%
                </Badge>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={ordersTrendData} />
            <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm text-gray-500">
              <span>Last 14 days shown</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-emerald-400" />
                  Orders
                </span>
                <span>Avg: 42/day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Currency Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-5 h-5 text-violet-600" />
                  Currency Distribution
                </CardTitle>
                <CardDescription>Transaction volume by currency</CardDescription>
              </div>
              <Badge variant="outline" className="text-violet-600 border-violet-200">
                Multi-Currency
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CurrencyBarChart data={currencyDistribution} />
          </CardContent>
        </Card>

        {/* Chart 4: CRM Pipeline Funnel */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-5 h-5 text-amber-600" />
                  CRM Sales Pipeline
                </CardTitle>
                <CardDescription>Lead conversion funnel</CardDescription>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                7.5% Close Rate
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <PipelineFunnel stages={crmPipelineStages} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest transactions and events across all modules</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                View All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[120px]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type)
                return (
                  <TableRow key={activity.id} className="cursor-pointer hover:bg-gray-50/50">
                    <TableCell>
                      <div className={`p-2 rounded-lg inline-flex ${getActivityColor(activity.type)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[300px]">{activity.details}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{activity.details.split(' - ')[0]}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.amount && (
                        <span className="font-mono text-sm font-medium">{activity.amount}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(activity.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{activity.timestamp}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <Link key={index} href={link.href}>
            <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group border-0 shadow-sm h-full">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-xl ${link.color} text-white group-hover:scale-110 transition-transform shadow-lg`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-gray-900">{link.title}</p>
                    {link.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {link.count} items
                      </Badge>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">99.98%</p>
                <p className="text-emerald-100 text-sm">System Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">58</p>
                <p className="text-blue-100 text-sm">Wilayas Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">12,456</p>
                <p className="text-purple-100 text-sm">Products Listed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">4.8/5</p>
                <p className="text-amber-100 text-sm">User Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
