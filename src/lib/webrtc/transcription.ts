// Call Transcription Service
// Real-time transcription using Web Speech API or Whisper API
// Supports Arabic, French, English for AlgeriaTrade.dz B2B Platform

// ============================================
// Type Definitions
// ============================================

export interface TranscriptionSegment {
  id: string
  speaker: 'caller' | 'callee' | 'unknown'
  text: string
  startTime: number // seconds from call start
  endTime: number
  confidence: number // 0-1
  language?: string
}

export interface TranscriptionResult {
  callId: string
  segments: TranscriptionSegment[]
  fullText: string
  summary?: string
  actionItems?: string[]
  keywords?: string[]
  language: string
  durationSeconds: number
  createdAt: Date
}

export interface TranscriptionOptions {
  language?: string // 'ar', 'fr', 'en', or 'auto'
  enableRealTime?: boolean
  enablePunctuation?: boolean
  enableDiarization?: boolean // Speaker identification
  model?: 'web-speech-api' | 'whisper' | 'deepgram'
}

export interface ActionItem {
  id: string
  task: string
  assignee?: string
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
  sourceSegmentId: string
}

// Supported languages for AlgeriaTrade.dz market
export const SUPPORTED_LANGUAGES = {
  ar: { name: 'Arabic', code: 'ar-SA', nativeName: 'العربية' },
  fr: { name: 'French', code: 'fr-FR', nativeName: 'Français' },
  en: { name: 'English', code: 'en-US', nativeName: 'English' },
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

// ============================================
// Web Speech API Implementation (Browser-based)
// ============================================

class SpeechTranscriber {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private onResult?: (transcript: string, isFinal: boolean) => void
  private onError?: (error: string) => void
  private currentLanguage: string = 'en-US'

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return

    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.alternatives = 3
    this.recognition.lang = this.currentLanguage
    this.recognition.maxAlternatives = 3

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
          
          // Get confidence
          const confidence = result[0].confidence
          console.log(`[Transcription] Final segment (confidence: ${(confidence * 100).toFixed(1)}%):`, result[0].transcript)
        } else {
          interimTranscript += result[0].transcript
        }
      }

      // Fire callback with interim results
      if (interimTranscript && this.onResult) {
        this.onResult(interimTranscript, false)
      }

      // Fire callback with final results
      if (finalTranscript && this.onResult) {
        this.onResult(finalTranscript.trim(), true)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Transcription] Error:', event.error)
      
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected',
        'audio-capture': 'No microphone found',
        'not-allowed': 'Microphone permission denied',
        'network': 'Network error occurred',
        'aborted': 'Transcription aborted',
        'service-not-allowed': 'Service not allowed',
      }

      this.onError?.(errorMessages[event.error] || `Unknown error: ${event.error}`)
    }

    this.recognition.onend = () => {
      console.log('[Transcription] Recognition ended')
      
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        try {
          this.recognition?.start()
        } catch (e) {
          console.warn('[Transcription] Could not restart recognition:', e)
        }
      }
    }
  }

  start(
    stream: MediaStream,
    options: TranscriptionOptions = {},
    callbacks: {
      onResult: (transcript: string, isFinal: boolean) => void
      onError: (error: string) => void
    }
  ): void {
    this.onResult = callbacks.onResult
    this.onError = callbacks.onError

    if (!this.recognition) {
      callbacks.onError('Speech recognition not supported in this browser')
      return
    }

    // Set language
    if (options.language && SUPPORTED_LANGUAGES[options.language as SupportedLanguage]) {
      this.currentLanguage = SUPPORTED_LANGUAGES[options.language as SupportedLanguage].code
      this.recognition.lang = this.currentLanguage
    }

    this.isListening = true

    try {
      this.recognition.start()
      console.log(`[Transcription] Started with language: ${this.currentLanguage}`)
    } catch (e) {
      console.error('[Transcription] Could not start recognition:', e)
      callbacks.onError('Failed to start speech recognition')
    }
  }

  stop(): void {
    this.isListening = false
    
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch (e) {
        console.warn('[Transcription] Could not stop recognition:', e)
      }
    }
  }

  isSupported(): boolean {
    return !!(typeof window !== 'undefined' && (
      window.SpeechRecognition || window.webkitSpeechRecognition
    ))
  }
}

// ============================================
// Whisper API Implementation (Server-side fallback)
// ============================================

