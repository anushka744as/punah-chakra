import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MissionPillars1Screen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Icon name="recycle" size={80} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Waste Reduction</Text>
        <Text style={styles.bodyText}>
          By separating your waste at the source, you ensure that valuable materials are diverted from landfills. 
          This is the first and most crucial step in the recycling process. Clean, uncontaminated recyclables have a much higher chance of being successfully repurposed into new products.
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1.2</Text>
            <Text style={styles.statLabel}>Tons saved / year</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>80%</Text>
            <Text style={styles.statLabel}>Less landfill</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Next: Resource Conservation"
          onPress={() => navigation.navigate('Welcome')} // Demo nav
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
  content: {
    padding: theme.spacing.xl,
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.md,
  },
  bodyText: {
    ...theme.typography.body,
    marginBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.label,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
