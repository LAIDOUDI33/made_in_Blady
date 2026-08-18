'use client'

import React, { useState, useEffect } from 'react'
import { 
  Phone,
  Video,
  PhoneOff,
  Clock,
  Signal,
  Mic,
  MicOff,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MoreVertical,
  Activity,
  Users,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play
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
interface CallRecord {
  id: string
  callId: string
  callerName: string
  callerCompany: string
  calleeName: string
  calleeCompany: string
  type: 'AUDIO' | 'VIDEO'
  status: 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'DECLINED' | 'FAILED'
  duration: number // in seconds
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  hasRecording: boolean
  recordingUrl?: string
  startedAt: string
  endedAt?: string
  networkType: 'wifi' | 'cellular' | 'unknown'
  iceCandidates: number
}

interface LiveCall extends CallRecord {
  currentDuration: number
  isMuted: boolean
  isVideoEnabled: boolean
}

// Mock Data - 28 call records
const mockCallHistory: CallRecord[] = [
  {
    id: '1', callId: 'CALL-2025-001', callerName: 'Ahmed Benali', callerCompany: 'TechnoDz Sarl',
    calleeName: 'Karim Hadj', calleeCompany: 'HardwarePro Algeria',
    type: 'VIDEO', status: 'COMPLETED', duration: 342, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call001.webm',
    startedAt: '2025-01-20T10:30:00', endedAt: '2025-01-20T10:35:42',
    networkType: 'wifi', iceCandidates: 8
  },
  {
    id: '2', callId: 'CALL-2025-002', callerName: 'Fatima Zerhouni', callerCompany: 'ModeStyle Algérie',
    calleeName: 'Yacine Boudiaf', calleeCompany: 'TextileExport',
    type: 'AUDIO', status: 'COMPLETED', duration: 185, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call002.webm',
    startedAt: '2025-01-20T11:15:00', endedAt: '2025-01-20T11:18:05',
    networkType: 'cellular', iceCandidates: 6
  },
  {
    id: '3', callId: 'CALL-2025-003', callerName: 'Mohamed Amine', callerCompany: 'AgroPlus DZ',
    calleeName: 'Sara Mellal', calleeCompany: 'FarmEquipment Co.',
    type: 'VIDEO', status: 'COMPLETED', duration: 567, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call003.webm',
    startedAt: '2025-01-20T09:00:00', endedAt: '2025-01-20T09:09:27',
    networkType: 'wifi', iceCandidates: 9
  },
  {
    id: '4', callId: 'CALL-2025-004', callerName: 'Nadia Bouazza', callerCompany: 'PharmaDist Algerie',
    calleeName: 'Omar Kaci', calleeCompany: 'MedSupply Intl',
    type: 'VIDEO', status: 'MISSED', duration: 0, quality: 'FAIR',
    hasRecording: false,
    startedAt: '2025-01-20T14:30:00',
    networkType: 'unknown', iceCandidates: 2
  },
  {
    id: '5', callId: 'CALL-2025-005', callerName: 'Rachid Hamadi', callerCompany: 'AutoParts DZ',
    calleeName: 'Leila Mansouri', calleeCompany: 'EuroAuto Parts',
    type: 'AUDIO', status: 'DECLINED', duration: 0, quality: 'POOR',
    hasRecording: false,
    startedAt: '2025-01-20T13:45:00',
    networkType: 'cellular', iceCandidates: 1
  },
  {
    id: '6', callId: 'CALL-2025-006', callerName: 'Samira Khelifi', callerCompany: 'BeautyZone',
    calleeName: 'Tarek Beghloul', calleeCompany: 'CosmoTrade',
    type: 'VIDEO', status: 'COMPLETED', duration: 423, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call006.webm',
    startedAt: '2025-01-19T16:20:00', endedAt: '2025-01-19T16:27:03',
    networkType: 'wifi', iceCandidates: 7
  },
  {
    id: '7', callId: 'CALL-2025-007', callerName: 'Kamel Djellouli', callerCompany: 'ElectroDz',
    calleeName: 'Nora Belmokhtar', calleeCompany: 'TechComponents SA',
    type: 'VIDEO', status: 'FAILED', duration: 12, quality: 'POOR',
    hasRecording: false,
    startedAt: '2025-01-19T15:30:00', endedAt: '2025-01-19T15:30:12',
    networkType: 'cellular', iceCandidates: 3
  },
  {
    id: '8', callId: 'CALL-2025-008', callerName: 'Amina Toubal', callerCompany: 'HomeDecor Plus',
    calleeName: 'Farid Meziane', calleeCompany: 'FurnitureExport',
    type: 'AUDIO', status: 'COMPLETED', duration: 298, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call008.webm',
    startedAt: '2025-01-19T14:00:00', endedAt: '2025-01-19T14:04:58',
    networkType: 'wifi', iceCandidates: 8
  },
  {
    id: '9', callId: 'CALL-2025-009', callerName: 'Youssef Brahimi', callerCompany: 'SportGear DZ',
    calleeName: 'Ines Rahmani', calleeCompany: 'AthleticSupplies',
    type: 'VIDEO', status: 'COMPLETED', duration: 156, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call009.webm',
    startedAt: '2025-01-19T11:30:00', endedAt: '2025-01-19T11:32:36',
    networkType: 'wifi', iceCandidates: 10
  },
  {
    id: '10', callId: 'CALL-2025-010', callerName: 'Lina Messaoudi', callerCompany: 'BookWorld Algeria',
    calleeName: 'Mourad Medelci', calleeCompany: 'EduPublish Intl',
    type: 'AUDIO', status: 'COMPLETED', duration: 445, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call010.webm',
    startedAt: '2025-01-18T10:15:00', endedAt: '2025-01-18T10:22:05',
    networkType: 'cellular', iceCandidates: 5
  },
  {
    id: '11', callId: 'CALL-2025-011', callerName: 'Omar Fettouhi', callerCompany: 'BuildMat Pro',
    calleeName: 'Salima Ait Ali', calleeCompany: 'ConstructionSupply',
    type: 'VIDEO', status: 'COMPLETED', duration: 678, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call011.webm',
    startedAt: '2025-01-18T09:00:00', endedAt: '2025-01-18T09:11:18',
    networkType: 'wifi', iceCandidates: 9
  },
  {
    id: '12', callId: 'CALL-2025-012', callerName: 'Hafsa Amrani', callerCompany: 'FoodService DZ',
    calleeName: 'Reda Benhammou', calleeCompany: 'RestaurantEquip',
    type: 'AUDIO', status: 'MISSED', duration: 0, quality: 'FAIR',
    hasRecording: false,
    startedAt: '2025-01-17T16:45:00',
    networkType: 'unknown', iceCandidates: 0
  },
  {
    id: '13', callId: 'CALL-2025-013', callerName: 'Bilal Charef', callerCompany: 'IT Solutions DZ',
    calleeName: 'Amira Bouteflika', calleeCompany: 'SoftwareHub',
    type: 'VIDEO', status: 'COMPLETED', duration: 892, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call013.webm',
    startedAt: '2025-01-17T14:00:00', endedAt: '2025-01-17T14:14:52',
    networkType: 'wifi', iceCandidates: 8
  },
  {
    id: '14', callId: 'CALL-2025-014', callerName: 'Meriem Kaced', callerCompany: 'GreenGarden DZ',
    calleeName: 'Nabil Ouldali', calleeCompany: 'AgriTech Supply',
    type: 'VIDEO', status: 'COMPLETED', duration: 334, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call014.webm',
    startedAt: '2025-01-16T11:30:00', endedAt: '2025-01-16T11:35:34',
    networkType: 'wifi', iceCandidates: 7
  },
  {
    id: '15', callId: 'CALL-2025-015', callerName: 'Abdelkrim Haddad', callerCompany: 'MetalWorks Co',
    calleeName: 'Dalila Bensaid', calleeCompany: 'SteelImport',
    type: 'AUDIO', status: 'DECLINED', duration: 0, quality: 'FAIR',
    hasRecording: false,
    startedAt: '2025-01-16T09:20:00',
    networkType: 'cellular', iceCandidates: 2
  },
  {
    id: '16', callId: 'CALL-2025-016', callerName: 'Nourhane Sadki', callerCompany: 'FashionHub DZ',
    calleeName: 'Karim Mebarki', calleeCompany: 'TextilePremium',
    type: 'VIDEO', status: 'COMPLETED', duration: 267, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call016.webm',
    startedAt: '2025-01-15T15:45:00', endedAt: '2025-01-15T15:49:27',
    networkType: 'wifi', iceCandidates: 6
  },
  {
    id: '17', callId: 'CALL-2025-017', callerName: 'Imene Boudjelida', callerCompany: 'CleanPro Services',
    calleeName: 'Yacine Sadi', calleeCompany: 'JanitorialSupply',
    type: 'AUDIO', status: 'COMPLETED', duration: 178, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call017.webm',
    startedAt: '2025-01-15T13:00:00', endedAt: '2025-01-15T13:02:58',
    networkType: 'cellular', iceCandidates: 5
  },
  {
    id: '18', callId: 'CALL-2025-018', callerName: 'Tarek Boussaid', callerCompany: 'SecurityFirst DZ',
    calleeName: 'Wassila Laifa', calleeCompany: 'SecuritySystems',
    type: 'VIDEO', status: 'COMPLETED', duration: 512, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call018.webm',
    startedAt: '2025-01-14T10:30:00', endedAt: '2025-01-14T10:38:32',
    networkType: 'wifi', iceCandidates: 9
  },
  {
    id: '19', callId: 'CALL-2025-019', callerName: 'Sara Mellal', callerCompany: 'FarmEquipment Co.',
    calleeName: 'Mohamed Amine', calleeCompany: 'AgroPlus DZ',
    type: 'VIDEO', status: 'COMPLETED', duration: 445, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call019.webm',
    startedAt: '2025-01-14T09:15:00', endedAt: '2025-01-14T09:22:05',
    networkType: 'wifi', iceCandidates: 8
  },
  {
    id: '20', callId: 'CALL-2025-020', callerName: 'Leila Mansouri', callerCompany: 'EuroAuto Parts',
    calleeName: 'Rachid Hamadi', calleeCompany: 'AutoParts DZ',
    type: 'AUDIO', status: 'MISSED', duration: 0, quality: 'FAIR',
    hasRecording: false,
    startedAt: '2025-01-13T17:00:00',
    networkType: 'unknown', iceCandidates: 1
  },
  {
    id: '21', callId: 'CALL-2025-021', callerName: 'Farid Meziane', callerCompany: 'FurnitureExport',
    calleeName: 'Amina Toubal', calleeCompany: 'HomeDecor Plus',
    type: 'VIDEO', status: 'COMPLETED', duration: 389, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call021.webm',
    startedAt: '2025-01-13T14:30:00', endedAt: '2025-01-13T14:36:29',
    networkType: 'wifi', iceCandidates: 7
  },
  {
    id: '22', callId: 'CALL-2025-022', callerName: 'Omar Kaci', callerCompany: 'MedSupply Intl',
    calleeName: 'Nadia Bouazza', calleeCompany: 'PharmaDist Algerie',
    type: 'VIDEO', status: 'FAILED', duration: 8, quality: 'POOR',
    hasRecording: false,
    startedAt: '2025-01-12T11:00:00', endedAt: '2025-01-12T11:00:08',
    networkType: 'cellular', iceCandidates: 2
  },
  {
    id: '23', callId: 'CALL-2025-023', callerName: 'Yacine Boudiaf', callerCompany: 'TextileExport',
    calleeName: 'Fatima Zerhouni', calleeCompany: 'ModeStyle Algérie',
    type: 'AUDIO', status: 'COMPLETED', duration: 234, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call023.webm',
    startedAt: '2025-01-12T09:45:00', endedAt: '2025-01-12T09:49:14',
    networkType: 'wifi', iceCandidates: 6
  },
  {
    id: '24', callId: 'CALL-2025-024', callerName: 'Nora Belmokhtar', callerCompany: 'TechComponents SA',
    calleeName: 'Kamel Djellouli', calleeCompany: 'ElectroDz',
    type: 'VIDEO', status: 'COMPLETED', duration: 567, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call024.webm',
    startedAt: '2025-01-11T13:20:00', endedAt: '2025-01-11T13:29:27',
    networkType: 'wifi', iceCandidates: 9
  },
  {
    id: '25', callId: 'CALL-2025-025', callerName: 'Tarek Beghloul', callerCompany: 'CosmoTrade',
    calleeName: 'Samira Khelifi', calleeCompany: 'BeautyZone',
    type: 'VIDEO', status: 'COMPLETED', duration: 178, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call025.webm',
    startedAt: '2025-01-11T10:00:00', endedAt: '2025-01-11T10:02:58',
    networkType: 'wifi', iceCandidates: 8
  },
  {
    id: '26', callId: 'CALL-2025-026', callerName: 'Salima Ait Ali', callerCompany: 'ConstructionSupply',
    calleeName: 'Omar Fettouhi', calleeCompany: 'BuildMat Pro',
    type: 'AUDIO', status: 'DECLINED', duration: 0, quality: 'FAIR',
    hasRecording: false,
    startedAt: '2025-01-10T16:30:00',
    networkType: 'cellular', iceCandidates: 1
  },
  {
    id: '27', callId: 'CALL-2025-027', callerName: 'Reda Benhammou', callerCompany: 'RestaurantEquip',
    calleeName: 'Hafsa Amrani', calleeCompany: 'FoodService DZ',
    type: 'VIDEO', status: 'COMPLETED', duration: 423, quality: 'GOOD',
    hasRecording: true, recordingUrl: '/recordings/call027.webm',
    startedAt: '2025-01-10T14:00:00', endedAt: '2025-01-10T14:07:03',
    networkType: 'wifi', iceCandidates: 7
  },
  {
    id: '28', callId: 'CALL-2025-028', callerName: 'Amira Bouteflika', callerCompany: 'SoftwareHub',
    calleeName: 'Bilal Charef', calleeCompany: 'IT Solutions DZ',
    type: 'VIDEO', status: 'COMPLETED', duration: 756, quality: 'EXCELLENT',
    hasRecording: true, recordingUrl: '/recordings/call028.webm',
    startedAt: '2025-01-09T09:30:00', endedAt: '2025-01-09T09:42:36',
    networkType: 'wifi', iceCandidates: 10
  }
]

// Simulated live calls (3 active)
const initialLiveCalls: LiveCall[] = [
  {
    ...mockCallHistory[0], currentDuration: 245, isMuted: false, isVideoEnabled: true
  } as LiveCall,
]

export default function CallsAdminPage() {
  const [callHistory] = useState<CallRecord[]>(mockCallHistory)
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>(initialLiveCalls)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simulate live call duration updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCalls(prev => prev.map(call => ({
        ...call,
        currentDuration: call.currentDuration + 1
      })))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleEndCall = (callId: string) => {
    setLiveCalls(prev => prev.filter(c => c.id !== callId))
  }

  const handleToggleMute = (callId: string) => {
    setLiveCalls(prev => prev.map(c =>
      c.id === callId ? { ...c, isMuted: !c.isMuted } : c
    ))
  }

  // Calculate stats
  const activeCallsToday = liveCalls.length
  const totalDuration = callHistory
    .filter(c => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + c.duration, 0)
  
  const avgCallQuality = (() => {
    const completedCalls = callHistory.filter(c => c.status === 'COMPLETED')
    if (completedCalls.length === 0) return 'N/A'
    
    const qualityScores = { EXCELLENT: 4, GOOD: 3, FAIR: 2, POOR: 1 }
    const avgScore = completedCalls.reduce((sum, c) => 
      sum + (qualityScores[c.quality] || 0), 0) / completedCalls.length
    
    if (avgScore >= 3.5) return 'Excellent'
    if (avgScore >= 2.5) return 'Good'
    if (avgScore >= 1.5) return 'Fair'
    return 'Poor'
  })()

  const recordedCallsCount = callHistory.filter(c => c.hasRecording).length

  // Filter calls
  const filteredCalls = callHistory.filter(call => {
    if (selectedStatus !== 'all' && call.status !== selectedStatus) return false
    if (selectedType !== 'all' && call.type !== selectedType) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        call.callId.toLowerCase().includes(query) ||
        call.callerName.toLowerCase().includes(query) ||
        call.calleeName.toLowerCase().includes(query) ||
        call.callerCompany.toLowerCase().includes(query) ||
        call.calleeCompany.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getStatusBadge = (status: CallRecord['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          In Progress
        </Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>
      case 'MISSED':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Missed</Badge>
      case 'DECLINED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Declined</Badge>
      case 'FAILED':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getQualityBadge = (quality: CallRecord['quality']) => {
    switch (quality) {
      case 'EXCELLENT':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Excellent</Badge>
      case 'GOOD':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>
      case 'FAIR':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Fair</Badge>
      case 'POOR':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Poor</Badge>
      default:
        return <Badge variant="secondary">{quality}</Badge>
    }
  }

  const getQualityColor = (quality: CallRecord['quality']) => {
    switch (quality) {
      case 'EXCELLENT': return 'text-emerald-500'
      case 'GOOD': return 'text-blue-500'
      case 'FAIR': return 'text-yellow-500'
      case 'POOR': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateStr: string) => {
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            WebRTC Calls Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time voice and video call administration
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
        <Card className={activeCallsToday > 0 ? 'border-green-300 bg-green-50/30' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Calls</p>
                <p className={`text-2xl font-bold mt-1 ${activeCallsToday > 0 ? 'text-green-600' : ''}`}>
                  {activeCallsToday}
                </p>
                <p className="text-xs text-gray-500 mt-1">Live now</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                activeCallsToday > 0 ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Phone className={`w-6 h-6 ${activeCallsToday > 0 ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Duration Today</p>
                <p className="text-2xl font-bold mt-1">{formatDuration(totalDuration)}</p>
                <p className="text-xs text-gray-500 mt-1">Completed calls</p>
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
                <p className="text-sm font-medium text-gray-500">Avg. Quality</p>
                <p className="text-2xl font-bold mt-1">{avgCallQuality}</p>
                <p className="text-xs text-gray-500 mt-1">Overall rating</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Signal className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Recorded Calls</p>
                <p className="text-2xl font-bold mt-1">{recordedCallsCount}</p>
                <p className="text-xs text-gray-500 mt-1">of {callHistory.length} total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList>
          <TabsTrigger value="live" className="gap-2">
            {activeCallsToday > 0 && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            )}
            Live Calls ({activeCallsToday})
          </TabsTrigger>
          <TabsTrigger value="history">Call History ({callHistory.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Live Calls Tab */}
        <TabsContent value="live" className="space-y-6">
          {liveCalls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Calls</h3>
                <p className="text-sm text-gray-500">
                  There are no calls in progress at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                  Active Calls Now
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {liveCalls.map((call) => (
                  <div key={call.id} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            {call.type === 'VIDEO' ? (
                              <Video className="w-6 h-6 text-white" />
                            ) : (
                              <Phone className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-pulse border-2 border-white"></span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{call.callerName}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-semibold">{call.calleeName}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {call.callId} • {call.type === 'VIDEO' ? 'Video' : 'Audio'} Call
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-mono font-bold text-green-600">
                            {formatDuration(call.currentDuration)}
                          </p>
                          <p className="text-xs text-gray-500">Duration</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleMute(call.id)}
                            title={call.isMuted ? 'Unmute' : 'Mute'}
                          >
                            {call.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" title="Monitor">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Monitor Call: {call.callId}</DialogTitle>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Caller</p>
                                    <p className="font-semibold">{call.callerName}</p>
                                    <p className="text-sm text-gray-600">{call.callerCompany}</p>
                                  </div>
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Callee</p>
                                    <p className="font-semibold">{call.calleeName}</p>
                                    <p className="text-sm text-gray-600">{call.calleeCompany}</p>
                                  </div>
                                </div>
                                
                                <div className="p-4 bg-black rounded-lg aspect-video flex items-center justify-center">
                                  <Video className="w-16 h-16 text-gray-600" />
                                </div>
                                
                                <div className="flex justify-center gap-4">
                                  <Button variant="destructive" onClick={() => handleEndCall(call.id)}>
                                    <PhoneOff className="mr-2 h-4 w-4" />
                                    End Call
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleEndCall(call.id)}
                            title="End Call"
                          >
                            <PhoneOff className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Call History
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="MISSED">Missed</option>
                  <option value="DECLINED">Declined</option>
                  <option value="FAILED">Failed</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Types</option>
                  <option value="AUDIO">Audio Only</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Recording</TableHead>
                      <TableHead>Started At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.slice(0, 20).map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>
                          <code className="font-mono text-xs">{call.callId}</code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{call.callerName}</p>
                            <p className="text-xs text-gray-500">→ {call.calleeName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {call.type === 'VIDEO' ? (
                              <Video className="w-3 h-3" />
                            ) : (
                              <Phone className="w-3 h-3" />
                            )}
                            {call.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {call.duration > 0 ? formatDuration(call.duration) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(call.status)}</TableCell>
                        <TableCell>{getQualityBadge(call.quality)}</TableCell>
                        <TableCell>
                          {call.hasRecording ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <Volume2 className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDateTime(call.startedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={`/admin/calls/${call.callId}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </a>
                              </DropdownMenuItem>
                              {call.hasRecording && (
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Recording
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Activity className="mr-2 h-4 w-4" />
                                View Analytics
                              </DropdownMenuItem>
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Types Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-500" />
                  Call Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Video Calls', count: callHistory.filter(c => c.type === 'VIDEO').length, percent: (callHistory.filter(c => c.type === 'VIDEO').length / callHistory.length) * 100, color: 'bg-purple-500' },
                  { label: 'Audio Calls', count: callHistory.filter(c => c.type === 'AUDIO').length, percent: (callHistory.filter(c => c.type === 'AUDIO').length / callHistory.length) * 100, color: 'bg-blue-500' }
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-500">{item.count} ({item.percent.toFixed(1)}%)</span>
                    </div>
                    <Progress value={item.percent} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Signal className="w-5 h-5 text-green-500" />
                  Quality Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Excellent', count: callHistory.filter(c => c.quality === 'EXCELLENT').length, color: 'bg-emerald-500' },
                  { label: 'Good', count: callHistory.filter(c => c.quality === 'GOOD').length, color: 'bg-blue-500' },
                  { label: 'Fair', count: callHistory.filter(c => c.quality === 'FAIR').length, color: 'bg-yellow-500' },
                  { label: 'Poor', count: callHistory.filter(c => c.quality === 'POOR').length, color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Completed', count: callHistory.filter(c => c.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-blue-600' },
                  { label: 'Missed', count: callHistory.filter(c => c.status === 'MISSED').length, icon: PhoneOff, color: 'text-yellow-600' },
                  { label: 'Declined', count: callHistory.filter(c => c.status === 'DECLINED').length, icon: XCircle, color: 'text-red-600' },
                  { label: 'Failed', count: callHistory.filter(c => c.status === 'FAILED').length, icon: AlertTriangle, color: 'text-gray-600' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="font-bold text-lg">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Network Types */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Signal className="w-5 h-5 text-orange-500" />
                  Network Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'WiFi', count: callHistory.filter(c => c.networkType === 'wifi').length, icon: '📶' },
                  { label: 'Cellular', count: callHistory.filter(c => c.networkType === 'cellular').length, icon: '📱' },
                  { label: 'Unknown', count: callHistory.filter(c => c.networkType === 'unknown').length, icon: '❓' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
