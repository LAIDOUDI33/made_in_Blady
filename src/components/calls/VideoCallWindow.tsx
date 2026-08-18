'use client'

import React, { useRef, useEffect, useState } from 'react'
import { 
  Phone, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor,
  Maximize2,
  Minimize2,
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
import ScreenShareView from './ScreenShareView'
import type { WebRTCCall, CallStatus } from '@/lib/webrtc/signaling-server'

interface VideoCallWindowProps {
  call: WebRTCCall
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callStatus: CallStatus | null
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isOnHold: boolean
  isRecording: boolean
  callDuration: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | null
  
  // Callbacks
  onHangup: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleHold: () => void
  onToggleRecording: () => void
  
  // Optional features
  showChat?: boolean
  isMinimized?: boolean
  onToggleMinimize?: () => void
  onToggleFullscreen?: () => void
}

export default function VideoCallWindow({
  call,
  localStream,
  remoteStream,
  callStatus,
  isMuted,
  isVideoOff,
  isScreenSharing,
  isOnHold,
  isRecording,
  callDuration,
  connectionQuality,
  
  onHangup,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHold,
  onToggleRecording,
  
  showChat = false,
  isMinimized = false,
  onToggleMinimize,
  onToggleFullscreen,
}: VideoCallWindowProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isPiP, setIsPiP] = useState(false)
  const [showChatPanel, setShowChatPanel] = useState(showChat)

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get other participant info (the person we're calling or who called us)
  const otherParticipant = {
    name: call.calleeName, // Simplified - in real app would determine based on role
    avatar: call.calleeAvatar,
  }

  // Minimized view (floating window)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 h-44 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="relative w-full h-full">
          {/* Remote video (small) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            muted={false}
          />
          
          {/* Overlay info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={otherParticipant.avatar} />
                  <AvatarFallback>{otherParticipant.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-medium truncate max-w-[120px]">
                  {otherParticipant.name}
                </span>
              </div>
              <span className="text-white/70 text-xs">{formatDuration(callDuration)}</span>
            </div>
          </div>

          {/* Expand button */}
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMinimize}
              className="absolute top-2 right-2 text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote video (main) */}
        {isScreenSharing ? (
          <ScreenShareView stream={remoteStream} />
        ) : (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isOnHold ? 'opacity-30' : ''}`}
            muted={false}
          />
        )}

        {/* On hold overlay */}
        {isOnHold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <Pause className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-white text-xl font-semibold">Call on Hold</p>
            </div>
          </div>
        )}

        {/* No remote stream placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-white/10">
                <AvatarImage src={otherParticipant.avatar} />
                <AvatarFallback className="text-4xl">{otherParticipant.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <h3 className="text-white text-2xl font-semibold">{otherParticipant.name}</h3>
              <p className="text-gray-400 mt-2 capitalize">{call.callType.toLowerCase()} call</p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {localStream && !isVideoOff && (
          <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-move group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            
            {/* PiP toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPiP(!isPiP)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            
            {/* Mute indicator */}
            {isMuted && (
              <div className="absolute bottom-1 left-1 bg-red-500 rounded-full p-1">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Top bar with call info and controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-white/20">
              <AvatarImage src={otherParticipant.avatar} />
              <AvatarFallback>{otherParticipant.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-white font-semibold text-lg">{otherParticipant.name}</h2>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={callStatus === 'CONNECTED' ? 'default' : 'secondary'}
                  className={callStatus === 'CONNECTED' ? 'bg-green-500' : ''}
                >
                  {callStatus || 'Connecting...'}
                </Badge>
                <span className="text-white/70 text-sm">{formatDuration(callDuration)}</span>
                {isRecording && (
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    <Circle className="w-2 h-2 fill-current" />
                    REC
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection quality indicator */}
            <CallQualityIndicator quality={connectionQuality} />
            
            {/* Fullscreen button */}
            {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            )}
            
            {/* Minimize button */}
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMinimize}
                className="text-white hover:bg-white/20"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Context badge */}
        {call.contextType !== 'DIRECT' && (
          <div className="absolute top-20 left-4">
            <Badge variant="outline" className="bg-black/30 text-white border-white/20">
              {call.contextType.replace('_', ' ')}: {call.contextId}
            </Badge>
          </div>
        )}
      </div>

      {/* Chat panel (toggleable) */}
      {showChatPanel && (
        <ChatDuringCall
          messages={[]}
          onSendMessage={() => {}}
          onClose={() => setShowChatPanel(false)}
        />
      )}

      {/* Bottom control bar */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <CallControls
            callType={call.callType}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            isOnHold={isOnHold}
            isRecording={isRecording}
            onHangup={onHangup}
            onToggleMute={onToggleMute}
            onToggleVideo={onToggleVideo}
            onToggleScreenShare={onToggleScreenShare}
            onToggleHold={onToggleHold}
            onToggleRecording={onToggleRecording}
            onToggleChat={() => setShowChatPanel(!showChatPanel)}
            isChatOpen={showChatPanel}
          />
        </div>
      </div>
    </div>
  )
}
