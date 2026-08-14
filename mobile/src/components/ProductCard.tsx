import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadows } from '../utils/constants';

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

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.textTertiary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        {/* Rating */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={Colors.warning} />
          <Text style={styles.ratingText}>{product.rating}</Text>
          <Text style={styles.reviewsText}>({product.reviews})</Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>
          {product.price.toLocaleString()} {product.currency}
        </Text>

        {/* Supplier & Location */}
        <View style={styles.metaRow}>
          <Ionicons name="storefront-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.metaText} numberOfLines={1}>{product.supplier}</Text>
          <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.metaText}>{product.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  imageContainer: {
    height: 140,
    backgroundColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  reviewsText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontFamily: FontFamily.regular,
  },
  price: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontFamily: FontFamily.semiBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    flexShrink: 1,
    fontFamily: FontFamily.regular,
  },
});
