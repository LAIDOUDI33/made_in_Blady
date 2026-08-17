'use client'

import React, { useRef, useEffect, useState } from 'react'
import { 
  Phone, 
  Mic, 
  MicOff, 
  Volume2,
  Pause,
  Circle,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import CallControls from './CallControls'
import ChatDuringCall from './ChatDuringCall'
import CallQualityIndicator from './CallQualityIndicator'
import type { WebRTCCall, CallStatus } from '@/lib/webrtc/signaling-server'

interface AudioCallWindowProps {
  call: WebRTCCall
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callStatus: CallStatus | null
  isMuted: boolean
  isOnHold: boolean
  isRecording: boolean
  callDuration: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | null
  
  // Callbacks
  onHangup: () => void
  onToggleMute: () => void
  onToggleHold: () => void
  onToggleRecording: () => void
  
  // Optional features
  showChat?: boolean
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export default function AudioCallWindow({
  call,
  localStream,
  callStatus,
  isMuted,
  isOnHold,
  isRecording,
  callDuration,
  connectionQuality,
  
  onHangup,
  onToggleMute,
  onToggleHold,
  onToggleRecording,
  
  showChat = false,
  isMinimized = false,
  onToggleMinimize,
}: AudioCallWindowProps) {
  const [showChatPanel, setShowChatPanel] = useState(showChat)
  
  // Get other participant info
  const otherParticipant = {
    name: call.calleeName,
    avatar: call.calleeAvatar,
  }

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Generate audio waveform visualization (simulated)
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    if (callStatus !== 'CONNECTED') return

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100)
    }, 100)

    return () => clearInterval(interval)
  }, [callStatus])

  // Minimized view (floating window for audio calls)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 h-20 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex items-center px-4 gap-3">
        {/* Animated audio indicator */}
        <div className="flex items-end gap-0.5 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-green-400 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(4, audioLevel * (0.3 + Math.random() * 0.7))}%`,
              }}
            />
          ))}
        </div>

        {/* Caller info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{otherParticipant.name}</p>
          <p className="text-green-400 text-xs">{formatDuration(callDuration)}</p>
        </div>

        {/* Hangup button */}
        <Button
          size="icon"
          onClick={onHangup}
          className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white"
        >
          <Phone className="w-3 h-3" />
        </Button>

        {/* Expand button */}
        {onToggleMinimize && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMinimize}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      {/* Background blur effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(99, 102, 241, 0.3) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto p-6 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-8">
          <Avatar className={`w-32 h-32 ring-4 ${callStatus === 'CONNECTED' ? 'ring-green-500/50' : 'ring-white/10'} transition-all duration-500`}>
            <AvatarImage src={otherParticipant.avatar} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              {otherParticipant.name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          
          {/* Pulsing ring when connected */}
          {callStatus === 'CONNECTED' && !isOnHold && (
            <div className="absolute inset-0 rounded-full animate-ping bg-green-400/20" />
          )}

          {/* On hold indicator */}
          {isOnHold && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-500 text-yellow-950 gap-1">
                <Pause className="w-3 h-3" />
                On Hold
              </Badge>
            </div>
          )}
        </div>

        {/* Caller name and status */}
        <h2 className="text-white text-3xl font-bold mb-2">{otherParticipant.name}</h2>
        
        <div className="flex items-center justify-center gap-3 mb-8">
          <Badge 
            variant={callStatus === 'CONNECTED' ? 'default' : 'secondary'}
            className={`${callStatus === 'CONNECTED' ? 'bg-green-500' : ''}`}
          >
            {callStatus === 'RINGING' ? 'Calling...' : 
             callStatus === 'CONNECTED' ? 'Connected' :
             callStatus || 'Connecting...'}
          </Badge>
          
          <span className="text-white/70 text-lg font-mono">{formatDuration(callDuration)}</span>
          
          {isRecording && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <Circle className="w-2 h-2 fill-current" />
              REC
            </Badge>
          )}
        </div>

        {/* Audio visualization */}
        {callStatus === 'CONNECTED' && !isOnHold && (
          <div className="flex items-center justify-center gap-1 mb-8 h-16">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-green-500 to-emerald-300 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(8, audioLevel * (0.2 + Math.sin(i * 0.5 + Date.now() * 0.005) * 0.4 + Math.random() * 0.4))}%`,
                }}
              />
            ))}
          </div>
        )}

        {/* Connection quality */}
        <div className="mb-8">
          <CallQualityIndicator quality={connectionQuality} showLabel />
        </div>

        {/* Context info */}
        {call.contextType !== 'DIRECT' && (
          <div className="mb-6">
            <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
              {call.contextType.replace('_', ' ')}: {call.contextId}
            </Badge>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Mute button */}
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={onToggleMute}
            className={`rounded-full h-14 w-14 ${!isMuted ? 'bg-white/10 hover:bg-white/20 text-white' : ''}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* Hold button */}
          <Button
            size="lg"
            variant={isOnHold ? 'default' : 'secondary'}
            onClick={onToggleHold}
            className={`rounded-full h-14 w-14 ${!isOnHold ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            <Pause className="w-6 h-6" />
          </Button>

          {/* Hangup button */}
          <Button
            size="lg"
            onClick={onHangup}
            className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white"
          >
            <Phone className="w-7 h-7 rotate-[135deg]" />
          </Button>

          {/* Recording button */}
          <Button
            size="lg"
            variant={isRecording ? 'destructive' : 'secondary'}
            onClick={onToggleRecording}
            className={`rounded-full h-14 w-14 ${!isRecording ? 'bg-white/10 hover:bg-white/20 text-white' : ''}`}
          >
            <Circle className={`w-6 h-6 ${isRecording ? 'fill-current' : ''}`} />
          </Button>

          {/* Chat button */}
          <Button
            size="lg"
            variant={showChatPanel ? 'default' : 'secondary'}
            onClick={() => setShowChatPanel(!showChatPanel)}
            className={`rounded-full h-14 w-14 ${!showChatPanel ? 'bg-white/10 hover:bg-white/20 text-white' : ''}`}
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Chat panel overlay */}
      {showChatPanel && (
        <ChatDuringCall
          messages={[]}
          onSendMessage={() => {}}
          onClose={() => setShowChatPanel(false)}
        />
      )}
    </div>
  )
}
