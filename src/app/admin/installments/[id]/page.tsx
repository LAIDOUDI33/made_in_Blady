'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  CreditCard,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Upload,
  Download,
  Calculator,
  Zap,
  Edit3,
  Save,
  Plus,
  Eye,
  Send,
  Paperclip,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Separator } from '@/components/ui/separator'

// Types
interface PaymentScheduleItem {
  id: number
  installmentNumber: number
  dueDate: string
  amount: number
  principal: number
  interest: number
  lateFee: number
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PROCESSING'
  paidDate?: string
  paymentMethod?: string
}

interface CommunicationLog {
  id: number
  date: string
  type: 'NOTE' | 'CALL' | 'EMAIL' | 'SYSTEM'
  author: string
  message: string
}

interface Document {
  id: number
  name: string
  type: string
  size: string
  uploadedAt: string
  uploadedBy: string
}

// Mock data for a single agreement
const mockAgreement = {
  id: '1',
  agreementNumber: 'DPA-2024-001',
  status: 'ACTIVE',
  buyerName: 'Ahmed Benali',
  buyerCompany: 'TechnoDz Sarl',
  buyerEmail: 'ahmed.benali@technodz.dz',
  buyerPhone: '+213 555 123 456',
  sellerName: 'Karim Hadj',
  sellerCompany: 'HardwarePro Algeria',
  sellerEmail: 'karim.hadj@hardwarepro.dz',
  principal: 2500000,
  interestRate: 8.5,
  monthlyPayment: 218750,
  remainingBalance: 1750000,
  totalPayments: 12,
  paidPayments: 4,
  startDate: '2024-10-15',
  endDate: '2025-09-15',
  durationMonths: 12,
  bankPartner: 'BNA',
  bankAccount: '****7890',
  nextDueDate: '2025-02-15',
  originalAmount: 2625000, // Principal + total interest
  totalPaid: 875000,
  totalInterestPaid: 0,
  lateFeesAccrued: 12500,
  createdAt: '2024-10-10',
  lastModified: '2025-01-18'
}

const mockPaymentSchedule: PaymentScheduleItem[] = [
  { id: 1, installmentNumber: 1, dueDate: '2024-11-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PAID', paidDate: '2024-11-14', paymentMethod: 'Bank Transfer' },
  { id: 2, installmentNumber: 2, dueDate: '2024-12-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PAID', paidDate: '2024-12-13', paymentMethod: 'Bank Transfer' },
  { id: 3, installmentNumber: 3, dueDate: '2025-01-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PAID', paidDate: '2025-01-14', paymentMethod: 'Bank Transfer' },
  { id: 4, installmentNumber: 4, dueDate: '2025-02-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PAID', paidDate: '2025-02-14', paymentMethod: 'Bank Transfer' },
  { id: 5, installmentNumber: 5, dueDate: '2025-03-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 6, installmentNumber: 6, dueDate: '2025-04-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 7, installmentNumber: 7, dueDate: '2025-05-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 8, installmentNumber: 8, dueDate: '2025-06-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 9, installmentNumber: 9, dueDate: '2025-07-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 10, installmentNumber: 10, dueDate: '2025-08-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 11, installmentNumber: 11, dueDate: '2025-09-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' },
  { id: 12, installmentNumber: 12, dueDate: '2025-10-15', amount: 218750, principal: 208333, interest: 10417, lateFee: 0, status: 'PENDING' }
]

const mockCommunicationLog: CommunicationLog[] = [
  { id: 1, date: '2025-01-20 14:30', type: 'NOTE', author: 'Admin User', message: 'Buyer confirmed next payment will be processed on time.' },
  { id: 2, date: '2025-01-15 09:15', type: 'SYSTEM', author: 'System', message: 'Payment #4 received and confirmed. Balance updated.' },
  { id: 3, date: '2025-01-10 16:45', type: 'EMAIL', author: 'Admin User', message: 'Sent payment reminder email to buyer.' },
  { id: 4, date: '2024-12-28 11:20', type: 'CALL', author: 'Admin User', message: 'Called buyer to confirm December payment status.' },
  { id: 5, date: '2024-12-15 08:00', type: 'SYSTEM', author: 'System', message: 'Payment #3 automatically processed via standing order.' }
]

