'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Phone,
  Video,
  Clock,
  Signal,
  Mic,
  MicOff,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  Wifi,
  Smartphone,
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  FileText,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface CallEvent {
  id: number
  timestamp: string
  type: 'RINGING' | 'CONNECTED' | 'HOLD' | 'RESUME' | 'ENDED' | 'QUALITY_CHANGE' | 'ERROR'
  description: string
  details?: string
}

interface QualityMetric {
  label: string
  value: string | number
  unit: string
  status: 'good' | 'warning' | 'critical'
  percentage: number
}

interface ReportedIssue {
  id: number
  type: 'AUDIO' | 'VIDEO' | 'CONNECTION' | 'OTHER'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  timestamp: string
  resolved: boolean
}

// Mock data for a single call detail
const mockCallDetail = {
  callId: 'CALL-2025-001',
  status: 'COMPLETED',
  type: 'VIDEO',
  duration: 342,
  quality: 'EXCELLENT',
  hasRecording: true,
  recordingUrl: '/recordings/call001.webm',
  recordingSize: '24.5 MB',
  
  // Participants
  caller: {
    name: 'Ahmed Benali',
    company: 'TechnoDz Sarl',
    email: 'ahmed.benali@technodz.dz',
    userId: 'user_001',
    role: 'caller',
    deviceInfo: {
      device: 'Desktop',
      browser: 'Chrome 120.0',
      os: 'Windows 11',
      ip: '196.xxx.xxx.xxx'
    }
  },
  callee: {
    name: 'Karim Hadj',
    company: 'HardwarePro Algeria',
    email: 'karim.hadj@hardwarepro.dz',
    userId: 'user_045',
    role: 'callee',
    deviceInfo: {
      device: 'Mobile',
      browser: 'Safari 17.2',
      os: 'iOS 17.3',
      ip: '41.xxx.xxx.xxx'
    }
  },
  
  // Connection info
  connection: {
    networkType: 'wifi',
    iceCandidates: 8,
    turnServer: 'turn:algeriatrade.dz:5349',
    region: 'EU-West',
    protocol: 'UDP/TLS'
  },
  
  // Timestamps
  startedAt: '2025-01-20T10:30:00',
  connectedAt: '2025-01-20T10:30:03',
  endedAt: '2025-01-20T10:35:42',
  
  // Related info
  orderId: 'ORD-2025-001',
  negotiationId: 'NEG-2025-042'
}

const mockCallEvents: CallEvent[] = [
  { id: 1, timestamp: '2025-01-20T10:30:00', type: 'RINGING', description: 'Call initiated by Ahmed Benali' },
  { id: 2, timestamp: '2025-01-20T10:30:02', type: 'RINGING', description: 'Ringing Karim Hadj...' },
  { id: 3, timestamp: '2025-01-20T10:30:03', type: 'CONNECTED', description: 'Call connected', details: 'ICE connection established in 2.1s' },
  { id: 4, timestamp: '2025-01-20T10:32:15', type: 'HOLD', description: 'Caller placed call on hold' },
  { id: 5, timestamp: '2025-01-20T10:33:45', type: 'RESUME', description: 'Call resumed' },
  { id: 6, timestamp: '2025-01-20T10:34:00', type: 'QUALITY_CHANGE', description: 'Quality adjustment', details: 'Bandwidth reduced to 500kbps' },
  { id: 7, timestamp: '2025-01-20T10:35:42', type: 'ENDED', description: 'Call ended normally', details: 'Duration: 5m 42s' }
]

const mockQualityMetrics: QualityMetric[] = [
  { label: 'Average Latency', value: 45, unit: 'ms', status: 'good', percentage: 90 },
  { label: 'Packet Loss', value: 0.02, unit: '%', status: 'good', percentage: 98 },
  { label: 'Jitter', value: 3.2, unit: 'ms', status: 'good', percentage: 95 },
  { label: 'Video Bitrate', value: 850, unit: 'kbps', status: 'good', percentage: 85 },
  { label: 'Audio Bitrate', value: 64, unit: 'kbps', status: 'good', percentage: 100 },
  { label: 'Round Trip Time', value: 52, unit: 'ms', status: 'good', percentage: 88 },
  { label: 'CPU Usage (Caller)', value: 23, unit: '%', status: 'good', percentage: 77 },
  { label: 'CPU Usage (Callee)', value: 31, unit: '%', status: 'good', percentage: 69 }
]

