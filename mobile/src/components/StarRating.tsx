import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constants
import { Colors, FontFamily, FontSize, Spacing } from '../utils/constants';

interface StarRatingProps {
  rating: number;
  size?: number;
  showCount?: boolean;
  count?: number;
}

export default function StarRating({ 
  rating, 
  size = 16, 
  showCount = false,
  count 
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {/* Full Stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Ionicons
            key={`full-${index}`}
            name="star"
            size={size}
            color={Colors.warning}
          />
        ))}
        
        {/* Half Star */}
        {hasHalfStar && (
          <Ionicons
            name="star-half"
            size={size}
            color={Colors.warning}
          />
        )}
        
        {/* Empty Stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Ionicons
            key={`empty-${index}`}
            name="star-outline"
            size={size}
            color={Colors.warning}
          />
        ))}
      </View>
      
      {showCount && count !== undefined && (
        <Text style={styles.countText}>({count})</Text>
      )}
      
      {!showCount && (
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
});
