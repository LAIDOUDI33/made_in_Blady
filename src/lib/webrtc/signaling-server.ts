// WebRTC Signaling Server
// Handles SDP offer/answer exchange, ICE candidates for AlgeriaTrade.dz B2B Platform

// ============================================
// Type Definitions
// ============================================

export type CallType = 'AUDIO' | 'VIDEO' | 'SCREEN_SHARE'
export type CallStatus = 'RINGING' | 'CONNECTED' | 'ON_HOLD' | 'ENDED' | 'DECLINED' | 'FAILED'
export type CallRole = 'CALLER' | 'CALLEE'
export type MediaQuality = 'SD' | 'HD' | 'FHD' | 'UHD'

// Quality settings mapping
export const QUALITY_SETTINGS: Record<MediaQuality, { width: number; height: number; frameRate: number }> = {
  SD: { width: 640, height: 360, frameRate: 15 },
  HD: { width: 1280, height: 720, frameRate: 30 },
  FHD: { width: 1920, height: 1080, frameRate: 30 },
  UHD: { width: 3840, height: 2160, frameRate: 30 }
}

export interface ICECandidate {
  candidate: string
  sdpMid: string | null
  sdpMLineIndex: number | null
  timestamp: Date
}

export interface WebRTCCall {
  id: string
  callType: CallType
  status: CallStatus
  
  callerId: string
  callerName: string
  callerAvatar?: string
  calleeId: string
  calleeName: string
  calleeAvatar?: string
  
  // Context
  contextType: 'DIRECT' | 'ORDER_RELATED' | 'PRODUCT_QUESTION' | 'SUPPORT'
  contextId?: string // Order ID, Product ID, etc.
  
  // Timing
  initiatedAt: Date
  connectedAt?: Date
  endedAt?: Date
  durationSeconds?: number
  
  // Quality
  mediaQuality: MediaQuality
  iceCandidates: ICECandidate[]
  
  // SDP (Session Description Protocol)
  offerSdp?: string
  answerSdp?: string
  
  // Recording
  isRecording: boolean
  recordingUrl?: string
  
  // Transcription (AI)
  transcriptionEnabled: boolean
  transcription?: string
  transcriptionLanguage?: string
  
  // Cost tracking (for premium features)
  isPremiumCall: boolean
  costPerMinute?: number
  totalCost?: number
}

export interface RTCSessionDescription {
  type: 'offer' | 'answer' | 'ice-candidate'
  sdp?: string
  candidate?: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
}

