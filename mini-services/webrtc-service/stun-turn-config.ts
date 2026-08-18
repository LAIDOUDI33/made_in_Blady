// STUN/TURN Server Configuration for WebRTC
// AlgeriaTrade.dz B2B Platform - NAT Traversal Configuration

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

/**
 * ICE Servers Configuration
 * 
 * STUN (Session Traversal Utilities for NAT) servers help discover public IP addresses
 * TURN (Traversal Using Relays around NAT) servers relay media when direct connection fails
 * 
 * For production deployment in Algeria/North Africa region:
 * - Consider using regional TURN servers for lower latency
 * - Google STUN servers work globally and are free
 * - For TURN, options include: self-hosted coturn, Twilio, Xirsys, Metered.ca
 */
export const ICE_SERVERS: IceServerConfig[] = [
  // ============================================
  // STUN Servers (Free, Public)
  // ============================================
  
  // Google STUN servers (primary - reliable, global network)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  
  // Mozilla STUN servers (backup)
  { urls: 'stun:stun.services.mozilla.com:3478' },
  
  // Additional STUN servers for redundancy
  { urls: 'stun:stun.nextcloud.com:443' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  
  // ============================================
  // TURN Server Configuration
  // Uncomment and configure based on your setup
  // ============================================
  
  // Option 1: Self-hosted coturn server (recommended for production)
  // Deploy coturn in same region as your users (e.g., EU or North Africa)
  ...(process.env.TURN_ENABLED === 'true' && process.env.TURN_SERVER_URL ? [{
    urls: [
      `turn:${process.env.TURN_SERVER_URL}:3478?transport=udp`,
      `turn:${process.env.TURN_SERVER_URL}:3478?transport=tcp`,
      `turns:${process.env.TURN_SERVER_URL}:5349?transport=tcp`, // TLS encrypted
    ],
    username: process.env.TURN_USERNAME || '',
    credential: process.env.TURN_CREDENTIAL || '',
  }] : []),
  
  // Option 2: Twilio Network Traversal Service
  // Sign up at https://www.twilio.com/stun-turn
  ...(process.env.TWILIO_TURN_ENABLED === 'true' ? [{
    urls: process.env.TWILIO_TURN_URLS?.split(',') || [
      'turn:global.turn.twilio.com:3478?transport=udp',
      'turn:global.turn.twilio.com:3478?transport=tcp',
    ],
    username: process.env.TWILIO_TURN_USERNAME || '',
    credential: process.env.TWILIO_TURN_CREDENTIAL || '',
  }] : []),
  
  // Option 3: Xirsys (popular TURN service provider)
  // Sign up at https://xirsys.com/
  ...(process.env.XIRSYS_ENABLED === 'true' ? [{
    urls: process.env.XIRSYS_URLS?.split(',') || [],
    username: process.env.XIRSYS_USERNAME || '',
    credential: process.env.XIRSYS_CREDENTIAL || '',
  }] : []),
  
  // Option 4: Metered.ca (affordable TURN service)
  ...(process.env.METERED_CA_ENABLED === 'true' ? [{
    urls: process.env.METERED_CA_URLS?.split(',') || [],
    username: process.env.METERED_CA_USERNAME || '',
    credential: process.env.METERED_CA_CREDENTIAL || '',
  }] : []),
];

/**
 * Get ICE server configuration for RTCPeerConnection
 */
export function getIceServerConfig(options?: {
  forceRelay?: boolean;  // Force all traffic through TURN (more secure, higher latency)
}): RTCConfiguration {
  const filteredServers = ICE_SERVERS.filter(server => {
    // Filter out TURN servers without credentials
    if (Array.isArray(server.urls)) {
      const hasTurn = server.urls.some(url => url.includes('turn:'));
      if (hasTurn && (!server.username || !server.credential)) {
        return false;
      }
    } else if (typeof server.urls === 'string') {
      if (server.urls.includes('turn:') && (!server.username || !server.credential)) {
        return false;
      }
    }
    return true;
  }) as RTCIceServer[];

  return {
    iceServers: filteredServers,
    
    // ICE candidate policy
    iceCandidatePolicy: options?.forceRelay ? 'relay' : 'all',
    
    // Bundle policy - bundle all media on single transport for efficiency
    bundlePolicy: 'max-bundle',
    
    // RTCP mux policy - multiplex RTCP with RTP
    rtcpMuxPolicy: 'require',
    
    // ICE transport policy
    iceTransportPolicy: options?.forceRelay ? 'relay' : 'all',
  };
}

/**
 * Check if TURN credentials are properly configured
 */
export function isTurnConfigured(): boolean {
  return (
    (process.env.TURN_ENABLED === 'true' &&
     process.env.TURN_SERVER_URL &&
     process.env.TURN_USERNAME &&
     process.env.TURN_CREDENTIAL) ||
    !!process.env.TWILIO_TURN_USERNAME ||
    !!process.env.XIRSYS_USERNAME ||
    !!process.env.METERED_CA_USERNAME
  );
}

/**
 * Get adaptive ICE config based on network quality
 * 
 * For poor networks, force relay through TURN for better connectivity
 */
export function getAdaptiveIceConfig(
  networkQuality?: 'excellent' | 'good' | 'fair' | 'poor'
): RTCConfiguration {
  switch (networkQuality) {
    case 'poor':
      // Force relay through TURN for better NAT traversal in poor networks
      return getIceServerConfig({ forceRelay: true });
    
    case 'fair':
      // Use all candidates but prefer relay
      return getIceServerConfig();
    
    case 'good':
    case 'excellent':
    default:
      // Use all candidates (P2P preferred for low latency)
      return getIceServerConfig();
  }
}

/**
 * Quality-based media constraints for different network conditions
 */
export function getMediaConstraintsForQuality(
  callType: 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE',
  quality: 'SD' | 'HD' | 'FHD' | 'UHD',
  networkQuality?: 'excellent' | 'good' | 'fair' | 'poor'
): MediaStreamConstraints {
  // Downgrade quality automatically for poor networks
  let effectiveQuality = quality;
  if (networkQuality === 'poor' && (quality === 'FHD' || quality === 'UHD')) {
    effectiveQuality = 'SD';
  } else if (networkQuality === 'fair' && quality === 'UHD') {
    effectiveQuality = 'HD';
  }

  const qualitySettings = {
    SD: { width: 640, height: 360, frameRate: 15 },
    HD: { width: 1280, height: 720, frameRate: 30 },
    FHD: { width: 1920, height: 1080, frameRate: 30 },
    UHD: { width: 3840, height: 2160, frameRate: 30 },
  };

  const settings = qualitySettings[effectiveQuality];

  switch (callType) {
    case 'AUDIO':
      return {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      };

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
      };

    case 'SCREEN_SHARE':
      return {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: settings.width },
          height: { ideal: settings.height },
          frameRate: { ideal: settings.frameRate },
          cursor: 'always',
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
      };

    default:
      return { audio: true, video: true };
  }
}
