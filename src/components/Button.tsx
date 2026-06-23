import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outlined';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({ title, variant = 'primary', style, textStyle, ...props }) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutlined = variant === 'outlined';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isSecondary && styles.secondaryButton,
        isOutlined && styles.outlinedButton,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          isPrimary && styles.primaryText,
          isSecondary && styles.secondaryText,
          isOutlined && styles.outlinedText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius, // 0px
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
  },
  text: {
    ...theme.typography.label,
    fontSize: 16, // A bit larger for buttons
  },
  primaryText: {
    color: theme.colors.textInverse,
  },
  secondaryText: {
    color: theme.colors.textInverse,
  },
  outlinedText: {
    color: theme.colors.textSecondary,
  },
});
