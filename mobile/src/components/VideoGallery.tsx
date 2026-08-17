// Video Gallery Component - AlgeriaTrade Mobile
// Composant de galerie vidéo avec support 360°

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Types & Interfaces
// ============================================

export type VideoType = 
  | 'product_demo'
  | 'factory_tour'
  | 'testimonial'
  | 'tutorial'
  | 'company_intro'
  | 'production_line'
  | 'ceo_message'
  | 'featured';

export type TourType = 'factory' | 'office' | 'showroom' | 'warehouse';

interface ProductVideo {
  id: string;
  title: string;
  description?: string;
  type: VideoType;
  url: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  viewCount: number;
  isPrimary: boolean;
  language?: 'fr' | 'ar' | 'en';
  createdAt: Date;
}

interface VirtualTour {
  id: string;
  title: string;
  description?: string;
  type: TourType;
  tourUrl: string;
  coverImage: string;
  hotspots: Array<{
    id: string;
    position: { x: number; y: number };
    title: string;
    targetSceneId: string;
  }>;
  viewCount: number;
  duration?: number; // estimated tour duration in minutes
}

interface VideoGalleryProps {
  videos: ProductVideo[];
  tours?: VirtualTour[];
  onVideoPress?: (video: ProductVideo) => void;
  onTourPress?: (tour: VirtualTour) => void;
  showDownloadButton?: boolean;
  showCastButton?: boolean;
  compact?: boolean;
  autoPlay?: boolean;
}

// ============================================
// Constants
// ============================================

const VIDEO_TYPE_CONFIG: Record<VideoType, { label: string; icon: string; color: string }> = {
  product_demo: { label: 'Démo produit', icon: 'cube-outline', color: Colors.primary },
  factory_tour: { label: 'Visite usine', icon: 'business-outline', color: Colors.info },
  testimonial: { label: 'Témoignage', icon: 'people-outline', color: Colors.success },
  tutorial: { label: 'Tutoriel', icon: 'play-circle-outline', color: Colors.warning },
  company_intro: { label: 'Présentation', icon: 'information-circle-outline', color: '#8B5CF6' },
  production_line: { label: 'Ligne de production', icon: 'cog-outline', color: Colors.error },
  ceo_message: { label: 'Message PDG', icon: 'mic-outline', color: Colors.secondary },
  featured: { label: 'En vedette', icon: 'star', color: '#F59E0B' },
};

const TOUR_TYPE_CONFIG: Record<TourType, { label: string; icon: string }> = {
  factory: { label: 'Usine', icon: 'business-outline' },
  office: { label: 'Bureau', icon: 'desktop-outline' },
  showroom: { label: 'Showroom', icon: 'storefront-outline' },
  warehouse: { label: 'Entrepôt', icon: 'grid-outline' },
};

// ============================================
// Sub-Components
// ============================================

