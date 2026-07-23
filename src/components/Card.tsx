import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'outlined' | 'elevated' | 'glass';
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'outlined', style, onPress }) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[
        styles.card,
        variant === 'outlined' && styles.outlined,
        variant === 'elevated' && styles.elevated,
        variant === 'glass' && styles.glass,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  flat: {
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  glass: {
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