export interface CallStats {
  callId: string
  packetsLost: number
  jitter: number
  roundTripTime: number
  bytesReceived: number
  bytesSent: number
  audioLevel?: number
  videoWidth?: number
  videoHeight?: number
  codec?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CallHistoryFilters {
  userId: string
  status?: CallStatus
  callType?: CallType
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
}

export interface InitiateCallOptions {
  callerId: string
  callerName: string
  callerAvatar?: string
  calleeId: string
  calleeName: string
  calleeAvatar?: string
  callType: CallType
  contextType?: WebRTCCall['contextType']
  contextId?: string
  mediaQuality?: MediaQuality
  isPremiumCall?: boolean
  transcriptionEnabled?: boolean
}

// ============================================
// In-Memory Call Store (Production would use Redis/DB)
// ============================================

const activeCalls = new Map<string, WebRTCCall>()
const userActiveCalls = new Map<string, Set<string>>() // userId -> Set of callIds

// Cleanup interval for stale calls (5 minutes)
const CALL_TIMEOUT_MS = 5 * 60 * 1000
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanupInterval() {
  if (cleanupInterval) return
  
  cleanupInterval = setInterval(() => {
    const now = new Date()
    for (const [callId, call] of activeCalls.entries()) {
      const isActive = ['RINGING', 'CONNECTED', 'ON_HOLD'].includes(call.status)
      const timeSinceInitiated = now.getTime() - new Date(call.initiatedAt).getTime()
      
      // Auto-end calls that have been ringing too long or are stale
      if (isActive && timeSinceInitiated > CALL_TIMEOUT_MS) {
        endCallInternal(callId, 'SYSTEM_TIMEOUT')
      }
    }
  }, 60000) // Check every minute
}

startCleanupInterval()

// ============================================
// Core Signaling Functions
// ============================================

/**
 * Generate a unique call ID
 */
export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Initialize a new call and return the call object
 */
export async function initiateCall(options: InitiateCallOptions): Promise<WebRTCCall> {
  const callId = generateCallId()
  
  const call: WebRTCCall = {
    id: callId,
    callType: options.callType,
    status: 'RINGING',
    
    callerId: options.callerId,
    callerName: options.callerName,
    callerAvatar: options.callerAvatar,
    calleeId: options.calleeId,
    calleeName: options.calleeName,
    calleeAvatar: options.calleeAvatar,
    
    contextType: options.contextType || 'DIRECT',
    contextId: options.contextId,
    
    initiatedAt: new Date(),
    mediaQuality: options.mediaQuality || 'HD',
    iceCandidates: [],
    
    isRecording: false,
    isPremiumCall: options.isPremiumCall || false,
    costPerMinute: options.isPremiumCall ? 0.05 : undefined, // $0.05/min for premium
    
    transcriptionEnabled: options.transcriptionEnabled || false,
  }

  // Store the call
  activeCalls.set(callId, call)
  
  // Track user's active calls
  trackUserCall(options.callerId, callId)
  trackUserCall(options.calleeId, callId)

  console.log(`[WebRTC] Call initiated: ${callId} from ${options.callerName} to ${options.calleeName}`)
  
  return call
}

/**
 * Handle incoming call request - notify the callee
 */
export async function handleCallRequest(callId: string, calleeId: string): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  if (call.calleeId !== calleeId) {
    throw new Error('Unauthorized access to this call')
  }
  
  if (call.status !== 'RINGING') {
    throw new Error(`Call is not in RINGING state. Current state: ${call.status}`)
  }
  
  // In production, this would emit a WebSocket event to notify the callee
  // For now, we just validate that the request can be handled
  console.log(`[WebRTC] Call request handled for ${calleeId}`)
}

/**
 * Accept a call and store the SDP answer
 */
export async function acceptCall(callId: string, calleeId: string, sdpAnswer?: string): Promise<WebRTCCall> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  if (call.calleeId !== calleeId) {
    throw new Error('Unauthorized access to this call')
  }
  
  if (call.status !== 'RINGING') {
    throw new Error(`Call cannot be accepted in ${call.status} state`)
  }
  
  // Update call status
  call.status = 'CONNECTED'
  call.connectedAt = new Date()
  if (sdpAnswer) {
    call.answerSdp = sdpAnswer
  }
  
  // Update in store
  activeCalls.set(callId, call)
  
  console.log(`[WebRTC] Call accepted: ${callId}`)
  
  return call
}

/**
 * Decline a call
 */
export async function declineCall(callId: string, calleeId: string, reason?: string): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  if (call.calleeId !== calleeId) {
    throw new Error('Unauthorized access to this call')
  }
  
  if (call.status !== 'RINGING') {
    throw new Error(`Call cannot be declined in ${call.status} state`)
  }
  
  call.status = 'DECLINED'
  call.endedAt = new Date()
  
  // Calculate duration (even for declined calls, it's just the ring time)
  call.durationSeconds = Math.floor(
    (new Date(call.endedAt).getTime() - new Date(call.initiatedAt).getTime()) / 1000
  )
  
  activeCalls.set(callId, call)
  
  // Clean up from user's active calls after a delay
  setTimeout(() => cleanupCall(callId), 5000)
  
  console.log(`[WebRTC] Call declined: ${callId}, reason: ${reason || 'No reason provided'}`)
}

/**
 * End a call and finalize with stats
 */
export async function endCall(callId: string, endedBy: string): Promise<WebRTCCall> {
  return endCallInternal(callId, endedBy)
}

/**
 * Internal end call function
 */
