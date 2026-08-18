// Shipment Tracker Screen - AlgeriaTrade Mobile
// Écran de suivi des expéditions en temps réel

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';

// Services
import apiService from '../../services/api';
import { pushNotificationService } from '../../services/pushNotifications';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type ShipmentRouteProp = RouteProp<RootStackParamList, 'ShipmentTracker'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Types & Interfaces
// ============================================

export type ShipmentStatus =
  | 'pending'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'lost'
  | 'exception';

export type ShippingMethod =
  | 'standard'
  | 'express'
  | 'air_freight'
  | 'sea_freight'
  | 'rail_freight'
  | 'pickup'
  | 'white_glove';

export type Incoterm = 
  | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DDP'
  | 'FAS' | 'FOB' | 'CFR' | 'CIF';

interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  description: string;
  location?: string;
  timestamp: Date;
  photoUrl?: string;
}

interface ShipmentData {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrierName: string;
  carrierLogo?: string;
  carrierPhone?: string;
  status: ShipmentStatus;
  shippingMethod: ShippingMethod;
  incoterm: Incoterm;
  
  // Addresses
  originAddress: {
    name: string;
    street: string;
    city: string;
    wilaya: string;
    postalCode: string;
    country: string;
  };
  
  destinationAddress: {
    name: string;
    street: string;
    city: string;
    wilaya: string;
    postalCode: string;
    country: string;
    deliveryInstructions?: string;
  };
  
  // Package info
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  packageCount: number;
  
  // Dates
  estimatedDeliveryStart?: Date;
  estimatedDeliveryEnd?: Date;
  actualDeliveryDate?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  
  // Cost
  shippingCost: number;
  currency: string;
  
  // Tracking
  trackingEvents: TrackingEvent[];
  trackingUrl?: string;
  
  // Documents
  waybillUrl?: string;
  customsDocsUrl?: string;
  insuranceUrl?: string;
  
  // Driver info (for out_for_delivery)
  driverInfo?: {
    name: string;
    phone: string;
    photoUrl?: string;
    vehicleInfo?: string;
    estimatedArrival?: Date;
  };
}

interface RatingData {
  shipmentId: string;
  rating: number; // 1-5
  comment?: string;
  categories: {
    deliverySpeed: number;
    packageCondition: number;
    courierBehavior: number;
  };
}

// ============================================
// Constants
// ============================================

const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, { 
  label: string; 
  icon: string; 
  color: string;
  description: string;
}> = {
  pending: { label: 'En attente', icon: 'time-outline', color: Colors.textTertiary, description: 'Commande en préparation' },
  ready_to_ship: { label: 'Prêt à expédier', icon: 'cube-outline', color: Colors.info, description: 'Colis prêt pour l\'expédition' },
  shipped: { label: 'Expédié', icon: 'airplane-outline', color: Colors.primary, description: 'Colis remis au transporteur' },
  in_transit: { label: 'En transit', icon: 'navigate-outline', color: Colors.info, description: 'Colis en cours de transport' },
  out_for_delivery: { label: 'En livraison', icon: 'bicycle-outline', color: Colors.warning, description: 'Le livreur est en route' },
  delivered: { label: 'Livré', icon: 'checkmark-circle', color: Colors.success, description: 'Colis livré avec succès' },
  failed_delivery: { label: 'Échec de livraison', icon: 'close-circle-outline', color: Colors.error, description: 'Impossible de livrer le colis' },
  returned: { label: 'Retourné', icon: 'return-down-back-outline', color: Colors.textTertiary, description: 'Colis retourné à l\'expéditeur' },
  lost: { label: 'Perdu', icon: 'help-circle-outline', color: Colors.error, description: 'Colis signalé comme perdu' },
  exception: { label: 'Exception', icon: 'alert-circle-outline', color: Colors.warning, description: 'Problème détecté' },
};

const SHIPPING_METHOD_CONFIG: Record<ShippingMethod, { label: string; icon: string }> = {
  standard: { label: 'Livraison standard', icon: 'truck-outline' },
  express: { label: 'Livraison express', icon: 'flash-outline' },
  air_freight: { label: 'Fret aérien', icon: 'airplane-outline' },
  sea_freight: { label: 'Fret maritime', icon: 'boat-outline' },
  rail_freight: { label: 'Fert ferroviaire', icon: 'train-outline' },
  pickup: { label: 'Retrait en point relais', icon: 'storefront-outline' },
  white_glove: { label: 'Livraison premium', icon: 'hand-left-outline' },
};

