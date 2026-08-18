// Call Recording Service
// MediaStreamRecorder integration for WebRTC calls
// AlgeriaTrade.dz B2B Platform

import { mkdir, writeFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// ============================================
// Type Definitions
// ============================================

export interface RecordingOptions {
  format?: 'webm' | 'mp4' | 'ogg';
  video?: boolean;
  audio?: boolean;
  quality?: 'low' | 'medium' | 'high';
  outputPath?: string;
}

export interface RecordingInfo {
  id: string;
  roomId: string;
  filename: string;
  filepath: string;
  format: string;
  duration: number; // seconds
  fileSize: number; // bytes
  startedAt: Date;
  endedAt: Date;
  mimeType: string;
}

export interface RecordingChunk {
  data: Blob;
  timestamp: Date;
}

// ============================================
// Configuration
// ============================================

const RECORDINGS_DIR = process.env.RECORDINGS_DIR || join(process.cwd(), 'recordings');
const MAX_RECORDING_DURATION = 2 * 60 * 60 * 1000; // 2 hours max

// Ensure recordings directory exists
async function ensureRecordingsDir(): Promise<string> {
  if (!existsSync(RECORDINGS_DIR)) {
    await mkdir(RECORDINGS_DIR, { recursive: true });
    console.log(`[Recorder] Created recordings directory: ${RECORDINGS_DIR}`);
  }
  return RECORDINGS_DIR;
}

// ============================================
// Call Recorder Class
// ============================================

export class CallRecorder {
  private roomId: string;
  private options: Required<RecordingOptions>;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: RecordingChunk[] = [];
  private startedAt: Date | null = null;
  private endedAt: Date | null = null;
  private recordingId: string;
  private filePath: string;
  private isRecording: boolean = false;

  constructor(roomId: string, options: RecordingOptions = {}) {
    this.roomId = roomId;
    this.recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.options = {
      format: options.format || 'webm',
      video: options.video !== false, // Default to recording video
      audio: options.audio !== false, // Default to recording audio
      quality: options.quality || 'high',
      outputPath: options.outputPath || RECORDINGS_DIR,
    };

    this.filePath = join(
      this.options.outputPath,
      `${this.recordingId}.${this.options.format}`
    );
  }

  /**
   * Start recording a MediaStream
   */
  async start(stream?: MediaStream): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    // Ensure output directory exists
    await ensureRecordingsDir();

    // Determine MIME type based on format and browser support
    const mimeType = this.getMimeType();
    
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn(`[Recorder] MIME type ${mimeType} not supported, falling back to default`);
      // Will use default MIME type
    }

    try {
      // If no stream provided, we'll need to receive chunks externally
      if (stream) {
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
          videoBitsPerSecond: this.getVideoBitrate(),
          audioBitsPerSecond: this.getAudioBitrate(),
        });

        this.setupMediaRecorderHandlers();
        this.mediaRecorder.start(1000); // Collect data every second
      }

      this.startedAt = new Date();
      this.chunks = [];
      this.isRecording = true;

      console.log(`[Recorder] Started recording ${this.recordingId} for room ${this.roomId}`);
    } catch (error) {
      console.error('[Recorder] Failed to start recording:', error);
      this.isRecording = false;
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop recording and save file
   */
  async stop(): Promise<RecordingInfo> {
    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = async () => {
          try {
            const info = await this.saveRecording();
            resolve(info);
          } catch (error) {
            reject(error);
          }
        };

        this.mediaRecorder.stop();
      } else {
        // Handle case where we're collecting chunks manually
        this.saveRecording()
          .then(resolve)
          .catch(reject);
      }
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log(`[Recorder] Paused recording ${this.recordingId}`);
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log(`[Recorder] Resumed recording ${this.recordingId}`);
    }
  }

  /**
   * Add a chunk of data (for manual recording mode)
   */
  addChunk(data: Blob): void {
    if (!this.isRecording) return;

    this.chunks.push({
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Get current recording status
   */
  getStatus(): {
    isRecording: boolean;
    duration: number;
    chunkCount: number;
    estimatedSize: number;
  } {
    const now = Date.now();
    const duration = this.startedAt ? Math.floor((now - this.startedAt.getTime()) / 1000) : 0;
    
    let estimatedSize = 0;
    for (const chunk of this.chunks) {
      estimatedSize += chunk.data.size;
    }

    return {
      isRecording: this.isRecording,
      duration,
      chunkCount: this.chunks.length,
      estimatedSize,
    };
  }

  /**
   * Get recording ID
   */
  getId(): string {
    return this.recordingId;
  }

  // ==========================================
  // Private Methods
  // ==========================================

  private setupMediaRecorderHandlers(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push({
          data: event.data,
          timestamp: new Date(),
        });
      }
    };

    this.mediaRecorder.onerror = (event: Event) => {
      console.error('[Recorder] MediaRecorder error:', event);
      this.isRecording = false;
    };

    // Auto-stop after max duration
    setTimeout(() => {
      if (this.isRecording) {
        console.warn('[Recorder] Max duration reached, stopping recording');
        this.stop().catch(console.error);
      }
    }, MAX_RECORDING_DURATION);
  }

  private async saveRecording(): Promise<RecordingInfo> {
    this.endedAt = new Date();
    this.isRecording = false;

    // Combine all chunks into single blob
    const mimeType = this.getMimeType();
    const blob = new Blob(
      this.chunks.map(c => c.data),
      { type: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm' }
    );

    // Convert blob to buffer and save to disk
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(this.filePath, buffer);
    
    // Get file stats
    const fileStat = await stat(this.filePath);

    const duration = this.startedAt && this.endedAt
      ? Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000)
      : 0;

    const info: RecordingInfo = {
      id: this.recordingId,
      roomId: this.roomId,
      filename: `${this.recordingId}.${this.options.format}`,
      filepath: this.filePath,
      format: this.options.format,
      duration,
      fileSize: fileStat.size,
      startedAt: this.startedAt!,
      endedAt: this.endedAt!,
      mimeType: blob.type,
    };

    console.log(`[Recorder] Saved recording: ${info.filename} (${(info.fileSize / 1024 / 1024).toFixed(2)}MB, ${duration}s)`);

    return info;
  }

  private getMimeType(): string {
    switch (this.options.format) {
      case 'mp4':
        return 'video/mp4';
      case 'ogg':
        return 'video/ogg';
      case 'webm':
      default:
        return 'video/webm;codecs=vp9,opus';
    }
  }

  private getVideoBitrate(): number {
    switch (this.options.quality) {
      case 'low':
        return 500_000; // 500 kbps
      case 'medium':
        return 1_500_000; // 1.5 Mbps
      case 'high':
      default:
        return 3_000_000; // 3 Mbps
    }
  }

  private getAudioBitrate(): number {
    switch (this.options.quality) {
      case 'low':
        return 32_000; // 32 kbps
      case 'medium':
        return 64_000; // 64 kbps
      case 'high':
      default:
        return 128_000; // 128 kbps
    }
  }
}

