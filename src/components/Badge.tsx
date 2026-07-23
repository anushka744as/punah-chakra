import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme/theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`size_${size}`], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
  },
  size_sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs,
  },
  badge_success: {
    backgroundColor: '#D1FAE5',
  },
  badge_warning: {
    backgroundColor: '#FEF3C7',
  },
  badge_error: {
    backgroundColor: '#FEE2E2',
  },
  badge_info: {
    backgroundColor: '#DBEAFE',
  },
  badge_neutral: {
    backgroundColor: '#F1F5F9',
  },
  badge_primary: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: 11,
  },
  textSize_md: {
    fontSize: 12,
  },
  text_success: {
    color: '#15A800',
  },
  text_warning: {
    color: '#92400E',
  },
  text_error: {
    color: '#991B1B',
  },
  text_info: {
    color: '#1E40AF',
  },
  text_neutral: {
    color: '#475569',
  },
  text_primary: {
    color: theme.colors.primaryDark,
  },
});
