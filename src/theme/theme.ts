export const colors = {
  primary: '#28402F',
  primaryContainer: '#E6ECE2',
  primaryLight: '#E6ECE2',
  primaryDark: '#1E2A22',
  secondary: '#2C6E8E',
  secondaryContainer: '#E4EFF3',
  clay: '#3D7690',
  background: '#EFE8D8',
  surface: '#FFFFFF',
  surfaceContainer: '#E6ECE2',
  surfaceContainerLow: '#F5F0E4',
  surfaceContainerHigh: '#E4EFF3',
  surfaceVariant: '#DCD3BE',
  onBackground: '#1E2A22',
  onSurface: '#1E2A22',
  onSurfaceVariant: '#5A6459',
  text: '#1E2A22',
  textSecondary: '#5A6459',
  textInverse: '#FFFFFF',
  border: '#DCD3BE',
  borderVariant: '#DCD3BE',
  outline: '#5A6459',
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

export const fonts = {
  headingRegular: 'Fraunces_500Medium',
  heading: 'Fraunces_600SemiBold',
  headingBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const typography = {
  display: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.text,
    lineHeight: 44,
  },
  h1: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: colors.text,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.text,
    lineHeight: 36,
  },
  h3: {
    fontFamily: fonts.headingRegular,
    fontSize: 22,
    color: colors.text,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.text,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
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
  fonts,
};

