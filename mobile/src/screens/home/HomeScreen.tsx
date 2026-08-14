import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';
import StarRating from '../../components/StarRating';

// Services
import { offlineService, useOfflineStatus } from '../../services/offline';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for demonstration (would come from API)
const CATEGORIES = [
  { id: '1', name: 'Agriculture', icon: '🌾', count: 3400, color: '#10B981' },
  { id: '2', name: 'Construction', icon: '🏗️', count: 5200, color: '#F59E0B' },
  { id: '3', name: 'Technologie', icon: '💻', count: 2800, color: '#3B82F6' },
  { id: '4', name: 'Alimentation', icon: '🍽️', count: 4100, color: '#EF4444' },
  { id: '5', name: 'Textile', icon: '👕', count: 1900, color: '#8B5CF6' },
  { id: '6', name: 'Chimie', icon: '🧪', count: 1500, color: '#EC4899' },
];

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  supplier: string;
  rating: number;
  reviews: number;
  location: string;
  category: string;
}

const FEATURED_PRODUCTS: Product[] = [
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
    name: "Huile d'Olive Extra Vierge - Bidon 5L",
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
  { label: 'Produits', value: '2,500+', subtitle: 'Disponibles', color: '#006233' },
  { label: 'Fournisseurs', value: '850+', subtitle: 'Vérifiés', color: '#D52B1E' },
  { label: 'RFQs Actifs', value: '120', subtitle: 'En cours', color: '#F59E0B' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  // State
  const [products, setProducts] = useState<Product[]>(FEATURED_PRODUCTS);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(FEATURED_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Offline status hook
  const { isOnline, isOffline } = useOfflineStatus();
  
  // Ref for preventing race conditions
  const isMountedRef = useRef(true);

  // Load data with offline support
  const loadData = useCallback(async (showRefreshAnimation: boolean = false) => {
    try {
      if (showRefreshAnimation) {
        setRefreshing(true);
      }

      // Try to get cached data first for instant display
      const cachedProducts = await offlineService.getCachedData<Product[]>('home_products');
      const cachedFeatured = await offlineService.getCachedData<Product[]>('featured_products');
      
      if (cachedProducts && isMountedRef.current) {
        setProducts(cachedProducts);
        setLoading(false);
      }
      
      if (cachedFeatured && isMountedRef.current) {
        setFeaturedProducts(cachedFeatured);
      }

      // Fetch fresh data if online
      if (isOnline || await offlineService.isConnected()) {
        try {
          // Simulate API call - replace with actual API call
          // const response = await fetch(`${API_URL}/products?limit=20`);
          // const data = await response.json();
          
          // For now, using mock data with simulated delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const freshProducts: Product[] = FEATURED_PRODUCTS; // Would be data.data from API
          const freshFeatured: Product[] = FEATURED_PRODUCTS.slice(0, 3);
          
          if (isMountedRef.current) {
            setProducts(freshProducts);
            setFeaturedProducts(freshFeatured);
            setLastUpdated(new Date());
            
            // Cache the fresh data
            await offlineService.cacheData('home_products', freshProducts, 30); // 30 min TTL
            await offlineService.cacheData('featured_products', freshFeatured, 30);
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          // Keep cached data on display
          if (!cachedProducts && isMountedRef.current) {
            setLoading(false);
          }
        }
      } else {
        // Offline mode - show cached data or empty state
        if (!cachedProducts && isMountedRef.current) {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isOnline]);

  // Initial load and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Search handler
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigation.navigate('ProductList', { searchQuery: query });
    }
  };

  // Category press handler
  const handleCategoryPress = (categoryName: string) => {
    navigation.navigate('ProductList', { category: categoryName });
  };

  // Product press handler
  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  // Retry button handler
  const handleRetry = () => {
    setLoading(true);
    loadData();
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
  const renderFeaturedProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.7}
    >
      {/* Product Image Placeholder */}
      <View style={styles.productImagePlaceholder}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Ionicons name="image-outline" size={40} color={Colors.textTertiary} />
        )}
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

  // Render stat card
  const renderStatCard = ({ item, index }: { item: typeof STATS[0]; index: number }) => (
    <View key={item.label} style={[styles.statCard, index === STATS.length - 1 && styles.statCardLast]}>
      <View style={[styles.statIndicator, { backgroundColor: `${item.color}20` }]}>
        <View style={[styles.statDot, { backgroundColor: item.color }]} />
      </View>
      <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
      <Text style={styles.statSubtitle}>{item.subtitle}</Text>
    </View>
  );

  // Loading state
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
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {new Date().getHours() < 18 ? 'Bonjour 👋' : 'Bonsoir 🌙'}
            </Text>
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

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
            <Text style={styles.offlineText}>Mode hors ligne - Données mises en cache</Text>
          </View>
        )}

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          placeholder="Rechercher produits, fournisseurs..."
        />

        {/* Last Updated Indicator */}
        {lastUpdated && !refreshing && (
          <Text style={styles.lastUpdatedText}>
            Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {STATS.map((stat, index) => renderStatCard({ item: stat, index }))}
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

      {/* Main Content List */}
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
                <Text style={styles.sectionTitle}>⭐ Produits Vedettes</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ProductList')}>
                  <Text style={styles.seeAllText}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={featuredProducts}
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

            {/* All Products Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📦 Derniers Produits</Text>
              </View>
              
              <FlatList
                data={products.slice(0, 4)} // Show first 4 products in grid
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.gridProductCard}
                    onPress={() => handleProductPress(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.gridProductImagePlaceholder}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.gridProductImage} resizeMode="cover" />
                      ) : (
                        <Ionicons name="image-outline" size={30} color={Colors.textTertiary} />
                      )}
                    </View>
                    <View style={styles.gridProductInfo}>
                      <Text style={styles.gridProductName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.gridProductPrice}>{item.price.toLocaleString()} DZD</Text>
                      <View style={styles.gridSupplierRow}>
                        <Ionicons name="location-outline" size={10} color={Colors.textTertiary} />
                        <Text style={styles.gridLocationText} numberOfLines={1}>{item.location}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => `grid-${item.id}`}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>Aucun produit trouvé</Text>
                    {isOffline && (
                      <Text style={styles.emptySubtext}>Connectez-vous pour voir les derniers produits</Text>
                    )}
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                      <Ionicons name="refresh" size={18} color={Colors.white} />
                      <Text style={styles.retryButtonText}>Réessayer</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          </>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
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
    fontFamily: FontFamily.regular,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  offlineText: {
    color: '#92400E',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
  },
  lastUpdatedText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    textAlign: 'right',
    fontFamily: FontFamily.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    paddingHorizontal: Spacing.xs,
  },
  statCardLast: {
    borderRightWidth: 0,
  },
  statIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    fontFamily: FontFamily.semiBold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: Colors.textTertiary,
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
  productImage: {
    width: '100%',
    height: '100%',
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
  gridRow: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  gridProductCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    maxWidth: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    ...Shadows.sm,
  },
  gridProductImagePlaceholder: {
    height: 120,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridProductImage: {
    width: '100%',
    height: '100%',
  },
  gridProductInfo: {
    padding: Spacing.sm,
  },
  gridProductName: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
    marginBottom: 4,
  },
  gridProductPrice: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  gridSupplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  gridLocationText: {
    flex: 1,
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontFamily: FontFamily.medium,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
  },
});
