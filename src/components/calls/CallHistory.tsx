'use client'

import React, { useState, useEffect } from 'react'
import { 
  Phone, 
  Video, 
  PhoneOff, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CallType, CallStatus } from '@/lib/webrtc/signaling-server'

// ============================================
// Type Definitions
// ============================================

interface CallHistoryEntry {
  id: string
  callerId: string
  calleeId: string
  callerName: string
  calleeName: string
  callerAvatar?: string
  calleeAvatar?: string
  callType: CallType
  status: CallStatus
  startedAt: Date
  endedAt?: Date
  durationSeconds?: number
  isRecording?: boolean
  hasScreenShare?: boolean
}

interface CallHistoryProps {
  userId: string
  calls?: CallHistoryEntry[]
  onRecall?: (calleeId: string, calleeName: string, callType: CallType) => void
  onDeleteCall?: (callId: string) => void
  onDeleteAll?: () => void
  onLoadMore?: () => void
  isLoading?: boolean
  hasMore?: boolean
  className?: string
}

// ============================================
// Helper Functions
// ============================================

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '--'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    // Today - show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    // Yesterday
    return 'Yesterday'
  } else if (days < 7) {
    // This week - show day name
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

function getCallIcon(
  entry: CallHistoryEntry,
  currentUserId: string
): React.ReactNode {
  const isIncoming = entry.calleeId === currentUserId
  
  switch (entry.status) {
    case 'MISSED':
      return <PhoneMissed className="w-4 h-4 text-red-500" />
    case 'DECLINED':
      return <PhoneMissed className="w-4 h-4 text-gray-400" />
    case 'ENDED':
    case 'FAILED':
      return isIncoming 
        ? <PhoneIncoming className="w-4 h-4 text-green-600" />
        : <PhoneOutgoing className="w-4 h-4 text-blue-600" />
    default:
      return <Phone className="w-4 h-4 text-gray-500" />
  }
}

function getStatusBadge(status: CallStatus): React.ReactNode {
  switch (status) {
    case 'ENDED':
      return <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
    case 'MISSED':
      return <Badge variant="destructive">Missed</Badge>
    case 'DECLINED':
      return <Badge variant="secondary">Declined</Badge>
    case 'FAILED':
      return <Badge variant="secondary" className="bg-red-50 text-red-600">Failed</Badge>
    default:
      return null
  }
}

// ============================================
// Main Component
// ============================================

export default function CallHistory({
  userId,
  calls = [],
  onRecall,
  onDeleteCall,
  onDeleteAll,
  onLoadMore,
  isLoading = false,
  hasMore = false,
  className = '',
}: CallHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Filter calls based on search and filters
  const filteredCalls = calls.filter(call => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesCaller = call.callerName.toLowerCase().includes(query)
      const matchesCallee = call.calleeName.toLowerCase().includes(query)
      if (!matchesCaller && !matchesCallee) return false
    }

    // Type filter
    if (filterType !== 'all' && call.callType !== filterType) return false

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed' && call.status !== 'ENDED') return false
      if (filterStatus === 'missed' && !['MISSED', 'DECLINED'].includes(call.status)) return false
    }

    return true
  })

  // Group calls by date for better organization
  const groupedCalls = filteredCalls.reduce<Record<string, CallHistoryEntry[]>>((groups, call) => {
    const dateKey = new Date(call.startedAt).toLocaleDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(call)
    return groups
  }, {})

  // Get other participant info
  const getOtherParticipant = (call: CallHistoryEntry) => {
    const isCallee = call.calleeId === userId
    return {
      name: isCallee ? call.callerName : call.calleeName,
      avatar: isCallee ? call.callerAvatar : call.calleeAvatar,
      id: isCallee ? call.callerId : call.calleeId,
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Call History</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCalls.length} call{filteredCalls.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Delete all button */}
        {onDeleteAll && calls.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteAll}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="AUDIO">Voice Calls</SelectItem>
            <SelectItem value="VIDEO">Video Calls</SelectItem>
            <SelectItem value="SCREEN_SHARE">Screen Share</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading calls...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredCalls.length === 0 && (
        <Card className="p-8 text-center">
          <Phone className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium text-lg mb-1">No calls found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Your call history will appear here'}
          </p>
        </Card>
      )}

      {/* Call list grouped by date */}
      {!isLoading && Object.entries(groupedCalls).map(([date, dayCalls]) => (
        <div key={date} className="space-y-2">
          {/* Date header */}
          <h3 className="text-sm font-medium text-muted-foreground px-1 sticky top-0 bg-background py-2">
            {new Date(date).toLocaleDateString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
            })}
          </h3>

          {/* Calls for this date */}
          {dayCalls.map((call) => {
            const other = getOtherParticipant(call)

            return (
              <Card
                key={call.id}
                className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => onRecall?.(other.id, other.name, call.callType)}
              >
                <div className="flex items-center gap-3">
                  {/* Call icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getCallIcon(call, userId)}
                  </div>

                  {/* Participant info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{other.name}</span>
                      {call.isRecording && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          REC
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {call.callType === 'VIDEO' ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <Phone className="w-3 h-3" />
                        )}
                        {formatTime(new Date(call.startedAt))}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(call.durationSeconds || 0)}
                      </span>
                      {getStatusBadge(call.status)}
                    </div>
                  </div>

                  {/* Duration for completed calls */}
                  {call.status === 'ENDED' && call.durationSeconds && (
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatDuration(call.durationSeconds)}
                    </span>
                  )}

                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onRecall?.(other.id, other.name, 'AUDIO')
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2 text-green-500" />
                        Voice Call Back
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onRecall?.(other.id, other.name, 'VIDEO')
                        }}
                      >
                        <Video className="w-4 h-4 mr-2 text-blue-500" />
                        Video Call Back
                      </DropdownMenuItem>
                      {onDeleteCall && (
                        <>
                          <div className="h-px my-1 bg-border" />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteCall(call.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          })}
        </div>
      ))}

      {/* Load more button */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Load More
          </Button>
        </div>
      )}

      {/* Summary stats at bottom */}
      {!isLoading && calls.length > 0 && (
        <div className="flex items-center justify-center gap-6 pt-4 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <PhoneIncoming className="w-3.5 h-3.5 text-green-500" />
            {calls.filter(c => c.calleeId === userId && c.status === 'ENDED').length} received
          </span>
          <span className="flex items-center gap-1">
            <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500" />
            {calls.filter(c => c.callerId === userId && c.status === 'ENDED').length} made
          </span>
          <span className="flex items-center gap-1">
            <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
            {calls.filter(c => ['MISSED', 'DECLINED'].includes(c.status)).length} missed
          </span>
        </div>
      )}
    </div>
  )
}
