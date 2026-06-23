import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MissionHeaderProps {
  rightElement?: React.ReactNode;
}

export const MissionHeader: React.FC<MissionHeaderProps> = ({ rightElement }) => {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Icon name="recycle" size={20} color={theme.colors.textInverse} />
        <Text style={styles.headerTitle}>PunahChakra</Text>
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Icon name="account" size={20} color={theme.colors.textInverse} />
        </View>
      )}
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
