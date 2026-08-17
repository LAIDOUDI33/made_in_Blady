'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type {
  CallType,
  CallStatus,
  MediaQuality,
  WebRTCCall,
  CallStats,
  ICECandidate,
} from '@/lib/webrtc/signaling-server'
import { getIceServerConfig, getMediaConstraints } from '@/lib/webrtc/ice-servers'

// ============================================
// Type Definitions
// ============================================

export interface WebRTCOptions {
  autoAnswer?: boolean
  enableRecording?: boolean
  enableTranscription?: boolean
  defaultQuality?: MediaQuality
  onIncomingCall?: (call: WebRTCCall) => void
  onCallEnded?: (call: WebRTCCall) => void
  onError?: (error: Error) => void
}

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: Date
}

export interface UseWebRTCReturn {
  // State
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  currentCall: WebRTCCall | null
  callStatus: CallStatus | null
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isOnHold: boolean
  isRecording: boolean
  callDuration: number
  callStats: CallStats | null
  isIncomingCall: boolean
  
  // Chat during call
  chatMessages: ChatMessage[]
  
  // Connection quality
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | null
  
  // Methods
  startCall: (calleeId: string, calleeName: string, callType: CallType) => Promise<WebRTCCall>
  acceptCall: (callId: string) => Promise<void>
  declineCall: (callId: string) => Promise<void>
  hangup: () => Promise<void>
  toggleMute: () => void
  toggleVideo: () => void
  toggleScreenShare: () => Promise<void>
  toggleHold: () => Promise<void>
  toggleRecording: () => Promise<void>
  sendChatMessage: (message: string) => void
  changeQuality: (quality: MediaQuality) => void
  
  // Utilities
  cleanup: () => void
}

// ============================================
// Main Hook
// ============================================

