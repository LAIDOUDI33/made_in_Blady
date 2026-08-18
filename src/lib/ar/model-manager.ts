// AR Model Manager
// Handles model upload, conversion, optimization, and metadata management
// AlgeriaTrade.dz B2B Platform

import { arConfig } from './config'
import type { ARModelFormat } from './config'

// ============================================
// Type Definitions
// ============================================

export interface ModelMetadata {
  id: string
  productId: string
  name: string
  originalName: string
  format: ARModelFormat
  fileSize: number // bytes
  thumbnailUrl?: string
  usdzUrl?: string // Converted iOS version
  scale: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  optimized: boolean
  polygonCount?: number
  textureSize?: number
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR'
  errorDetails?: string
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface UploadOptions {
  productId: string
  name?: string
  generateThumbnail?: boolean
  optimizeOnUpload?: boolean
  convertToUSDZ?: boolean
  uploadedBy: string
}

export interface UploadResult {
  success: boolean
  modelId?: string
  modelUrl?: string
  thumbnailUrl?: string
  errors?: string[]
  warnings?: string[]
}

export interface ValidationResult {
  valid: boolean
  format: ARModelFormat | null
  fileSize: number
  estimatedPolygons?: number
  errors: string[]
  warnings: string[]
  optimizationSuggestions: string[]
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate a 3D model file before upload
 */
export function validateModelFile(file: File): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const validFormats: ARModelFormat[] = ['glb', 'gltf', 'usdz']
  
  let format: ARModelFormat | null = null
  
  if (validFormats.includes(extension as ARModelFormat)) {
    format = extension as ARModelFormat
  } else {
    errors.push(
      `Invalid file format: ${extension}. Supported formats: ${arConfig.modelFormats.join(', ')}`
    )
  }

  // Check file size
  const maxSizeBytes = arConfig.quality.maxModelSizeMB * 1024 * 1024
  
  if (file.size > maxSizeBytes) {
    errors.push(
      `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed: ${arConfig.quality.maxModelSizeMB}MB`
    )
  }

  // Warnings for large files
  const warningThreshold = maxSizeBytes * 0.5
  if (file.size > warningThreshold) {
    warnings.push('Large file detected. Consider optimizing for better web performance.')
    suggestions.push('Enable Draco compression to reduce file size')
  }

  // Estimate polygons based on file size (rough estimate)
  const estimatedPolygons = Math.round(file.size / 1000)
  
  if (estimatedPolygons > arConfig.quality.polygonTarget * 2) {
    warnings.push(`High polygon count estimated (~${estimatedPolygons.toLocaleString()})`)
    suggestions.push('Consider mesh simplification to target ~50,000 polygons')
    suggestions.push('Generate LODs for distance-based rendering')
  }

  return {
    valid: errors.length === 0,
    format,
    fileSize: file.size,
    estimatedPolygons,
    errors,
    warnings,
    optimizationSuggestions: suggestions,
  }
}

/**
 * Validate model format by reading magic bytes
 */
export async function validateModelFormat(file: File): Promise<{
  format: string
  version?: string
  valid: boolean
}> {
  const buffer = await file.slice(0, 12).arrayBuffer()
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // GLB detection (magic: glTF + version)
  if (
    bytes[0] === 0x67 && // g
    bytes[1] === 0x6c && // l
    bytes[2] === 0x54 && // T
    bytes[3] === 0x46 && // F
  ) {
    const version = view.getUint32(4, true)
    return {
      format: 'glb',
      version: `${version}`,
      valid: version === 2,
    }
  }

  // GLTF detection (JSON text)
  const textDecoder = new TextDecoder()
  const header = textDecoder.decode(bytes.slice(0, 4))
  if (header === '{' || file.name.endsWith('.gltf')) {
    return { format: 'gltf', valid: true }
  }

  // USDZ detection (ZIP-based)
  if (
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    if (file.name.endsWith('.usdz')) {
      return { format: 'usdz', valid: true }
    }
  }

  return { format: 'unknown', valid: false }
}

// ============================================
// Model Manager Class
// ============================================

export class ARModelManager {
  private uploadUrl: string
  private apiUrl: string

  constructor(options?: { uploadUrl?: string; apiUrl?: string }) {
    this.uploadUrl = options?.uploadUrl || '/api/ar/models'
    this.apiUrl = options?.apiUrl || '/api/ar'
  }

