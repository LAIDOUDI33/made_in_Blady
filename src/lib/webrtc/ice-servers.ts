// ICE Server Configuration for WebRTC
// AlgeriaTrade.dz B2B Platform - TURN/STUN Server Configuration

export interface RTCIceServerConfig {
  urls: string | string[]
  username?: string
  credential?: string
  credentialType?: 'password' | 'oauth'
}

/**
 * ICE Servers configuration for WebRTC connections
 * 
 * STUN servers are used to discover public IP addresses
 * TURN servers relay media through NAT (required when direct connection fails)
 * 
 * For production deployment, configure your own TURN server or use a service like:
 * - Twilio Network Traversal Service
 * - Xirsys
 * - Metered.ca
 */
export const ICE_SERVERS: RTCIceServerConfig[] = [
  // ============================================
  // STUN Servers (Free, Public)
  // Used for discovering your public IP address
  // ============================================
  
  // Google STUN servers (primary)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  
  // Mozilla STUN servers (backup)
  { urls: 'stun:stun.services.mozilla.com' },
  
  // ============================================
  // TURN Server (Production Required)
  // Uncomment and configure for production use
  // ============================================
  
  // Option 1: Self-hosted coturn/TURN server
  ...(process.env.TURN_SERVER_URL ? [{
    urls: [
      `turn:${process.env.TURN_SERVER_URL}:3478?transport=udp`,
      `turn:${process.env.TURN_SERVER_URL}:3478?transport=tcp`,
      `turns:${process.env.TURN_SERVER_URL}:5349?transport=tcp`, // TLS
    ],
    username: process.env.TURN_USERNAME || '',
    credential: process.env.TURN_CREDENTIAL || '',
  }] : []),
  
  // Option 2: Twilio Network Traversal Service
  ...(process.env.TWILIO_TURN_URL ? [{
    urls: process.env.TWILIO_TURN_URL,
    username: process.env.TWILIO_TURN_USERNAME || '',
    credential: process.env.TWILIO_TURN_CREDENTIAL || '',
  }] : []),
  
  // Option 3: Xirsys (popular choice)
  ...(process.env.XIRSYS_TURN_URL ? [{
    urls: process.env.XIRSYS_TURN_URL,
    username: process.env.XIRSYS_TURN_USERNAME || '',
    credential: process.env.XIRSYS_TURN_CREDENTIAL || '',
  }] : []),
]

/**
 * Get ICE servers as RTCPeerConnection config format
 */
export function getIceServerConfig(): RTCConfiguration {
  return {
    iceServers: ICE_SERVERS.filter(server => 
      // Filter out servers without credentials if they require it
      !server.urls.toString().includes('turn:') || 
      (server.username && server.credential)
    ) as RTCIceServer[],
    
    // ICE candidate policy
    iceCandidatePolicy: 'all', // or 'relay' for forced relay through TURN
    
    // Bundle policy (bundle all media on single transport)
    bundlePolicy: 'max-bundle',
    
    // RTCP mux policy
    rtcpMuxPolicy: 'require',
    
    // ICE transport policy
    // 'all': Use all candidates (P2P + relay)
    // 'relay': Force relay through TURN only (more secure, higher latency)
    iceTransportPolicy: process.env.FORCE_RELAY === 'true' ? 'relay' : 'all',
  }
}

/**
 * Check if TURN credentials are configured
 */
export function isTurnConfigured(): boolean {
  return !!(
    process.env.TURN_SERVER_URL && 
    process.env.TURN_USERNAME && 
    process.env.TURN_CREDENTIAL
  )
}

/**
 * Get recommended ICE server config based on network conditions
 */
export function getAdaptiveIceConfig(networkQuality?: 'excellent' | 'good' | 'poor'): RTCConfiguration {
  const baseConfig = getIceServerConfig()
  
  switch (networkQuality) {
    case 'poor':
      // Force relay through TURN for better NAT traversal
      return {
        ...baseConfig,
        iceTransportPolicy: 'relay',
      }
    case 'good':
    case 'excellent':
    default:
      return baseConfig
  }
}

/**
 * Peer Connection constraints based on call type
 */
export function getPeerConnectionConstraints(callType: 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE', quality: MediaQuality): RTCOfferOptions {
  const qualitySettings = {
    SD: { width: 640, height: 360, frameRate: 15 },
    HD: { width: 1280, height: 720, frameRate: 30 },
    FHD: { width: 1920, height: 1080, frameRate: 30 },
    UHD: { width: 3840, height: 2160, frameRate: 30 },
  }

  const settings = qualitySettings[quality]

  return {
    offerToReceiveAudio: true,
    offerToReceiveVideo: callType !== 'AUDIO',
    voiceActivityDetection: true,
  }
}

/**
 * Media constraints for getting user media
 */
export function getMediaConstraints(callType: 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE', quality: MediaQuality): MediaStreamConstraints {
  const qualitySettings = {
    SD: { width: 640, height: 360, frameRate: 15 },
    HD: { width: 1280, height: 720, frameRate: 30 },
    FHD: { width: 1920, height: 1080, frameRate: 30 },
    UHD: { width: 3840, height: 2160, frameRate: 30 },
  }

  const settings = qualitySettings[quality]

  switch (callType) {
    case 'AUDIO':
      return {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      }
    
    case 'VIDEO':
      return {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: settings.width, min: 320 },
          height: { ideal: settings.height, min: 180 },
          frameRate: { ideal: settings.frameRate, min: 10 },
          facingMode: 'user',
        },
      }
    
    case 'SCREEN_SHARE':
      return {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Try to capture system audio
          ...(typeof window !== 'undefined' && 'getDisplayMedia' in navigator.mediaDevices ? {
            suppressLocalAudioPlayback: true,
          } : {}),
        },
        video: {
          width: { ideal: settings.width },
          height: { ideal: settings.height },
          frameRate: { ideal: settings.frameRate },
          cursor: 'always',
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
      }
    
    default:
      return { audio: true, video: true }
  }
}

// Re-export types from signaling-server
export type { MediaQuality } from './signaling-server'
