'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, Video, PhoneOff, Clock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CallType } from '@/lib/webrtc/signaling-server'

interface IncomingCallModalProps {
  visible: boolean
  callerId: string
  callerName: string
  callerAvatar?: string
  callType: CallType
  contextType?: 'DIRECT' | 'ORDER_RELATED' | 'PRODUCT_QUESTION' | 'SUPPORT'
  contextId?: string
  onAccept: () => void
  onDecline: (reason?: string) => void
  onSendMessage?: (message: string) => void
}

// Quick reply options for declining with message
const QUICK_REPLIES = [
  "Can't talk now, call later?",
  "I'll call you back in 5 minutes",
  "I'm in a meeting",
  "Send me a message instead",
]

export default function IncomingCallModal({
  visible,
  callerId,
  callerName,
  callerAvatar,
  callType,
  contextType,
  onAccept,
  onDecline,
  onSendMessage,
}: IncomingCallModalProps) {
  const [ringDuration, setRingDuration] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const ringStartTimeRef = useRef<number | null>(null)
  const prevVisibleRef = useRef(visible)

  // Track ringing duration - use ref to avoid effect cascading
  useEffect(() => {
    // Reset when modal becomes visible
    if (visible && !prevVisibleRef.current) {
      setRingDuration(0)
      ringStartTimeRef.current = Date.now()
    }
    
    // Reset when modal hides
    if (!visible && prevVisibleRef.current) {
      setRingDuration(0)
      ringStartTimeRef.current = null
    }
    
    prevVisibleRef.current = visible
    
    if (!visible) return

    const interval = setInterval(() => {
      if (ringStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - ringStartTimeRef.current) / 1000)
        setRingDuration(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [visible])

  // Auto-decline after 60 seconds of ringing
  useEffect(() => {
    if (!visible || ringDuration < 59) return
    
    const timer = setTimeout(() => {
      onDecline('No answer - auto declined')
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [ringDuration, visible, onDecline])

  // Ringing animation effect - use CSS class toggle instead of state
  useEffect(() => {
    if (!visible) {
      setIsAnimating(false)
      return
    }
    
    // Start animation after a tick to ensure initial render
    const startTimer = setTimeout(() => {
      setIsAnimating(true)
    }, 0)

    const animationInterval = setInterval(() => {
      setIsAnimating(prev => !prev)
    }, 1000)

    return () => {
      clearTimeout(startTimer)
      clearInterval(animationInterval)
    }
  }, [visible])

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle quick reply
  const handleQuickReply = (message: string) => {
    if (onSendMessage) {
      onSendMessage(message)
    }
    onDecline(`Auto-reply: ${message}`)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md mx-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header with gradient based on call type */}
        <div className={`p-6 text-white ${
          callType === 'VIDEO' 
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700' 
            : 'bg-gradient-to-br from-violet-600 to-purple-700'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">
                Incoming {callType === 'AUDIO' ? 'Voice' : 'Video'} Call
              </span>
            </Badge>
            <span className="text-sm font-mono opacity-90">
              {formatDuration(ringDuration)}
            </span>
          </div>

          {/* Caller info with animated avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {/* Animated rings around avatar */}
              <div 
                className={`absolute inset-0 rounded-full bg-white/20 transition-transform duration-500 ${
                  isAnimating ? 'scale-110' : 'scale-100'
                }`}
              />
              <div className={`absolute -inset-2 rounded-full border-2 border-white/40 ${
                isAnimating ? 'animate-pulse' : ''
              }`} />
              
              <Avatar className="w-20 h-20 ring-4 ring-white/30 relative">
                <AvatarImage src={callerAvatar} alt={callerName} />
                <AvatarFallback className="bg-white/20 text-3xl font-bold">
                  {callerName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>

              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold truncate">{callerName}</h3>
              
              {/* Context badge */}
              {contextType && contextType !== 'DIRECT' && (
                <Badge variant="outline" className="mt-2 bg-white/10 text-white/90 border-white/30 text-xs">
                  {contextType.replace('_', ' ')}: {contextId}
                </Badge>
              )}
              
              <p className="text-sm mt-2 opacity-80">
                wants to {callType === 'AUDIO' ? 'voice' : 'video'} call you...
              </p>
            </div>
          </div>
        </div>

        {/* Video preview placeholder for video calls */}
        {callType === 'VIDEO' && (
          <div className="h-28 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
            {/* Simulated video preview area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-24 bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-gray-700">
                <Video className="w-8 h-8 text-gray-500" />
                <span className="text-xs text-gray-500">Incoming video</span>
              </div>
            </div>
            
            {/* Scanning line animation */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-scan" />
          </div>
        )}

        {/* Action buttons */}
        <div className="p-6 pt-5">
          <div className="flex items-center justify-center gap-6">
            {/* Decline button */}
            <Button
              size="lg"
              onClick={() => onDecline('Declined by user')}
              className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
            
            {/* Accept button with pulse animation */}
            <div className="relative">
              {/* Pulsing ring effect */}
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25" />
              <div className="absolute -inset-1 rounded-full bg-green-400 animate-pulse opacity-40" />
              
              <Button
                size="lg"
                onClick={onAccept}
                className="rounded-full h-20 w-20 bg-green-500 hover:bg-green-600 text-white shadow-xl shadow-green-500/40 hover:shadow-green-500/60 transition-all relative z-10"
              >
                {callType === 'AUDIO' ? (
                  <Phone className="w-8 h-8" />
                ) : (
                  <Video className="w-8 h-8" />
                )}
              </Button>
            </div>
            
            {/* Message button (if callback provided) */}
            {onSendMessage && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {}}
                className="rounded-full h-16 w-16 border-2 hover:bg-gray-50 transition-all"
              >
                <MessageSquare className="w-7 h-7" />
              </Button>
            )}
          </div>

          {/* Button labels */}
          <div className="flex items-center justify-center gap-6 mt-3">
            <span className="text-xs text-muted-foreground w-16 text-center">Decline</span>
            <span className="text-xs text-green-600 font-medium w-20 text-center">Accept</span>
            {onSendMessage && (
              <span className="text-xs text-muted-foreground w-16 text-center">Message</span>
            )}
          </div>
        </div>

        {/* Quick reply options */}
        <div className="px-6 pb-5">
          <p className="text-xs text-center text-muted-foreground mb-3 font-medium">
            Or reply with a quick message:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_REPLIES.map((message, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(message)}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700 hover:text-gray-900 max-w-[180px] truncate"
                title={message}
              >
                {message}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Custom CSS for scan animation */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(112px); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