  /**
   * Upload a new AR model
   */
  async uploadModel(file: File, options: UploadOptions): Promise<UploadResult> {
    // Validate first
    const validation = validateModelFile(file)
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      }
    }

    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', options.productId)
      formData.append('name', options.name || file.name.replace(/\.[^/.]+$/, ''))
      formData.append('uploadedBy', options.uploadedBy)
      
      if (options.generateThumbnail !== undefined) {
        formData.append('generateThumbnail', String(options.generateThumbnail))
      }
      if (options.optimizeOnUpload !== undefined) {
        formData.append('optimizeOnUpload', String(options.optimizeOnUpload))
      }
      if (options.convertToUSDZ !== undefined) {
        formData.append('convertToUSDZ', String(options.convertToUSDZ))
      }

      // Send to API
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          errors: [errorData.error || `Upload failed with status ${response.status}`],
          warnings: validation.warnings,
        }
      }

      const result = await response.json()

      return {
        success: true,
        modelId: result.data?.id,
        modelUrl: result.data?.fileUrl,
        thumbnailUrl: result.data?.thumbnailUrl,
        warnings: validation.warnings,
      }
    } catch (error) {
      console.error('[ARModelManager] Upload error:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Upload failed'],
        warnings: validation.warnings,
      }
    }
  }

  /**
   * Request conversion to USDZ format (for iOS)
   */
  async requestUSDZConversion(modelId: string): Promise<{
    success: boolean
    usdzUrl?: string
    status: string
  }> {
    try {
      const response = await fetch(`${this.uploadUrl}/${modelId}/convert/usdz`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Conversion request failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        usdzUrl: result.data?.usdzUrl,
        status: result.data?.status || 'PROCESSING',
      }
    } catch (error) {
      console.error('[ARModelManager] Conversion error:', error)
      return {
        success: false,
        status: 'ERROR',
      }
    }
  }

  /**
   * Get model metadata
   */
  async getModelMetadata(modelId: string): Promise<ModelMetadata | null> {
    try {
      const response = await fetch(`${this.uploadUrl}/${modelId}`)

      if (!response.ok) {
        return null
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('[ARModelManager] Get metadata error:', error)
      return null
    }
  }

  /**
   * Get models for a product
   */
  async getProductModels(productId: string): Promise<ModelMetadata[]> {
    try {
      const response = await fetch(`${this.uploadUrl}?productId=${productId}`)

      if (!response.ok) {
        return []
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('[ARModelManager] Get product models error:', error)
      return []
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.uploadUrl}/${modelId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `Delete failed with status ${response.status}`,
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[ARModelManager] Delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  /**
   * Update model metadata
   */
  async updateModelMetadata(
    modelId: string,
    updates: Partial<Pick<ModelMetadata, 'name' | 'scale' | 'rotation'>>
  ): Promise<{ success: boolean; data?: ModelMetadata; error?: string }> {
    try {
      const response = await fetch(`${this.uploadUrl}/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || 'Update failed',
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: result.data,
      }
    } catch (error) {
      console.error('[ARModelManager] Update error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      }
    }
  }

  /**
   * Generate thumbnail for a model
   */
  async generateThumbnail(modelId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.uploadUrl}/${modelId}/thumbnail/generate`, {
        method: 'POST',
      })

      if (!response.ok) {
        return null
      }

      const result = await response.json()
      return result.data?.thumbnailUrl || null
    } catch (error) {
      console.error('[ARModelManager] Generate thumbnail error:', error)
      return null
    }
  }
}

// Singleton instance
export const arModelManager = new ARModelManager()

// ============================================
// Utility Functions
// ============================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is a supported 3D model format
 */
export function isSupportedModelFormat(filename: string): boolean {
  const ext = getFileExtension(filename)
  return arConfig.modelFormats.includes(ext as ARModelFormat)
}

/**
 * Generate default scale based on product category
 */
export function getDefaultScale(category?: string): { x: number; y: number; z: number } {
  switch (category?.toLowerCase()) {
    case 'furniture':
      return { x: 0.01, y: 0.01, z: 0.01 } // Furniture usually in cm/mm
    case 'electronics':
      return { x: 0.001, y: 0.001, z: 0.001 } // Electronics in mm
    case 'machinery':
      return { x: 0.005, y: 0.005, z: 0.005 } // Machinery in mixed units
    case 'clothing':
      return { x: 0.01, y: 0.01, z: 0.01 } // Clothing in cm
    default:
      return { x: 1, y: 1, z: 1 }
  }
}
