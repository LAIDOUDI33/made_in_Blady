'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface ARModelUploaderProps {
  onSuccess?: () => void
  productId?: string
}

export default function ARModelUploader({ onSuccess, productId: initialProductId }: ARModelUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [productId, setProductId] = useState(initialProductId || '')
  const [name, setName] = useState('')
  const [format, setFormat] = useState('GLB')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Allowed file types
  const allowedTypes = [
    '.glb', '.gltf', '.fbx', '.usdz', '.obj', '.dae'
  ]

  const maxFileSize = 100 * 1024 * 1024 // 100MB

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) return

    // Validate file extension
    const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(extension)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
      return
    }

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      toast.error('File too large. Maximum size is 100MB')
      return
    }

    setFile(selectedFile)
    
    // Auto-fill name if not set
    if (!name) {
      setName(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }

    // Auto-detect format
    const formatMap: Record<string, string> = {
      '.glb': 'GLB',
      '.gltf': 'GLTF',
      '.fbx': 'FBX',
      '.usdz': 'USDZ',
      '.obj': 'OBJ',
      '.dae': 'DAE',
    }
    setFormat(formatMap[extension] || 'GLB')
  }, [name])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      // Simulate file input change
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(droppedFile)
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !productId || !name) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', productId)
      formData.append('name', name)

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.open('POST', '/api/ar/models/upload')
        xhr.send(formData)
      })

      await uploadPromise

      setUploadStatus('success')
      toast.success('Model uploaded successfully!')
      
      // Reset form after delay
      setTimeout(() => {
        setFile(null)
        setName('')
        setProductId(initialProductId || '')
        setUploadProgress(0)
        onSuccess?.()
      }, 1500)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      toast.error('Failed to upload model')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product ID */}
      <div className="space-y-2">
        <Label htmlFor="productId">Product ID *</Label>
        <Input
          id="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="e.g., prod_12345"
          required
        />
        <p className="text-xs text-gray-500">The unique identifier of the product</p>
      </div>

      {/* Model Name */}
      <div className="space-y-2">
        <Label htmlFor="modelName">Model Name *</Label>
        <Input
          id="modelName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Industrial Pump Model"
          required
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>3D Model File *</Label>
        
        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.fbx,.usdz,.obj,.dae"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drop your 3D model here or click to browse
            </p>
            
            <p className="text-xs text-gray-500">
              Supported formats: GLB, GLTF, FBX, USDZ (max 100MB)
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-purple-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload Progress */}
            {(isUploading || uploadStatus !== 'idle') && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {isUploading 
                      ? `Uploading... ${uploadProgress}%`
                      : uploadStatus === 'success' 
                        ? 'Upload complete!' 
                        : 'Upload failed'
                    }
                  </span>
                  
                  {uploadStatus === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  
                  {uploadStatus === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                {uploadStatus === 'error' && errorMessage && (
                  <p className="text-xs text-red-600">{errorMessage}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Format Selection (auto-detected but can be overridden) */}
      <div className="space-y-2">
        <Label>Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GLB">GLB (Recommended)</SelectItem>
            <SelectItem value="GLTF">GLTF</SelectItem>
            <SelectItem value="FBX">FBX</SelectItem>
            <SelectItem value="USDZ">USDZ (iOS)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!file || !productId || !name || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Model
          </>
        )}
      </Button>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 text-xs text-blue-800">
        <p className="font-medium mb-2">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Use GLB format for optimal web performance</li>
          <li>Keep models under 50MB for faster loading</li>
          <li>Optimize textures to 1024x1024 or smaller</li>
          <li>Use Draco compression for smaller file sizes</li>
        </ul>
      </div>
    </form>
  )
}
