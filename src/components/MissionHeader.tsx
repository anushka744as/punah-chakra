import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MissionHeaderProps {
  rightElement?: React.ReactNode;
}

export const MissionHeader: React.FC<MissionHeaderProps> = ({ rightElement }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo_icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>PunahChakra</Text>
      </View>
      {rightElement ? rightElement : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryDark,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.xs,
    fontWeight: 'bold',
    fontSize: 18,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