export function useWebRTC(options: WebRTCOptions = {}): UseWebRTCReturn {
  const {
    autoAnswer = false,
    enableRecording = false,
    enableTranscription = false,
    defaultQuality = 'HD',
    onIncomingCall,
    onCallEnded,
    onError,
  } = options

  const { data: session } = useSession()
  
  // Refs for WebRTC objects
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [currentCall, setCurrentCall] = useState<WebRTCCall | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isOnHold, setIsOnHold] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStats, setCallStats] = useState<CallStats | null>(null)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | null>(null)
  const [mediaQuality, setMediaQuality] = useState<MediaQuality>(defaultQuality)

  // Get current user info
  const currentUserId = session?.user?.id || ''
  const currentUserAvatar = session?.user?.image || undefined

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Create a new RTCPeerConnection with proper configuration
   */
  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    const config = getIceServerConfig()
    
    const pc = new RTCPeerConnection(config)

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind)
      if (event.streams[0]) {
        remoteStreamRef.current = event.streams[0]
        setRemoteStream(event.streams[0])
      }
    }

    // Handle ICE candidate gathering
    pc.onicecandidate = async (event) => {
      if (event.candidate && currentCall) {
        try {
          await fetch(`/api/calls/${currentCall.id}/ice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUserId,
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            }),
          })
        } catch (error) {
          console.error('[WebRTC] Error sending ICE candidate:', error)
        }
      }
    }

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState)
      
      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          setConnectionQuality('excellent')
          break
        case 'disconnected':
          setConnectionQuality('poor')
          break
        case 'failed':
          setConnectionQuality('poor')
          onError?.(new Error('ICE connection failed'))
          break
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState)
      
      switch (pc.connectionState) {
        case 'connected':
          setCallStatus('CONNECTED')
          break
        case 'disconnected':
        case 'failed':
        case 'closed':
          handleCallEnd()
          break
      }
    }

    return pc
  }, [currentCall, currentUserId, onError])

  /**
   * Start duration timer
   */
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    setCallDuration(0)
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }, [])

  /**
   * Stop duration timer
   */
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [])

  /**
   * Start stats collection
   */
  const startStatsCollection = useCallback(() => {
    if (!currentCall) return

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
    }

    statsIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/calls/${currentCall.id}/stats`)
        if (response.ok) {
          const result = await response.json()
          setCallStats(result.data)
          
          // Update quality based on stats
          if (result.data.packetsLost > 50 || result.data.jitter > 50) {
            setConnectionQuality('poor')
          } else if (result.data.packetsLost > 20 || result.data.jitter > 30) {
            setConnectionQuality('fair')
          } else if (result.data.packetsLost > 5 || result.data.jitter > 15) {
            setConnectionQuality('good')
          } else {
            setConnectionQuality('excellent')
          }
        }
      } catch (error) {
        console.error('[WebRTC] Error fetching stats:', error)
      }
    }, 5000) // Every 5 seconds
  }, [currentCall])

  /**
   * Stop stats collection
   */
  const stopStatsCollection = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
  }, [])

  /**
   * Handle call end cleanup
   */
  const handleCallEnd = useCallback(async () => {
    stopDurationTimer()
    stopStatsCollection()

    // Stop local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }

    // Stop screen share stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
      setIsScreenSharing(false)
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    setCallStatus('ENDED')
    
    if (currentCall) {
      onCallEnded?.(currentCall)
    }
  }, [stopDurationTimer, stopStatsCollection, currentCall, onCallEnded])

  /**
   * Cleanup all resources
   */
  const cleanup = useCallback(() => {
    handleCallEnd()
    setCurrentCall(null)
    setCallStats(null)
    setConnectionQuality(null)
    setChatMessages([])
    setIsMuted(false)
    setIsVideoOff(false)
    setIsOnHold(false)
    setIsRecording(false)
    setIsIncomingCall(false)
  }, [handleCallEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // ============================================
  // Core Methods
  // ============================================

  /**
   * Start a new call
   */
  const startCall = useCallback(async (
    calleeId: string,
    calleeName: string,
    callType: CallType
  ): Promise<WebRTCCall> => {
    try {
      // Clean up any existing call first
      if (currentCall) {
        await hangup()
      }

      // Get user media based on call type
      const constraints = getMediaConstraints(callType, mediaQuality)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      localStreamRef.current = stream
      setLocalStream(stream)

      // Create peer connection
      const pc = await createPeerConnection()
      peerConnectionRef.current = pc

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Create and send offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Initiate call via API
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerId: currentUserId,
          callerName: session?.user?.name || 'User',
          callerAvatar: currentUserAvatar,
          calleeId,
          calleeName,
          callType,
          contextType: 'DIRECT',
          mediaQuality,
          transcriptionEnabled: enableTranscription,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate call')
      }

      const result = await response.json()
      const call: WebRTCCall = result.data

      // Store offer SDP
      await fetch('/api/calls/' + call.id + '/store-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp }),
      })

      setCurrentCall(call)
      setCallStatus('RINGING')
      setIsIncomingCall(false)

      return call
    } catch (error) {
      console.error('[WebRTC] Error starting call:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to start call'))
      throw error
    }
  }, [currentCall, mediaQuality, createPeerConnection, currentUserId, session?.user?.name, currentUserAvatar, enableTranscription, onError])

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback(async (callId: string): Promise<void> => {
    try {
      // Get call details
      const response = await fetch(`/api/calls/${callId}`)
      if (!response.ok) {
        throw new Error('Call not found')
      }
      
      const result = await response.json()
      const call: WebRTCCall = result.data

      // Get user media based on call type
      const constraints = getMediaConstraints(call.callType, call.mediaQuality as MediaQuality)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      localStreamRef.current = stream
      setLocalStream(stream)

      // Create peer connection
      const pc = await createPeerConnection()
      peerConnectionRef.current = pc

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Set remote description (the offer)
      const offerResponse = await fetch(`/api/calls/${callId}/answer`)
      const offerResult = await offerResponse.json()
      
      if (offerResult.data?.offerSdp) {
        await pc.setRemoteDescription({
          type: 'offer',
          sdp: offerResult.data.offerSdp,
        })
      }

      // Create and send answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Send answer via API
      await fetch(`/api/calls/${callId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calleeId: currentUserId,
          sdpAnswer: answer.sdp,
        }),
      })

      setCurrentCall(call)
      setCallStatus('CONNECTED')
      setIsIncomingCall(false)
      setMediaQuality(call.mediaQuality as MediaQuality)
      
      startDurationTimer()
      startStatsCollection()
    } catch (error) {
      console.error('[WebRTC] Error accepting call:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to accept call'))
      throw error
    }
  }, [createPeerConnection, currentUserId, startDurationTimer, startStatsCollection, onError])

  /**
   * Decline an incoming call
   */
  const declineCall = useCallback(async (callId: string): Promise<void> => {
    try {
      await fetch(`/api/calls/${callId}/hangup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endedBy: currentUserId,
          reason: 'Declined by user',
        }),
      })
    } catch (error) {
      console.error('[WebRTC] Error declining call:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to decline call'))
    }
  }, [currentUserId, onError])

  /**
   * Hangup/End the current call
   */
  const hangup = useCallback(async (): Promise<void> => {
    if (!currentCall) return

    try {
      await fetch(`/api/calls/${currentCall.id}/hangup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endedBy: currentUserId }),
      })

      handleCallEnd()
    } catch (error) {
      console.error('[WebRTC] Error hanging up:', error)
      // Force cleanup even if API fails
      handleCallEnd()
    }
  }, [currentCall, currentUserId, handleCallEnd])

  // ============================================
  // Media Control Methods
  // ============================================

  /**
   * Toggle microphone mute
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(prev => !prev)
    }
  }, [])

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(prev => !prev)
    }
  }, [])

  /**
   * Toggle screen sharing
   */
  const toggleScreenShare = useCallback(async (): Promise<void> => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing and revert to camera
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop())
          screenStreamRef.current = null
        }

        // Re-add video track from original stream
        if (localStreamRef.current && peerConnectionRef.current) {
          const videoSender = peerConnectionRef.current.getSenders()
            .find(sender => sender.track?.kind === 'video')
          
          if (videoSender && localStreamRef.current.getVideoTracks()[0]) {
            videoSender.replaceTrack(localStreamRef.current.getVideoTracks()[0])
          }
        }

        setIsScreenSharing(false)
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        screenStreamRef.current = screenStream

        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const videoSender = peerConnectionRef.current.getSenders()
            .find(sender => sender.track?.kind === 'video')
          
          if (videoSender && screenStream.getVideoTracks()[0]) {
            videoSender.replaceTrack(screenStream.getVideoTracks()[0])
          }
        }

        // Handle user stopping screen share via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare()
        }

        setIsScreenSharing(true)
      }
    } catch (error) {
      console.error('[WebRTC] Error toggling screen share:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to toggle screen share'))
    }
  }, [isScreenSharing, onError])

  /**
   * Toggle hold state
   */
  const toggleHold = useCallback(async (): Promise<void> => {
    if (!currentCall) return

    try {
      await fetch(`/api/calls/${currentCall.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          onHold: !isOnHold,
        }),
      })

      setIsOnHold(prev => !prev)
    } catch (error) {
      console.error('[WebRTC] Error toggling hold:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to toggle hold'))
    }
  }, [currentCall, currentUserId, isOnHold, onError])

  /**
   * Toggle recording
   */
  const toggleRecording = useCallback(async (): Promise<void> => {
    if (!currentCall) return

    try {
      await fetch(`/api/calls/${currentCall.id}/recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          recording: !isRecording,
        }),
      })

      setIsRecording(prev => !prev)
    } catch (error) {
      console.error('[WebRTC] Error toggling recording:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to toggle recording'))
    }
  }, [currentCall, currentUserId, isRecording, onError])

  /**
   * Change media quality
   */
  const changeQuality = useCallback((quality: MediaQuality) => {
    setMediaQuality(quality)
    // Note: Changing quality mid-call requires renegotiation
    // This would need additional implementation
  }, [])

  // ============================================
  // Chat During Call
  // ============================================

  /**
   * Send a text message during the call
   */
  const sendChatMessage = useCallback((message: string) => {
    if (!currentCall || !message.trim()) return

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: currentUserId,
      content: message.trim(),
      timestamp: new Date(),
    }

    setChatMessages(prev => [...prev, newMessage])
    
    // In production, this would be sent via WebSocket/DataChannel
    console.log('[WebRTC] Chat message sent:', message)
  }, [currentCall, currentUserId])

  // ============================================
  // Return Hook Interface
  // ============================================

  return {
    // State
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
    callStats,
    isIncomingCall,
    chatMessages,
    connectionQuality,

    // Methods
    startCall,
    acceptCall,
    declineCall,
    hangup,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleHold,
    toggleRecording,
    sendChatMessage,
    changeQuality,

    // Utilities
    cleanup,
  }
}

export default useWebRTC
