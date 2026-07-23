import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

interface ChipProps {
  label: string;
  status?: 'collected' | 'pending' | 'default';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ label, status = 'default', style }) => {
  const isCollected = status === 'collected';
  const isPending = status === 'pending';

  return (
    <View
      style={[
        styles.chip,
        isCollected && styles.collectedChip,
        isPending && styles.pendingChip,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          (isCollected || isPending) && styles.statusText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant, // Default slate background
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-start',
  },
  collectedChip: {
    backgroundColor: theme.colors.primaryDark, // Forest Green
  },
  pendingChip: {
    backgroundColor: theme.colors.textSecondary, // Slate
  },
  text: {
    ...theme.typography.label,
    fontSize: 12,
    color: theme.colors.text,
  },
  statusText: {
    color: theme.colors.textInverse,
  },
});