// ============================================
// Recording Manager (for managing multiple recordings)
// ============================================

class RecordingManager {
  private activeRecordings: Map<string, CallRecorder> = new Map();

  /**
   * Start a new recording
   */
  async startRecording(
    roomId: string,
    stream?: MediaStream,
    options?: RecordingOptions
  ): Promise<string> {
    const recorder = new CallRecorder(roomId, options);
    await recorder.start(stream);
    
    this.activeRecordings.set(roomId, recorder);
    return recorder.getId();
  }

  /**
   * Stop a recording
   */
  async stopRecording(roomId: string): Promise<RecordingInfo | null> {
    const recorder = this.activeRecordings.get(roomId);
    if (!recorder) return null;

    const info = await recorder.stop();
    this.activeRecordings.delete(roomId);
    
    return info;
  }

  /**
   * Get recording status
   */
  getStatus(roomId: string): ReturnType<CallRecorder['getStatus']> | null {
    const recorder = this.activeRecordings.get(roomId);
    if (!recorder) return null;

    return recorder.getStatus();
  }

  /**
   * Stop all active recordings
   */
  async stopAll(): Promise<void> {
    const stopPromises: Promise<RecordingInfo>[] = [];

    for (const [roomId, recorder] of this.activeRecordings.entries()) {
      stopPromises.push(recorder.stop());
    }

    await Promise.allSettled(stopPromises);
    this.activeRecordings.clear();
  }

  /**
   * Get list of active recording room IDs
   */
  getActiveRecordings(): string[] {
    return Array.from(this.activeRecordings.keys());
  }
}

// Export singleton instance
export const recordingManager = new RecordingManager();

// ============================================
// Utility Functions
// ============================================

/**
 * Format recording duration as human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }

  return `${minutes}m ${secs}s`;
}

/**
 * Format file size as human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)}KB`;
  }

  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)}MB`;
  }

  const gb = mb / 1024;
  return `${gb.toFixed(2)}GB`;
}
