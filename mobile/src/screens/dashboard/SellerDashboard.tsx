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
  { label: 'Produits', value: '45', icon: 'cube-outline', color: Colors.primary },
  { label: 'Vues', value: '2.4K', icon: 'eye-outline', color: Colors.info },
  { label: 'Devis envoyés', value: '128', icon: 'chatbubbles-outline', color: Colors.success },
  { label: 'Taux réponse', value: '95%', icon: 'time-outline', color: Colors.warning },
];

const RECENT_ORDERS = [
  { id: '1', buyer: 'Ahmed B.', product: 'Panneau solaire 300W', amount: '135 000 DA', status: 'confirmed' },
  { id: '2', buyer: 'Karim M.', product: 'Ciment x50 sacs', amount: '325 000 DA', status: 'processing' },
  { id: '3', buyer: 'Sara L.', product: 'Huile olive 5L x10', amount: '85 000 DA', status: 'shipped' },
];

export default function SellerDashboard() {
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
            <Text style={styles.greeting}>Espace Fournisseur</Text>
            <Text style={styles.companyName}>SolarTech Algérie</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Verification Badge */}
        <View style={styles.verificationBanner}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.verificationText}>
            Compte vérifié • Réponse moyenne : 2h
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Ajouter un produit"
            icon="add-outline"
            onPress={() => {}}
            style={styles.actionButton}
            variant="outline"
          />
          <Button
            title="Voir les AO"
            icon="document-text-outline"
            onPress={() => navigation.navigate('RFQList' as never)}
            style={styles.actionButton}
          />
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {RECENT_ORDERS.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderItem} activeOpacity={0.7}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderBuyer}>{order.buyer}</Text>
                <Text style={styles.orderProduct} numberOfLines={1}>{order.product}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>{order.amount}</Text>
                <View style={[
                  styles.statusBadge,
                  order.status === 'confirmed' && styles.statusConfirmed,
                  order.status === 'processing' && styles.statusProcessing,
                  order.status === 'shipped' && styles.statusShipped,
                ]}>
                  <Text style={[
                    styles.statusText,
                    order.status === 'confirmed' && styles.statusTextConfirmed,
                    order.status === 'processing' && styles.statusTextProcessing,
                    order.status === 'shipped' && styles.statusTextShipped,
                  ]}>
                    {order.status === 'confirmed' ? 'Confirmée' : 
                     order.status === 'processing' ? 'En cours' : 'Expédiée'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={24} color={Colors.warning} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Conseil du jour</Text>
            <Text style={styles.tipsText}>
              Répondez aux AO dans les 2h pour augmenter vos chances de conversion de 40%.
            </Text>
          </View>
        </View>
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
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  companyName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}10`,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  verificationText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontFamily: FontFamily.medium,
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
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  orderBuyer: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  orderProduct: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusConfirmed: {
    backgroundColor: `${Colors.success}15`,
  },
  statusProcessing: {
    backgroundColor: `${Colors.warning}15`,
  },
  statusShipped: {
    backgroundColor: `${Colors.info}15`,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  statusTextConfirmed: {
    color: Colors.success,
  },
  statusTextProcessing: {
    color: Colors.warning,
  },
  statusTextShipped: {
    color: Colors.info,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: `${Colors.warning}08`,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
});
