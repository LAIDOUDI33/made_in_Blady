// Escrow Detail Screen - AlgeriaTrade Mobile
// Écran de détail du compte séquestre (Trade Assurance)

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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';

// Services
import apiService from '../../services/api';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type EscrowDetailRouteProp = RouteProp<RootStackParamList, 'EscrowDetail'>;

// ============================================
// Types & Interfaces
// ============================================

export type EscrowStatus = 
  | 'pending'
  | 'funded'
  | 'in_escrow'
  | 'release_requested'
  | 'released'
  | 'refund_requested'
  | 'refunded'
  | 'disputed'
  | 'cancelled';

export type DisputeStatus = 
  | 'open'
  | 'investigating'
  | 'mediation'
  | 'arbitration'
  | 'resolved'
  | 'closed';

export type DisputeReason =
  | 'not_as_described'
  | 'quality_issues'
  | 'shipping_delay'
  | 'damaged_goods'
  | 'wrong_quantity'
  | 'counterfeit'
  | 'other';

interface EscrowTimelineEvent {
  id: string;
  status: EscrowStatus;
  label: string;
  description?: string;
  timestamp: Date;
  completed: boolean;
}

interface DisputeMessage {
  id: string;
  senderId: string;
  senderRole: 'buyer' | 'seller' | 'mediator';
  content: string;
  attachments?: Array<{ uri: string; name: string }>;
  createdAt: Date;
}

interface Dispute {
  id: string;
  reason: DisputeReason;
  status: DisputeStatus;
  description: string;
  requestedAmount: number;
  evidencePhotos: Array<{ uri: string; name: string }>;
  messages: DisputeMessage[];
  mediatorId?: string;
  mediatorName?: string;
  deadline?: Date;
  resolvedAt?: Date;
  resolution?: string;
}

interface EscrowData {
  id: string;
  orderId: string;
  accountNumber: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  buyerId: string;
  sellerId: string;
  fundedAt?: Date;
  releaseRequestedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  autoReleaseDays: number;
  platformFee: number;
  dispute?: Dispute;
  timeline: EscrowTimelineEvent[];
}

// ============================================
// Constants
// ============================================

const ESCROW_STATUS_CONFIG: Record<EscrowStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'En attente', color: Colors.textTertiary, icon: 'time-outline' },
  funded: { label: 'Financé', color: Colors.info, icon: 'wallet-outline' },
  in_escrow: { label: 'En séquestre', color: Colors.primary, icon: 'shield-checkmark-outline' },
  release_requested: { label: 'Libération demandée', color: Colors.warning, icon: 'arrow-up-outline' },
  released: { label: 'Libéré', color: Colors.success, icon: 'checkmark-circle' },
  refund_requested: { label: 'Remboursement demandé', color: Colors.warning, icon: 'refresh-outline' },
  refunded: { label: 'Remboursé', color: Colors.info, icon: 'arrow-down-outline' },
  disputed: { label: 'En litige', color: Colors.error, icon: 'alert-circle-outline' },
  cancelled: { label: 'Annulé', color: Colors.error, icon: 'close-circle-outline' },
};

const DISPUTE_REASONS: Array<{ value: DisputeReason; label: string; description: string }> = [
  { value: 'not_as_described', label: 'Produit non conforme', description: 'Le produit ne correspond pas à la description' },
  { value: 'quality_issues', label: 'Problèmes de qualité', description: 'Défauts ou problèmes de qualité constatés' },
  { value: 'shipping_delay', label: 'Retard de livraison', description: 'La livraison est en retard significatif' },
  { value: 'damaged_goods', label: 'Produits endommagés', description: 'Les produits ont été endommagés lors du transport' },
  { value: 'wrong_quantity', label: 'Quantité incorrecte', description: 'La quantité reçue ne correspond pas' },
  { value: 'counterfeit', label: 'Produit contrefait', description: 'Suspicion de contrefaçon' },
  { value: 'other', label: 'Autre raison', description: 'Autre motif de litige' },
];

// ============================================
// Main Component
// ============================================

