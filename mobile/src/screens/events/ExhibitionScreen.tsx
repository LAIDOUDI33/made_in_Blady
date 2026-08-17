// Exhibition Screen - AlgeriaTrade Mobile
// Écran des expositions et événements B2B

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';

// Services
import apiService from '../../services/api';
import { offlineService, useOfflineStatus } from '../../services/offline';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type ExhibitionRouteProp = RouteProp<RootStackParamList, 'Exhibition'>;

// ============================================
// Types & Interfaces
// ============================================

export type ExhibitionType =
  | 'virtual_trade_show'
  | 'industry_event'
  | 'product_launch'
  | 'procurement_event'
  | 'networking_event'
  | 'conference';

export type ExhibitionStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';

export type RegistrationType = 'visitor' | 'exhibitor' | 'speaker' | 'press';

interface ExhibitionEvent {
  id: string;
  exhibitionId: string;
  title: string;
  description?: string;
  type: 'seminar' | 'workshop' | 'keynote' | 'networking_session' | 'demo' | 'presentation';
  startTime: Date;
  endTime: Date;
  speakers?: Array<{ name: string; company?: string; photoUrl?: string }>;
  capacity: number;
  registeredCount: number;
  location?: string; // For physical events - room/hall name
  recordingUrl?: string;
}

interface ExhibitionBooth {
  id: string;
  exhibitionId: string;
  boothNumber: string;
  companyName: string;
  companyLogo?: string;
  bannerImage?: string;
  description?: string;
  products: Array<{ id: string; name: string; image?: string }>;
  staffIds: string[];
  welcomeMessage?: string;
  website?: string;
  contactEmail?: string;
  isVirtual: boolean;
  arAvailable: boolean;
  visitorCount: number;
}

interface Exhibition {
  id: string;
  title: string;
  description: string;
  type: ExhibitionType;
  status: ExhibitionStatus;
  startDate: Date;
  endDate: Date;
  coverImage?: string;
  logo?: string;
  isVirtual: boolean;
  isPhysical: boolean;
  location?: {
    venue: string;
    address: string;
    city: string;
    wilaya: string;
  };
  virtualPlatform?: string;
  maxExhibitors: number;
  maxVisitors: number;
  currentExhibitors: number;
  currentVisitors: number;
  registrationFee?: number;
  currency?: string;
  featured: boolean;
  organizerName: string;
  organizerLogo?: string;
  themeColor?: string;
  booths?: ExhibitionBooth[];
  events?: ExhibitionEvent[];
  userRegistration?: {
    id: string;
    type: RegistrationType;
    status: 'registered' | 'checked_in' | 'attended' | 'cancelled';
    registeredAt: Date;
    checkedInAt?: Date;
  };
}

interface ExhibitionScreenProps {
  exhibitionId?: string;
}

// ============================================
// Constants
// ============================================

const EXHIBITION_TYPE_CONFIG: Record<ExhibitionType, { 
  label: string; 
  icon: string; 
  color: string;
}> = {
  virtual_trade_show: { label: 'Salon virtuel', icon: 'globe-outline', color: Colors.primary },
  industry_event: { label: 'Événement sectoriel', icon: 'business-outline', color: Colors.info },
  product_launch: { label: 'Lancement produit', icon: 'rocket-outline', color: Colors.warning },
  procurement_event: { label: 'Événement achats', icon: 'cart-outline', color: Colors.success },
  networking_event: { label: 'Networking', icon: 'people-outline', color: '#8B5CF6' },
  conference: { label: 'Conférence', icon: 'mic-outline', color: Colors.secondary },
};

const REGISTRATION_TYPES: Array<{ value: RegistrationType; label: string; description: string; price: string }> = [
  { value: 'visitor', label: 'Visiteur', description: 'Accès aux exposants et conférences', price: 'Gratuit' },
  { value: 'exhibitor', label: 'Exposant', description: 'Stand virtuel avec produits', price: 'Sur devis' },
  { value: 'speaker', label: 'Conférencier', description: 'Présentation lors de l\'événement', price: 'Sur invitation' },
  { value: 'press', label: 'Presse', description: 'Accès presse et interviews', price: 'Sur demande' },
];

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  seminar: { label: 'Séminaire', icon: 'school-outline', color: Colors.primary },
  workshop: { label: 'Atelier', icon: 'construct-outline', color: Colors.info },
  keynote: { label: 'Conférence principale', icon: 'mic-outline', color: Colors.warning },
  networking_session: { label: 'Session networking', icon: 'people-outline', color: Colors.success },
  demo: { label: 'Démonstration', icon: 'play-circle-outline', color: '#8B5CF6' },
  presentation: { label: 'Présentation', icon: 'desktop-outline', color: Colors.secondary },
};

