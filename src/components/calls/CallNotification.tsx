'use client'

import React, { useState, useEffect } from 'react'
import { Phone, Video, PhoneOff, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CallType } from '@/lib/webrtc/signaling-server'

interface CallNotificationProps {
  visible: boolean
  callerId: string
  callerName: string
  callerAvatar?: string
  callType: CallType
  contextType?: string
  onAccept: () => void
  onDecline: () => void
  ringDuration?: number
}

export default function CallNotification({
  visible,
  callerName,
  callerAvatar,
  callType,
  contextType,
  onAccept,
  onDecline,
  ringDuration = 0,
}: CallNotificationProps) {
  const [duration, setDuration] = useState(ringDuration)

  // Track ringing duration
  useEffect(() => {
    if (!visible) {
      setDuration(0)
      return
    }

    const interval = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [visible])

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Auto-decline after 60 seconds of ringing
  useEffect(() => {
    if (!visible || duration >= 60) return

    if (duration === 59) {
      onDecline()
    }
  }, [duration, visible, onDecline])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 gap-1">
              <Clock className="w-3 h-3" />
              Incoming {callType.toLowerCase()} call
            </Badge>
            <span className="text-sm opacity-80">{formatDuration(duration)}</span>
          </div>

          {/* Caller info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-4 ring-white/30">
                <AvatarImage src={callerAvatar} />
                <AvatarFallback className="bg-white/20 text-2xl">
                  {callerName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Animated ring around avatar */}
              <div className="absolute inset-0 rounded-full animate-ping bg-green-400/30" />
              <div className="absolute -inset-1 rounded-full border-2 border-green-400/50 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold truncate">{callerName}</h3>
              {contextType && contextType !== 'DIRECT' && (
                <p className="text-sm opacity-80 mt-1 capitalize">
                  {contextType.replace('_', ' ')}
                </p>
              )}
              <p className="text-sm opacity-70 mt-1">
                wants to {callType === 'AUDIO' ? 'voice' : 'video'} call you
              </p>
            </div>
          </div>
        </div>

        {/* Animated call animation for video calls */}
        {callType !== 'AUDIO' && (
          <div className="h-24 bg-gradient-to-b from-purple-500/10 to-transparent relative overflow-hidden">
            {/* Simulated video preview placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-6 flex items-center justify-center gap-4">
          {/* Decline button */}
          <Button
            size="lg"
            onClick={onDecline}
            className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          
          {/* Accept button with pulse effect */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
            <Button
              size="lg"
              onClick={onAccept}
              className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600 text-white relative z-10"
            >
              {callType === 'AUDIO' ? (
                <Phone className="w-7 h-7" />
              ) : (
                <Video className="w-7 h-7" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick response options */}
        <div className="px-6 pb-4">
          <p className="text-xs text-center text-muted-foreground mb-2">
            Or reply with a message:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Can't talk now, call later?",
              "I'll call you back in 5 minutes",
              "I'm in a meeting",
              "Send me a message instead",
            ].map((message, index) => (
              <button
                key={index}
                onClick={() => {
                  // Would send auto-reply and decline
                  console.log('Auto-reply:', message)
                  onDecline()
                }}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {message}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// Compact notification variant (for toast-style notifications)
export function CompactCallNotification({
  visible,
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onDecline,
}: Omit<CallNotificationProps, 'ringDuration' | 'contextType'>) {
  if (!visible) return null

  return (
    <div className="fixed top-4 right-4 z-[100] w-80 animate-in slide-in-from-right duration-300">
      <Card className="overflow-hidden shadow-xl border-l-4 border-l-green-500">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarImage src={callerAvatar} />
                <AvatarFallback>{callerName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{callerName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                Incoming {callType.toLowerCase()} call...
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={onDecline}
                  variant="outline"
                  className="h-8 px-3 text-xs"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={onAccept}
                  className="h-8 px-3 text-xs bg-green-500 hover:bg-green-600"
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
