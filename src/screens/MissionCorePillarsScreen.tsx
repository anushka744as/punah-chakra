import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { MissionHeader } from '../components/MissionHeader';

export const MissionCorePillarsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <MissionHeader 
        rightElement={
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>1/4</Text>
          </View>
        }
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>MISSION ONBOARDING</Text>
        <Text style={styles.title}>Core Mission Pillars</Text>
        
        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>01</Text>
          <View style={styles.pillarHeader}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 24 }}>🏭</Text>
            </View>
            <Text style={styles.pillarTitle}>Industrial Scale</Text>
          </View>
          <Text style={styles.pillarText}>
            Moving beyond boutique recycling. We leverage high-capacity logistics and industrial-grade sorting facilities to process tonnage that actually impacts the global circular economy.
          </Text>
          <View style={styles.imagePlaceholder} />
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>02</Text>
          <View style={styles.pillarHeader}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 24 }}>✅</Text>
            </View>
            <Text style={styles.pillarTitle}>Verified Quality</Text>
          </View>
          <Text style={styles.pillarText}>
            Every kilogram of material processed is tracked through our digital ledger. We ensure that recycled feedstock meets rigorous industrial standards for purity and structural integrity.
          </Text>
          <View style={styles.imagePlaceholder} />
        </View>
      </ScrollView>

      <View style={styles.footerRow}>
        <Button 
          title="BACK"
          variant="outlined"
          style={styles.flex1}
          onPress={() => navigation.goBack()} 
        />
        <View style={{ width: theme.spacing.md }} />
        <Button 
          title="NEXT: PILLAR DETAILS"
          style={styles.flex2}
          onPress={() => navigation.navigate('MissionDeployment')} 
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
  badgeBox: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: theme.spacing.xl,
  },
  subtitle: {
    ...theme.typography.label,
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xl,
  },
  pillarCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  pillarNumber: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.surfaceVariant, // Light gray
  },
  pillarHeader: {
    marginBottom: theme.spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillarTitle: {
    ...theme.typography.h3,
    fontWeight: 'bold',
  },
  pillarText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: '#334155',
  },
  footerRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
});