const mockDocuments: Document[] = [
  { id: 1, name: 'DPA_Agreement_DPA-2024-001.pdf', type: 'PDF', size: '245 KB', uploadedAt: '2024-10-10', uploadedBy: 'System' },
  { id: 2, name: 'Identity_Card_Benali.pdf', type: 'PDF', size: '1.2 MB', uploadedAt: '2024-10-10', uploadedBy: 'Buyer' },
  { id: 3, name: 'Commercial_Register_TechnoDz.pdf', type: 'PDF', size: '890 KB', uploadedAt: '2024-10-10', uploadedBy: 'Buyer' },
  { id: 4, name: 'Bank_Approval_BNA.pdf', type: 'PDF', size: '156 KB', uploadedAt: '2024-10-12', uploadedBy: 'Bank' },
  { id: 5, name: 'Invoice_HardwarePro_001.pdf', type: 'PDF', size: '320 KB', uploadedAt: '2024-10-10', uploadedBy: 'Seller' }
]

export default function DPADetailPage() {
  const params = useParams()
  const router = useRouter()
  const [agreement] = useState(mockAgreement)
  const [paymentSchedule] = useState(mockPaymentSchedule)
  const [communicationLog, setCommunicationLog] = useState(mockCommunicationLog)
  const [documents] = useState(mockDocuments)
  
  // Dialog states
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [showEarlySettlement, setShowEarlySettlement] = useState(false)
  const [showUploadDoc, setShowUploadDoc] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  
  // Form states
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [newNote, setNewNote] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Paid</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-700 border-red-200 animate-pulse">Overdue</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Processing</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'NOTE': return <FileText className="w-4 h-4 text-blue-500" />
      case 'CALL': return <Phone className="w-4 h-4 text-green-500" />
      case 'EMAIL': return <Mail className="w-4 h-4 text-purple-500" />
      case 'SYSTEM': return <Zap className="w-4 h-4 text-orange-500" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  // Calculate early settlement offer
  const calculateEarlySettlement = () => {
    const remainingPayments = paymentSchedule.filter(p => p.status !== 'PAID')
    const remainingPrincipal = remainingPayments.reduce((sum, p) => sum + p.principal, 0)
    const discountRate = 0.05 // 5% discount for early settlement
    const discountAmount = remainingPrincipal * discountRate
    const settlementAmount = remainingPrincipal - discountAmount
    
    return {
      remainingPayments: remainingPayments.length,
      remainingPrincipal,
      discountRate: discountRate * 100,
      discountAmount,
      settlementAmount,
      savings: discountAmount
    }
  }

  const settlementOffer = calculateEarlySettlement()

  // Calculate late fee
  const calculateLateFee = (dueDate: string, baseAmount: number) => {
    const today = new Date()
    const due = new Date(dueDate)
    const daysLate = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
    const lateFeeRate = 0.02 // 2% per month
    const monthlyLateFee = baseAmount * lateFeeRate
    const fee = Math.round(monthlyLateFee * (daysLate / 30))
    
    return { daysLate, fee }
  }

  const handleRecordPayment = () => {
    // In production, this would call an API
    alert(`Payment of ${formatCurrency(Number(paymentAmount))} recorded successfully!`)
    setShowRecordPayment(false)
    setPaymentAmount('')
    setPaymentNote('')
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    
    const note: CommunicationLog = {
      id: communicationLog.length + 1,
      date: new Date().toLocaleString('fr-FR'),
      type: 'NOTE',
      author: 'Admin User',
      message: newNote
    }
    
    setCommunicationLog([note, ...communicationLog])
    setNewNote('')
    setShowAddNote(false)
  }

  const progressPercent = (agreement.paidPayments / agreement.totalPayments) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/admin/installments')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {agreement.agreementNumber}
              </h1>
              {getStatusBadge(agreement.status)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Created on {formatDate(agreement.createdAt)} • Last modified {formatDate(agreement.lastModified)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showEarlySettlement} onOpenChange={setShowEarlySettlement}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Early Settlement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Early Settlement Offer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <p className="text-sm font-medium text-emerald-800 mb-2">Settlement Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Remaining Payments:</span>
                      <span className="font-medium">{settlementOffer.remainingPayments} installments</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Principal:</span>
                      <span className="font-medium">{formatCurrency(settlementOffer.remainingPrincipal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({settlementOffer.discountRate}%):</span>
                      <span className="font-medium">-{formatCurrency(settlementOffer.discountAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-emerald-700">
                      <span>Settlement Amount:</span>
                      <span>{formatCurrency(settlementOffer.settlementAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  By settling early, the buyer saves {formatCurrency(settlementOffer.savings)} in interest.
                </p>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEarlySettlement(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => alert('Settlement offer generated and sent to buyer!')}>
                    Generate Offer
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <Edit3 className="mr-2 h-4 w-4" />
            Modify Agreement
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Agreement PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Print Schedule
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Defaulted
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Progress</p>
                  <p className="text-2xl font-bold mt-1">
                    {agreement.paidPayments} / {agreement.totalPayments} payments
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-2xl font-bold text-violet-600">{progressPercent.toFixed(0)}%</p>
                </div>
              </div>
              
              <Progress value={progressPercent} className="h-3 mb-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Original Amount</p>
                  <p className="font-semibold">{formatCurrency(agreement.originalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Paid</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(agreement.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-semibold text-orange-600">{formatCurrency(agreement.remainingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Next Due</p>
                  <p className="font-semibold">{formatDate(agreement.nextDueDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Buyer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{agreement.buyerName}</p>
                  <p className="text-sm text-gray-500">{agreement.buyerCompany}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {agreement.buyerEmail}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {agreement.buyerPhone}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Buyer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-500" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{agreement.sellerName}</p>
                  <p className="text-sm text-gray-500">{agreement.sellerCompany}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {agreement.sellerEmail}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Schedule */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-500" />
                  Payment Schedule
                </CardTitle>
                <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Manual Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Payment Amount (DZD)</label>
                        <Input
                          type="number"
                          placeholder="Enter amount..."
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Note (Optional)</label>
                        <Textarea
                          placeholder="Add a note about this payment..."
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRecordPayment(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRecordPayment}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm Payment
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentSchedule.map((payment) => {
                      const lateInfo = payment.status === 'PENDING' 
                        ? calculateLateFee(payment.dueDate, payment.amount)
                        : null

                      return (
                        <TableRow 
                          key={payment.id}
                          className={lateInfo && lateInfo.daysLate > 0 ? 'bg-red-50/50' : ''}
                        >
                          <TableCell className="font-mono text-sm">{payment.installmentNumber}</TableCell>
                          <TableCell>
                            <span className={lateInfo && lateInfo.daysLate > 0 ? 'text-red-600 font-medium' : ''}>
                              {formatDate(payment.dueDate)}
                            </span>
                            {lateInfo && lateInfo.daysLate > 0 && (
                              <span className="block text-xs text-red-500">
                                +{lateInfo.daysLate} days late
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {formatCurrency(payment.principal)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {formatCurrency(payment.interest)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'PENDING' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setPaymentAmount(String(payment.amount))
                                  setShowRecordPayment(true)
                                }}
                              >
                                Record
                              </Button>
                            )}
                            {payment.status === 'PAID' && (
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details & Actions */}
        <div className="space-y-6">
          {/* Agreement Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                Agreement Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Principal Amount</span>
                <span className="font-medium">{formatCurrency(agreement.principal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Interest Rate</span>
                <span className="font-medium">{agreement.interestRate}% p.a.</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Monthly Payment</span>
                <span className="font-medium">{formatCurrency(agreement.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="font-medium">{agreement.durationMonths} months</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Bank Partner</span>
                <span className="font-medium">{agreement.bankPartner}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Account</span>
                <span className="font-medium font-mono">{agreement.bankAccount}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Late Fees Accrued</span>
                <span className="font-medium text-red-600">{formatCurrency(agreement.lateFeesAccrued)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Late Fee Calculator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-500" />
                Late Fee Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-orange-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Late Fee Rate:</span>
                  <span className="font-medium">2% per month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Next Payment Due:</span>
                  <span className="font-medium">{formatDate(agreement.nextDueDate)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>If overdue by 7 days:</span>
                  <span className="text-red-600">+{formatCurrency(Math.round(agreement.monthlyPayment * 0.02 * 7 / 30))}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>If overdue by 30 days:</span>
                  <span className="text-red-600">+{formatCurrency(Math.round(agreement.monthlyPayment * 0.02))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Documents
                </CardTitle>
                <Dialog open={showUploadDoc} onOpenChange={setShowUploadDoc}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag & drop files here or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </p>
                      <input type="file" className="hidden" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowUploadDoc(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        alert('Document uploaded successfully!')
                        setShowUploadDoc(false)
                      }}>
                        Upload
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.size} • {doc.uploadedBy}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Communication Log */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  Communication Log
                </CardTitle>
                <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Textarea
                        placeholder="Write your note here..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={4}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddNote(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddNote}>
                          <Send className="mr-2 h-4 w-4" />
                          Add Note
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {communicationLog.map((log) => (
                  <div key={log.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="mt-0.5">
                      {getCommIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{log.author}</span>
                        <span className="text-xs text-gray-400">{log.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
