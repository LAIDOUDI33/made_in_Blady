import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';
import StarRating from '../../components/StarRating';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows, AppConfig } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for demonstration
const CATEGORIES = [
  { id: '1', name: 'Agriculture', icon: '🌾', count: 3400, color: '#10B981' },
  { id: '2', name: 'Construction', icon: '🏗️', count: 5200, color: '#F59E0B' },
  { id: '3', name: 'Technologie', icon: '💻', count: 2800, color: '#3B82F6' },
  { id: '4', name: 'Alimentation', icon: '🍽️', count: 4100, color: '#EF4444' },
  { id: '5', name: 'Textile', icon: '👕', count: 1900, color: '#8B5CF6' },
  { id: '6', name: 'Chimie', icon: '🧪', count: 1500, color: '#EC4899' },
];

const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'Panneau Solaire 300W Monocristallin',
    price: 45000,
    currency: 'DZD',
    image: null,
    supplier: 'SolarTech Algérie',
    rating: 4.8,
    reviews: 124,
    location: 'Alger',
    category: 'Technologie',
  },
  {
    id: '2',
    name: 'Ciment Portland CE I 42.5 - Sac 50kg',
    price: 6500,
    currency: 'DZD',
    image: null,
    supplier: 'SCIMAT',
    rating: 4.6,
    reviews: 89,
    location: 'Skikda',
    category: 'Construction',
  },
  {
    id: '3',
    name: 'Huile d\'Olive Extra Vierge - Bidon 5L',
    price: 8500,
    currency: 'DZD',
    image: null,
    supplier: 'Les Oliviers de Béjaïa',
    rating: 4.9,
    reviews: 256,
    location: 'Béjaïa',
    category: 'Agriculture',
  },
];

const STATS = [
  { label: 'Fournisseurs', value: '2,500+', icon: 'business-outline' },
  { label: 'Produits', value: '50K+', icon: 'cube-outline' },
  { label: 'AO Actifs', value: '1,200+', icon: 'document-text-outline' },
  { label: 'Transactions', value: '15M+ DA', icon: 'swap-horizontal-outline' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigation.navigate('ProductList', { searchQuery: query });
    }
  };

  const handleCategoryPress = (categoryName: string) => {
    navigation.navigate('ProductList', { category: categoryName });
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item.name)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}20` }]}>
        <Text style={styles.categoryEmoji}>{item.icon}</Text>
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.count.toLocaleString()}</Text>
    </TouchableOpacity>
  );

  // Render featured product
  const renderFeaturedProduct = ({ item }: { item: typeof FEATURED_PRODUCTS[0] }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Product Image Placeholder */}
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="image-outline" size={40} color={Colors.textTertiary} />
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <StarRating rating={item.rating} size={14} showCount count={item.reviews} />
        
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
            {item.price.toLocaleString()} {item.currency}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </View>
        
        <View style={styles.supplierRow}>
          <Ionicons name="storefront-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.supplierName} numberOfLines={1}>{item.supplier}</Text>
          <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.subGreeting}>Trouvez les meilleurs fournisseurs</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          placeholder="Rechercher produits, fournisseurs..."
        />
      </View>

      {/* Stats Banner */}
      <View style={styles.statsContainer}>
        {STATS.map((stat, index) => (
          <View key={stat.label} style={[styles.statItem, index === STATS.length - 1 && styles.statItemLast]}>
            <Ionicons name={stat.icon as any} size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('CreateRFQ')}
          activeOpacity={0.7}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="add-circle" size={24} color={Colors.white} />
          </View>
          <Text style={styles.quickActionText}>Poster un AO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
          onPress={() => navigation.navigate('RFQList')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
          </View>
          <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>Voir les AO</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Categories Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Catégories</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Featured Products Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Produits populaires</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ProductList')}>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={FEATURED_PRODUCTS}
                renderItem={renderFeaturedProduct}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
              />
            </View>

            {/* Promotional Banner */}
            <TouchableOpacity style={styles.promoBanner} activeOpacity={0.8}>
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>Devenez Fournisseur</Text>
                <Text style={styles.promoSubtitle}>
                  Rejoignez +2500 entreprises sur AlgeriaTrade
                </Text>
                <View style={styles.promoButton}>
                  <Text style={styles.promoButtonText}>En savoir plus</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward-circle" size={60} color={`${Colors.white}30`} />
            </TouchableOpacity>
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTop: {
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
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
  notificationBadge: {
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${Colors.primary}08`,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: `${Colors.primary}20`,
  },
  statItemLast: {
    borderRightWidth: 0,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
    fontFamily: FontFamily.semiBold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  quickActionButtonSecondary: {
    backgroundColor: `${Colors.primary}10`,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.white}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconSecondary: {
    backgroundColor: `${Colors.primary}20`,
  },
  quickActionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  quickActionTextSecondary: {
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
  },
  categoryItem: {
    width: 90,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  categoryCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  productsList: {
    paddingHorizontal: Spacing.lg,
  },
  productCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  productImagePlaceholder: {
    height: 140,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: Spacing.md,
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  productPrice: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  supplierName: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  locationText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  promoBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: FontFamily.bold,
  },
  promoSubtitle: {
    fontSize: FontSize.sm,
    color: `${Colors.white}CC`,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },
  promoButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  promoButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  listContent: {
    paddingBottom: 100, // Space for bottom nav
  },
});