const STATUS_ORDER: ShipmentStatus[] = [
  'pending',
  'ready_to_ship',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

// ============================================
// Main Component
// ============================================

export default function ShipmentTrackerScreen() {
  const route = useRoute<ShipmentRouteProp>();
  const navigation = useNavigation();
  
  const { trackingNumber: initialTrackingNumber } = route.params || {};
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [trackingInput, setTrackingInput] = useState(initialTrackingNumber || '');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [categoryRatings, setCategoryRatings] = useState({
    deliverySpeed: 5,
    packageCondition: 5,
    courierBehavior: 5,
  });
  const [submittingRating, setSubmittingRating] = useState(false);

  // Load shipment data
  const loadShipment = useCallback(async (trackingNum?: string) => {
    const num = trackingNum || trackingInput;
    
    if (!num) return;

    try {
      const data = await apiService.trackShipment(num);
      setShipment(data);
      
      // Subscribe to push notifications for this shipment
      pushNotificationService.subscribeToTopic(`shipment_${data.id}`);
    } catch (error) {
      console.error('[ShipmentTrackerScreen] Error loading:', error);
      Alert.alert('Erreur', 'Impossible de trouver cette expédition. Vérifiez le numéro de suivi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trackingInput]);

  useEffect(() => {
    if (initialTrackingNumber) {
      loadShipment(initialTrackingNumber);
    } else {
      setLoading(false);
    }
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadShipment();
  };

  // Search for shipment
  const handleSearch = () => {
    if (!trackingInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de suivi.');
      return;
    }
    
    setLoading(true);
    loadShipment(trackingInput.trim());
  };

  // Contact driver
  const handleContactDriver = (type: 'call' | 'message') => {
    if (!shipment?.driverInfo) return;

    if (type === 'call') {
      Alert.alert(
        'Appeler le livreur',
        `Voulez-vous appeler ${shipment.driverInfo.name} au ${shipment.driverInfo.phone} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Appeler', 
            onPress: () => {
              // In real app, would use Linking.openURL(`tel:${phone}`)
              console.log('[ShipmentTracker] Calling driver');
            }
          }
        ]
      );
    } else {
      // Navigate to chat with driver
      navigation.navigate('Chat' as any, {
        conversationId: `delivery_${shipment.id}`,
        userName: `${shipment.driverInfo.name} (Livreur)`,
      });
    }
  };

  // Submit rating
  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une note.');
      return;
    }

    setSubmittingRating(true);

    try {
      await apiService.rateDelivery(shipment!.id, {
        rating,
        comment: ratingComment || undefined,
        categories: categoryRatings,
      });

      Alert.alert('Merci !', 'Votre avis a été enregistré.', [
        { text: 'OK', onPress: () => setShowRatingModal(false) }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer votre avis.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Get current progress step
  const getCurrentStepIndex = (): number => {
    if (!shipment) return -1;
    return STATUS_ORDER.indexOf(shipment.status);
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Recherche de l'expédition...</Text>
      </View>
    );
  }

  // Render search view (no shipment loaded)
  if (!shipment) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suivi d'expédition</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          {/* Illustration */}
          <View style={styles.searchIllustration}>
            <Ionicons name="locate-outline" size={80} color={Colors.primary} />
          </View>

          <Text style={styles.searchTitle}>Suivez votre colis</Text>
          <Text style={styles.searchSubtitle}>
            Entrez votre numéro de suivi pour connaître l'état de votre livraison
          </Text>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={trackingInput}
              onChangeText={setTrackingInput}
              placeholder="Numéro de suivi"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Recent searches would go here */}
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recherches récentes</Text>
            <Text style={styles.noRecentText}>Aucune recherche récente</Text>
          </View>

          {/* Help */}
          <TouchableOpacity style={styles.helpCard}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Besoin d'aide ?</Text>
              <Text style={styles.helpDescription}>
                Consultez notre FAQ ou contactez le support client
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main tracker view
  const currentStep = getCurrentStepIndex();
  const statusConfig = SHIPMENT_STATUS_CONFIG[shipment.status];
  const methodConfig = SHIPPING_METHOD_CONFIG[shipment.shippingMethod];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi d'expédition</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusConfig.color }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color + '15' }]}>
              <Ionicons name={statusConfig.icon as any} size={28} color={statusConfig.color} />
            </View>
            
            <View style={styles.statusInfo}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
              <Text style={styles.statusDescription}>{statusConfig.description}</Text>
            </View>
          </View>

          {/* Tracking Number */}
          <View style={styles.trackingNumberContainer}>
            <Text style={styles.trackingNumberLabel}>N° de suivi</Text>
            <View style={styles.trackingNumberRow}>
              <Text style={styles.trackingNumberValue}>{shipment.trackingNumber}</Text>
              <TouchableOpacity onPress={() => {
                // Copy to clipboard
                Alert.alert('Copié', 'Le numéro de suivi a été copié.');
              }}>
                <Ionicons name="copy-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Estimate */}
          {(shipment.estimatedDeliveryStart || shipment.estimatedDeliveryEnd) && (
            <View style={styles.deliveryEstimate}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.deliveryEstimateText}>
                Livraison estimée:{' '}
                {shipment.estimatedDeliveryStart?.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
                {shipment.estimatedDeliveryEnd && shipment.estimatedDeliveryStart?.getTime() !== shipment.estimatedDeliveryEnd?.getTime()
                  ? ` - ${shipment.estimatedDeliveryEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                  : ''
                }
              </Text>
            </View>
          )}
        </View>

        {/* Progress Steps */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progression</Text>
          
          <View style={styles.stepsContainer}>
            {STATUS_ORDER.map((status, index) => {
              const config = SHIPMENT_STATUS_CONFIG[status];
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <React.Fragment key={status}>
                  {/* Step Circle */}
                  <View style={styles.stepItem}>
                    <View style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isCurrent && styles.stepCircleCurrent,
                    ]}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                      ) : (
                        <View style={styles.stepCircleInner} />
                      )}
                    </View>
                    
                    <Text style={[
                      styles.stepLabel,
                      isCompleted && styles.stepLabelCompleted,
                      isCurrent && styles.stepLabelCurrent,
                    ]}>
                      {config.label}
                    </Text>
                  </View>

                  {/* Connector Line */}
                  {index < STATUS_ORDER.length - 1 && (
                    <View style={[
                      styles.stepConnector,
                      index < currentStep && styles.stepConnectorCompleted,
                    ]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Map Placeholder (would be real map in production) */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.mapPlaceholderText}>Carte de suivi en temps réel</Text>
            
            {/* Simulated route visualization */}
            <View style={styles.routeVisualization}>
              <View style={styles.routeOrigin}>
                <View style={styles.routeDotOrigin} />
                <Text style={styles.routeOriginLabel}>Origine</Text>
              </View>
              
              <View style={styles.routeLine}>
                {[...Array(5)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.routeCheckpoint,
                      i <= Math.floor(currentStep / 2) && styles.routeCheckpointActive
                    ]} 
                  />
                ))}
              </View>
              
              <View style={styles.routeDestination}>
                <View style={[
                  styles.routeDotDestination,
                  currentStep >= STATUS_ORDER.length - 2 && styles.routeDotDestinationActive
                ]} />
                <Text style={styles.routeDestinationLabel}>Destination</Text>
              </View>
            </View>
          </View>

          {/* Address Cards */}
          <View style={styles.addressesContainer}>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={[styles.addressIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="arrow-up" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.addressType}>Expéditeur</Text>
              </View>
              <Text style={styles.addressName}>{shipment.originAddress.name}</Text>
              <Text style={styles.addressDetail}>
                {shipment.originAddress.street}, {shipment.originAddress.city}
              </Text>
              <Text style={styles.addressDetail}>
                {shipment.originAddress.wilaya}, {shipment.originAddress.postalCode}
              </Text>
            </View>

            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={[styles.addressIcon, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="arrow-down" size={16} color={Colors.success} />
                </View>
                <Text style={styles.addressType}>Destinataire</Text>
              </View>
              <Text style={styles.addressName}>{shipment.destinationAddress.name}</Text>
              <Text style={styles.addressDetail}>
                {shipment.destinationAddress.street}, {shipment.destinationAddress.city}
              </Text>
              <Text style={styles.addressDetail}>
                {shipment.destinationAddress.wilaya}, {shipment.destinationAddress.postalCode}
              </Text>
              {shipment.destinationAddress.deliveryInstructions && (
                <>
                  <Text style={styles.instructionsLabel}>Instructions:</Text>
                  <Text style={styles.instructionsText}>
                    {shipment.destinationAddress.deliveryInstructions}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Driver Info Card (when out for delivery) */}
        {shipment.driverInfo && shipment.status === 'out_for_delivery' && (
          <View style={styles.driverCard}>
            <Text style={styles.sectionTitle}>Votre livreur</Text>
            
            <View style={styles.driverInfoContainer}>
              {shipment.driverInfo.photoUrl ? (
                <Image source={{ uri: shipment.driverInfo.photoUrl }} style={styles.driverPhoto} />
              ) : (
                <View style={styles.driverPhotoPlaceholder}>
                  <Ionicons name="person" size={32} color={Colors.textTertiary} />
                </View>
              )}
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{shipment.driverInfo.name}</Text>
                {shipment.driverInfo.vehicleInfo && (
                  <Text style={styles.driverVehicle}>{shipment.driverInfo.vehicleInfo}</Text>
                )}
                {shipment.driverInfo.estimatedArrival && (
                  <View style={styles.etaContainer}>
                    <Ionicons name="time-outline" size={14} color={Colors.warning} />
                    <Text style={styles.etaText}>
                      Arrivée estimée: {new Date(shipment.driverInfo.estimatedArrival).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.driverActions}>
              <TouchableOpacity
                style={[styles.driverActionButton, styles.callButton]}
                onPress={() => handleContactDriver('call')}
              >
                <Ionicons name="call-outline" size={18} color={Colors.white} />
                <Text style={styles.driverActionText}>Appeler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.driverActionButton, styles.messageButton]}
                onPress={() => handleContactDriver('message')}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
                <Text style={[styles.driverActionText, styles.messageButtonText]}>
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Package Info */}
        <View style={styles.packageSection}>
          <Text style={styles.sectionTitle}>Détails du colis</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Méthode</Text>
              <View style={styles.methodBadge}>
                <Ionicons name={methodConfig.icon as any} size={14} color={Colors.primary} />
                <Text style={styles.methodText}>{methodConfig.label}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Poids</Text>
              <Text style={styles.infoValue}>{shipment.weight} kg</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Colis</Text>
              <Text style={styles.infoValue}>{shipment.packageCount}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Incoterm</Text>
              <Text style={styles.infoValue}>{shipment.incoterm}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Transporteur</Text>
              <Text style={styles.infoValue}>{shipment.carrierName}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Coût</Text>
              <Text style={styles.infoValue}>
                {shipment.shippingCost.toLocaleString('fr-FR')} {shipment.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* Tracking Events Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Historique du suivi</Text>
          
          {shipment.trackingEvents.map((event, index) => {
            const eventConfig = SHIPMENT_STATUS_CONFIG[event.status];
            const isLast = index === shipment.trackingEvents.length - 1;
            
            return (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    isLast ? styles.timelineDotLast : {},
                    { backgroundColor: eventConfig.color }
                  ]} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                
                <View style={[styles.timelineContent, isLast && styles.timelineContentLast]}>
                  <Text style={styles.timelineTitle}>{event.description}</Text>
                  
                  {event.location && (
                    <View style={styles.timelineLocation}>
                      <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.timelineLocationText}>{event.location}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.timelineTime}>
                    {new Date(event.timestamp).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  
                  {event.photoUrl && (
                    <Image source={{ uri: event.photoUrl }} style={styles.timelinePhoto} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Documents */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documents</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shipment.waybillUrl && (
              <TouchableOpacity style={styles.documentChip}>
                <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>Letter de voiture</Text>
                  <Text style={styles.documentFormat}>PDF</Text>
                </View>
                <Ionicons name="download-outline" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
            
            {shipment.customsDocsUrl && (
              <TouchableOpacity style={styles.documentChip}>
                <Ionicons name="document-attach-outline" size={18} color={Colors.info} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>Documents douaniers</Text>
                  <Text style={styles.documentFormat}>PDF</Text>
                </View>
                <Ionicons name="download-outline" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
            
            {shipment.insuranceUrl && (
              <TouchableOpacity style={styles.documentChip}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>Assurance</Text>
                  <Text style={styles.documentFormat}>PDF</Text>
                </View>
                <Ionicons name="download-outline" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Rate Delivery Button (if delivered) */}
        {shipment.status === 'delivered' && (
          <TouchableOpacity
            style={styles.ratingButton}
            onPress={() => setShowRatingModal(true)}
          >
            <Ionicons name="star-outline" size={20} color={Colors.white} />
            <Text style={styles.ratingButtonText}>Évaluer la livraison</Text>
          </TouchableOpacity>
        )}

        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Évaluer la livraison</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.ratingQuestion}>
              Comment évaluez-vous votre expérience de livraison ?
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#F59E0B' : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingValueText}>{rating}/5</Text>
            )}

            {/* Category Ratings */}
            <Text style={styles.categoryTitle}>Notes détaillées</Text>
            
            {[
              { key: 'deliverySpeed', label: 'Vitesse de livraison' },
              { key: 'packageCondition', label: 'État du colis' },
              { key: 'courierBehavior', label: 'Comportement du livreur' },
            ].map(category => (
              <View key={category.key} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <View style={styles.categoryStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setCategoryRatings(prev => ({
                        ...prev,
                        [category.key]: star,
                      }))}
                    >
                      <Ionicons
                        name={star <= categoryRatings[category.key as keyof typeof categoryRatings] ? 'star' : 'star-outline'}
                        size={24}
                        color={star <= categoryRatings[category.key as keyof typeof categoryRatings] ? '#F59E0B' : Colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Comment */}
            <TextInput
              style={styles.commentInput}
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Commentaire (optionnel)"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitRatingButton, submittingRating && styles.submitDisabled]}
              onPress={handleSubmitRating}
              disabled={submittingRating}
            >
              {submittingRating ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitRatingText}>Envoyer mon avis</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search View
  searchContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  searchIllustration: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.lg,
  },
  searchTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
  },
  searchSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSection: {
    marginTop: Spacing.xl,
  },
  recentTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.sm,
  },
  noRecentText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  helpContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  helpTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  helpDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },

  // Status Card
  statusCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderLeftWidth: 4,
    ...Shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    fontFamily: FontFamily.bold,
  },
  statusDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  trackingNumberContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  trackingNumberLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  trackingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingNumberValue: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
  },
  deliveryEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryEstimateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },

  // Progress Section
  progressSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  stepsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleCurrent: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  stepCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  stepLabelCompleted: {
    color: Colors.primary,
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '600',
  },
  stepConnector: {
    width: 20,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: -12,
    marginBottom: 4,
  },
  stepConnectorCompleted: {
    backgroundColor: Colors.primary,
  },

  // Map Section
  mapContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapPlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    fontFamily: FontFamily.regular,
  },
  routeVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  routeOrigin: {
    alignItems: 'center',
  },
  routeDotOrigin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  routeOriginLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  routeLine: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  routeCheckpoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  routeCheckpointActive: {
    backgroundColor: Colors.primary,
  },
  routeDestination: {
    alignItems: 'center',
  },
  routeDotDestination: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  routeDotDestinationActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  routeDestinationLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  addressesContainer: {
    gap: Spacing.sm,
  },
  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  addressIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  addressType: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontFamily: FontFamily.medium,
  },
  addressName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  addressDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  instructionsLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.medium,
  },
  instructionsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: FontFamily.regular,
  },

  // Driver Card
  driverCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  driverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
  },
  driverPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  driverName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  driverVehicle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  etaText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: '500',
    marginLeft: 4,
    fontFamily: FontFamily.medium,
  },
  driverActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  driverActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  callButton: {
    backgroundColor: Colors.success,
  },
  messageButton: {
    backgroundColor: Colors.primaryLight,
  },
  driverActionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  messageButtonText: {
    color: Colors.primary,
  },

  // Package Info
  packageSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  infoItem: {
    width: '50%',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  methodText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },

  // Timeline
  timelineSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: Spacing.lg,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineDotLast: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: Colors.borderLight,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timelineContentLast: {
    borderBottomWidth: 0,
  },
  timelineTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: 4,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timelineLocationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  timelineTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  timelinePhoto: {
    width: SCREEN_WIDTH - 100,
    height: 120,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },

  // Documents
  documentsSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  documentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  documentTitle: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  documentFormat: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Rating Button
  ratingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  ratingButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },

  // Rating Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  ratingModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  ratingQuestion: {
    fontSize: FontSize.base,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ratingValueText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: FontFamily.regular,
  },
  categoryTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  categoryStars: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
  submitRatingButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitRatingText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
});
