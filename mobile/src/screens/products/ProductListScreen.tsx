import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// Components
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Labels } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type RouteProps = RouteProp<RootStackParamList, 'ProductList'>;

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  image?: string | null;
  supplier: string;
  rating: number;
  reviews: number;
  location: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Panneau Solaire 300W Monocristallin', price: 45000, currency: 'DZD', image: null, supplier: 'SolarTech Algérie', rating: 4.8, reviews: 124, location: 'Alger' },
  { id: '2', name: 'Ciment Portland CE I 42.5 - Sac 50kg', price: 6500, currency: 'DZD', image: null, supplier: 'SCIMAT', rating: 4.6, reviews: 89, location: 'Skikda' },
  { id: '3', name: "Huile d'Olive Extra Vierge - Bidon 5L", price: 8500, currency: 'DZD', image: null, supplier: 'Les Oliviers de Béjaïa', rating: 4.9, reviews: 256, location: 'Béjaïa' },
  { id: '4', name: 'Tôle Galvanisée 2mm - Plaque 2x1m', price: 12000, currency: 'DZD', image: null, supplier: 'MétalPro', rating: 4.5, reviews: 67, location: 'Oran' },
  { id: '5', name: 'Pompe Submersible 1HP - Forage', price: 35000, currency: 'DZD', image: null, supplier: 'HydroEquip', rating: 4.7, reviews: 98, location: 'Blida' },
  { id: '6', name: 'Câble Électrique 4mm² - Rouleau 100m', price: 28000, currency: 'DZD', image: null, supplier: 'CableAlgerie', rating: 4.4, reviews: 156, location: 'Constantine' },
];

export default function ProductListScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || '');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('rating');

  const category = route.params?.category;

  useEffect(() => {
    // Load products based on category or search query
    loadProducts();
  }, [category, route.params?.searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let filteredProducts = [...MOCK_PRODUCTS];
    
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
    }
    
    setProducts(filteredProducts);
    setLoading(false);
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail' as never, { productId } as never);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item.id)}
    />
  );

  const getTitle = () => {
    if (searchQuery) return `Résultats pour "${searchQuery}"`;
    if (category) return category;
    return Labels.products;
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadProducts}
          placeholder="Rechercher des produits..."
        />
        
        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
            onPress={() => setSortBy('rating')}
          >
            <Ionicons name="star" size={14} color={sortBy === 'rating' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
              Populaire
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'price-asc' && styles.sortButtonActive]}
            onPress={() => setSortBy('price-asc')}
          >
            <Ionicons name="arrow-up" size={14} color={sortBy === 'price-asc' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.sortButtonText, sortBy === 'price-asc' && styles.sortButtonTextActive]}>
              Prix ↑
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'price-desc' && styles.sortButtonActive]}
            onPress={() => setSortBy('price-desc')}
          >
            <Ionicons name="arrow-down" size={14} color={sortBy === 'price-desc' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.sortButtonText, sortBy === 'price-desc' && styles.sortButtonTextActive]}>
              Prix ↓
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsCountText}>
          {products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{Labels.loading}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySubtitle}>
            Essayez d'autres mots-clés ou catégories
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  sortButtonTextActive: {
    color: Colors.white,
  },
  resultsCount: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  resultsCountText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
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
  productsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
});
