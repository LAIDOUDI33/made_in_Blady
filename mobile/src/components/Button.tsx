import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Constants
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: object;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const getButtonStyles = () => {
    const baseStyles: any[] = [styles.button];

    // Variant
    switch (variant) {
      case 'outline':
        baseStyles.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyles.push(styles.buttonGhost);
        break;
      case 'secondary':
        baseStyles.push(styles.buttonSecondary);
        break;
      default:
        baseStyles.push(styles.buttonPrimary);
    }

    // Size
    switch (size) {
      case 'small':
        baseStyles.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyles.push(styles.buttonLarge);
        break;
      default:
        baseStyles.push(styles.buttonMedium);
    }

    // Full width
    if (fullWidth) {
      baseStyles.push(styles.buttonFullWidth);
    }

    // Disabled state
    if (disabled || loading) {
      baseStyles.push(styles.buttonDisabled);
    }

    return baseStyles;
  };

  const getTextStyles = (): any[] => {
    const textStyles: any[] = [styles.text];

    switch (variant) {
      case 'outline':
        textStyles.push(styles.textOutline);
        break;
      case 'ghost':
        textStyles.push(styles.textGhost);
        break;
      case 'secondary':
        textStyles.push(styles.textSecondary);
        break;
      default:
        textStyles.push(styles.textPrimary);
    }

    if (size === 'small') {
      textStyles.push(styles.textSmall);
    }

    return textStyles;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={variant === 'primary' ? Colors.white : Colors.primary} 
        />
      ) : (
        <>
          {icon && !loading && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : 18} 
              color={variant === 'primary' ? Colors.white : Colors.primary} 
              style={styles.icon}
            />
          )}
          <Text style={getTextStyles()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  // Variants
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonSecondary: {
    backgroundColor: Colors.surface,
  },
  // Sizes
  buttonSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttonMedium: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  buttonLarge: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  // Full Width
  buttonFullWidth: {
    width: '100%',
  },
  // Disabled State
  buttonDisabled: {
    opacity: 0.5,
  },
  // Text Styles
  text: {
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  textPrimary: {
    color: Colors.white,
  },
  textOutline: {
    color: Colors.primary,
  },
  textGhost: {
    color: Colors.primary,
  },
  textSecondary: {
    color: Colors.text,
  },
  textSmall: {
    fontSize: FontSize.sm,
  },
  icon: {
    marginRight: -4,
  },
});
