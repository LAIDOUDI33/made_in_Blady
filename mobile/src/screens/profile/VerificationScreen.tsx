// Verification Screen - AlgeriaTrade Mobile
// Écran de vérification du compte fournisseur

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, RouteProp } from '@react-navigation/native';

// Services
import apiService from '../../services/api';
import { offlineService } from '../../services/offline';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type VerificationRouteProp = RouteProp<RootStackParamList, 'Verification'>;
type NavigationProp = ReturnType<typeof useNavigation>;

// ============================================
// Types & Interfaces
// ============================================

export type VerificationLevel = 'BASIC' | 'VERIFIED' | 'CERTIFIED' | 'PREMIUM' | 'ENTERPRISE';

export type VerificationType =
  | 'business_license'
  | 'tax_compliance'
  | 'bank_account'
  | 'identity'
  | 'address'
  | 'phone'
  | 'email'
  | 'product_quality'
  | 'production_capacity'
  | 'export_license'
  | 'iso_certification'
  | 'sgs_audit';

interface VerificationBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  level: VerificationLevel;
  description: string;
}

interface VerificationDocument {
  id: string;
  type: VerificationType;
  uri: string;
  name: string;
  uploadedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface VerificationStatus {
  currentLevel: VerificationLevel;
  score: number;
  verifications: Array<{
    id: string;
    type: VerificationType;
    status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
    submittedAt?: Date;
    reviewedAt?: Date;
    notes?: string;
  }>;
  badges: VerificationBadge[];
}

// ============================================
// Constants
// ============================================

const VERIFICATION_LEVELS: Record<VerificationLevel, { label: string; color: string; icon: string }> = {
  BASIC: { label: 'Basique', color: Colors.textTertiary, icon: 'shield-checkmark-outline' },
  VERIFIED: { label: 'Vérifié', color: Colors.info, icon: 'shield-checkmark' },
  CERTIFIED: { label: 'Certifié', color: Colors.success, icon: 'award' },
  PREMIUM: { label: 'Premium', color: Colors.warning, icon: 'star' },
  ENTERPRISE: { label: 'Entreprise', color: '#8B5CF6', icon: 'business' },
};

const VERIFICATION_TYPES: Array<{ type: VerificationType; label: string; description: string; required: boolean }> = [
  { type: 'business_license', label: 'Registre de commerce', description: 'Document officiel d\'immatriculation', required: true },
  { type: 'tax_compliance', label: 'Conformité fiscale', description: 'Attestation fiscale en cours de validité', required: true },
  { type: 'identity', label: 'Pièce d\'identité', description: 'Carte d\'identité nationale ou passeport', required: true },
  { type: 'bank_account', label: 'RIB bancaire', description: 'Relevé d\'identité bancaire', required: false },
  { type: 'address', label: 'Justificatif de domicile', description: 'Facture ou titre de propriété', required: false },
  { type: 'iso_certification', label: 'Certification ISO', description: 'Certification ISO si applicable', required: false },
  { type: 'export_license', label: 'Licence d\'exportation', description: 'Autorisation d\'exportation', required: false },
];

const BADGE_ICONS: Record<string, string> = {
  verified_seller: 'checkmark-circle',
  quality_assured: 'shield-checkmark',
  fast_responder: 'flash',
  top_rated: 'star',
  trusted_partner: 'hand-left',
  certified_exporter: 'globe',
};

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'approved': return Colors.success;
    case 'rejected': return Colors.error;
    case 'under_review': return Colors.warning;
    case 'submitted': return Colors.info;
    default: return Colors.textTertiary;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved': return 'Approuvé';
    case 'rejected': return 'Rejeté';
    case 'under_review': return 'En cours';
    case 'submitted': return 'Soumis';
    default: return 'En attente';
  }
}

// ============================================
// Main Component
// ============================================

