import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MissionOverviewScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
        <Icon name="arrow-left" size={24} color={theme.colors.textInverse} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Missions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Icon name="leaf" size={48} color={theme.colors.primary} />
          <Text style={styles.heroTitle}>Our Environmental Pillars</Text>
          <Text style={styles.heroSubtitle}>Learn how your actions contribute to a sustainable future.</Text>
        </View>

        <View style={styles.missionList}>
          <View style={styles.missionItem}>
            <View style={styles.missionIconContainer}>
              <Icon name="recycle" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.missionTextContainer}>
              <Text style={styles.missionTitle}>Waste Reduction</Text>
              <Text style={styles.missionDesc}>Minimizing landfill waste through efficient sorting.</Text>
            </View>
          </View>
          
          <View style={styles.missionItem}>
            <View style={styles.missionIconContainer}>
              <Icon name="tree" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.missionTextContainer}>
              <Text style={styles.missionTitle}>Resource Conservation</Text>
              <Text style={styles.missionDesc}>Saving trees and water by recycling paper products.</Text>
            </View>
          </View>

          <View style={styles.missionItem}>
            <View style={styles.missionIconContainer}>
              <Icon name="factory" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.missionTextContainer}>
              <Text style={styles.missionTitle}>Emission Control</Text>
              <Text style={styles.missionDesc}>Reducing carbon footprint from manufacturing.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <Button 
          title="Start Learning"
          onPress={() => navigation.navigate('MissionPillars1')} // Proceed to next screen
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryDark,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  content: {
    padding: theme.spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  missionList: {
    marginTop: theme.spacing.md,
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  missionIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.md,
  },
  missionTextContainer: {
    flex: 1,
  },
  missionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  missionDesc: {
    ...theme.typography.bodySmall,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
