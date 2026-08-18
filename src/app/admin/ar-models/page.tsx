'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  Eye,
  Box,
  Search,
  Filter,
  MoreVertical,
  BarChart3,
  Settings,
  Globe,
  Zap,
  Clock,
  CheckCircle2,
  Loader2,
  Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import ARModelUploader from '@/components/admin/ARModelUploader'
import ARModelPreview from '@/components/admin/ARModelPreview'

// Types
interface ARModelData {
  id: string
  productId: string
  productName: string
  name: string
  modelUrl: string
  thumbnailUrl: string
  format: 'GLB' | 'USDZ' | 'GLTF' | 'FBX'
  fileSize: number // KB
  polygonCount: number
  optimizedForMobile: boolean
  isEnabled: boolean
  viewsCount: number
  capturesCount: number
  avgViewDuration: number
  createdAt: string
  updatedAt: string
  cdnUrl?: string
}

interface OptimizationQueueItem {
  id: string
  modelName: string
  format: string
  originalSize: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  startedAt?: string
}

// Mock Data - 12 AR models for demonstration
const mockModels: ARModelData[] = [
  {
    id: '1', productId: 'PRD-001', productName: 'Industrial CNC Machine',
    name: 'cnc_machine_v2.glb',
    modelUrl: '/models/cnc_machine.glb',
    thumbnailUrl: '/thumbnails/cnc_machine.png',
    format: 'GLB', fileSize: 4520, polygonCount: 125000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 1245, capturesCount: 89, avgViewDuration: 42,
    createdAt: '2025-01-15T10:00:00', updatedAt: '2025-01-18T14:30:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/cnc_machine_v2.glb'
  },
  {
    id: '2', productId: 'PRD-002', productName: 'Office Ergonomic Chair',
    name: 'ergo_chair.usdz',
    modelUrl: '/models/ergo_chair.usdz',
    thumbnailUrl: '/thumbnails/ergo_chair.png',
    format: 'USDZ', fileSize: 2890, polygonCount: 78000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 2340, capturesCount: 156, avgViewDuration: 35,
    createdAt: '2025-01-14T09:15:00', updatedAt: '2025-01-17T11:20:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/ergo_chair.usdz'
  },
  {
    id: '3', productId: 'PRD-003', productName: 'Smart Home Speaker',
    name: 'smart_speaker_v3.glb',
    modelUrl: '/models/smart_speaker.glb',
    thumbnailUrl: '/thumbnails/smart_speaker.png',
    format: 'GLB', fileSize: 1850, polygonCount: 45000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 3420, capturesCount: 234, avgViewDuration: 28,
    createdAt: '2025-01-13T16:30:00', updatedAt: '2025-01-19T09:00:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/smart_speaker_v3.glb'
  },
  {
    id: '4', productId: 'PRD-004', productName: 'Solar Panel Kit',
    name: 'solar_panel_kit.glb',
    modelUrl: '/models/solar_panel.glb',
    thumbnailUrl: '/thumbnails/solar_panel.png',
    format: 'GLB', fileSize: 6780, polygonCount: 198000,
    optimizedForMobile: false, isEnabled: true,
    viewsCount: 890, capturesCount: 45, avgViewDuration: 55,
    createdAt: '2025-01-12T11:00:00', updatedAt: '2025-01-12T11:00:00'
  },
  {
    id: '5', productId: 'PRD-005', productName: 'Medical Equipment Cart',
    name: 'medical_cart_v2.usdz',
    modelUrl: '/models/medical_cart.usdz',
    thumbnailUrl: '/thumbnails/medical_cart.png',
    format: 'USDZ', fileSize: 3200, polygonCount: 95000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 567, capturesCount: 28, avgViewDuration: 38,
    createdAt: '2025-01-11T14:45:00', updatedAt: '2025-01-16T10:15:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/medical_cart_v2.usdz'
  },
  {
    id: '6', productId: 'PRD-006', productName: 'Textile Loom Machine',
    name: 'textile_loom.glb',
    modelUrl: '/models/textile_loom.glb',
    thumbnailUrl: '/thumbnails/textile_loom.png',
    format: 'GLB', fileSize: 8900, polygonCount: 245000,
    optimizedForMobile: false, isEnabled: false,
    viewsCount: 234, capturesCount: 12, avgViewDuration: 62,
    createdAt: '2025-01-10T08:30:00', updatedAt: '2025-01-10T08:30:00'
  },
  {
    id: '7', productId: 'PRD-007', productName: 'Agricultural Tractor',
    name: 'tractor_2024.glb',
    modelUrl: '/models/tractor.glb',
    thumbnailUrl: '/thumbnails/tractor.png',
    format: 'GLB', fileSize: 12450, polygonCount: 356000,
    optimizedForMobile: false, isEnabled: true,
    viewsCount: 1567, capturesCount: 78, avgViewDuration: 48,
    createdAt: '2025-01-09T13:20:00', updatedAt: '2025-01-18T16:45:00'
  },
  {
    id: '8', productId: 'PRD-008', productName: 'Construction Crane Model',
    name: 'mini_crane.usdz',
    modelUrl: '/models/mini_crane.usdz',
    thumbnailUrl: '/thumbnails/mini_crane.png',
    format: 'USDZ', fileSize: 2100, polygonCount: 67000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 1890, capturesCount: 112, avgViewDuration: 33,
    createdAt: '2025-01-08T10:00:00', updatedAt: '2025-01-15T14:00:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/mini_crane.usdz'
  },
  {
    id: '9', productId: 'PRD-009', productName: 'Pharmaceutical Display Unit',
    name: 'pharma_display.glb',
    modelUrl: '/models/pharma_display.glb',
    thumbnailUrl: '/thumbnails/pharma_display.png',
    format: 'GLB', fileSize: 1650, polygonCount: 42000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 756, capturesCount: 43, avgViewDuration: 29,
    createdAt: '2025-01-07T15:30:00', updatedAt: '2025-01-14T11:30:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/pharma_display.glb'
  },
  {
    id: '10', productId: 'PRD-010', productName: 'LED Street Light',
    name: 'led_streetlight_v2.glb',
    modelUrl: '/models/led_streetlight.glb',
    thumbnailUrl: '/thumbnails/led_streetlight.png',
    format: 'GLB', fileSize: 890, polygonCount: 28000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 1120, capturesCount: 67, avgViewDuration: 24,
    createdAt: '2025-01-06T09:45:00', updatedAt: '2025-01-13T08:15:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/led_streetlight_v2.glb'
  },
  {
    id: '11', productId: 'PRD-011', productName: 'Water Pump System',
    name: 'water_pump.fbx',
    modelUrl: '/models/water_pump.fbx',
    thumbnailUrl: '/thumbnails/water_pump.png',
    format: 'FBX', filesize: 5600, polygonCount: 145000,
    optimizedForMobile: false, isEnabled: false,
    viewsCount: 123, capturesCount: 5, avgViewDuration: 41,
    createdAt: '2025-01-05T12:00:00', updatedAt: '2025-01-05T12:00:00'
  } as any,
  {
    id: '12', productId: 'PRD-012', productName: 'Warehouse Shelving Unit',
    name: 'shelving_unit.glb',
    modelUrl: '/models/shelving_unit.glb',
    thumbnailUrl: '/thumbnails/shelving_unit.png',
    format: 'GLB', fileSize: 2340, polygonCount: 68000,
    optimizedForMobile: true, isEnabled: true,
    viewsCount: 945, capturesCount: 54, avgViewDuration: 31,
    createdAt: '2025-01-04T16:15:00', updatedAt: '2025-01-12T10:30:00',
    cdnUrl: 'https://cdn.algeriatrade.dz/ar/models/shelving_unit.glb'
  }
]

