import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import KPICard from '../../components/KPICard';
import Button from '../../components/Button';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../utils/constants';

const STATS = [
  { label: 'AO Publiés', value: '12', icon: 'document-text-outline', color: Colors.primary },
  { label: 'Devis Reçus', value: '48', icon: 'chatbubbles-outline', color: Colors.info },
  { label: 'Commandes', value: '8', icon: 'cube-outline', color: Colors.success },
  { label: 'Économies', value: '-15%', icon: 'trending-down-outline', color: Colors.warning },
];

const RECENT_RFQS = [
  { id: '1', title: 'Panneaux solaires 300W', status: 'open', responses: 12 },
  { id: '2', title: 'Ciment Portland 500 sacs', status: 'closed', responses: 8 },
  { id: '3', title: 'Système irrigation goutte-à-goutte', status: 'open', responses: 5 },
];

const QUICK_ACTIONS = [
  { label: 'Nouvel AO', icon: 'add-circle-outline', screen: 'CreateRFQ' as const },
  { label: 'Mes AO', icon: 'document-text-outline', screen: 'RFQList' as const },
  { label: 'Favoris', icon: 'heart-outline', screen: 'ProductList' as const },
  { label: 'Commandes', icon: 'cube-outline', screen: 'BuyerDashboard' as const },
];

export default function BuyerDashboard() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, Ahmed 👋</Text>
            <Text style={styles.subGreeting}>Bienvenue sur votre tableau de bord</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Messages' as never)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action.screen as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}10` }]}>
                <Ionicons name={action.icon as any} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            {STATS.map((stat) => (
              <KPICard
                key={stat.label}
                title={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            ))}
          </View>
        </View>

        {/* Recent RFQs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appels d'offres récents</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RFQList' as never)}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {RECENT_RFQS.map((rfq) => (
            <TouchableOpacity key={rfq.id} style={styles.rfqItem} activeOpacity={0.7}>
              <View style={styles.rfqInfo}>
                <Text style={styles.rfqTitle} numberOfLines={1}>{rfq.title}</Text>
                <View style={styles.rfqMeta}>
                  <View style={[
                    styles.statusBadge, 
                    rfq.status === 'open' ? styles.statusOpen : styles.statusClosed
                  ]}>
                    <Text style={[
                      styles.statusText,
                      rfq.status === 'open' ? styles.statusTextOpen : styles.statusTextClosed
                    ]}>
                      {rfq.status === 'open' ? 'Ouvert' : 'Fermé'}
                    </Text>
                  </View>
                  <Text style={styles.responsesCount}>
                    {rfq.responses} réponse{rfq.responses > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Promotional Banner */}
        <TouchableOpacity style={styles.promoBanner} activeOpacity={0.8}>
          <View style={styles.promoContent}>
            <Ionicons name="rocket-outline" size={24} color={Colors.white} />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Passez à un compte Premium</Text>
              <Text style={styles.promoSubtitle}>Accédez à des fonctionnalités exclusives</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={`${Colors.white}80`} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  quickAction: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rfqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rfqInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  rfqTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.xs,
  },
  rfqMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusOpen: {
    backgroundColor: `${Colors.success}15`,
  },
  statusClosed: {
    backgroundColor: `${Colors.textTertiary}15`,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  statusTextOpen: {
    color: Colors.success,
  },
  statusTextClosed: {
    color: Colors.textTertiary,
  },
  responsesCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  promoSubtitle: {
    fontSize: FontSize.sm,
    color: `${Colors.white}CC`,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
});
