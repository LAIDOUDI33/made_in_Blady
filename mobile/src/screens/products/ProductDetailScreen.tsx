import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// Components
import Button from '../../components/Button';
import StarRating from '../../components/StarRating';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../../utils/constants';

// Types
import { RootStackParamList } from '../../navigation';

type RouteProps = RouteProp<RootStackParamList, 'ProductDetail'>;

const MOCK_PRODUCT = {
  id: '1',
  name: 'Panneau Solaire 300W Monocristallin',
  description: 'Panneau solaire photovoltaïque de haute efficacité pour installations résidentielles et commerciales. Garantie 25 ans sur la puissance de sortie. Résistant aux conditions climatiques extrêmes.',
  price: 45000,
  currency: 'DZD',
  supplier: {
    id: '1',
    name: 'SolarTech Algérie',
    location: 'Alger',
    verified: true,
    rating: 4.8,
    productsCount: 45,
    responseRate: 95,
  },
  rating: 4.8,
  reviews: 124,
  images: [],
  specifications: [
    { label: 'Puissance', value: '300W' },
    { label: 'Type', value: 'Monocristallin' },
    { label: 'Efficacité', value: '21.5%' },
    { label: 'Dimensions', value: '1640 x 992 x 35 mm' },
    { label: 'Poids', value: '18.5 kg' },
    { label: 'Garantie produit', value: '10 ans' },
    { label: 'Garantie puissance', value: '25 ans' },
  ],
  inStock: true,
  minOrder: 1,
  deliveryTime: '3-5 jours ouvrables',
};

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ${MOCK_PRODUCT.name} sur AlgeriaTrade - ${MOCK_PRODUCT.price.toLocaleString()} ${MOCK_PRODUCT.currency}`,
      });
    } catch (error) {
      // Handle error or user dismissal
    }
  };

  const handleContactSupplier = () => {
    Alert.alert(
      'Contacter le fournisseur',
      `Envoyer un message à ${MOCK_PRODUCT.supplier.name}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Contacter', onPress: () => navigation.navigate('Messages' as never) },
      ]
    );
  };

  const handleRequestQuote = () => {
    Alert.alert(
      'Demander un devis',
      `Demander un devis pour ${quantity} unité(s) de ce produit`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => navigation.navigate('CreateRFQ' as never) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Placeholder */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={80} color={Colors.textTertiary} />
            <Text style={styles.imagePlaceholderText}>Image du produit</Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={[styles.actionButton, isFavorite && styles.actionButtonActive]}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFavorite ? Colors.error : Colors.text} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stock Badge */}
          {MOCK_PRODUCT.inStock ? (
            <View style={styles.stockBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.stockBadgeText}>En stock</Text>
            </View>
          ) : (
            <View style={[styles.stockBadge, styles.outOfStockBadge]}>
              <Ionicons name="close-circle" size={14} color={Colors.error} />
              <Text style={[styles.stockBadgeText, styles.outOfStockText]}>Rupture de stock</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.headerSection}>
            <Text style={styles.productName}>{MOCK_PRODUCT.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {MOCK_PRODUCT.price.toLocaleString()} {MOCK_PRODUCT.currency}
              </Text>
              <Text style={styles.taxInfo}>HT</Text>
            </View>
            
            {/* Rating */}
            <View style={styles.ratingRow}>
              <StarRating rating={MOCK_PRODUCT.rating} size={18} showCount count={MOCK_PRODUCT.reviews} />
              <Text style={styles.reviewCount}>({MOCK_PRODUCT.reviews} avis)</Text>
            </View>
          </View>

          {/* Supplier Info */}
          <TouchableOpacity style={styles.supplierCard} activeOpacity={0.7}>
            <View style={styles.supplierAvatar}>
              <Text style={styles.supplierAvatarText}>
                {MOCK_PRODUCT.supplier.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.supplierInfo}>
              <View style={styles.supplierNameRow}>
                <Text style={styles.supplierName}>{MOCK_PRODUCT.supplier.name}</Text>
                {MOCK_PRODUCT.supplier.verified && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.supplierLocation}>
                <Ionicons name="location-outline" size={12} /> {MOCK_PRODUCT.supplier.location}
              </Text>
              <View style={styles.supplierStats}>
                <Text style={styles.supplierStat}>
                  {MOCK_PRODUCT.supplier.productsCount} produits
                </Text>
                <Text style={styles.supplierStat}>•</Text>
                <Text style={styles.supplierStat}>
                  Taux de réponse: {MOCK_PRODUCT.supplier.responseRate}%
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{MOCK_PRODUCT.description}</Text>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spécifications</Text>
            <View style={styles.specsContainer}>
              {MOCK_PRODUCT.specifications.map((spec, index) => (
                <View key={index} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.deliverySection}>
            <Ionicons name="truck-outline" size={24} color={Colors.primary} />
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>Livraison</Text>
              <Text style={styles.deliveryTime}>{MOCK_PRODUCT.deliveryTime}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {/* Quantity Selector */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Contacter"
            variant="outline"
            onPress={handleContactSupplier}
            style={styles.contactButton}
          />
          <Button
            title="Demander un devis"
            onPress={handleRequestQuote}
            style={styles.quoteButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  imagePlaceholder: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  imagePlaceholderText: {
    marginTop: Spacing.sm,
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
  },
  imageActions: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: center',
    ...Shadows.md,
  },
  actionButtonActive: {
    backgroundColor: `${Colors.error}10`,
  },
  stockBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: `${Colors.success}15`,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  outOfStockBadge: {
    backgroundColor: `${Colors.error}15`,
  },
  stockBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.success,
    fontFamily: FontFamily.medium,
  },
  outOfStockText: {
    color: Colors.error,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  productName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  taxInfo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  reviewCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  supplierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  supplierAvatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  supplierName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  supplierLocation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  supplierStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  supplierStat: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    fontFamily: FontFamily.semiBold,
  },
  description: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
  },
  specsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  specLabel: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  specValue: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${Colors.primary}08`,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  deliveryTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.lg,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    width: 44,
    textAlign: 'center',
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  contactButton: {
    flex: 1,
  },
  quoteButton: {
    flex: 2,
  },
});