const mockReportedIssues: ReportedIssue[] = [
  {
    id: 1,
    type: 'CONNECTION',
    severity: 'LOW',
    description: 'Brief video freeze at 10:32:15 during hold operation',
    timestamp: '2025-01-20T10:32:16',
    resolved: true
  }
]

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [call] = useState(mockCallDetail)
  const [events] = useState(mockCallEvents)
  const [qualityMetrics] = useState(mockQualityMetrics)
  const [reportedIssues] = useState(mockReportedIssues)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventIcon = (type: CallEvent['type']) => {
    switch (type) {
      case 'RINGING': return <Phone className="w-4 h-4 text-yellow-500" />
      case 'CONNECTED': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'HOLD': return <Pause className="w-4 h-4 text-orange-500" />
      case 'RESUME': return <Play className="w-4 h-4 text-blue-500" />
      case 'ENDED': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'QUALITY_CHANGE': return <Signal className="w-4 h-4 text-purple-500" />
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getQualityBadge = (quality: string) => {
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

  const getStatusColor = (status: QualityMetric['status']) => {
    switch (status) {
      case 'good': return 'text-emerald-600 bg-emerald-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'critical': return 'text-red-600 bg-red-50'
    }
  }

  const getSeverityBadge = (severity: ReportedIssue['severity']) => {
    switch (severity) {
      case 'LOW': return <Badge className="bg-blue-100 text-blue-700">Low</Badge>
      case 'MEDIUM': return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>
      case 'HIGH': return <Badge className="bg-red-100 text-red-700">High</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/admin/calls')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{call.callId}</h1>
              {getQualityBadge(call.quality)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formatDateTime(call.startedAt)} • Duration: {formatDuration(call.duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          {call.hasRecording && (
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download Recording
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Participant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Caller */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Caller
                  <Badge variant="outline" className="ml-auto">{call.caller.role}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                    {call.caller.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{call.caller.name}</p>
                    <p className="text-sm text-gray-500">{call.caller.company}</p>
                    <p className="text-xs text-gray-400">{call.caller.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-700 mb-2">Device Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      {call.caller.deviceInfo.device === 'Desktop' ? (
                        <Monitor className="w-4 h-4" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                      {call.caller.deviceInfo.device}
                    </div>
                    <div className="text-gray-600">{call.caller.deviceInfo.browser}</div>
                    <div className="text-gray-600 col-span-2">{call.caller.deviceInfo.os}</div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View User Profile
                </Button>
              </CardContent>
            </Card>

            {/* Callee */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  Callee
                  <Badge variant="outline" className="ml-auto">{call.callee.role}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                    {call.callee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{call.callee.name}</p>
                    <p className="text-sm text-gray-500">{call.callee.company}</p>
                    <p className="text-xs text-gray-400">{call.callee.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-700 mb-2">Device Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      {call.callee.deviceInfo.device === 'Desktop' ? (
                        <Monitor className="w-4 h-4" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                      {call.callee.deviceInfo.device}
                    </div>
                    <div className="text-gray-600">{call.callee.deviceInfo.browser}</div>
                    <div className="text-gray-600 col-span-2">{call.callee.deviceInfo.os}</div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View User Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Call Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Call Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-semibold flex items-center gap-1 mt-1">
                    {call.type === 'VIDEO' ? (
                      <><Video className="w-4 h-4 text-purple-500" /> Video</>
                    ) : (
                      <><Phone className="w-4 h-4 text-blue-500" /> Audio</>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold mt-1">{formatDuration(call.duration)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold mt-1 capitalize">{call.status.toLowerCase()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Network</p>
                  <p className="font-semibold flex items-center gap-1 mt-1">
                    <Wifi className="w-4 h-4 text-green-500" />
                    {call.connection.networkType.toUpperCase()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">ICE Candidates</p>
                  <p className="font-semibold mt-1">{call.connection.iceCandidates}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Protocol</p>
                  <p className="font-semibold mt-1">{call.connection.protocol}</p>
                </div>
              </div>

              {/* Related Items */}
              <Separator className="my-4" />
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-gray-500">Related Order</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{call.orderId}</code>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Related Negotiation</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{call.negotiationId}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recording Tab */}
        <TabsContent value="recording" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-orange-500" />
                Call Recording
              </CardTitle>
              <CardDescription>
                {call.hasRecording 
                  ? `Recording available • ${call.recordingSize}`
                  : 'No recording available for this call'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {call.hasRecording ? (
                <div className="space-y-6">
                  {/* Video Player Placeholder */}
                  <div className="relative bg-black rounded-xl aspect-video max-w-3xl mx-auto overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <video
                        className="w-full h-full object-contain"
                        poster="/api/placeholder/800/450"
                      >
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Custom Controls Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                          </Button>
                          
                          <div className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer">
                            <div className="h-full bg-white rounded-full w-1/3"></div>
                          </div>
                          
                          <span className="text-white text-sm font-mono">01:47 / 05:42</span>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setIsMuted(!isMuted)}
                          >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Center Play Button */}
                    {!isPlaying && (
                      <button 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                        onClick={() => setIsPlaying(true)}
                      >
                        <Play className="w-8 h-8 text-gray-800 ml-1" />
                      </button>
                    )}
                  </div>

                  {/* Recording Info */}
                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Format</p>
                        <p className="font-semibold">WebM (VP9)</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Resolution</p>
                        <p className="font-semibold">1280x720</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Frame Rate</p>
                        <p className="font-semibold">30 fps</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Audio</p>
                        <p className="font-semibold">Opus 48kHz</p>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3">
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download WebM
                      </Button>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio Only
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <VolumeX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Recording Available</h3>
                  <p className="text-sm text-gray-500">
                    This call was not recorded or the recording could not be saved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Event Timeline
              </CardTitle>
              <CardDescription>Chronological log of all call events</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {events.map((event, idx) => (
                    <div key={event.id} className="relative flex gap-4 pl-12">
                      {/* Timeline Dot */}
                      <div className={`absolute left-3 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                        event.type === 'CONNECTED' ? 'bg-green-500' :
                        event.type === 'ENDED' ? 'bg-gray-400' :
                        event.type === 'ERROR' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}>
                        {getEventIcon(event.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{event.description}</p>
                            {event.details && (
                              <p className="text-sm text-gray-500 mt-1">{event.details}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-400 whitespace-nowrap">
                            {formatDateTime(event.timestamp).split(', ')[1]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Signal className="w-5 h-5 text-teal-500" />
                Quality Metrics
              </CardTitle>
              <CardDescription>Detailed technical performance indicators</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qualityMetrics.map((metric) => (
                  <div key={metric.label} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{metric.label}</p>
                        <p className="text-2xl font-bold mt-1">
                          {typeof metric.value === 'number' ? metric.value.toFixed(metric.unit === '%' ? 2 : 1) : metric.value}
                          <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
                        </p>
                      </div>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <Progress value={metric.percentage} className="h-2 mt-3" />
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Overall Assessment</span>
                </div>
                <p className="text-sm text-green-700">
                  This call had excellent quality with minimal latency and no significant packet loss.
                  Both participants experienced smooth audio/video throughout the conversation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Reported Issues
              </CardTitle>
              <CardDescription>
                {reportedIssues.length > 0 
                  ? `${reportedIssues.length} issue(s) reported during this call`
                  : 'No issues were reported for this call'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {reportedIssues.length > 0 ? (
                <div className="space-y-4">
                  {reportedIssues.map((issue) => (
                    <div key={issue.id} className={`p-4 rounded-lg border ${
                      issue.resolved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSeverityBadge(issue.severity)}
                            <Badge variant="outline">{issue.type}</Badge>
                            {issue.resolved && (
                              <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                            )}
                          </div>
                          <p className="text-sm">{issue.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Reported: {formatDateTime(issue.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">All Clear!</h3>
                  <p className="text-sm text-gray-500">
                    No issues were reported during this call.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
