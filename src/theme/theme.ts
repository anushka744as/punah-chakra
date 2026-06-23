export const colors = {
  primary: '#10B981',
  primaryDark: '#064E3B',
  primaryLight: '#34D399',
  secondary: '#064E3B',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceVariant: '#E2E8F0',
  text: '#0d1c2f',
  textSecondary: '#334155',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: colors.text,
  },
  h3: {
    fontSize: 22,
    fontWeight: '500' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
};

export const theme = {
  colors,
  spacing,
  typography,
  radius: 0, // Zero Radius
};