// ============================================
// Main Component
// ============================================

export default function ExhibitionScreen(props: ExhibitionScreenProps) {
  const route = useRoute<ExhibitionRouteProp>();
  const navigation = useNavigation();
  
  const exhibitionId = props.exhibitionId || (route.params?.id as string);
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedRegistrationType, setSelectedRegistrationType] = useState<RegistrationType>('visitor');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [interests, setInterests] = useState('');
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'booths' | 'events' | 'networking'>('info');
  const [isOffline] = useOfflineStatus();

  // Load exhibitions or single exhibition
  const loadData = useCallback(async () => {
    try {
      if (exhibitionId) {
        const data = await apiService.getExhibitionDetail(exhibitionId);
        setSelectedExhibition(data);
      } else {
        const data = await apiService.getExhibitions();
        setExhibitions(data);
        
        // Cache for offline
        if (!isOffline) {
          await offlineService.cacheExhibitions(data);
        }
      }
    } catch (error) {
      console.error('[ExhibitionScreen] Error loading data:', error);
      
      // Try cache if offline
      if (isOffline || !exhibitionId) {
        const cached = await offlineService.getCachedExhibitions();
        if (cached.length > 0) {
          if (exhibitionId) {
            setSelectedExhibition(cached.find(e => e.id === exhibitionId) || null);
          } else {
            setExhibitions(cached);
          }
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [exhibitionId, isOffline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Register for exhibition
  const handleRegister = async () => {
    if (!selectedExhibition) return;

    setRegistering(true);

    try {
      await apiService.registerForExhibition(selectedExhibition.id, {
        type: selectedRegistrationType,
        companyName: companyName || undefined,
        jobTitle: jobTitle || undefined,
        interests: interests || undefined,
      });

      Alert.alert(
        'Inscription confirmée !',
        `Vous êtes inscrit en tant que ${REGISTRATION_TYPES.find(r => r.value === selectedRegistrationType)?.label}.`,
        [{ text: 'OK', onPress: () => {
          setShowRegistrationModal(false);
          loadData(); // Reload to show registration status
        }}]
      );
    } catch (error) {
      console.error('[ExhibitionScreen] Error registering:', error);
      Alert.alert('Erreur', 'Impossible de finaliser l\'inscription.');
    } finally {
      setRegistering(false);
    }
  };

  // Schedule meeting with exhibitor
  const handleScheduleMeeting = (booth: ExhibitionBooth) => {
    Alert.alert(
      'Planifier une réunion',
      `Souhaitez-vous planifier une réunion avec ${booth.companyName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => {
          navigation.navigate('Messages' as any, {
            conversationId: `exhibition_${selectedExhibition?.id}_${booth.id}`,
            userName: booth.companyName,
          });
        }}
      ]
    );
  };

  // Format date range
  const formatDateRange = (start: Date, end: Date): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    return `${startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  // Render loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // List view (no specific exhibition selected)
  if (!exhibitionId && !selectedExhibition) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expositions & Événements</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={exhibitions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exhibitionCard}
              onPress={() => setSelectedExhibition(item)}
              activeOpacity={0.7}
            >
              {/* Cover Image */}
              <View style={styles.cardImageContainer}>
                {item.coverImage ? (
                  <Image source={{ uri: item.coverImage }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImagePlaceholder, { backgroundColor: EXHIBITION_TYPE_CONFIG[item.type]?.color + '20' }]}>
                    <Ionicons 
                      name={EXHIBITION_TYPE_CONFIG[item.type]?.icon as any} 
                      size={48} 
                      color={EXHIBITION_TYPE_CONFIG[item.type]?.color} 
                    />
                  </View>
                )}
                
                {/* Status Badge */}
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.status === 'live' ? Colors.error : item.status === 'upcoming' ? Colors.primary : Colors.textTertiary }
                ]}>
                  <Text style={styles.statusText}>
                    {item.status === 'live' ? 'EN DIRECT' : item.status === 'upcoming' ? 'À VENIR' : 'TERMINÉ'}
                  </Text>
                </View>

                {/* Featured Badge */}
                {item.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.featuredBadgeText}>En vedette</Text>
                  </View>
                )}

                {/* Type Badge */}
                <View style={[styles.typeBadge, { backgroundColor: EXHIBITION_TYPE_CONFIG[item.type]?.color }]}>
                  <Text style={styles.typeBadgeText}>
                    {EXHIBITION_TYPE_CONFIG[item.type]?.label}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {formatDateRange(item.startDate, item.endDate)}
                    </Text>
                  </View>
                  
                  {item.location && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.location.city}, {item.location.wilaya}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="storefront-outline" size={14} color={Colors.textTertiary} />
                      <Text style={styles.statText}>
                        {item.currentExhibitors}/{item.maxExhibitors} exposants
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="people-outline" size={14} color={Colors.textTertiary} />
                      <Text style={styles.statText}>
                        {item.currentVisitors?.toLocaleString() || '0'} visiteurs
                      </Text>
                    </View>
                  </View>

                  {!item.userRegistration && item.status === 'upcoming' && (
                    <TouchableOpacity 
                      style={styles.registerButton}
                      onPress={() => {
                        setSelectedExhibition(item);
                        setShowRegistrationModal(true);
                      }}
                    >
                      <Text style={styles.registerButtonText}>S'inscrire</Text>
                    </TouchableOpacity>
                  )}

                  {item.userRegistration && (
                    <View style={styles.registeredBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.registeredText}>Inscrit</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Aucun événement</Text>
              <Text style={styles.emptySubtitle}>
                Revenez plus tard pour découvrir les prochaines expositions.
              </Text>
            </View>
          }
        />

        {/* Registration Modal */}
        <RegistrationModal
          visible={showRegistrationModal}
          exhibition={selectedExhibition}
          onClose={() => setShowRegistrationModal(false)}
          onRegister={handleRegister}
          loading={registering}
        />
      </View>
    );
  }

  // Detail view (single exhibition)
  if (!selectedExhibition) return null;

  const typeConfig = EXHIBITION_TYPE_CONFIG[selectedExhibition.type];

  return (
    <View style={styles.container}>
      {/* Header with Cover */}
      <View style={styles.detailHeaderContainer}>
        {selectedExhibition.coverImage ? (
          <Image source={{ uri: selectedExhibition.coverImage }} style={styles.detailCoverImage} />
        ) : (
          <View style={[styles.detailCoverPlaceholder, { backgroundColor: typeConfig?.color + '30' }]}>
            <Ionicons name={typeConfig?.icon as any} size={64} color={typeConfig?.color} />
          </View>
        )}
        
        <View style={styles.detailHeaderOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (exhibitionId) {
                navigation.goBack();
              } else {
                setSelectedExhibition(null);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.detailHeaderActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="share-social-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="heart-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} />
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.badgesRow}>
          <View style={[
            styles.detailTypeBadge, 
            { backgroundColor: typeConfig?.color }
          ]}>
            <Text style={styles.detailTypeBadgeText}>{typeConfig?.label}</Text>
          </View>
          
          <View style={[
            styles.detailStatusBadge,
            { 
              backgroundColor: selectedExhibition.status === 'live' 
                ? Colors.error 
                : selectedExhibition.status === 'upcoming' 
                  ? Colors.success 
                  : Colors.textTertiary 
            }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: selectedExhibition.status === 'live' ? Colors.error : Colors.success }
            ]} />
            <Text style={styles.detailStatusText}>
              {selectedExhibition.status === 'live' ? 'En direct' : selectedExhibition.status === 'upcoming' ? 'À venir' : 'Terminé'}
            </Text>
          </View>
        </View>

        <Text style={styles.detailTitle}>{selectedExhibition.title}</Text>
        
        <Text style={styles.detailOrganizer}>
          Organisé par {selectedExhibition.organizerName}
        </Text>

        <View style={styles.dateLocationRow}>
          <View style={styles.dateLocationItem}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.dateLocationText}>
              {formatDateRange(selectedExhibition.startDate, selectedExhibition.endDate)}
            </Text>
          </View>
          
          {selectedExhibition.location && (
            <View style={styles.dateLocationItem}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateLocationText} numberOfLines={1}>
                {selectedExhibition.location.venue}, {selectedExhibition.location.city}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{selectedExhibition.currentExhibitors}</Text>
          <Text style={styles.statLabel}>Exposants</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{selectedExhibition.currentVisitors?.toLocaleString() || '0'}</Text>
          <Text style={styles.statLabel}>Visiteurs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{selectedExhibition.events?.length || 0}</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['info', 'booths', 'events', 'networking'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'info' ? 'Info' : tab === 'booths' ? 'Exposants' : tab === 'events' ? 'Programme' : 'Network'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'info' && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{selectedExhibition.description}</Text>

            {selectedExhibition.registrationFee !== undefined && (
              <View style={styles.feeSection}>
                <Text style={styles.sectionTitle}>Tarifs d'inscription</Text>
                <FlatList
                  data={REGISTRATION_TYPES.filter(t => t.value !== 'speaker')}
                  keyExtractor={(item) => item.value}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.feeItem}>
                      <Text style={styles.feeTypeLabel}>{item.label}</Text>
                      <Text style={styles.feePrice}>{item.price}</Text>
                    </View>
                  )}
                />
              </View>
            )}

            {/* CTA Button */}
            {!selectedExhibition.userRegistration && selectedExhibition.status === 'upcoming' && (
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => setShowRegistrationModal(true)}
              >
                <Ionicons name="person-add-outline" size={20} color={Colors.white} />
                <Text style={styles.ctaButtonText}>S'inscrire à l'événement</Text>
              </TouchableOpacity>
            )}

            {selectedExhibition.userRegistration && (
              <View style={styles.alreadyRegistered}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <View style={styles.registeredInfo}>
                  <Text style={styles.registeredTitle}>Vous êtes inscrit !</Text>
                  <Text style={styles.registeredType}>
                    En tant que {REGISTRATION_TYPES.find(r => r.value === selectedExhibition.userRegistration?.type)?.label}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'booths' && (
          <View style={styles.boothsSection}>
            <Text style={styles.sectionTitle}>
              Exposants ({selectedExhibition.booths?.length || 0})
            </Text>
            
            {selectedExhibition.booths?.map(booth => (
              <TouchableOpacity
                key={booth.id}
                style={styles.boothCard}
                activeOpacity={0.7}
              >
                <View style={styles.boothHeader}>
                  <View style={styles.boothCompanyInfo}>
                    {booth.companyLogo ? (
                      <Image source={{ uri: booth.companyLogo }} style={styles.companyLogo} />
                    ) : (
                      <View style={styles.companyLogoPlaceholder}>
                        <Ionicons name="business-outline" size={24} color={Colors.textTertiary} />
                      </View>
                    )}
                    <View>
                      <Text style={styles.companyName}>{booth.companyName}</Text>
                      <Text style={styles.boothNumber}>Stand {booth.boothNumber}</Text>
                    </View>
                  </View>
                  
                  {booth.arAvailable && (
                    <View style={styles.arBadge}>
                      <Ionicons name="cube-outline" size={12} color={Colors.white} />
                      <Text style={styles.arBadgeText}>AR</Text>
                    </View>
                  )}
                </View>

                {booth.bannerImage && (
                  <Image source={{ uri: booth.bannerImage }} style={styles.boothBanner} />
                )}

                {booth.welcomeMessage && (
                  <Text style={styles.welcomeMessage} numberOfLines={2}>
                    "{booth.welcomeMessage}"
                  </Text>
                )}

                {booth.products.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
                    {booth.products.map(product => (
                      <View key={product.id} style={styles.productChip}>
                        {product.image ? (
                          <Image source={{ uri: product.image }} style={styles.productImage} />
                        ) : null}
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.boothFooter}>
                  <View style={styles.visitorCount}>
                    <Ionicons name="eye-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.visitorCountText}>
                      {booth.visitorCount} visiteurs
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.meetingButton}
                    onPress={() => handleScheduleMeeting(booth)}
                  >
                    <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                    <Text style={styles.meetingButtonText}>Réunion</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )) || (
              <View style={styles.emptySection}>
                <Ionicons name="storefront-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Aucun exposant pour le moment</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'events' && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>
              Programme ({selectedExhibition.events?.length || 0})
            </Text>
            
            {selectedExhibition.events?.map((event, index) => {
              const eventTypeConfig = EVENT_TYPE_CONFIG[event.type];
              
              return (
                <TouchableOpacity key={event.id} style={styles.eventCard}>
                  <View style={styles.eventTimeColumn}>
                    <Text style={styles.eventStartTime}>
                      {new Date(event.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.eventEndTime}>
                      {new Date(event.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDivider} />
                  
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeaderRow}>
                      <View style={[
                        styles.eventTypeBadge,
                        { backgroundColor: eventTypeConfig?.color + '20' }
                      ]}>
                        <Ionicons 
                          name={eventTypeConfig?.icon as any} 
                          size={12} 
                          color={eventTypeConfig?.color} 
                        />
                        <Text style={[styles.eventTypeText, { color: eventTypeConfig?.color }]}>
                          {eventTypeConfig?.label}
                        </Text>
                      </View>
                      
                      <Text style={styles.eventCapacity}>
                        {event.registeredCount}/{event.capacity} places
                      </Text>
                    </View>
                    
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    
                    {event.speakers && event.speakers.length > 0 && (
                      <View style={styles.speakersRow}>
                        {event.speakers.slice(0, 3).map((speaker, idx) => (
                          <View key={idx} style={styles.speakerItem}>
                            {speaker.photoUrl ? (
                              <Image source={{ uri: speaker.photoUrl }} style={styles.speakerPhoto} />
                            ) : (
                              <View style={styles.speakerPhotoPlaceholder}>
                                <Ionicons name="person" size={12} color={Colors.white} />
                              </View>
                            )}
                            <Text style={styles.speakerName}>{speaker.name}</Text>
                          </View>
                        ))}
                        {event.speakers.length > 3 && (
                          <Text style={styles.moreSpeakers}>+{event.speakers.length - 3}</Text>
                        )}
                      </View>
                    )}
                    
                    {event.location && (
                      <View style={styles.eventLocation}>
                        <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                        <Text style={styles.eventLocationText}>{event.location}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }) || (
              <View style={styles.emptySection}>
                <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Aucun événement programmé</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'networking' && (
          <View style={styles.networkingSection}>
            <Text style={styles.sectionTitle}>Fonctionnalités Networking</Text>
            
            <View style={styles.networkingFeatures}>
              <TouchableOpacity style={styles.networkingFeature}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="people-outline" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Participants</Text>
                <Text style={styles.featureDescription}>
                  Découvrez les autres participants et connectez-vous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.networkingFeature}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="chatbubbles-outline" size={28} color={Colors.info} />
                </View>
                <Text style={styles.featureTitle}>Chat en direct</Text>
                <Text style={styles.featureDescription}>
                  Discutez avec les exposants et autres visiteurs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.networkingFeature}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="swap-vertical-outline" size={28} color={Colors.success} />
                </View>
                <Text style={styles.featureTitle}>B2B Meetings</Text>
                <Text style={styles.featureDescription}>
                  Planifiez des réunions d'affaires avec les exposants
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.networkingFeature}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name="card-outline" size={28} color={Colors.warning} />
                </View>
                <Text style={styles.featureTitle}>Carte de visite</Text>
                <Text style={styles.featureDescription}>
                  Échangez vos coordonnées numériquement
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Registration Modal */}
      <RegistrationModal
        visible={showRegistrationModal}
        exhibition={selectedExhibition}
        onClose={() => setShowRegistrationModal(false)}
        onRegister={handleRegister}
        loading={registering}
      />
    </View>
  );
}

// ============================================
// Sub-Components
// ============================================

function RegistrationModal({
  visible,
  exhibition,
  onClose,
  onRegister,
  loading,
}: {
  visible: boolean;
  exhibition: Exhibition | null;
  onClose: () => void;
  onRegister: () => void;
  loading: boolean;
}) {
  const [selectedType, setSelectedType] = useState<RegistrationType>('visitor');
  const [company, setCompany] = useState('');
  const [job, setJob] = useState('');
  const [interest, setInterest] = useState('');

  if (!exhibition) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.registrationModal}>
          <View style={styles.registrationHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.registrationTitle}>Inscription</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.exhibitionName}>{exhibition.title}</Text>

          <Text style={styles.selectTypeLabel}>Type d'inscription</Text>
          
          {REGISTRATION_TYPES.map(type => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.registrationTypeOption,
                selectedType === type.value && styles.registrationTypeSelected
              ]}
              onPress={() => setSelectedType(type.value)}
            >
              <View style={[
                styles.typeRadio,
                selectedType === type.value && styles.typeRadioSelected
              ]}>
                {selectedType === type.value && (
                  <View style={styles.typeRadioInner} />
                )}
              </View>
              <View style={styles.typeContent}>
                <Text style={styles.typeName}>{type.label}</Text>
                <Text style={styles.typeDesc}>{type.description}</Text>
              </View>
              <Text style={styles.typePrice}>{type.price}</Text>
            </TouchableOpacity>
          ))}

          {(selectedType === 'exhibitor' || selectedType === 'speaker') && (
            <>
              <TextInput
                style={styles.regInput}
                value={company}
                onChangeText={setCompany}
                placeholder="Nom de l'entreprise"
                placeholderTextColor={Colors.textTertiary}
              />
              <TextInput
                style={styles.regInput}
                value={job}
                onChangeText={setJob}
                placeholder="Poste / Fonction"
                placeholderTextColor={Colors.textTertiary}
              />
            </>
          )}

          <TextInput
            style={[styles.regInput, styles.regTextArea]}
            value={interest}
            onChangeText={setInterest}
            placeholder="Centres d'intérêt (optionnel)"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={onRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmer l'inscription</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Import RefreshControl
import { RefreshControl } from 'react-native-gesture-handler';

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },

  // List View
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  exhibitionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: FontFamily.bold,
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    fontFamily: FontFamily.semiBold,
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.white,
    fontFamily: FontFamily.medium,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  cardMeta: {
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  registerButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  registerButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registeredText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  emptySubtitle: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Detail View
  detailHeaderContainer: {
    height: 250,
    position: 'relative',
  },
  detailCoverImage: {
    width: '100%',
    height: '100%',
  },
  detailCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
  },
  titleSection: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailTypeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  detailTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.xs,
  },
  detailOrganizer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.sm,
  },
  dateLocationRow: {
    gap: Spacing.md,
  },
  dateLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLocationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Info Tab
  infoSection: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
  },
  feeSection: {
    marginBottom: Spacing.lg,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  feeTypeLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  feePrice: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  ctaButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  ctaButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  alreadyRegistered: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  registeredInfo: {
    flex: 1,
  },
  registeredTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.success,
    fontFamily: FontFamily.semiBold,
  },
  registeredType: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },

  // Booths Tab
  boothsSection: {
    padding: Spacing.md,
  },
  boothCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  boothHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  boothCompanyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  companyLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  companyName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  boothNumber: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  arBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  arBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  boothBanner: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  welcomeMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.sm,
  },
  productsScroll: {
    marginBottom: Spacing.sm,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  productImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  productName: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  boothFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  visitorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitorCountText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  meetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  meetingButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },

  // Events Tab
  eventsSection: {
    padding: Spacing.md,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  eventTimeColumn: {
    alignItems: 'center',
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    marginRight: Spacing.md,
  },
  eventStartTime: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  eventEndTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  eventDivider: {},
  eventContent: {
    flex: 1,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  eventCapacity: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  eventTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.xs,
  },
  speakersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  speakerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  speakerPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  speakerPhotoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  speakerName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  moreSpeakers: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocationText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Networking Tab
  networkingSection: {
    padding: Spacing.md,
  },
  networkingFeatures: {
    gap: Spacing.sm,
  },
  networkingFeature: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    flex: 1,
  },

  // Empty section in tabs
  emptySection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Registration Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  registrationModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
    maxHeight: '85%',
  },
  registrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  registrationTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  exhibitionName: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.md,
  },
  selectTypeLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.sm,
  },
  registrationTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  registrationTypeSelected: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  typeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeRadioSelected: {
    borderColor: Colors.primary,
  },
  typeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  typeContent: {
    flex: 1,
  },
  typeName: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  typeDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  typePrice: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  regInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.sm,
  },
  regTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
});
