// Inspection Booking Screen - AlgeriaTrade Mobile
// Écran de réservation d'inspection qualité

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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';

// Services
import apiService from '../../services/api';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type InspectionRouteProp = RouteProp<RootStackParamList, 'InspectionBooking'>;

// ============================================
// Types & Interfaces
// ============================================

export type InspectionType =
  | 'pre_production'
  | 'during_production'
  | 'pre_shipment'
  | 'container_loading'
  | 'sample_inspection'
  | 'factory_audit';

export type InspectionStatus = 
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

interface InspectionService {
  id: string;
  type: InspectionType;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  typicalLeadTime: number; // in days
  includesPhotoReport: boolean;
  includesLabTest: boolean;
  maxSamples?: number;
}

interface InspectionBookingData {
  productId?: string;
  serviceId: string;
  inspectionType: InspectionType;
  preferredDate: Date;
  address: {
    street: string;
    city: string;
    wilaya: string;
    postalCode: string;
    contactPerson: string;
    phone: string;
  };
  specialInstructions?: string;
  isUrgent: boolean;
}

interface InspectionResult {
  id: string;
  bookingId: string;
  overallScore: number; // 0-100
  status: 'pass' | 'fail' | 'conditional';
  summary: string;
  details: Array<{
    criterion: string;
    status: 'pass' | 'fail' | 'warning';
    notes?: string;
    photos?: string[];
  }>;
  photos: string[];
  reportUrl?: string;
  inspectorName: string;
  inspectedAt: Date;
  completedAt?: Date;
}

interface BookingInfo {
  id: string;
  bookingNumber: string;
  status: InspectionStatus;
  service: InspectionService;
  scheduledDate?: Date;
  completedAt?: Date;
  result?: InspectionResult;
  totalAmount: number;
  isPaid: boolean;
  createdAt: Date;
}

// ============================================
// Constants
// ============================================

const INSPECTION_TYPES: Record<InspectionType, { 
  label: string; 
  icon: string; 
  color: string;
  description: string;
}> = {
  pre_production: {
    label: 'Pré-production',
    icon: 'clipboard-outline',
    color: Colors.primary,
    description: 'Vérification des matières premières et équipements avant production',
  },
  during_production: {
    label: 'En cours de production',
    icon: 'cog-outline',
    color: Colors.info,
    description: 'Contrôle qualité pendant le processus de fabrication',
  },
  pre_shipment: {
    label: 'Pré-expédition',
    icon: 'ship-outline',
    color: Colors.success,
    description: 'Inspection finale avant l\'expédition (le plus populaire)',
  },
  container_loading: {
    label: 'Chargement conteneur',
    icon: 'cube-outline',
    color: Colors.warning,
    description: 'Vérification du chargement et conditionnement',
  },
  sample_inspection: {
    label: 'Échantillon',
    icon: 'flask-outline',
    color: '#8B5CF6',
    description: 'Analyse d\'échantillons en laboratoire',
  },
  factory_audit: {
    label: 'Audit usine',
    icon: 'business-outline',
    color: Colors.secondary,
    description: 'Audit complet des installations et processus',
  },
};

const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Béjaïa',
  'Tlemcen', 'Biskra', 'Tébessa', 'El Oued', 'Skikda', 'Tiaret', 'M\'sila',
  'Mascara', 'Ain Témouchent', 'Saïda', 'Ghardaïa', 'Tizi Ouzou', 'Jijel',
  'Chlef', 'Sidi Bel Abbès', 'Bouira', 'Tarf', 'Tindouf', 'Tissemsilt',
  'El Ouff', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Ain Defla',
  'Naâma', 'Ain Témouchent', 'Hamma Bouziane', 'M\'Ghair', 'Oum El Bouaghi',
  'Relizane', 'El M\'Ghair', 'El Bayadh', 'Illizi', ' Bordj Badji Mokhtar',
  'Béchar', 'Adrar', 'Djanet', 'Guelaat Sbi Meradi', 'Timimoun', 'Saléa',
  'Beni Abbes', 'Tamanrasset', 'In Guezzam', 'Tougourt', 'Djelfa', 'Laghouat',
];

const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '13:00 - 15:00',
  '15:00 - 17:00',
];

