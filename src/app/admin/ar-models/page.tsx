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
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import ARModelUploader from '@/components/admin/ARModelUploader'
import ARModelPreview from '@/components/admin/ARModelPreview'

interface ARModelData {
  id: string
  productId: string
  name: string
  modelUrl: string
  thumbnailUrl: string
  format: string
  fileSize: number
  polygonCount: number
  optimizedForMobile: boolean
  isEnabled: boolean
  viewsCount: number
  avgViewDuration: number
  createdAt: string
  updatedAt: string
}

export default function ARModelsAdminPage() {
  const [models, setModels] = useState<ARModelData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ARModelData | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  // Fetch models on mount
  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/ar/models')
      
      if (response.ok) {
        const result = await response.json()
        setModels(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this AR model?')) return

    try {
      const response = await fetch(`/api/ar/models/${modelId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setModels(models.filter(m => m.id !== modelId))
      }
    } catch (error) {
      console.error('Failed to delete model:', error)
    }
  }

  const handleToggleEnabled = async (model: ARModelData) => {
    try {
      const response = await fetch(`/api/ar/models/${model.productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !model.isEnabled }),
      })

      if (response.ok) {
        setModels(models.map(m => 
          m.id === model.id ? { ...m, isEnabled: !m.isEnabled } : m
        ))
      }
    } catch (error) {
      console.error('Failed to toggle model:', error)
    }
  }

  // Format file size
  const formatFileSize = (kb: number): string => {
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  // Filter models by search query
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.productId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const totalViews = models.reduce((sum, m) => sum + m.viewsCount, 0)
  const totalModels = models.length
  const enabledModels = models.filter(m => m.isEnabled).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AR Model Management</h1>
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
                fetchModels()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Eye className="w-10 h-10 text-green-500 bg-green-100 rounded-lg p-2" />
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
              <BarChart3 className="w-10 h-10 text-blue-500 bg-blue-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Duration</p>
                <p className="text-2xl font-bold">
                  {models.length > 0 
                    ? `${Math.round(models.reduce((sum, m) => sum + m.avgViewDuration, 0) / models.length)}s`
                    : 'N/A'}
                </p>
              </div>
              <Upload className="w-10 h-10 text-orange-500 bg-orange-100 rounded-lg p-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models">All Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">3D Models</CardTitle>
                
                <div className="flex items-center gap-2">
                  {/* Search */}
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
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
                            <span className="font-medium">{model.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {model.productId}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{model.format}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(model.fileSize)}</TableCell>
                        <TableCell>{model.viewsCount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={model.isEnabled ? 'default' : 'secondary'}
                            className={model.isEnabled ? 'bg-green-500' : ''}
                          >
                            {model.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
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

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AR Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Detailed analytics coming soon</p>
                <p className="text-sm mt-2">
                  View basic stats in the cards above or check individual model analytics
                </p>
              </div>
            </CardContent>
          </Card>
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