function endCallInternal(callId: string, endedBy: string): WebRTCCall {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  call.status = 'ENDED'
  call.endedAt = new Date()
  
  // Calculate duration
  if (call.connectedAt) {
    call.durationSeconds = Math.floor(
      (new Date(call.endedAt!).getTime() - new Date(call.connectedAt).getTime()) / 1000
    )
  } else {
    call.durationSeconds = 0
  }
  
  // Calculate cost for premium calls
  if (call.isPremiumCall && call.costPerMinute && call.durationSeconds) {
    call.totalCost = (call.durationSeconds / 60) * call.costPerMinute
  }
  
  activeCalls.set(callId, call)
  
  // Clean up from user's active calls
  untrackUserCall(call.callerId, callId)
  untrackUserCall(call.calleeId, callId)
  
  // Remove from active calls after a delay (to allow final stats retrieval)
  setTimeout(() => cleanupCall(callId), 30000)
  
  console.log(`[WebRTC] Call ended: ${callId} by ${endedBy}, duration: ${call.durationSeconds}s`)
  
  return call
}

/**
 * Exchange ICE candidates between peers
 */
export async function exchangeICECandidate(
  callId: string, 
  userId: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  // Verify user is part of this call
  if (call.callerId !== userId && call.calleeId !== userId) {
    throw new Error('Unauthorized access to this call')
  }
  
  if (call.status !== 'CONNECTED' && call.status !== 'RINGING') {
    throw new Error(`Cannot exchange ICE candidates in ${call.status} state`)
  }
  
  // Store the ICE candidate
  const iceCandidate: ICECandidate = {
    candidate: candidate.candidate || '',
    sdpMid: candidate.sdpMid || null,
    sdpMLineIndex: candidate.sdpMLineIndex || null,
    timestamp: new Date(),
  }
  
  call.iceCandidates.push(iceCandidate)
  activeCalls.set(callId, call)
  
  console.log(`[WebRTC] ICE candidate exchanged for call: ${callId}`)
}

/**
 * Toggle hold state for a call
 */
export async function toggleHold(callId: string, userId: string, onHold: boolean): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  if (call.callerId !== userId && call.calleeId !== userId) {
    throw new Error('Unauthorized access to this call')
  }
  
  if (call.status !== 'CONNECTED' && call.status !== 'ON_HOLD') {
    throw new Error(`Cannot toggle hold in ${call.status} state`)
  }
  
  call.status = onHold ? 'ON_HOLD' : 'CONNECTED'
  activeCalls.set(callId, call)
  
  console.log(`[WebRTC] Call ${onHold ? 'placed on hold' : 'resumed'}: ${callId}`)
}

/**
 * Toggle recording state for a call
 */
export async function toggleRecording(callId: string, userId: string, recording: boolean): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  if (call.callerId !== userId && call.calleeId !== userId) {
    throw new Error('Unauthorized access to this call')
  }
  
  if (call.status !== 'CONNECTED') {
    throw new Error('Can only record connected calls')
  }
  
  call.isRecording = recording
  
  if (recording) {
    // Generate a placeholder recording URL (in production, this would be actual storage URL)
    call.recordingUrl = `/api/calls/${callId}/recording/file`
  }
  
  activeCalls.set(callId, call)
  
  console.log(`[WebRTC] Recording ${recording ? 'started' : 'stopped'} for call: ${callId}`)
}

/**
 * Get all active calls for a user
 */
export async function getActiveCalls(userId: string): Promise<WebRTCCall[]> {
  const userCallIds = userActiveCalls.get(userId)
  if (!userCallIds) return []
  
  const calls: WebRTCCall[] = []
  for (const callId of userCallIds) {
    const call = activeCalls.get(callId)
    if (call && ['RINGING', 'CONNECTED', 'ON_HOLD'].includes(call.status)) {
      calls.push(call)
    }
  }
  
  return calls
}

/**
 * Get call history with pagination
 */
