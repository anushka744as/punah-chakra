export const colors = {
  primary: '#15A800',
  primaryContainer: '#4CE033',
  primaryLight: '#85F272',
  primaryDark: '#118800',
  secondary: '#15A800',
  secondaryContainer: '#ADEDD3',
  background: '#F8F9FF',
  surface: '#FFFFFF',
  surfaceContainer: '#E6EEFF',
  surfaceContainerLow: '#EFF4FF',
  surfaceContainerHigh: '#DDE9FF',
  surfaceVariant: '#D5E3FD',
  onBackground: '#0D1C2F',
  onSurface: '#0D1C2F',
  onSurfaceVariant: '#3C4A42',
  text: '#0D1C2F',
  textSecondary: '#6C7A71',
  textInverse: '#FFFFFF',
  border: '#D5E3FD',
  borderVariant: '#BBCABF',
  outline: '#6C7A71',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',
  success: '#10B981',
  successContainer: '#ADEDD3',
  warning: '#F59E0B',
  info: '#3B82F6',
  cardBackground: '#FFFFFF',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: colors.text,
    lineHeight: 44,
  },
  h1: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 36,
  },
  h3: {
    fontSize: 22,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 24,
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
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 16,
  },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const theme = {
  colors,
  spacing,
  typography,
  radius,
};