// Video Player Modal
function VideoPlayerModal({ 
  video, 
  visible, 
  onClose, 
  onDownload,
  onCast,
}: { 
  video: ProductVideo | null; 
  visible: boolean; 
  onClose: () => void;
  onDownload?: () => void;
  onCast?: () => void;
}) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setIsPlaying(status.isPlaying);
    setDuration(status.durationMillis || 0);
    setPlaybackPosition(status.positionMillis || 0);
    setIsLoading(false);
    
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  const seekForward = async () => {
    if (!videoRef.current) return;
    const newPosition = Math.min(playbackPosition + 10000, duration);
    await videoRef.current.setPositionAsync(newPosition);
  };

  const seekBackward = async () => {
    if (!videoRef.current) return;
    const newPosition = Math.max(playbackPosition - 10000, 0);
    await videoRef.current.setPositionAsync(newPosition);
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    if (!video) return;
    try {
      await Share.share({
        message: `Regardez cette vidéo sur AlgeriaTrade: ${video.title}`,
        url: video.url,
      });
    } catch (error) {
      console.error('[VideoGallery] Error sharing:', error);
    }
  };

  if (!video) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.playerContainer}>
        {/* Video */}
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: video.url }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            isMuted={isMuted}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Center Play Button */}
          {!isPlaying && !isLoading && (
            <TouchableOpacity style={styles.centerPlayButton} onPress={togglePlayPause}>
              <Ionicons name="play" size={48} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Video Info */}
        <View style={styles.videoInfoContainer}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          
          {video.description && (
            <Text style={styles.videoDescription} numberOfLines={2}>
              {video.description}
            </Text>
          )}

          <View style={styles.videoMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {(video.viewCount / 1000).toFixed(1)}K vues
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {formatTime(video.duration * 1000)}
              </Text>
            </View>
            {VIDEO_TYPE_CONFIG[video.type] && (
              <View style={[styles.typeBadge, { backgroundColor: VIDEO_TYPE_CONFIG[video.type].color + '20' }]}>
                <Ionicons 
                  name={VIDEO_TYPE_CONFIG[video.type].icon as any} 
                  size={12} 
                  color={VIDEO_TYPE_CONFIG[video.type].color} 
                />
                <Text style={[styles.typeBadgeText, { color: VIDEO_TYPE_CONFIG[video.type].color }]}>
                  {VIDEO_TYPE_CONFIG[video.type].label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${duration > 0 ? (playbackPosition / duration) * 100 : 0}%` }
              ]} 
            />
          </View>
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>{formatTime(playbackPosition)}</Text>
            <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.bottomControlButton} onPress={seekBackward}>
            <Ionicons name="play-back" size={24} color={Colors.text} />
            <Text style={styles.controlLabel}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={32} 
              color={Colors.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomControlButton} onPress={seekForward}>
            <Ionicons name="play-forward" size={24} color={Colors.text} />
            <Text style={styles.controlLabel}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomControlButton} onPress={toggleMute}>
            <Ionicons 
              name={isMuted ? 'volume-mute' : 'volume-high'} 
              size={24} 
              color={Colors.text} 
            />
          </TouchableOpacity>

          {onDownload && (
            <TouchableOpacity style={styles.bottomControlButton} onPress={onDownload}>
              <Ionicons name="download-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}

          {onCast && (
            <TouchableOpacity style={styles.bottomControlButton} onPress={onCast}>
              <Ionicons name="tv-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Virtual Tour Viewer
function VirtualTourViewer({
  tour,
  visible,
  onClose,
}: {
  tour: VirtualTour | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [showHotspots, setShowHotspots] = useState(true);

  if (!tour) return null;

  // In a real implementation, this would use a 360° viewer library
  // like react-native-360 or similar
  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.tourContainer}>
        {/* Header */}
        <View style={styles.tourHeader}>
          <TouchableOpacity style={styles.tourBackButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.tourHeaderInfo}>
            <Text style={styles.tourTitle}>{tour.title}</Text>
            <Text style={styles.tourSubtitle}>
              {TOUR_TYPE_CONFIG[tour.type]?.label || 'Visite virtuelle'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.hotspotToggle}
            onPress={() => setShowHotspots(!showHotspots)}
          >
            <Ionicons 
              name={showHotspots ? 'location' : 'location-outline'} 
              size={24} 
              color={showHotspots ? Colors.primary : Colors.textTertiary} 
            />
          </TouchableOpacity>
        </View>

        {/* 360° View Placeholder */}
        <View style={styles.tourViewer}>
          <Image 
            source={{ uri: tour.coverImage }} 
            style={styles.tourCoverImage}
            resizeMode="cover"
          />
          
          {/* 360° Indicator */}
          <View style={styles.indicator360}>
            <Ionicons name="globe-outline" size={20} color={Colors.white} />
            <Text style={styles.indicator360Text}>Vue 360°</Text>
          </View>

          {/* Hotspots */}
          {showHotspots && tour.hotspots.map(hotspot => (
            <TouchableOpacity
              key={hotspot.id}
              style={[
                styles.hotspot,
                { left: hotspot.position.x, top: hotspot.position.y }
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.hotspotOuter}>
                <View style={styles.hotspotInner} />
              </View>
              <Text style={styles.hotspotLabel}>{hotspot.title}</Text>
            </TouchableOpacity>
          ))}

          {/* Navigation Arrows */}
          <TouchableOpacity 
            style={[styles.navArrow, styles.navArrowLeft]}
            onPress={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
          >
            <Ionicons name="chevron-back" size={32} color={Colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navArrow, styles.navArrowRight]}
            onPress={() => setCurrentSceneIndex(currentSceneIndex + 1)}
          >
            <Ionicons name="chevron-forward" size={32} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Tour Info */}
        <View style={styles.tourInfo}>
          {tour.description && (
            <Text style={styles.tourDescription}>{tour.description}</Text>
          )}
          
          <View style={styles.tourStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.statText}>
                {(tour.viewCount / 1000).toFixed(1)}K vues
              </Text>
            </View>
            {tour.duration && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.statText}>~{tour.duration} min</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons name="navigate-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.statText}>{tour.hotspots.length} points d'intérêt</Text>
            </View>
          </View>

          {/* Scene Indicators */}
          <View style={styles.sceneIndicators}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.sceneDot,
                  index === currentSceneIndex && styles.sceneDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// Main Component
// ============================================

export default function VideoGallery({
  videos,
  tours = [],
  onVideoPress,
  onTourPress,
  showDownloadButton = true,
  showCastButton = false,
  compact = false,
  autoPlay = false,
}: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<ProductVideo | null>(null);
  const [selectedTour, setSelectedTour] = useState<VirtualTour | null>(null);
  const [activeTab, setActiveTab] = useState<'videos' | 'tours'>('videos');

  const handleVideoPress = (video: ProductVideo) => {
    if (onVideoPress) {
      onVideoPress(video);
    } else {
      setSelectedVideo(video);
    }
  };

  const handleTourPress = (tour: VirtualTour) => {
    if (onTourPress) {
      onTourPress(tour);
    } else {
      setSelectedTour(tour);
    }
  };

  const handleDownload = async (video: ProductVideo) => {
    Alert.alert(
      'Téléchargement',
      `Voulez-vous télécharger "${video.title}" pour le visionnage hors ligne ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Télécharger', onPress: () => {
          // In a real app, this would download using FileSystem or similar
          Alert.alert('Succès', 'Le téléchargement va commencer.');
        }}
      ]
    );
  };

  const handleCast = () => {
    Alert.alert(
      'Casting',
      'Sélectionnez un appareil pour caster la vidéo.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Chromecast', onPress: () => {
          Alert.alert('Connexion', 'Connexion à Chromecast...');
        }},
        { text: 'Apple TV', onPress: () => {
          Alert.alert('Connexion', 'Connexion à Apple TV...');
        }}
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: ProductVideo }) => {
    const typeConfig = VIDEO_TYPE_CONFIG[item.type];
    
    if (compact) {
      return (
        <TouchableOpacity
          style={styles.compactVideoItem}
          onPress={() => handleVideoPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.compactThumbnailContainer}>
            <Image source={{ uri: item.thumbnailUrl }} style={styles.compactThumbnail} />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={36} color={Colors.white} />
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.compactViews}>
              {(item.viewCount / 1000).toFixed(1)}K vues
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
          
          {/* Play Button Overlay */}
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={48} color={Colors.white} />
          </View>

          {/* Duration Badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Primary Badge */}
          {item.isPrimary && (
            <View style={styles.primaryBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.primaryBadgeText}>Principal</Text>
            </View>
          )}

          {/* Type Badge */}
          {typeConfig && (
            <View style={[styles.typeOverlayBadge, { backgroundColor: typeConfig.color }]}>
              <Ionicons name={typeConfig.icon as any} size={12} color={Colors.white} />
              <Text style={styles.typeOverlayText}>{typeConfig.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.videoCardContent}>
          <Text style={styles.videoCardTitle} numberOfLines={2}>{item.title}</Text>
          
          {item.description && (
            <Text style={styles.videoCardDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}

          <View style={styles.videoCardMeta}>
            <Text style={styles.videoCardViews}>
              {(item.viewCount / 1000).toFixed(1)}K vues
            </Text>
            <View style={styles.videoCardActions}>
              {showDownloadButton && (
                <TouchableOpacity 
                  style={styles.cardActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                >
                  <Ionicons name="download-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
              {showCastButton && (
                <TouchableOpacity 
                  style={styles.cardActionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCast();
                  }}
                >
                  <Ionicons name="tv-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTourItem = ({ item }: { item: VirtualTour }) => {
    const tourConfig = TOUR_TYPE_CONFIG[item.type];

    return (
      <TouchableOpacity
        style={styles.tourCard}
        onPress={() => handleTourPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tourCardImageContainer}>
          <Image source={{ uri: item.coverImage }} style={styles.tourCardImage} />
          
          {/* 360° Badge */}
          <View style={styles.badge360}>
            <Ionicons name="globe-outline" size={14} color={Colors.white} />
            <Text style={styles.badge360Text}>360°</Text>
          </View>

          {/* Tour Type */}
          {tourConfig && (
            <View style={styles.tourTypeBadge}>
              <Ionicons name={tourConfig.icon as any} size={12} color={Colors.white} />
              <Text style={styles.tourTypeText}>{tourConfig.label}</Text>
            </View>
          )}

          {/* Hotspots Count */}
          <View style={styles.hotspotsCount}>
            <Ionicons name="location" size={12} color={Colors.white} />
            <Text style={styles.hotspotsCountText}>{item.hotspots.length}</Text>
          </View>
        </View>

        <View style={styles.tourCardContent}>
          <Text style={styles.tourCardTitle} numberOfLines={1}>{item.title}</Text>
          
          {item.description && (
            <Text style={styles.tourCardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.tourCardMeta}>
            <Text style={styles.tourCardViews}>
              {(item.viewCount / 1000).toFixed(1)}K vues
            </Text>
            {item.duration && (
              <Text style={styles.tourDuration}>~{item.duration} min</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Compact mode - horizontal list
  if (compact) {
    return (
      <>
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactList}
        />
        
        <VideoPlayerModal
          video={selectedVideo}
          visible={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDownload={() => selectedVideo && handleDownload(selectedVideo)}
          onCast={showCastButton ? handleCast : undefined}
        />

        <VirtualTourViewer
          tour={selectedTour}
          visible={!!selectedTour}
          onClose={() => setSelectedTour(null)}
        />
      </>
    );
  }

  // Full gallery with tabs
  return (
    <View style={styles.container}>
      {/* Tabs */}
      {(tours.length > 0 && videos.length > 0) && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
            onPress={() => setActiveTab('videos')}
          >
            <Ionicons 
              name="videocam-outline" 
              size={18} 
              color={activeTab === 'videos' ? Colors.primary : Colors.textTertiary} 
            />
            <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
              Vidéos ({videos.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tours' && styles.activeTab]}
            onPress={() => setActiveTab('tours')}
          >
            <Ionicons 
              name="globe-outline" 
              size={18} 
              color={activeTab === 'tours' ? Colors.primary : Colors.textTertiary} 
            />
            <Text style={[styles.tabText, activeTab === 'tours' && styles.activeTabText]}>
              Visites 360° ({tours.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {activeTab === 'videos' ? (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.videosGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Aucune vidéo disponible</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={tours}
          renderItem={renderTourItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.toursList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="globe-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Aucune visite virtuelle disponible</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <VideoPlayerModal
        video={selectedVideo}
        visible={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onDownload={() => selectedVideo && handleDownload(selectedVideo)}
        onCast={showCastButton ? handleCast : undefined}
      />

      <VirtualTourViewer
        tour={selectedTour}
        visible={!!selectedTour}
        onClose={() => setSelectedTour(null)}
      />
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: Colors.primary + '15',
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textTertiary,
    fontFamily: FontFamily.medium,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Videos Grid
  videosGrid: {
    padding: Spacing.md,
  },
  videoCard: {
    width: (SCREEN_WIDTH - Spacing.md * 3) / 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    marginRight: Spacing.md % 2 !== 0 ? 0 : undefined,
    ...Shadows.sm,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 120,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  primaryBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  primaryBadgeText: {
    fontSize: FontSize.xs,
    color: '#F59E0B',
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  typeOverlayBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  typeOverlayText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  videoCardContent: {
    padding: Spacing.sm,
  },
  videoCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
    lineHeight: 16,
  },
  videoCardDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.xs,
  },
  videoCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoCardViews: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  videoCardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardActionButton: {
    padding: Spacing.xs,
  },

  // Tours List
  toursList: {
    padding: Spacing.md,
  },
  tourCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  tourCardImageContainer: {
    width: 140,
    height: 100,
    position: 'relative',
  },
  tourCardImage: {
    width: '100%',
    height: '100%',
  },
  badge360: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  badge360Text: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  tourTypeBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  tourTypeText: {
    fontSize: 10,
    color: Colors.white,
    fontFamily: FontFamily.regular,
  },
  hotspotsCount: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  hotspotsCountText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  tourCardContent: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  tourCardTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.xs,
  },
  tourCardDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.xs,
  },
  tourCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tourCardViews: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  tourDuration: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },

  // Compact Mode
  compactList: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  compactVideoItem: {
    width: 160,
    marginRight: Spacing.md,
  },
  compactThumbnailContainer: {
    position: 'relative',
    height: 90,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  compactThumbnail: {
    width: '100%',
    height: '100%',
  },
  compactInfo: {
    marginTop: Spacing.xs,
  },
  compactTitle: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    lineHeight: 14,
  },
  compactViews: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Video Player Modal
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWrapper: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoPlayer: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: Spacing.md,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 98, 51, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  videoInfoContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  videoTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.xs,
  },
  videoDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.sm,
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bottomControlButton: {
    alignItems: 'center',
    padding: Spacing.xs,
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  controlLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Virtual Tour Viewer
  tourContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  tourBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  tourTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  tourSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  hotspotToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourViewer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  tourCoverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator360: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  indicator360Text: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  hotspot: {
    position: 'absolute',
    alignItems: 'center',
  },
  hotspotOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '80',
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  hotspotLabel: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowLeft: {
    left: Spacing.sm,
  },
  navArrowRight: {
    right: Spacing.sm,
  },
  tourInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
  },
  tourDescription: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  tourStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  sceneIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sceneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
  },
  sceneDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
});
