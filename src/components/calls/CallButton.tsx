'use client'

import React, { useState } from 'react'
import { Phone, Video, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { useWebRTC } from '@/hooks/useWebRTC'
import VideoCallWindow from './VideoCallWindow'
import AudioCallWindow from './AudioCallWindow'
import CallNotification from './CallNotification'
import type { CallType } from '@/lib/webrtc/signaling-server'

interface CallButtonProps {
  calleeId: string
  calleeName: string
  calleeAvatar?: string
  contextType?: 'DIRECT' | 'ORDER_RELATED' | 'PRODUCT_QUESTION' | 'SUPPORT'
  contextId?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showLabel?: boolean
  disabled?: boolean
  className?: string
}

export default function CallButton({
  calleeId,
  calleeName,
  calleeAvatar,
  contextType = 'DIRECT',
  contextId,
  size = 'default',
  variant = 'default',
  showLabel = false,
  disabled = false,
  className = '',
}: CallButtonProps) {
  const [isCalling, setIsCalling] = useState(false)
  
  const {
    localStream,
    remoteStream,
    currentCall,
    callStatus,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isOnHold,
    isRecording,
    callDuration,
    connectionQuality,
    
    startCall,
    acceptCall,
    declineCall,
    hangup,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHold,
    toggleRecording,
    cleanup,
  } = useWebRTC({
    onIncomingCall: () => {
      // Handle incoming call notification
      console.log('Incoming call received')
    },
    onError: (error) => {
      console.error('Call error:', error)
      setIsCalling(false)
    },
  })

  const handleStartCall = async (callType: CallType) => {
    if (disabled || isCalling) return
    
    setIsCalling(true)
    try {
      await startCall(calleeId, calleeName, callType)
    } catch (error) {
      console.error('Failed to start call:', error)
      setIsCalling(false)
    }
  }

  const handleHangup = async () => {
    try {
      await hangup()
      setIsCalling(false)
    } catch (error) {
      console.error('Error hanging up:', error)
      cleanup()
      setIsCalling(false)
    }
  }

  // If there's an active call, show the appropriate window
  if (currentCall && ['RINGING', 'CONNECTED', 'ON_HOLD'].includes(callStatus || '')) {
    if (currentCall.callType === 'AUDIO') {
      return (
        <AudioCallWindow
          call={currentCall}
          localStream={localStream}
          remoteStream={remoteStream}
          callStatus={callStatus}
          isMuted={isMuted}
          isOnHold={isOnHold}
          isRecording={isRecording}
          callDuration={callDuration}
          connectionQuality={connectionQuality}
          
          onHangup={handleHangup}
          onToggleMute={toggleMute}
          onToggleHold={toggleHold}
          onToggleRecording={toggleRecording}
        />
      )
    }
    
    return (
      <VideoCallWindow
        call={currentCall}
        localStream={localStream}
        remoteStream={remoteStream}
        callStatus={callStatus}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isOnHold={isOnHold}
        isRecording={isRecording}
        callDuration={callDuration}
        connectionQuality={connectionQuality}
        
        onHangup={handleHangup}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHold={toggleHold}
        onToggleRecording={toggleRecording}
        
        isMinimized={false}
        onToggleMinimize={() => {/* Would implement minimize */}}
      />
    )
  }

  // Show dropdown with call options
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
            disabled={disabled || isCalling}
            className={`gap-2 ${className}`}
          >
            {isCalling ? (
              <>
                <PhoneOff className="w-4 h-4 animate-pulse" />
                {showLabel && 'Calling...'}
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                {showLabel && 'Call'}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleStartCall('AUDIO')} className="gap-3 cursor-pointer">
            <Phone className="w-4 h-4 text-green-500" />
            <div>
              <p className="font-medium">Voice Call</p>
              <p className="text-xs text-muted-foreground">Audio only</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStartCall('VIDEO')} className="gap-3 cursor-pointer">
            <Video className="w-4 h-4 text-blue-500" />
            <div>
              <p className="font-medium">Video Call</p>
              <p className="text-xs text-muted-foreground">Audio & video</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Incoming call notification would be shown here */}
      <CallNotification
        visible={false} // Would be controlled by WebSocket events
        callerName=""
        callerAvatar=""
        callType="AUDIO"
        onAccept={() => {}}
        onDecline={() => {}}
      />
    </>
  )
}

// Simpler single-purpose button variants
export function VoiceCallButton(props: Omit<CallButtonProps, 'showLabel'>) {
  return <CallButton {...props} showLabel={false} />
}

export function VideoCallButton(props: Omit<CallButtonProps, 'showLabel'>) {
  const { ...rest } = props
  
  // This would directly start a video call instead of showing dropdown
  return (
    <Button
      variant={props.variant || 'outline'}
      size={props.size === 'lg' ? 'lg' : props.size === 'sm' ? 'icon' : 'icon'}
      disabled={props.disabled}
      className={`${props.className}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        // Direct video call trigger - would need to integrate with useWebRTC
      }}
    >
      <Video className="w-4 h-4" />
    </Button>
  )
}