export async function getCallHistory(filters: CallHistoryFilters): Promise<PaginatedResult<WebRTCCall>> {
  const page = filters.page || 1
  const pageSize = filters.pageSize || 20
  
  // In production, this would query the database
  // For now, we filter from active/stored calls
  const allCalls = Array.from(activeCalls.values())
  
  let filteredCalls = allCalls.filter(call => 
    call.callerId === filters.userId || call.calleeId === filters.userId
  )
  
  // Apply additional filters
  if (filters.status) {
    filteredCalls = filteredCalls.filter(call => call.status === filters.status)
  }
  
  if (filters.callType) {
    filteredCalls = filteredCalls.filter(call => call.callType === filters.callType)
  }
  
  if (filters.dateFrom) {
    filteredCalls = filteredCalls.filter(call => 
      new Date(call.initiatedAt) >= filters.dateFrom!
    )
  }
  
  if (filters.dateTo) {
    filteredCalls = filteredCalls.filter(call => 
      new Date(call.initiatedAt) <= filters.dateTo!
    )
  }
  
  // Sort by initiatedAt descending
  filteredCalls.sort((a, b) => 
    new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()
  )
  
  // Paginate
  const total = filteredCalls.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const paginatedData = filteredCalls.slice(startIndex, startIndex + pageSize)
  
  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Generate a signed URL for accessing call recording
 */
export async function generateCallRecordingURL(callId: string): Promise<string> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  if (!call.isRecording || !call.recordingUrl) {
    throw new Error('This call was not recorded')
  }
  
  // In production, generate a signed URL with expiration
  // For now, return the recording URL directly
  const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now
  const token = Buffer.from(`${callId}:${expiresAt.getTime()}`).toString('base64url')
  
  return `${call.recordingUrl}?token=${token}&expires=${expiresAt.getTime()}`
}

/**
 * Store SDP offer for a call
 */
export async function storeOffer(callId: string, sdp: string): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  call.offerSdp = sdp
  activeCalls.set(callId, call)
}

/**
 * Get stored SDP offer
 */
export async function getOffer(callId: string): Promise<string | undefined> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  return call.offerSdp
}

/**
 * Get stored SDP answer
 */
export async function getAnswer(callId: string): Promise<string | undefined> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  return call.answerSdp
}

/**
 * Get call by ID
 */
export async function getCallById(callId: string): Promise<WebRTCCall | null> {
  return activeCalls.get(callId) || null
}

/**
 * Update call transcription
 */
export async function updateTranscription(callId: string, transcription: string): Promise<void> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  call.transcription = transcription
  activeCalls.set(callId, call)
}

// ============================================
// Helper Functions
// ============================================

function trackUserCall(userId: string, callId: string): void {
  if (!userActiveCalls.has(userId)) {
    userActiveCalls.set(userId, new Set())
  }
  userActiveCalls.get(userId)!.add(callId)
}

function untrackUserCall(userId: string, callId: string): void {
  const calls = userActiveCalls.get(userId)
  if (calls) {
    calls.delete(callId)
    if (calls.size === 0) {
      userActiveCalls.delete(userId)
    }
  }
}

function cleanupCall(callId: string): void {
  const call = activeCalls.get(callId)
  if (call) {
    untrackUserCall(call.callerId, callId)
    untrackUserCall(call.calleeId, callId)
    activeCalls.delete(callId)
  }
}

/**
 * Get call statistics (simulated for demo)
 */
export async function getCallStats(callId: string): Promise<CallStats> {
  const call = activeCalls.get(callId)
  
  if (!call) {
    throw new Error('Call not found')
  }
  
  // In production, these would come from RTCPeerConnection.getStats()
  // For now, return simulated values
  return {
    callId,
    packetsLost: Math.floor(Math.random() * 10),
    jitter: Math.random() * 30,
    roundTripTime: Math.random() * 100 + 20,
    bytesReceived: Math.floor(Math.random() * 10000000),
    bytesSent: Math.floor(Math.random() * 10000000),
    audioLevel: Math.random() * 100,
    videoWidth: QUALITY_SETTINGS[call.mediaQuality].width,
    videoHeight: QUALITY_SETTINGS[call.mediaQuality].height,
    codec: call.callType === 'AUDIO' ? 'opus' : 'VP9',
  }
}
