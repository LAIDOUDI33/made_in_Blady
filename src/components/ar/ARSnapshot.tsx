'use client'

import React, { useState, useEffect } from 'react'
import { 
  Image as ImageIcon,
  Download,
  Share2,
  Trash2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Grid3X3,
  X,
  ZoomIn,
  Heart,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ============================================
// Types
// ============================================

interface SnapshotData {
  id: string
  modelId: string
  imageUrl: string
  thumbnailUrl?: string
  capturedAt: string
  shared: boolean
  shareToken?: string
  metadata?: {
    productName?: string
    productId?: string
  }
}

interface ARSnapshotProps {
  userId?: string
  modelId?: string
  onShare?: (snapshot: SnapshotData) => void
  onDelete?: (snapshotId: string) => void
  className?: string
}

// ============================================
// Main Component
// ============================================

export function ARSnapshot({
  userId,
  modelId,
  onShare,
  onDelete,
  className = '',
}: ARSnapshotProps) {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotData | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch snapshots
  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        let url = '/api/ar/capture'
        const params = new URLSearchParams()
        
        if (userId) params.append('userId', userId)
        if (modelId) params.append('modelId', modelId)
        
        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url)

        if (response.ok) {
          const result = await response.json()
          setSnapshots(result.data || [])
        }
      } catch (error) {
        console.error('[ARSnapshot] Fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSnapshots()
  }, [userId, modelId])

  // Handle download
  const handleDownload = async (snapshot: SnapshotData) => {
    try {
      const response = await fetch(snapshot.imageUrl)
      const blob = await response.blob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ar-snapshot-${snapshot.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[ARSnapshot] Download error:', error)
    }
  }

  // Handle share
  const handleShareClick = async (snapshot: SnapshotData) => {
    if (onShare) {
      onShare(snapshot)
      return
    }

    // Default share behavior
    if (navigator.share) {
      try {
        await navigator.share({
          title: snapshot.metadata?.productName || 'AR Snapshot',
          text: 'Check out this AR product preview!',
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or share failed - fallback to clipboard
        handleCopyLink(snapshot)
      }
    } else {
      handleCopyLink(snapshot)
    }
  }

  // Copy share link
  const handleCopyLink = async (snapshot: SnapshotData) => {
    if (snapshot.shareToken) {
      const shareUrl = `${window.location.origin}/ar/snapshot/${snapshot.shareToken}`
      await navigator.clipboard.writeText(shareUrl)
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  // Handle delete
  const handleDelete = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to delete this snapshot?')) return

    try {
      const response = await fetch(`/api/ar/capture/${snapshotId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSnapshots(prev => prev.filter(s => s.id !== snapshotId))
        onDelete?.(snapshotId)
      }
    } catch (error) {
      console.error('[ARSnapshot] Delete error:', error)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">AR Snapshots</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (snapshots.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Snapshots Yet</h3>
        <p className="text-gray-500 mb-4">
          Capture AR views to see them here. Take a screenshot while viewing a product in AR mode.
        </p>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            AR Snapshots
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({snapshots.length})
            </span>
          </h3>
        </div>

        {/* View mode toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Snapshots grid/list */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
          : 'space-y-3'
      }>
        {snapshots.map(snapshot => (
          <SnapshotItem
            key={snapshot.id}
            snapshot={snapshot}
            viewMode={viewMode}
            onSelect={() => setSelectedSnapshot(snapshot)}
            onDownload={() => handleDownload(snapshot)}
            onShare={() => handleShareClick(snapshot)}
            onDelete={() => handleDelete(snapshot.id)}
            formatDate={formatDate}
          />
        ))}
      </div>

      {/* Fullscreen viewer dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedSnapshot && (
            <>
              <div className="relative">
                {/* Image */}
                <img
                  src={selectedSnapshot.imageUrl}
                  alt={`AR Snapshot - ${selectedSnapshot.metadata?.productName || selectedSnapshot.id}`}
                  className="w-full max-h-[70vh] object-contain bg-gray-100"
                />

                {/* Close button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                  onClick={() => setSelectedSnapshot(null)}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Product name overlay */}
                {selectedSnapshot.metadata?.productName && (
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-black/60 text-white border-0 px-3 py-1.5">
                      {selectedSnapshot.metadata.productName}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Actions bar */}
              <div className="p-4 flex items-center justify-between border-t">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedSnapshot.capturedAt).split(',')[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedSnapshot.capturedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedSnapshot)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(selectedSnapshot)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleShareClick(selectedSnapshot)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Snapshot Item Component
// ============================================

interface SnapshotItemProps {
  snapshot: SnapshotData
  viewMode: 'grid' | 'list'
  onSelect: () => void
  onDownload: () => void
  onShare: () => void
  onDelete: () => void
  formatDate: (date: string) => string
}

function SnapshotItem({
  snapshot,
  viewMode,
  onSelect,
  onDownload,
  onShare,
  onDelete,
  formatDate,
}: SnapshotItemProps) {
  if (viewMode === 'list') {
    return (
      <Card 
        className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
        onClick={onSelect}
      >
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={snapshot.thumbnailUrl || snapshot.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Hover actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="w-7 h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload()
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="w-7 h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare()
                }}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {snapshot.metadata?.productName && (
              <p className="font-medium text-gray-900 truncate">
                {snapshot.metadata.productName}
              </p>
            )}
            <p className="text-sm text-gray-500">{formatDate(snapshot.capturedAt)}</p>
            
            {snapshot.shared && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Shared
              </Badge>
            )}
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={onSelect}>
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={snapshot.thumbnailUrl || snapshot.imageUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onShare()
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Shared badge */}
        {snapshot.shared && (
          <Badge className="absolute top-2 right-2 bg-purple-500/90 text-white border-0">
            <Heart className="w-3 h-3 mr-1" />
            Shared
          </Badge>
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 text-white/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-black/50"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="p-3">
        {snapshot.metadata?.productName ? (
          <p className="font-medium text-gray-900 truncate text-sm">
            {snapshot.metadata.productName}
          </p>
        ) : (
          <p className="text-sm text-gray-500">AR Snapshot</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{formatDate(snapshot.capturedAt)}</p>
      </div>
    </Card>
  )
}

export default ARSnapshot