export default function EscrowDetailScreen() {
  const route = useRoute<EscrowDetailRouteProp>();
  const navigation = useNavigation();
  
  const { escrowId } = route.params || {};
  
  // State
  const [loading, setLoading] = useState(true);
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<DisputeReason>('not_as_described');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load escrow data
  const loadEscrowData = useCallback(async () => {
    if (!escrowId) return;
    
    try {
      const data = await apiService.getEscrowDetail(escrowId);
      setEscrowData(data);
    } catch (error) {
      console.error('[EscrowDetailScreen] Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du compte séquestre.');
    } finally {
      setLoading(false);
    }
  }, [escrowId]);

  useEffect(() => {
    loadEscrowData();
  }, [loadEscrowData]);

  // Fund escrow account
  const handleFundEscrow = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    setActionLoading(true);
    
    try {
      await apiService.fundEscrow(escrowId!, parseFloat(fundAmount));
      Alert.alert('Succès', 'Le compte a été financé avec succès.', [
        { text: 'OK', onPress: () => {
          setShowFundModal(false);
          loadEscrowData();
        }}
      ]);
    } catch (error) {
      console.error('[EscrowDetailScreen] Error funding escrow:', error);
      Alert.alert('Erreur', 'Impossible de financer le compte. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Request release
  const handleRequestRelease = async () => {
    Alert.alert(
      'Confirmer la libération',
      'Êtes-vous sûr de vouloir demander la libération des fonds ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.requestRelease(escrowId!);
              Alert.alert('Succès', 'La demande de libération a été envoyée.', [
                { text: 'OK', onPress: loadEscrowData }
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'envoyer la demande.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Request refund
  const handleRequestRefund = async () => {
    Alert.alert(
      'Demander un remboursement',
      'Souhaitez-vous ouvrir un litige pour ce remboursement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ouvrir un litige', onPress: () => setShowDisputeModal(true) },
        {
          text: 'Remboursement simple',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.requestRefund(escrowId!);
              Alert.alert('Succès', 'La demande de remboursement a été envoyée.', [
                { text: 'OK', onPress: loadEscrowData }
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'envoyer la demande.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Submit dispute
  const handleSubmitDispute = async () => {
    if (!disputeDescription.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire le problème en détail.');
      return;
    }

    setActionLoading(true);
    
    try {
      await apiService.openDispute(escrowId!, {
        reason: selectedReason,
        description: disputeDescription,
      });
      
      Alert.alert('Litige ouvert', 'Votre litige a été soumis. Un médiateur sera assigné sous 24h.', [
        { text: 'OK', onPress: () => {
          setShowDisputeModal(false);
          setDisputeDescription('');
          loadEscrowData();
        }}
      ]);
    } catch (error) {
      console.error('[EscrowDetailScreen] Error opening dispute:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le litige.');
    } finally {
      setActionLoading(false);
    }
  };

  // Accept resolution
  const handleAcceptResolution = async (type: 'release' | 'refund') => {
    const actionText = type === 'release' ? 'accepter la libération' : 'accepter le remboursement';
    
    Alert.alert(
      `Confirmer`,
      `Êtes-vous sûr de vouloir ${actionText} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setActionLoading(true);
            try {
              if (type === 'release') {
                await apiService.acceptRelease(escrowId!);
              } else {
                await apiService.acceptRefund(escrowId!);
              }
              Alert.alert('Succès', 'La résolution a été acceptée.', [
                { text: 'OK', onPress: loadEscrowData }
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Send message to mediator
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      await apiService.sendDisputeMessage(escrowId!, chatMessage);
      setChatMessage('');
      loadEscrowData(); // Reload to show new message
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    }
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

  if (!escrowData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Données non disponibles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEscrowData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = ESCROW_STATUS_CONFIG[escrowData.status];

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
        <Text style={styles.headerTitle}>Trade Assurance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusConfig.color }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon as any} size={28} color={statusConfig.color} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Statut actuel</Text>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Montant en séquestre</Text>
            <Text style={styles.amountValue}>
              {escrowData.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {escrowData.currency}
            </Text>
          </View>

          {/* Account Info */}
          <View style={styles.accountInfo}>
            <Text style={styles.accountNumber}>
              N° Compte: {escrowData.accountNumber}
            </Text>
            <Text style={styles.autoReleaseText}>
              Libération automatique dans {escrowData.autoReleaseDays} jours
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          
          <View style={styles.timeline}>
            {escrowData.timeline.map((event, index) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineDotContainer}>
                  <View style={[
                    styles.timelineDot,
                    event.completed 
                      ? { backgroundColor: Colors.primary } 
                      : { backgroundColor: Colors.surfaceVariant, borderWidth: 2, borderColor: Colors.border }
                  ]}/>
                  {index < escrowData.timeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    !event.completed && styles.timelineLabelPending
                  ]}>
                    {event.label}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {new Date(event.timestamp).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {event.description && (
                    <Text style={styles.timelineDescription}>{event.description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {escrowData.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowFundModal(true)}
            >
              <Ionicons name="wallet-outline" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Financer le compte</Text>
            </TouchableOpacity>
          )}

          {(escrowData.status === 'funded' || escrowData.status === 'in_escrow') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.releaseButton]}
                onPress={handleRequestRelease}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Confirmer la réception</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.refundButton]}
                onPress={handleRequestRefund}
              >
                <Ionicons name="return-down-back-outline" size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Demander un remboursement</Text>
              </TouchableOpacity>
            </>
          )}

          {escrowData.status === 'released' && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.completedText}>Les fonds ont été libérés au vendeur</Text>
            </View>
          )}

          {escrowData.status === 'refunded' && (
            <View style={styles.refundedBanner}>
              <Ionicons name="arrow-back-circle" size={24} color={Colors.info} />
              <Text style={styles.refundedText}>Vous avez été remboursé</Text>
            </View>
          )}
        </View>

        {/* Dispute Section */}
        {escrowData.dispute && (
          <View style={[styles.disputeCard, { borderLeftColor: Colors.error }]}>
            <View style={styles.disputeHeader}>
              <Ionicons name="alert-triangle" size={24} color={Colors.error} />
              <View style={styles.disputeHeaderInfo}>
                <Text style={styles.disputeTitle}>Litige en cours</Text>
                <Text style={styles.disputeReason}>
                  {DISPUTE_REASONS.find(r => r.value === escrowData.dispute?.reason)?.label}
                </Text>
              </View>
            </View>

            {/* Dispute Status */}
            <View style={styles.disputeStatusBadge}>
              <Text style={styles.disputeStatusText}>
                Statut: {escrowData.dispute.status.toUpperCase()}
              </Text>
            </View>

            {/* Mediator Info */}
            {escrowData.dispute.mediatorName && (
              <View style={styles.mediatorInfo}>
                <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.mediatorText}>
                  Médiateur: {escrowData.dispute.mediatorName}
                </Text>
              </View>
            )}

            {/* Deadline */}
            {escrowData.dispute.deadline && (
              <View style={styles.deadlineInfo}>
                <Ionicons name="time-outline" size={16} color={Colors.warning} />
                <Text style={styles.deadlineText}>
                  Date limite: {new Date(escrowData.dispute.deadline).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}

            {/* Chat with Mediator */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => setShowChatModal(true)}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
              <Text style={styles.chatButtonText}>Contacter le médiateur</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            {/* Messages Preview */}
            {escrowData.dispute.messages.length > 0 && (
              <View style={styles.messagesPreview}>
                {escrowData.dispute.messages.slice(-3).map(msg => (
                  <View 
                    key={msg.id} 
                    style={[
                      styles.messageBubble,
                      msg.senderRole === 'mediator' ? styles.mediatorBubble : styles.userBubble
                    ]}
                  >
                    <Text style={styles.messageSender}>
                      {msg.senderRole === 'mediator' ? 'Médiateur' : 'Vous'}
                    </Text>
                    <Text style={styles.messageContent}>{msg.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Resolution Actions */}
            {escrowData.dispute.status === 'resolved' && escrowData.dispute.resolution && (
              <View style={styles.resolutionSection}>
                <Text style={styles.resolutionTitle}>Résolution proposée:</Text>
                <Text style={styles.resolutionText}>{escrowData.dispute.resolution}</Text>
                <View style={styles.resolutionActions}>
                  <TouchableOpacity
                    style={[styles.resolutionButton, styles.acceptReleaseButton]}
                    onPress={() => handleAcceptResolution('release')}
                  >
                    <Text style={styles.resolutionButtonText}>Accepter la libération</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolutionButton, styles.acceptRefundButton]}
                    onPress={() => handleAcceptResolution('refund')}
                  >
                    <Text style={styles.resolutionButtonText}>Accepter le remboursement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fund Modal */}
      <Modal visible={showFundModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Financer le compte séquestre</Text>
            
            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>Montant ({escrowData.currency})</Text>
              <TextInput
                style={styles.amountInput}
                value={fundAmount}
                onChangeText={setFundAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <Text style={styles.feeInfo}>
              Frais de plateforme: {escrowData.platformFee}%
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowFundModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleFundEscrow}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={showDisputeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Ouvrir un litige</Text>
            
            <Text style={styles.inputLabel}>Motif du litige</Text>
            <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
              {DISPUTE_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason.value && styles.reasonItemSelected
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <View style={[
                    styles.reasonRadio,
                    selectedReason === reason.value && styles.reasonRadioSelected
                  ]}>
                    {selectedReason === reason.value && (
                      <View style={styles.reasonRadioInner} />
                    )}
                  </View>
                  <View style={styles.reasonContent}>
                    <Text style={styles.reasonLabel}>{reason.label}</Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Description détaillée</Text>
            <TextInput
              style={styles.descriptionInput}
              value={disputeDescription}
              onChangeText={setDisputeDescription}
              multiline
              numberOfLines={4}
              placeholder="Décrivez le problème en détail..."
              placeholderTextColor={Colors.textTertiary}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDisputeModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalConfirmButton, styles.disputeConfirmButton]}
                onPress={handleSubmitDispute}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Soumettre le litige</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={showChatModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.chatModalContent]}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setShowChatModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.chatHeaderText}>Discussion avec le médiateur</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Messages */}
            <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
              {escrowData.dispute?.messages.map(msg => (
                <View 
                  key={msg.id}
                  style={[
                    styles.chatMessageRow,
                    msg.senderRole === 'mediator' ? {} : styles.chatMessageRowOwn
                  ]}
                >
                  <View style={[
                    styles.chatBubble,
                    msg.senderRole === 'mediator' ? styles.chatBubbleMediator : styles.chatBubbleOwn
                  ]}>
                    <Text style={styles.chatSender}>
                      {msg.senderRole === 'mediator' ? 'Médiateur' : 'Vous'}
                    </Text>
                    <Text style={styles.chatText}>{msg.content}</Text>
                    <Text style={styles.chatTime}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder="Écrivez votre message..."
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={!chatMessage.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={chatMessage.trim() ? Colors.primary : Colors.textTertiary} 
                />
              </TouchableOpacity>
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
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
    borderLeftWidth: 4,
    ...Shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  statusText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    fontFamily: FontFamily.bold,
  },
  amountSection: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  amountLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.xs,
  },
  amountValue: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  accountInfo: {
    marginTop: Spacing.md,
  },
  accountNumber: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  autoReleaseText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.md,
  },
  timeline: {
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: Spacing.lg,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: Spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 1,
  },
  timelineLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  timelineLabelPending: {
    color: Colors.textTertiary,
  },
  timelineTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  timelineDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  actionsSection: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  releaseButton: {
    backgroundColor: Colors.success,
  },
  refundButton: {
    backgroundColor: Colors.warning,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  completedText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },
  refundedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  refundedText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.info,
    fontFamily: FontFamily.medium,
  },
  disputeCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  disputeHeaderInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  disputeTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.error,
    fontFamily: FontFamily.semiBold,
  },
  disputeReason: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  disputeStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  disputeStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.error,
    fontFamily: FontFamily.semiBold,
  },
  mediatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  mediatorText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  deadlineText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    marginLeft: Spacing.xs,
    fontFamily: FontFamily.medium,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chatButtonText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.sm,
    fontFamily: FontFamily.medium,
  },
  messagesPreview: {
    marginBottom: Spacing.md,
  },
  messageBubble: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  mediatorBubble: {
    backgroundColor: Colors.surface,
  },
  userBubble: {
    backgroundColor: Colors.primaryLight + '20',
  },
  messageSender: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
    fontFamily: FontFamily.semiBold,
  },
  messageContent: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  resolutionSection: {
    padding: Spacing.md,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  resolutionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.xs,
  },
  resolutionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.md,
  },
  resolutionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  resolutionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  acceptReleaseButton: {
    backgroundColor: Colors.success,
  },
  acceptRefundButton: {
    backgroundColor: Colors.info,
  },
  resolutionButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
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
  amountInputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.xs,
  },
  amountInput: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.xl,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  feeInfo: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
  },
  reasonsList: {
    maxHeight: 200,
    marginBottom: Spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  reasonItemSelected: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reasonRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonRadioSelected: {
    borderColor: Colors.primary,
  },
  reasonRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  reasonDescription: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  descriptionInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  modalCancelText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  disputeConfirmButton: {
    backgroundColor: Colors.error,
  },
  modalConfirmText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  chatModalContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  chatHeaderText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  chatMessages: {
    flex: 1,
    maxHeight: 300,
    marginBottom: Spacing.md,
  },
  chatMessageRow: {
    marginBottom: Spacing.sm,
  },
  chatMessageRowOwn: {
    alignItems: 'flex-end',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  chatBubbleMediator: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 4,
  },
  chatBubbleOwn: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  chatSender: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: FontFamily.semiBold,
  },
  chatText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  chatTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
    fontFamily: FontFamily.regular,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: FontSize.base,
    color: Colors.text,
    paddingVertical: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
});