export default function VerificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationStatus | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<VerificationDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState<VerificationType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load verification data
  const loadVerificationData = useCallback(async () => {
    try {
      const data = await apiService.getVerifications();
      setVerificationData(data);
    } catch (error) {
      console.error('[VerificationScreen] Error loading data:', error);
      // Try to load from cache
      const cached = await offlineService.getCachedVerification();
      if (cached) {
        setVerificationData(cached);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVerificationData();
  }, [loadVerificationData]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadVerificationData();
  };

  // Document picker
  const pickDocument = async (type: VerificationType) => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour télécharger des documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newDoc: VerificationDocument = {
          id: `${Date.now()}`,
          type,
          uri: result.assets[0].uri,
          name: `${type}_${Date.now()}.jpg`,
          status: 'pending',
        };
        
        setSelectedDocuments(prev => [...prev, newDoc]);
        setShowUploadModal(false);
        
        // Cache document for offline upload
        await offlineService.cacheVerificationDocument(newDoc);
      }
    } catch (error) {
      console.error('[VerificationScreen] Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document.');
    }
  };

  // Take photo
  const takePhoto = async (type: VerificationType) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'appareil photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newDoc: VerificationDocument = {
          id: `${Date.now()}`,
          type,
          uri: result.assets[0].uri,
          name: `photo_${type}_${Date.now()}.jpg`,
          status: 'pending',
        };
        
        setSelectedDocuments(prev => [...prev, newDoc]);
        setShowUploadModal(false);
        
        await offlineService.cacheVerificationDocument(newDoc);
      }
    } catch (error) {
      console.error('[VerificationScreen] Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    }
  };

  // Submit verification request
  const submitVerification = async () => {
    if (selectedDocuments.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un document.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Upload each document
      for (const doc of selectedDocuments) {
        const formData = new FormData();
        formData.append('type', doc.type);
        formData.append('document', {
          uri: doc.uri,
          name: doc.name,
          type: 'image/jpeg',
        } as any);

        await apiService.submitVerification(formData);
      }

      Alert.alert(
        'Succès',
        'Votre demande de vérification a été soumise. Vous recevrez une notification lors de la validation.',
        [{ text: 'OK', onPress: () => {
          setSelectedDocuments([]);
          loadVerificationData();
        }}]
      );
    } catch (error) {
      console.error('[VerificationScreen] Error submitting verification:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la soumission. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove selected document
  const removeDocument = (id: string) => {
    setSelectedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Get level progress percentage
  const getProgressForNextLevel = (): number => {
    if (!verificationData) return 0;
    
    const levels: VerificationLevel[] = ['BASIC', 'VERIFIED', 'CERTIFIED', 'PREMIUM', 'ENTERPRISE'];
    const currentIdx = levels.indexOf(verificationData.currentLevel);
    const nextIdx = Math.min(currentIdx + 1, levels.length - 1);
    
    // Calculate based on approved verifications
    const totalRequired = VERIFICATION_TYPES.filter(v => v.required).length;
    const approvedCount = verificationData.verifications.filter(
      v => v.status === 'approved'
    ).length;
    
    return Math.min(100, Math.round((approvedCount / totalRequired) * 100));
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Vérification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status Card */}
        {verificationData && (
          <View style={styles.statusCard}>
            <View style={styles.levelContainer}>
              <View style={[styles.levelBadge, { backgroundColor: VERIFICATION_LEVELS[verificationData.currentLevel].color }]}>
                <Ionicons 
                  name={VERIFICATION_LEVELS[verificationData.currentLevel].icon as any} 
                  size={32} 
                  color={Colors.white} 
                />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelLabel}>Niveau actuel</Text>
                <Text style={[styles.levelName, { color: VERIFICATION_LEVELS[verificationData.currentLevel].color }]}>
                  {VERIFICATION_LEVELS[verificationData.currentLevel].label}
                </Text>
                <Text style={styles.scoreText}>
                  Score de confiance: {verificationData.score}/100
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getProgressForNextLevel()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{getProgressForNextLevel()}% vers le niveau suivant</Text>
            </View>

            {/* Badges */}
            {verificationData.badges.length > 0 && (
              <View style={styles.badgesSection}>
                <Text style={styles.sectionTitle}>Badges obtenus</Text>
                <View style={styles.badgesRow}>
                  {verificationData.badges.map(badge => (
                    <View key={badge.id} style={[styles.badgeItem, { backgroundColor: badge.color + '20' }]}>
                      <Ionicons 
                        name={(BADGE_ICONS[badge.icon] || 'medal') as any} 
                        size={20} 
                        color={badge.color} 
                      />
                      <Text style={[styles.badgeName, { color: badge.color }]}>
                        {badge.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Verification Types List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents à fournir</Text>
          
          {VERIFICATION_TYPES.map(item => {
            const verification = verificationData?.verifications.find(v => v.type === item.type);
            const isSubmitted = verification?.status === 'submitted' || verification?.status === 'under_review';
            const isApproved = verification?.status === 'approved';
            
            return (
              <TouchableOpacity
                key={item.type}
                style={[
                  styles.verificationItem,
                  isApproved && styles.verificationItemApproved,
                ]}
                onPress={() => {
                  if (!isApproved) {
                    setSelectedType(item.type);
                    setShowUploadModal(true);
                  }
                }}
                disabled={isApproved}
              >
                <View style={styles.verificationIconContainer}>
                  <Ionicons
                    name={
                      isApproved 
                        ? 'checkmark-circle' 
                        : isSubmitted 
                          ? 'time' 
                          : 'document-text-outline'
                    }
                    size={24}
                    color={
                      isApproved 
                        ? Colors.success 
                        : isSubmitted 
                          ? Colors.warning 
                          : Colors.textTertiary
                    }
                  />
                </View>
                
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationLabel}>{item.label}</Text>
                  <Text style={styles.verificationDescription}>{item.description}</Text>
                  
                  {verification && (
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(verification.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(verification.status) }
                      ]}>
                        {getStatusText(verification.status)}
                      </Text>
                    </View>
                  )}
                </View>

                <Ionicons 
                  name={isApproved ? 'lock-closed' : 'chevron-forward'} 
                  size={20} 
                  color={isApproved ? Colors.textTertiary : Colors.primary} 
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Documents Preview */}
        {selectedDocuments.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Documents sélectionnés ({selectedDocuments.length})</Text>
            
            {selectedDocuments.map(doc => (
              <View key={doc.id} style={styles.documentPreview}>
                <Image source={{ uri: doc.uri }} style={styles.documentImage} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {VERIFICATION_TYPES.find(t => t.type === doc.type)?.label || doc.type}
                  </Text>
                  <Text style={styles.documentStatus}>Prêt à envoyer</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDocument(doc.id)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={submitVerification}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Envoyer la demande</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Pourquoi se vérifier ?</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="trending-up-outline" size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>+40% de visibilité</Text>
              <Text style={styles.infoDescription}>Les fournisseurs vérifiés apparaissent en premier dans les recherches.</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Confiance accrue</Text>
              <Text style={styles.infoDescription}>Les acheteurs privilégient les fournisseurs certifiés.</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="chatbubbles-outline" size={20} color={Colors.warning} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Plus de contacts</Text>
              <Text style={styles.infoDescription}>Recevez jusqu'à 3x plus de demandes de devis.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un document</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => selectedType && pickDocument(selectedType)}
            >
              <Ionicons name="images-outline" size={28} color={Colors.primary} />
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>Depuis la galerie</Text>
                <Text style={styles.modalOptionDesc}>Choisir une image existante</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => selectedType && takePhoto(selectedType)}
            >
              <Ionicons name="camera-outline" size={28} color={Colors.primary} />
              <View style={styles.modalOptionContent}>
                <Text style={styles.modalOptionTitle}>Prendre une photo</Text>
                <Text style={styles.modalOptionDesc}>Utiliser l'appareil photo</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  statusCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  levelName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  badgesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeName: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  verificationItemApproved: {
    opacity: 0.7,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  verificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  verificationContent: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  verificationDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  selectedSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  documentImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  documentName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  documentStatus: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontFamily: FontFamily.regular,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
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
  infoSection: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  infoDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  modalOptionContent: {
    marginLeft: Spacing.md,
  },
  modalOptionTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  modalOptionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  modalCancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalCancelText: {
    fontSize: FontSize.base,
    color: Colors.error,
    fontFamily: FontFamily.medium,
  },
});
