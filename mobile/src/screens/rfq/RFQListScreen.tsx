import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Labels, RFQStatus } from '../../utils/constants';

interface RFQ {
  id: string;
  title: string;
  category: string;
  quantity: string;
  budget?: string;
  status: keyof typeof RFQStatus;
  responsesCount: number;
  createdAt: string;
  deadline: string;
}

const MOCK_RFQS: RFQ[] = [
  {
    id: '1',
    title: 'Panneaux solaires pour projet agricole',
    category: 'Énergie solaire',
    quantity: '50 unités',
    budget: '2 000 000 - 3 000 000 DA',
    status: 'OPEN',
    responsesCount: 12,
    createdAt: '2024-01-15',
    deadline: '2024-02-15',
  },
  {
    id: '2',
    title: 'Ciment Portland pour construction villa',
    category: 'Matériaux construction',
    quantity: '500 sacs',
    status: 'CLOSED',
    responsesCount: 8,
    createdAt: '2024-01-10',
    deadline: '2024-02-10',
  },
  {
    id: '3',
    title: 'Système d\'irrigation goutte à goutte',
    category: 'Agriculture',
    quantity: '10 hectares',
    budget: '500 000 - 800 000 DA',
    status: 'OPEN',
    responsesCount: 5,
    createdAt: '2024-01-12',
    deadline: '2024-02-12',
  },
];

const STATUS_CONFIG = {
  OPEN: { label: 'Ouvert', color: Colors.success, bgColor: `${Colors.success}15` },
  CLOSED: { label: 'Fermé', color: Colors.textTertiary, bgColor: `${Colors.textTertiary}15` },
  EXPIRED: { label: 'Expiré', color: Colors.error, bgColor: `${Colors.error}15` },
  DRAFT: { label: 'Brouillon', color: Colors.warning, bgColor: `${Colors.warning}15` },
};

export default function RFQListScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const filteredRFQS = filterStatus === 'all' 
    ? MOCK_RFQS 
    : MOCK_RFQS.filter(rfq => rfq.status === filterStatus);

  const renderRFQ = ({ item }: { item: RFQ }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    
    return (
      <TouchableOpacity style={styles.rfqCard} activeOpacity={0.7}>
        <View style={styles.rfqHeader}>
          <Text style={styles.rfqTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.rfqDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.category}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.quantity}</Text>
          </View>

          {item.budget && (
            <View style={styles.detailItem}>
              <Ionicons name="wallet-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{item.budget}</Text>
            </View>
          )}
        </View>

        <View style={styles.rfqFooter}>
          <View style={styles.responsesContainer}>
            <Ionicons name="chatbubbles-outline" size={16} color={Colors.primary} />
            <Text style={styles.responsesText}>{item.responsesCount} réponse{item.responsesCount > 1 ? 's' : ''}</Text>
          </View>
          
          <View style={styles.datesContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.dateText}>Expire: {item.deadline}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Labels.myRFQs}</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('CreateRFQ' as never)}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.newButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'OPEN', 'CLOSED'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === status && styles.filterTabTextActive,
              ]}
            >
              {status === 'all' ? 'Tous' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RFQs List */}
      <FlatList
        data={filteredRFQS}
        renderItem={renderRFQ}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun appel d'offres</Text>
            <Text style={styles.emptySubtitle}>
              Commencez par poster votre premier appel d'offres
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRFQ' as never)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  newButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  rfqCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  rfqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  rfqTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
    fontFamily: FontFamily.semiBold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  rfqDetails: {
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  rfqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  responsesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responsesText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    fontFamily: FontFamily.semiBold,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
});

const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
