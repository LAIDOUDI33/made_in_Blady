// AR Snapshot Manager
// Handles capturing, watermarking, sharing, and saving AR snapshots
// AlgeriaTrade.dz B2B Platform

import { arConfig } from './config'

// ============================================
// Type Definitions
// ============================================

export interface SnapshotOptions {
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
  includeWatermark?: boolean
  watermarkText?: string
  includeTimestamp?: boolean
  includeProductInfo?: {
    name: string
    price?: string
  }
}

export interface SnapshotResult {
  success: boolean
  blob: Blob | null
  dataUrl: string | null
  error?: string
}

export interface SavedSnapshot {
  id: string
  modelId: string
  userId: string
  imageUrl: string
  thumbnailUrl?: string
  capturedAt: Date
  shared: boolean
  shareToken?: string
  metadata?: {
    productName?: string
    productId?: string
    deviceInfo?: string
  }
}

export interface ShareOptions {
  platform: 'whatsapp' | 'facebook' | 'twitter' | 'email' | 'link' | 'download' | 'clipboard'
  title?: string
  text?: string
  url?: string
}

export interface ShareResult {
  success: boolean
  shareUrl?: string
  error?: string
}

// ============================================
// Snapshot Capture Class
// ============================================

export class ARSnapshotManager {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  /**
   * Initialize canvas for snapshot operations
   */
  private ensureCanvas(width = 1920, height = 1080): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
    }
    
    this.canvas.width = width
    this.canvas.height = height
  }

  /**
   * Capture snapshot from a WebGL renderer or image source
   */
  async captureFromSource(
    source: HTMLCanvasElement | OffscreenCanvas | ImageBitmap,
    options: SnapshotOptions = {}
  ): Promise<SnapshotResult> {
    const {
      format = arConfig.snapshot.format,
      quality = arConfig.snapshot.quality,
      includeWatermark = arConfig.snapshot.includeWatermark,
      watermarkText = arConfig.snapshot.watermarkText,
      includeTimestamp = true,
      includeProductInfo,
    } = options

    try {
      // Ensure canvas is ready
      this.ensureCanvas(source.width, source.height)
      
      if (!this.ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Draw source image
      this.ctx.drawImage(source, 0, 0)

      // Add watermark if requested
      if (includeWatermark) {
        this.addWatermark(watermarkText)
      }

      // Add timestamp if requested
      if (includeTimestamp) {
        this.addTimestamp()
      }

      // Add product info if provided
      if (includeProductInfo) {
        this.addProductInfo(includeProductInfo)
      }

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        this.canvas!.toBlob(resolve, `image/${format}`, quality)
      })

      // Generate data URL
      const dataUrl = this.canvas.toDataURL(`image/${format}`, quality)

      return {
        success: true,
        blob,
        dataUrl,
      }
    } catch (error) {
      console.error('[ARSnapshot] Capture error:', error)
      return {
        success: false,
        blob: null,
        dataUrl: null,
        error: error instanceof Error ? error.message : 'Capture failed',
      }
    }
  }

  /**
   * Capture from Three.js renderer
   */
  async captureFromThreeJS(
    renderer: { domElement: HTMLCanvasElement },
    options: SnapshotOptions = {}
  ): Promise<SnapshotResult> {
    return this.captureFromSource(renderer.domElement, options)
  }

  /**
   * Add watermark to current canvas
   */
  private addWatermark(text: string): void {
    if (!this.ctx || !this.canvas) return

    const ctx = this.ctx
    const canvas = this.canvas

    // Save context state
    ctx.save()

    // Configure text style
    const fontSize = Math.max(16, canvas.width / 80)
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'

    // Measure text
    const metrics = ctx.measureText(text)
    const padding = 15
    const height = fontSize + padding * 2
    const width = metrics.width + padding * 2
    const x = canvas.width - 20
    const y = canvas.height - 20

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.roundRect(x - width, y - height, width, height, 8)
    ctx.fill()

    // Draw text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillText(text, x - padding, y - padding)

    // Restore context state
    ctx.restore()
  }

  /**
   * Add timestamp to snapshot
   */
  private addTimestamp(): void {
    if (!this.ctx || !this.canvas) return

    const ctx = this.ctx
    const canvas = this.canvas

    ctx.save()

    const now = new Date()
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const fontSize = Math.max(12, canvas.width / 120)
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'

    ctx.fillText(timestamp, 20, canvas.height - 20)

    ctx.restore()
  }

  /**
   * Add product information overlay
   */
  private addProductInfo(info: { name: string; price?: string }): void {
    if (!this.ctx || !this.canvas) return

    const ctx = this.ctx
    const canvas = this.canvas

    ctx.save()

    const fontSize = Math.max(18, canvas.width / 70)
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    const x = 20
    const y = 20
    const padding = 12

    // Measure text
    const nameMetrics = ctx.measureText(info.name)
    let width = nameMetrics.width + padding * 2
    let height = fontSize + padding * 2

    if (info.price) {
      const priceFontSize = fontSize * 1.2
      ctx.font = `700 ${priceFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      const priceMetrics = ctx.measureText(info.price)
      width = Math.max(width, priceMetrics.width + padding * 2)
      height += priceFontSize + 8
    }

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.roundRect(x, y, width, height, 10)
    ctx.fill()

    // Draw product name
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillText(info.name, x + padding, y + padding + fontSize)

    // Draw price if available
    if (info.price) {
      const priceFontSize = fontSize * 1.2
      ctx.font = `700 ${priceFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.fillStyle = '#4ade80' // Green color for price
      ctx.fillText(info.price, x + padding, y + padding + fontSize + priceFontSize + 8)
    }

    ctx.restore()
  }

  /**
   * Draw rounded rectangle helper
   */
  private roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    if (!this.ctx) return
    
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  // ============================================
  // Share Functionality
  // ============================================

  /**
   * Share snapshot via various platforms
   */
  async share(snapshot: Blob | string, options: ShareOptions): Promise<ShareResult> {
    const { platform, title = 'AlgeriaTrade.dz - AR Showroom', text, url } = options

    try {
      switch (platform) {
        case 'download':
          return this.downloadSnapshot(snapshot)
        
        case 'clipboard':
          return this.copyToClipboard(snapshot)
        
        case 'link':
          return this.generateShareLink(url || window.location.href)
        
        case 'whatsapp':
          return this.shareToWhatsApp(title, text, url)
        
        case 'email':
          return this.shareViaEmail(title, text, url)
        
        case 'twitter':
          return this.shareToTwitter(title, text, url)
        
        case 'facebook':
          return this.shareToFacebook(url)
        
        default:
          return { success: false, error: `Unsupported platform: ${platform}` }
      }
    } catch (error) {
      console.error('[ARSnapshot] Share error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed',
      }
    }
  }

  private async downloadSnapshot(snapshot: Blob | string): Promise<ShareResult> {
    try {
      const blob = typeof snapshot === 'string' 
        ? await (await fetch(snapshot)).blob()
        : snapshot
      
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `algeriatrade-ar-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }
    }
  }

  private async copyToClipboard(snapshot: Blob | string): Promise<ShareResult> {
    try {
      if (typeof snapshot === 'string') {
        await navigator.clipboard.writeText(snapshot)
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': snapshot }),
        ])
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Copy failed',
      }
    }
  }

  private generateShareLink(url: string): Promise<ShareResult> {
    const shareUrl = `${url}?shared=${Date.now()}`
    return Promise.resolve({
      success: true,
      shareUrl,
    })
  }

  private async shareToWhatsApp(
    title: string,
    text?: string,
    url?: string
  ): Promise<ShareResult> {
    const message = `${title}\n${text || ''}\n${url || ''}`.trim()
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
    
    return { success: true, shareUrl: whatsappUrl }
  }

  private async shareViaEmail(
    title: string,
    text?: string,
    url?: string
  ): Promise<ShareResult> {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${text || ''}\n\n${url || ''}`.trim())
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
    
    window.location.href = mailtoUrl
    
    return { success: true, shareUrl: mailtoUrl }
  }

  private async shareToTwitter(
    title: string,
    text?: string,
    url?: string
  ): Promise<ShareResult> {
    const tweet = `${title}\n${text || ''}`.trim().slice(0, 280)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url || '')}`
    
    window.open(twitterUrl, '_blank')
    
    return { success: true, shareUrl: twitterUrl }
  }

  private async shareToFacebook(url?: string): Promise<ShareResult> {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.href)}`
    
    window.open(fbUrl, '_blank')
    
    return { success: true, shareUrl: fbUrl }
  }

  // ============================================
  // Save Snapshot to Server
  // ============================================

  /**
   * Save snapshot to server
   */
  async saveSnapshot(
    snapshot: Blob,
    metadata: {
      modelId: string
      userId: string
      productName?: string
      productId?: string
    }
  ): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('snapshot', snapshot, `snapshot-${Date.now()}.png`)
      formData.append('modelId', metadata.modelId)
      formData.append('userId', metadata.userId)
      
      if (metadata.productName) {
        formData.append('productName', metadata.productName)
      }
      if (metadata.productId) {
        formData.append('productId', metadata.productId)
      }

      const response = await fetch('/api/ar/capture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || 'Failed to save snapshot',
        }
      }

      const result = await response.json()
      return {
        success: true,
        snapshotId: result.data?.id,
      }
    } catch (error) {
      console.error('[ARSnapshot] Save error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Save failed',
      }
    }
  }

  /**
   * Get saved snapshots for user
   */
  async getSnapshots(userId: string): Promise<SavedSnapshot[]> {
    try {
      const response = await fetch(`/api/ar/capture?userId=${userId}`)
      
      if (!response.ok) {
        return []
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('[ARSnapshot] Get snapshots error:', error)
      return []
    }
  }

  /**
   * Delete a saved snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/ar/capture/${snapshotId}`, {
        method: 'DELETE',
      })

      return response.ok
    } catch (error) {
      console.error('[ARSnapshot] Delete error:', error)
      return false
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.canvas = null
    this.ctx = null
  }
}

// Singleton instance
export const arSnapshotManager = new ARSnapshotManager()

// ============================================
// Utility Functions
// ============================================

/**
 * Quick capture and download
 */
export async function quickCaptureAndDownload(
  source: HTMLCanvasElement | OffscreenCanvas | ImageBitmap,
  filename?: string
): Promise<void> {
  const result = await arSnapshotManager.captureFromSource(source)
  
  if (result.success && result.blob) {
    const url = URL.createObjectURL(result.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `ar-snapshot-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(url)
  }
}
