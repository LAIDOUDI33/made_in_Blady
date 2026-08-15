'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize,
  Camera,
  Video,
  Building2,
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  type: string;
  language?: string;
  viewCount?: number;
  isPrimary?: boolean;
  isFeatured?: boolean;
}

interface VirtualTourData {
  id: string;
  title: string;
  description?: string;
  tourUrl: string;
  coverImage?: string;
  type: string;
  viewCount?: number;
  hotspots?: any[];
}

interface VideoShowroomProps {
  videos?: VideoData[];
  virtualTours?: VirtualTourData[];
  companyId?: string;
  productId?: string;
  title?: string;
  editable?: boolean;
  onVideoUpload?: (data: any) => void;
  onVideoDelete?: (id: string) => void;
}

export function VideoShowroom({
  videos = [],
  virtualTours = [],
  companyId,
  productId,
  title = "Video Showroom",
  editable = false,
  onVideoUpload,
  onVideoDelete
}: VideoShowroomProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [selectedTour, setSelectedTour] = useState<VirtualTourData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Demo data if none provided
  const demoVideos: VideoData[] = videos.length > 0 ? videos : [
    {
      id: '1',
      title: 'Product Demonstration',
      description: 'See our product in action with detailed features showcase',
      videoUrl: '/demo-video.mp4',
      thumbnailUrl: '',
      duration: 180,
      type: 'product_demo',
      language: 'fr',
      viewCount: 1250,
      isPrimary: true
    },
    {
      id: '2',
      title: 'Factory Tour',
      description: 'Take a virtual tour of our manufacturing facility',
      videoUrl: '/factory-tour.mp4',
      thumbnailUrl: '',
      duration: 320,
      type: 'factory_tour',
      language: 'fr',
      viewCount: 890
    },
    {
      id: '3',
      title: 'Customer Testimonial',
      description: 'Hear what our customers say about us',
      videoUrl: '/testimonial.mp4',
      thumbnailUrl: '',
      duration: 95,
      type: 'testimonial',
      language: 'ar',
      viewCount: 540
    }
  ];

  const demoTours: VirtualTourData[] = virtualTours.length > 0 ? virtualTours : [
    {
      id: '1',
      title: '360° Factory View',
      description: 'Explore our production facility in immersive 360°',
      tourUrl: '/virtual-tour/',
      coverImage: '',
      type: 'factory',
      viewCount: 2340
    }
  ];

  const displayVideos = demoVideos;
  const displayTours = demoTours;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count?: number) => {
    if (!count) return '0 views';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'product_demo': return Camera;
      case 'factory_tour': return Building2;
      case 'testimonial': return Star;
      default: return Video;
    }
  };

  const getVideoTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {displayVideos.length} videos • {displayTours.length} virtual tours
          </p>
        </div>
        
        {editable && (
          <Button onClick={() => onVideoUpload?.({})}>
            <Camera className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        )}
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Videos ({displayVideos.length})
          </TabsTrigger>
          <TabsTrigger value="tours" className="gap-2">
            <Building2 className="h-4 w-4" />
            360° Tours ({displayTours.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          {/* Featured/Primary Video */}
          {displayVideos.find(v => v.isPrimary || v.isFeatured) && (
            <Card className="mb-6 overflow-hidden group cursor-pointer" onClick={() => setSelectedVideo(displayVideos.find(v => v.isPrimary || v.isFeatured)!)}>
              <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                <img 
                  src={displayVideos.find(v => v.isPrimary)?.thumbnailUrl || '/placeholder-video.jpg'} 
                  alt="Video thumbnail"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-4 bg-white/90 rounded-full shadow-lg">
                    <Play className="h-8 w-8 text-primary ml-1" />
                  </div>
                </div>

                {/* Duration badge */}
                <Badge className="absolute bottom-3 right-3 bg-black/80 text-white">
                  {formatDuration(displayVideos.find(v => v.isPrimary)?.duration)}
                </Badge>

                {/* Primary badge */}
                {displayVideos.find(v => v.isPrimary)?.isPrimary && (
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Main Video
                  </Badge>
                )}
              </div>
              
              <CardContent className="pt-4">
                <h4 className="font-semibold">{displayVideos.find(v => v.isPrimary)?.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {displayVideos.find(v => v.isPrimary)?.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVideos.filter(v => !v.isPrimary).map((video) => {
              const TypeIcon = getVideoTypeIcon(video.type);
              
              return (
                <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedVideo(video)}>
                  <div className="relative aspect-video bg-muted">
                    <img 
                      src={video.thumbnailUrl || '/placeholder-video.jpg'} 
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-3 bg-white/90 rounded-full">
                        <Play className="h-6 w-6 text-primary ml-0.5" />
                      </div>
                    </div>

                    <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                      {formatDuration(video.duration)}
                    </Badge>

                    <Badge variant="secondary" className="absolute top-2 left-2 gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {getVideoTypeLabel(video.type)}
                    </Badge>
                  </div>
                  
                  <CardContent className="pt-3">
                    <h5 className="font-medium text-sm line-clamp-1">{video.title}</h5>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{formatViews(video.viewCount)}</span>
                      {video.language && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {video.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    {editable && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 w-full text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVideoDelete?.(video.id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tours" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayTours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTour(tour)}>
                <div className="relative aspect-[16/9] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
                  <img 
                    src={tour.coverImage || '/placeholder-tour.jpg'} 
                    alt={tour.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Maximize className="h-12 w-12 mx-auto mb-2 text-primary opacity-80" />
                      <p className="font-semibold">Click to explore</p>
                    </div>
                  </div>

                  <Badge className="absolute top-3 left-3 gap-1">
                    <Building2 className="h-3 w-3" />
                    360° Virtual Tour
                  </Badge>

                  <Badge variant="secondary" className="absolute bottom-3 right-3">
                    {formatViews(tour.viewCount)}
                  </Badge>
                </div>
                
                <CardContent className="pt-4">
                  <h4 className="font-semibold">{tour.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tour.description}</p>
                  
                  <Button variant="outline" size="sm" className="mt-3">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Tour
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {!selectedVideo ? null : (
            <>
              <div className="relative aspect-video bg-black">
                <video
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.thumbnailUrl}
                  className="w-full h-full"
                  controls
                  autoPlay
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
              
              <DialogHeader className="p-4">
                <DialogTitle>{selectedVideo.title}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatViews(selectedVideo.viewCount)}</span>
                  <span>•</span>
                  <span>{formatDuration(selectedVideo.duration)}</span>
                  <span>•</span>
                  <Badge variant="outline" className="gap-1">
                    {(() => { const I = getVideoTypeIcon(selectedVideo.type); return <I className="h-3 w-3" />; })()}
                    {getVideoTypeLabel(selectedVideo.type)}
                  </Badge>
                </div>
                {selectedVideo.description && (
                  <p className="text-sm mt-2">{selectedVideo.description}</p>
                )}
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Virtual Tour Dialog */}
      <Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden h-[80vh]">
          {!selectedTour ? null : (
            <>
              <div className="relative h-full bg-muted">
                <iframe
                  src={selectedTour.tourUrl}
                  title={selectedTour.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                  vr
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact video gallery for product cards
export function VideoGallery({ 
  videos, 
  maxVisible = 3 
}: { 
  videos: VideoData[]; 
  maxVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  
  if (!videos || videos.length === 0) return null;

  const displayVideos = showAll ? videos : videos.slice(0, maxVisible);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Video className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{videos.length} Videos</span>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {displayVideos.map((video) => (
          <div 
            key={video.id}
            className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
          >
            <img 
              src={video.thumbnailUrl || '/placeholder-video.jpg'}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
              <Play className="h-4 w-4 text-white" />
            </div>
            <Badge className="absolute bottom-1 right-1 px-1 py-0 text-[10px] bg-black/70 text-white">
              {Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}
            </Badge>
          </div>
        ))}
        
        {videos.length > maxVisible && !showAll && (
          <button 
            onClick={() => setShowAll(true)}
            className="flex-shrink-0 w-24 h-16 rounded-md border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary transition-colors"
          >
            <span className="text-xs text-muted-foreground">+{videos.length - maxVisible}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default VideoShowroom;