const mockOptimizationQueue: OptimizationQueueItem[] = [
  { id: 'opt-1', modelName: 'solar_panel_kit.glb', format: 'GLB → USDZ', originalSize: 6780, status: 'PROCESSING', progress: 65, startedAt: '2025-01-20T10:30:00' },
  { id: 'opt-2', modelName: 'tractor_2024.glb', format: 'GLB (Optimize)', originalSize: 12450, status: 'PENDING', progress: 0 },
  { id: 'opt-3', modelName: 'textile_loom.glb', format: 'GLB → USDZ + Optimize', originalSize: 8900, status: 'PENDING', progress: 0 }
]

export default function ARModelsAdminPage() {
  const [models, setModels] = useState<ARModelData[]>(mockModels)
  const [isLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ARModelData | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [optimizationQueue] = useState<OptimizationQueueItem[]>(mockOptimizationQueue)

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this AR model?')) return
    setModels(models.filter(m => m.id !== modelId))
  }

  const handleToggleEnabled = async (model: ARModelData) => {
    setModels(models.map(m => 
      m.id === model.id ? { ...m, isEnabled: !m.isEnabled } : m
    ))
  }

  // Format file size
  const formatFileSize = (kb: number): string => {
    if (!kb) return 'N/A'
    if (kb < 1024) return `${kb.toFixed(0)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  // Filter models by search query
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.productName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const totalViews = models.reduce((sum, m) => sum + m.viewsCount, 0)
  const totalCaptures = models.reduce((sum, m) => sum + (m.capturesCount || 0), 0)
  const totalModels = models.length
  const enabledModels = models.filter(m => m.isEnabled).length
  const optimizedModels = models.filter(m => m.optimizedForMobile).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            AR Model Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage 3D models for augmented reality product viewing
          </p>
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Upload Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New AR Model</DialogTitle>
            </DialogHeader>
            <ARModelUploader 
              onSuccess={() => {
                setShowUploadDialog(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Models</p>
                <p className="text-2xl font-bold">{totalModels}</p>
              </div>
              <Box className="w-10 h-10 text-purple-500 bg-purple-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{enabledModels}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500 bg-green-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-10 h-10 text-blue-500 bg-blue-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Captures</p>
                <p className="text-2xl font-bold">{totalCaptures.toLocaleString()}</p>
              </div>
              <Camera className="w-10 h-10 text-orange-500 bg-orange-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Optimized</p>
                <p className="text-2xl font-bold">{optimizedModels}/{totalModels}</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-500 bg-yellow-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models">All Models ({totalModels})</TabsTrigger>
          <TabsTrigger value="queue">Optimization Queue ({optimizationQueue.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">CDN Settings</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">3D Models Library</CardTitle>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>

                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-12">
                  <Box className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No models found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchQuery ? 'Try a different search term' : 'Upload your first 3D model'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowUploadDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Model
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product / Model</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Polygons</TableHead>
                      <TableHead>Optimized</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Captures</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {model.thumbnailUrl ? (
                              <img
                                src={model.thumbnailUrl}
                                alt={model.name}
                                className="w-10 h-10 rounded object-cover bg-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center">
                                <Box className="w-5 h-5 text-purple-500" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium block">{model.productName}</span>
                              <code className="text-xs text-gray-500">{model.name}</code>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            model.format === 'USDZ' ? 'border-blue-300 text-blue-600' :
                            model.format === 'GLB' ? 'border-green-300 text-green-600' :
                            'border-gray-300'
                          }>
                            {model.format}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(model.fileSize)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {(model.polygonCount / 1000).toFixed(0)}K
                        </TableCell>
                        <TableCell>
                          {model.optimizedForMobile ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <Zap className="w-3 h-3 mr-1" />Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>{model.viewsCount.toLocaleString()}</TableCell>
                        <TableCell>{(model.capturesCount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={model.isEnabled ? 'default' : 'secondary'}
                            className={model.isEnabled ? 'bg-green-500' : ''}
                          >
                            {model.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(model.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedModel(model)
                                  setShowPreviewDialog(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleEnabled(model)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {model.isEnabled ? 'Disable' : 'Enable'}
                              </DropdownMenuItem>
                              {model.cdnUrl && (
                                <DropdownMenuItem>
                                  <Globe className="w-4 h-4 mr-2" />
                                  Copy CDN URL
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(model.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Queue Tab */}
        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-orange-500" />
                Optimization Queue
              </CardTitle>
              <CardDescription>
                Models waiting to be optimized or converted
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {optimizationQueue.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Queue Empty</h3>
                  <p className="text-sm text-gray-500">
                    All models have been processed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {optimizationQueue.map((item) => (
                    <div key={item.id} className={`p-4 rounded-lg border ${
                      item.status === 'PROCESSING' ? 'bg-blue-50 border-blue-200' :
                      item.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Box className="w-10 h-10 text-purple-500 bg-purple-100 rounded-lg p-2" />
                          <div>
                            <p className="font-semibold">{item.modelName}</p>
                            <p className="text-sm text-gray-500">{item.format} • Original: {formatFileSize(item.originalSize)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            {item.status === 'PROCESSING' && (
                              <>
                                <Progress value={item.progress} className="h-2 mb-1" />
                                <p className="text-xs text-gray-500">{item.progress}% complete</p>
                              </>
                            )}
                            {item.status === 'PENDING' && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {item.status === 'COMPLETED' && (
                              <Badge className="bg-green-100 text-green-700">Completed</Badge>
                            )}
                            {item.status === 'FAILED' && (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                          </div>
                          
                          {item.status === 'PROCESSING' && (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          )}
                        </div>
                      </div>
                      
                      {item.startedAt && (
                        <p className="text-xs text-gray-400 mt-2 ml-14">
                          Started: {new Date(item.startedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Viewed Models */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Most Viewed Models
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...models]
                  .sort((a, b) => b.viewsCount - a.viewsCount)
                  .slice(0, 5)
                  .map((model, idx) => (
                    <div key={model.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{model.productName}</p>
                        <p className="text-xs text-gray-500">{model.name}</p>
                      </div>
                      <span className="font-semibold text-sm">{model.viewsCount.toLocaleString()} views</span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Capture Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange-500" />
                  Highest Capture Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...models]
                  .filter(m => m.capturesCount > 0)
                  .sort((a, b) => (b.capturesCount || 0) / b.viewsCount - (a.capturesCount || 0) / a.viewsCount)
                  .slice(0, 5)
                  .map((model) => {
                    const captureRate = ((model.capturesCount || 0) / model.viewsCount * 100).toFixed(1)
                    return (
                      <div key={model.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{model.productName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{model.capturesCount} caps</span>
                          <Badge variant="outline" className="text-orange-600">{captureRate}%</Badge>
                        </div>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>

            {/* Format Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  Format Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['GLB', 'USDZ', 'GLTF', 'FBX'].map((format) => {
                  const count = models.filter(m => m.format === format).length
                  const percent = (count / models.length) * 100
                  return (
                    <div key={format} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{format}</span>
                        <span className="text-gray-500">{count} models ({percent.toFixed(0)}%)</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Average View Duration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-500" />
                  Avg. View Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...models]
                  .sort((a, b) => b.avgViewDuration - a.avgViewDuration)
                  .slice(0, 5)
                  .map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="font-medium text-sm truncate flex-1">{model.productName}</span>
                      <span className="font-mono text-sm ml-4">{model.avgViewDuration}s avg</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CDN Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  CDN Configuration
                </CardTitle>
                <CardDescription>Content delivery network settings for AR models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">CDN Active</span>
                  </div>
                  <p className="text-sm text-green-700">cdn.algeriatrade.dz</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Base URL</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">https://cdn.algeriatrade.dz/ar/</code>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Cache TTL</span>
                    <span className="font-medium text-sm">30 days</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Compression</span>
                    <span className="font-medium text-sm">Gzip Enabled</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">SSL Certificate</span>
                    <Badge className="bg-green-100 text-green-700">Valid</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure CDN Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Optimization Settings
                </CardTitle>
                <CardDescription>Default optimization options for new uploads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Auto-optimize on upload</p>
                      <p className="text-xs text-gray-500">Automatically optimize for mobile</p>
                    </div>
                    <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Generate USDZ version</p>
                      <p className="text-xs text-gray-500">Create iOS compatible version</p>
                    </div>
                    <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Max polygon count</p>
                      <p className="text-xs text-gray-500">Target for optimization</p>
                    </div>
                    <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">100K</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Max texture size</p>
                      <p className="text-xs text-gray-500">Resolution limit</p>
                    </div>
                    <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">2048px</span>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Model Preview</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <ARModelPreview 
              productId={selectedModel.productId}
              modelName={selectedModel.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
