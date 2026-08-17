'use client'

import React from 'react'
import { 
  Phone, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor,
  MonitorOff,
  Pause,
  Play,
  Circle,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CallType } from '@/lib/webrtc/signaling-server'

interface CallControlsProps {
  callType: CallType
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isOnHold: boolean
  isRecording: boolean
  
  onHangup: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleHold: () => void
  onToggleRecording: () => void
  onToggleChat?: () => void
  isChatOpen?: boolean
}

export default function CallControls({
  callType,
  isMuted,
  isVideoOff,
  isScreenSharing,
  isOnHold,
  isRecording,
  
  onHangup,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHold,
  onToggleRecording,
  onToggleChat,
  isChatOpen = false,
}: CallControlsProps) {
  const ControlButton = ({ 
    onClick, 
    active, 
    destructive, 
    children, 
    tooltip,
    size = 'default',
    className = '',
  }: {
    onClick: () => void
    active?: boolean
    destructive?: boolean
    children: React.ReactNode
    tooltip: string
    size?: 'sm' | 'default' | 'lg'
    className?: string
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size === 'lg' ? 'lg' : size === 'sm' ? 'icon' : 'icon'}
            variant={destructive ? 'destructive' : active ? 'secondary' : 'ghost'}
            onClick={onClick}
            className={`
              rounded-full transition-all duration-200
              ${!active && !destructive ? 'bg-white/10 hover:bg-white/20 text-white border-0' : ''}
              ${destructive ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
              ${size === 'lg' ? 'h-14 w-14' : 'h-12 w-12'}
              ${className}
            `}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Mute/Unmute */}
      <ControlButton
        onClick={onToggleMute}
        active={isMuted}
        destructive={isMuted}
        tooltip={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </ControlButton>

      {/* Video On/Off (only for video calls) */}
      {(callType === 'VIDEO' || callType === 'SCREEN_SHARE') && (
        <ControlButton
          onClick={onToggleVideo}
          active={isVideoOff}
          destructive={isVideoOff}
          tooltip={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </ControlButton>
      )}

      {/* Screen Share (only for video calls) */}
      {(callType === 'VIDEO' || callType === 'SCREEN_SHARE') && (
        <ControlButton
          onClick={onToggleScreenShare}
          active={isScreenSharing}
          tooltip={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </ControlButton>
      )}

      {/* Hold/Resume */}
      <ControlButton
        onClick={onToggleHold}
        active={isOnHold}
        tooltip={isOnHold ? 'Resume call' : 'Hold call'}
        className={isOnHold ? '!bg-yellow-500 hover:!bg-yellow-600 !text-white' : ''}
      >
        {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </ControlButton>

      {/* Hangup (primary action - larger) */}
      <ControlButton
        onClick={onHangup}
        destructive
        tooltip="End call"
        size="lg"
      >
        <Phone className="w-6 h-6 rotate-[135deg]" />
      </ControlButton>

      {/* Recording */}
      <ControlButton
        onClick={onToggleRecording}
        active={isRecording}
        destructive={isRecording}
        tooltip={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <Circle className={`w-5 h-5 ${isRecording ? 'fill-current' : ''}`} />
      </ControlButton>

      {/* Chat (optional) */}
      {onToggleChat && (
        <ControlButton
          onClick={onToggleChat}
          active={isChatOpen}
          tooltip={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <MessageSquare className="w-5 h-5" />
        </ControlButton>
      )}
    </div>
  )
}
