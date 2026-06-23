import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../theme/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background, // White
    borderWidth: 1,
    borderColor: theme.colors.border, // 1px solid #E2E8F0
    borderRadius: theme.radius, // 0px
    padding: theme.spacing.md, // 16px
    // No shadow.
  },
});