async function transcribeWithWhisper(
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  // This would call your backend which uses OpenAI's Whisper API
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  
  if (options.language) {
    formData.append('language', options.language)
  }

  try {
    const response = await fetch('/api/calls/transcribe', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Transcription failed')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('[Transcription] Whisper error:', error)
    throw error
  }
}

// ============================================
// Transcription Manager
// ============================================

export class CallTranscriptionManager {
  private transcriber: SpeechTranscriber
  private segments: TranscriptionSegment[] = []
  private callStartTime: number = 0
  private callId: string = ''
  private isRecording: boolean = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

  constructor() {
    this.transcriber = new SpeechTranscriber()
  }

  /**
   * Start real-time transcription for a call
   */
  async startTranscription(
    callId: string,
    stream: MediaStream,
    options: TranscriptionOptions = {}
  ): Promise<void> {
    this.callId = callId
    this.callStartTime = Date.now()
    this.segments = []
    this.audioChunks = []

    // Start recording audio for backup transcription
    this.startAudioRecording(stream)

    // Start real-time transcription if supported
    if (this.transcriber.isSupported()) {
      this.transcriber.start(stream, options, {
        onResult: (text, isFinal) => {
          if (isFinal) {
            this.addSegment({
              id: `seg_${Date.now()}`,
              speaker: 'unknown', // Would need diarization for speaker ID
              text,
              startTime: (Date.now() - this.callStartTime) / 1000,
              endTime: (Date.now() - this.callStartTime) / 1000,
              confidence: 0.9, // Estimated
              language: options.language,
            })
          }
        },
        onError: (error) => {
          console.error('[TranscriptionManager] Error:', error)
        },
      })
    }

    this.isRecording = true
  }

  /**
   * Stop transcription and get final result
   */
  async stopTranscription(): Promise<TranscriptionResult> {
    this.isRecording = false

    // Stop real-time transcription
    this.transcriber.stop()

    // Stop audio recording and get blob
    const audioBlob = await this.stopAudioRecording()

    // If we have no segments from real-time transcription, use Whisper as fallback
    if (this.segments.length === 0 && audioBlob.size > 0) {
      try {
        const whisperResult = await transcribeWithWhisper(audioBlob)
        return whisperResult
      } catch (error) {
        console.error('[TranscriptionManager] Fallback transcription failed:', error)
      }
    }

    // Build final result
    const fullText = this.segments.map(s => s.text).join(' ')
    
    // Generate summary and extract action items
    const summary = this.generateSummary(fullText)
    const actionItems = this.extractActionItems(fullText)
    const keywords = this.extractKeywords(fullText)

    return {
      callId: this.callId,
      segments: [...this.segments],
      fullText,
      summary,
      actionItems,
      keywords,
      language: this.detectLanguage(fullText),
      durationSeconds: (Date.now() - this.callStartTime) / 1000,
      createdAt: new Date(),
    }
  }

  /**
   * Add a transcription segment manually
   */
  addSegment(segment: Omit<TranscriptionSegment, 'id'>): void {
    this.segments.push({
      ...segment,
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    })
  }

  /**
   * Get current transcript
   */
  getCurrentTranscript(): string {
    return this.segments.map(s => s.text).join(' ')
  }

  /**
   * Check if transcription is available
   */
  isSupported(): boolean {
    return this.transcriber.isSupported() || typeof navigator !== 'undefined'
  }

  // ============================================
  // Private Methods
  // ============================================

  private startAudioRecording(stream: MediaStream): void {
    try {
      // Get only audio tracks
      const audioStream = new MediaStream(stream.getAudioTracks())
      
      this.mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(1000) // Collect data every second
      console.log('[TranscriptionManager] Audio recording started')
    } catch (error) {
      console.error('[TranscriptionManager] Failed to start audio recording:', error)
    }
  }

  private async stopAudioRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.audioChunks.length === 0) {
        resolve(new Blob())
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.audioChunks = []
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  private generateSummary(text: string): string {
    // Simple keyword-based summary generation
    // In production, would use AI/LLM for better summaries
    
    const words = text.toLowerCase().split(/\s+/)
    const importantWords = ['price', 'order', 'delivery', 'product', 'quantity', 
                           'shipping', 'payment', 'discount', 'urgent', 'meeting']
    
    const foundWords = importantWords.filter(w => words.includes(w))
    
    if (foundWords.length === 0) {
      return 'General business discussion'
    }

    return `Discussion about: ${foundWords.slice(0, 3).join(', ')}`
  }

  private extractActionItems(text: string): ActionItem[] {
    const items: ActionItem[] = []
    
    // Simple pattern matching for action items
    const patterns = [
      /(?:will|shall|going to)\s+(.+?)(?:\.|,|$)/gi,
      /(?:need to|have to|must)\s+(.+?)(?:\.|,|$)/gi,
      /(?:send|email|call|contact)\s+(.+?)(?:\.|,|$)/gi,
    ]

    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        items.push({
          id: `action_${items.length + 1}`,
          task: match[1].trim(),
          priority: text.includes('urgent') ? 'high' : 'medium',
          sourceSegmentId: '',
        })
      }
    })

    return items.slice(0, 10) // Limit to 10 action items
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)

    // Count word frequency
    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    const arabicPattern = /[\u0600-\u06FF]/
    const frenchPattern = /\b(le|la|les|de|des|du|un|une|et|ou|mais|pour|dans|sur|avec|que|qui|ce|cette|ces|est|sont|avoir|être)\b/i
    
    if (arabicPattern.test(text)) return 'ar'
    if (frenchPattern.test(text)) return 'fr'
    return 'en'
  }
}

// ============================================
// Export singleton instance
// ============================================

export const transcriptionManager = new CallTranscriptionManager()

// Helper function to format timestamp
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