// ============================================
// Main Component
// ============================================

export default function InspectionBookingScreen() {
  const route = useRoute<InspectionRouteProp>();
  const navigation = useNavigation();
  
  const { productId } = route.params || {};
  
  // State
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<InspectionService[]>([]);
  const [selectedService, setSelectedService] = useState<InspectionService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Select type, 2: Details, 3: Confirm, 4: Result
  
  // Form state
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Booking & Result state
  const [currentBooking, setCurrentBooking] = useState<BookingInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showWilayaModal, setShowWilayaModal] = useState(false);

  // Load services
  const loadServices = useCallback(async () => {
    try {
      const data = await apiService.getInspectionServices();
      setServices(data);
    } catch (error) {
      console.error('[InspectionBookingScreen] Error loading services:', error);
      Alert.alert('Erreur', 'Impossible de charger les services d\'inspection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Select service and move to next step
  const handleSelectService = (service: InspectionService) => {
    setSelectedService(service);
    setStep(2);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (optional)
      // if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      days.push(date);
    }
    
    return days;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendarModal(false);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!street.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer l\'adresse.');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer la ville.');
      return false;
    }
    if (!wilaya) {
      Alert.alert('Erreur', 'Veuillez sélectionner la wilaya.');
      return false;
    }
    if (!contactPerson.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du contact.');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone.');
      return false;
    }
    if (!selectedDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date.');
      return false;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau horaire.');
      return false;
    }
    return true;
  };

  // Submit booking
  const handleSubmitBooking = async () => {
    if (!validateForm() || !selectedService) return;

    setSubmitting(true);

    try {
      const booking = await apiService.bookInspection({
        productId,
        serviceId: selectedService.id,
        inspectionType: selectedService.type,
        preferredDate: selectedDate!,
        address: {
          street,
          city,
          wilaya,
          postalCode,
          contactPerson,
          phone,
        },
        specialInstructions: specialInstructions || undefined,
        isUrgent,
      });

      setCurrentBooking(booking);
      setStep(3); // Confirmation step
      
      Alert.alert(
        'Réservation confirmée !',
        `Votre réservation ${booking.bookingNumber} a été enregistrée.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[InspectionBookingScreen] Error booking:', error);
      Alert.alert('Erreur', 'Impossible de finaliser la réservation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total price
  const calculateTotal = (): number => {
    if (!selectedService) return 0;
    
    let total = selectedService.basePrice;
    
    if (isUrgent) {
      total *= 1.5; // 50% surcharge for urgent
    }
    
    return Math.round(total * 100) / 100;
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

  // Step 1: Select Service Type
  if (step === 1) {
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
          <Text style={styles.headerTitle}>Réserver une inspection</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <View style={styles.infoBannerContent}>
              <Text style={styles.infoBannerTitle}>Inspection professionnelle</Text>
              <Text style={styles.infoBannerText}>
                Nos inspecteurs certifiés vérifient la qualité de vos produits avant expédition.
              </Text>
            </View>
          </View>

          {/* Service Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choisissez le type d'inspection</Text>
            
            {services.map(service => {
              const config = INSPECTION_TYPES[service.type];
              
              return (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleSelectService(service)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.serviceIconContainer, { backgroundColor: config.color + '15' }]}>
                    <Ionicons name={config.icon as any} size={28} color={config.color} />
                  </View>
                  
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceName}>{config.label}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {config.description}
                    </Text>
                    
                    <View style={styles.serviceMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>
                          ~{service.typicalLeadTime} jours
                        </Text>
                      </View>
                      
                      {service.includesPhotoReport && (
                        <View style={[styles.metaItem, styles.metaItemSuccess]}>
                          <Ionicons name="camera-outline" size={14} color={Colors.success} />
                          <Text style={[styles.metaText, styles.metaTextSuccess]}>
                            Photos incluses
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.priceValue}>
                      {service.basePrice.toLocaleString('fr-FR')} {service.currency}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* How it works */}
          <View style={styles.howItWorksSection}>
            <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
            
            <View style={styles.stepsList}>
              {[
                { step: 1, title: 'Choisissez', desc: 'Sélectionnez le type d\'inspection' },
                { step: 2, title: 'Planifiez', desc: 'Définissez la date et le lieu' },
                { step: 3, title: 'Payez', desc: 'Effectuez le paiement sécurisé' },
                { step: 4, title: 'Recevez', desc: 'Obtenez votre rapport détaillé' },
              ].map(item => (
                <View key={item.step} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDescription}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Step 2: Details Form
  if (step === 2) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStep(1)}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la réservation</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Service Summary */}
          {selectedService && (
            <View style={styles.selectedServiceBanner}>
              <View style={[
                styles.selectedServiceIcon, 
                { backgroundColor: INSPECTION_TYPES[selectedService.type].color + '15' }
              ]}>
                <Ionicons 
                  name={INSPECTION_TYPES[selectedService.type].icon as any} 
                  size={20} 
                  color={INSPECTION_TYPES[selectedService.type].color} 
                />
              </View>
              <View style={styles.selectedServiceInfo}>
                <Text style={styles.selectedServiceName}>
                  {INSPECTION_TYPES[selectedService.type].label}
                </Text>
                <Text style={styles.selectedServicePrice}>
                  À partir de {selectedService.basePrice.toLocaleString('fr-FR')} {selectedService.currency}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Address Section */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Adresse d'inspection</Text>
            
            <TextInput
              style={styles.textInput}
              value={street}
              onChangeText={setStreet}
              placeholder="Adresse *"
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.textInput, styles.flexInput]}
                value={city}
                onChangeText={setCity}
                placeholder="Ville *"
                placeholderTextColor={Colors.textTertiary}
              />
              
              <TouchableOpacity
                style={[styles.textInput, styles.selectInput]}
                onPress={() => setShowWilayaModal(true)}
              >
                <Text style={[styles.selectText, wilaya ? styles.selectTextFilled : {}]}>
                  {wilaya || 'Wilaya *'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="Code postal"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          {/* Contact Section */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Contact sur place</Text>
            
            <TextInput
              style={styles.textInput}
              value={contactPerson}
              onChangeText={setContactPerson}
              placeholder="Nom du contact *"
              placeholderTextColor={Colors.textTertiary}
            />

            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Téléphone *"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Date & Time */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Date et heure préférées</Text>
            
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowCalendarModal(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>
                {selectedDate 
                  ? selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Sélectionner une date *'
                }
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.timeSlotsContainer}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot && styles.timeSlotSelected
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    selectedTimeSlot === slot && styles.timeSlotTextSelected
                  ]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Options */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Options supplémentaires</Text>
            
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIsUrgent(!isUrgent)}
            >
              <View style={[styles.checkbox, isUrgent && styles.checkboxChecked]}>
                {isUrgent && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Demande urgente (+50%)</Text>
                <Text style={styles.optionDescription}>
                  Inspection sous 48h (si disponible)
                </Text>
              </View>
            </TouchableOpacity>

            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Instructions spéciales (optionnel)"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Price Summary */}
          <View style={styles.priceSummary}>
            <Text style={styles.priceSummaryTitle}>Récapitulatif</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {INSPECTION_TYPES[selectedService?.type]?.label || 'Inspection'}
              </Text>
              <Text style={styles.priceAmount}>
                {selectedService?.basePrice.toLocaleString('fr-FR')} {selectedService?.currency}
              </Text>
            </View>
            
            {isUrgent && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: Colors.warning }]}>
                  Supplément urgent
                </Text>
                <Text style={[styles.priceAmount, { color: Colors.warning }]}>
                  +{Math.round((selectedService?.basePrice || 0) * 0.5).toLocaleString('fr-FR')}
                </Text>
              </View>
            )}
            
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {calculateTotal().toLocaleString('fr-FR')} {selectedService?.currency || 'DZD'}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitBooking}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Confirmer la réservation</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Wilaya Picker Modal */}
        <Modal visible={showWilayaModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowWilayaModal(false)}>
                  <Text style={styles.pickerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Sélectionner la wilaya</Text>
                <View style={{ width: 60 }} />
              </View>
              
              <ScrollView style={styles.pickerList}>
                {WILAYAS.map(w => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.pickerItem, wilaya === w && styles.pickerItemSelected]}
                    onPress={() => {
                      setWilaya(w);
                      setShowWilayaModal(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, wilaya === w && styles.pickerItemSelectedText]}>
                      {w}
                    </Text>
                    {wilaya === w && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Calendar Modal */}
        <Modal visible={showCalendarModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                  <Text style={styles.pickerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Choisir une date</Text>
                <View style={{ width: 60 }} />
              </View>
              
              <ScrollView style={styles.calendarGrid}>
                {generateCalendarDays().map((date, index) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected
                      ]}
                      onPress={() => handleDateSelect(date)}
                    >
                      <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                        {dayName}
                      </Text>
                      <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                        {date.getDate()}
                      </Text>
                      <Text style={[styles.monthName, isSelected && styles.monthNameSelected]}>
                        {date.toLocaleDateString('fr-FR', { month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Step 3: Confirmation / Result View
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma réservation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentBooking && (
          <>
            {/* Status Card */}
            <View style={[
              styles.statusCard,
              { borderLeftColor: getStatusColor(currentBooking.status) }
            ]}>
              <View style={styles.statusHeader}>
                <Ionicons 
                  name={getStatusIcon(currentBooking.status)} 
                  size={32} 
                  color={getStatusColor(currentBooking.status)} 
                />
                <View style={styles.statusInfo}>
                  <Text style={styles.bookingNumber}>{currentBooking.bookingNumber}</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(currentBooking.status) }]}>
                    {getStatusText(currentBooking.status)}
                  </Text>
                </View>
              </View>

              {!currentBooking.isPaid && currentBooking.status !== 'cancelled' && (
                <TouchableOpacity style={styles.payButton}>
                  <Ionicons name="card-outline" size={18} color={Colors.white} />
                  <Text style={styles.payButtonText}>
                    Payer {currentBooking.totalAmount.toLocaleString('fr-FR')} DZD
                  </Text>
                </TouchableOpacity>
              )}

              {currentBooking.isPaid && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.paidText}>Payée</Text>
                </View>
              )}
            </View>

            {/* Service Info */}
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Service réservé</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>
                  {INSPECTION_TYPES[currentBooking.service.type]?.label}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date prévue</Text>
                <Text style={styles.detailValue}>
                  {currentBooking.scheduledDate 
                    ? new Date(currentBooking.scheduledDate).toLocaleDateString('fr-FR')
                    : 'À définir'
                  }
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant</Text>
                <Text style={styles.detailValue}>
                  {currentBooking.totalAmount.toLocaleString('fr-FR')} DZD
                </Text>
              </View>
            </View>

            {/* Result (if completed) */}
            {currentBooking.result && (
              <View style={[styles.resultCard, { 
                borderLeftColor: currentBooking.result.status === 'pass' 
                  ? Colors.success 
                  : currentBooking.result.status === 'fail' 
                    ? Colors.error 
                    : Colors.warning 
              }]}>
                <Text style={styles.resultTitle}>Résultat de l'inspection</Text>
                
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{currentBooking.result.overallScore}/100</Text>
                  <View style={[
                    styles.scoreBadge,
                    { backgroundColor: currentBooking.result.status === 'pass' 
                      ? Colors.successLight 
                      : currentBooking.result.status === 'fail' 
                        ? Colors.errorLight 
                        : Colors.warningLight 
                    }
                  ]}>
                    <Text style={[
                      styles.scoreBadgeText,
                      { color: currentBooking.result.status === 'pass' 
                        ? Colors.success 
                        : currentBooking.result.status === 'fail' 
                          ? Colors.error 
                          : Colors.warning 
                      }
                    ]}>
                      {currentBooking.result.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultSummary}>{currentBooking.result.summary}</Text>

                {currentBooking.result.reportUrl && (
                  <TouchableOpacity style={styles.reportButton}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                    <Text style={styles.reportButtonText}>Voir le rapport complet</Text>
                    <Ionicons name="open-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}

                {/* Result details */}
                {currentBooking.result.details.slice(0, 3).map((detail, index) => (
                  <View key={index} style={styles.criterionRow}>
                    <View style={[
                      styles.criterionDot,
                      { backgroundColor: detail.status === 'pass' 
                        ? Colors.success 
                        : detail.status === 'fail' 
                          ? Colors.error 
                          : Colors.warning 
                      ]}
                    ]}
                    />
                    <Text style={styles.criterionText} numberOfLines={1}>
                      {detail.criterion}
                    </Text>
                    <Text style={[
                      styles.criterionStatus,
                      { color: detail.status === 'pass' 
                        ? Colors.success 
                        : detail.status === 'fail' 
                          ? Colors.error 
                          : Colors.warning 
                      }
                    ]}>
                      {detail.status === 'pass' ? 'OK' : detail.status === 'fail' ? 'ÉCHEC' : 'ATTENTION'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Helper functions
function getStatusColor(status: InspectionStatus): string {
  switch (status) {
    case 'scheduled': return Colors.info;
    case 'in_progress': return Colors.warning;
    case 'completed':
    case 'pass': return Colors.success;
    case 'failed':
    case 'fail': return Colors.error;
    case 'cancelled': return Colors.textTertiary;
    default: return Colors.textTertiary;
  }
}

function getStatusIcon(status: InspectionStatus): string {
  switch (status) {
    case 'pending': return 'time-outline';
    case 'scheduled': return 'calendar-outline';
    case 'in_progress': return 'sync-outline';
    case 'completed':
    case 'pass': return 'checkmark-circle';
    case 'failed':
    case 'fail': return 'close-circle';
    case 'cancelled': return 'ban-outline';
    default: return 'ellipsis-circle';
  }
}

function getStatusText(status: InspectionStatus): string {
  switch (status) {
    case 'pending': return 'En attente';
    case 'scheduled': return 'Planifiée';
    case 'in_progress': return 'En cours';
    case 'completed': return 'Terminée';
    case 'failed': return 'Échouée';
    case 'cancelled': return 'Annulée';
    default: return status;
  }
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  scrollView: {
    flex: 1,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  infoBannerContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoBannerTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
  },
  infoBannerText: {
    fontSize: FontSize.sm,
    color: Colors.primaryDark,
    fontFamily: FontFamily.regular,
  },

  // Sections
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },

  // Service Cards
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.sm,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemSuccess: {},
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  metaTextSuccess: {
    color: Colors.success,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: Spacing.sm,
  },
  priceValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },

  // How it works
  howItWorksSection: {
    padding: Spacing.md,
  },
  stepsList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  stepDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Selected Service Banner
  selectedServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  selectedServiceIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedServiceInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  selectedServiceName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  selectedServicePrice: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },

  // Form
  formSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formSectionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    backgroundColor: Colors.white,
    marginBottom: Spacing.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flexInput: {
    flex: 1,
  },
  selectInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  selectTextFilled: {
    color: Colors.text,
  },

  // Date & Time
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateText: {
    flex: 1,
    fontSize: FontSize.base,
    color: selectedDate ? Colors.text : Colors.textTertiary,
    marginLeft: Spacing.sm,
    fontFamily: FontFamily.regular,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  timeSlotTextSelected: {
    color: Colors.white,
  },

  // Options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  optionDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },

  // Price Summary
  priceSummary: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    marginBottom: Spacing.lg,
  },
  priceSummaryTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  priceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  priceAmount: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  totalAmount: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 40 : Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerCancelText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
    width: 60,
  },
  pickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary + '10',
  },
  pickerItemText: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  pickerItemSelectedText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
  },
  calendarDay: {
    width: (SCREEN_WIDTH - Spacing.lg) / 4,
    aspectRatio: 0.75,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    margin: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    textTransform: 'uppercase',
  },
  dayNameSelected: {
    color: Colors.white + 'AA',
  },
  dayNumber: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  dayNumberSelected: {
    color: Colors.white,
  },
  monthName: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  monthNameSelected: {
    color: Colors.white + 'AA',
  },

  // Confirmation Screen
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
  statusInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  bookingNumber: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  statusText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  payButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  payButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.white,
    fontFamily: FontFamily.medium,
  },
  paidBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  paidText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },
  detailCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  detailTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  resultCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  resultTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreValue: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginRight: Spacing.md,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scoreBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  resultSummary: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  reportButtonText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontFamily: FontFamily.medium,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  criterionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  criterionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  criterionStatus: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
});
