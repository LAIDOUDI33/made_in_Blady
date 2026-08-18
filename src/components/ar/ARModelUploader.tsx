'use client'

import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  X, 
  File3D, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Eye,
  RotateCcw,
  ZoomIn,
  Download,
  Trash2,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  validateModelFile,
  formatFileSize,
  isSupportedModelFormat,
} from '@/lib/ar/model-manager'

// ============================================
// Types
// ============================================

interface ARModelUploaderProps {
  productId: string
  onUploadComplete?: (modelData: any) => void
  onError?: (error: Error) => void
  className?: string
}

interface UploadState {
  file: File | null
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
    suggestions: string[]
  } | null
  isUploading: boolean
  uploadProgress: number
  isUploaded: boolean
  uploadResult: any | null
}

interface ModelSettings {
  name: string
  scale: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  autoOptimize: boolean
  generateThumbnail: boolean
  convertToUSDZ: boolean
}

// ============================================
// Main Component
// ============================================

export function ARModelUploader({
  productId,
  onUploadComplete,
  onError,
  className = '',
}: ARModelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    validation: null,
    isUploading: false,
    uploadProgress: 0,
    isUploaded: false,
    uploadResult: null,
  })

  const [settings, setSettings] = useState<ModelSettings>({
    name: '',
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    autoOptimize: true,
    generateThumbnail: true,
    convertToUSDZ: true,
  })

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    const validation = validateModelFile(file)
    
    setUploadState(prev => ({
      ...prev,
      file,
      validation,
      isUploaded: false,
      uploadResult: null,
    }))

    // Update model name if not set
    if (!settings.name || settings.name === '') {
      setSettings(prev => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, ''),
      }))
    }

    // Create preview URL for image files (if thumbnail provided)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }, [settings.name])

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [handleFileSelect])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // Simulate upload process
  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.validation?.valid) return

    setUploadState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }))

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', uploadState.file)
      formData.append('productId', productId)
      formData.append('name', settings.name)
      formData.append('scale', JSON.stringify(settings.scale))
      formData.append('rotation', JSON.stringify(settings.rotation))
      formData.append('autoOptimize', String(settings.autoOptimize))
      formData.append('generateThumbnail', String(settings.generateThumbnail))
      formData.append('convertToUSDZ', String(settings.convertToUSDZ))

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + Math.random() * 15, 95),
        }))
      }, 200)

      // Send to API
      const response = await fetch('/api/ar/models', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
        isUploaded: true,
        uploadResult: result.data,
      }))

      onUploadComplete?.(result.data)
    } catch (error) {
      console.error('[ARModelUploader] Upload error:', error)
      setUploadState(prev => ({ ...prev, isUploading: false, uploadProgress: 0 }))
      onError?.(error instanceof Error ? error : new Error('Upload failed'))
    }
  }

  // Reset uploader
  const handleReset = () => {
    setUploadState({
      file: null,
      validation: null,
      isUploading: false,
      uploadProgress: 0,
      isUploaded: false,
      uploadResult: null,
    })
    setSettings({
      name: '',
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      autoOptimize: true,
      generateThumbnail: true,
      convertToUSDZ: true,
    })
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload AR Model</h3>
            <p className="text-sm text-gray-500 mt-1">
              Add a 3D model for AR preview (GLB, GLTF formats supported)
            </p>
          </div>
          
          {uploadState.isUploaded && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Uploaded
            </Badge>
          )}
        </div>

        {/* Upload Area */}
        {!uploadState.isUploaded && (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50'
                : uploadState.file
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.usdz,.obj"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {!uploadState.file ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drag & drop your 3D model here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse files
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span>Supported:</span>
                  <Badge variant="outline" className="text-xs">GLB</Badge>
                  <Badge variant="outline" className="text-xs">GLTF</Badge>
                  <Badge variant="outline" className="text-xs">USDZ</Badge>
                  <span>• Max 50MB</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <File3D className="w-8 h-8 text-emerald-600" />
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uploadState.file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(uploadState.file.size)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove file
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Validation Messages */}
        {uploadState.validation && !uploadState.validation.valid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <AlertCircle className="w-4 h-4" />
              Validation Errors
            </div>
            <ul className="space-y-1 ml-6">
              {uploadState.validation.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {uploadState.validation?.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <Info className="w-4 h-4" />
              Warnings
            </div>
            <ul className="space-y-1 ml-6">
              {uploadState.validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-amber-600">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Optimization Suggestions */}
        {uploadState.validation?.suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Info className="w-4 h-4" />
              Optimization Suggestions
            </div>
            <ul className="space-y-1 ml-6">
              {uploadState.validation.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-blue-600">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Progress */}
        {uploadState.isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="font-medium text-emerald-600">{Math.round(uploadState.uploadProgress)}%</span>
            </div>
            <Progress value={uploadState.uploadProgress} className="h-2" />
          </div>
        )}

        {/* Model Settings */}
        {(uploadState.file && uploadState.validation?.valid) && !uploadState.isUploaded && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Model Settings</h4>

              {/* Model Name */}
              <div className="space-y-2">
                <Label htmlFor="modelName">Model Name</Label>
                <Input
                  id="modelName"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter model display name"
                />
              </div>

              {/* Scale Settings */}
              <div className="space-y-2">
                <Label>Scale</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['x', 'y', 'z'] as const).map(axis => (
                    <div key={axis} className="space-y-1">
                      <Label className="text-xs text-gray-500 uppercase">{axis}</Label>
                      <Slider
                        value={[settings.scale[axis]]}
                        onValueChange={([value]) =>
                          setSettings(prev => ({
                            ...prev,
                            scale: { ...prev.scale, [axis]: value },
                          }))
                        }
                        min={0.01}
                        max={10}
                        step={0.01}
                      />
                      <span className="text-xs text-gray-500 text-center block">
                        {settings.scale[axis].toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoOptimize}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, autoOptimize: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Auto-optimize model</span>
                    <p className="text-xs text-gray-500">
                      Reduce file size and polygon count for better performance
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.generateThumbnail}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, generateThumbnail: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Generate thumbnail</span>
                    <p className="text-xs text-gray-500">
                      Auto-generate preview images from multiple angles
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.convertToUSDZ}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, convertToUSDZ: e.target.checked }))
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Convert to USDZ</span>
                    <p className="text-xs text-gray-500">
                      Create iOS-compatible version for Quick Look
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <Separator />

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploadState.isUploading || !settings.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {uploadState.isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Model
                </>
              )}
            </Button>
          </>
        )}

        {/* Success State */}
        {uploadState.isUploaded && uploadState.uploadResult && (
          <>
            <Separator />
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              
              <div>
                <h4 className="font-semibold text-emerald-800">Model Uploaded Successfully!</h4>
                <p className="text-sm text-emerald-600 mt-1">
                  Your 3D model is now available for AR preview.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.dispatchEvent(
                    new CustomEvent('ar:view-product', { detail: { productId } })
                  )}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview in AR
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Upload Another
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default ARModelUploader
