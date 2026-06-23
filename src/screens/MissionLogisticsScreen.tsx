import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MissionHeader } from '../components/MissionHeader';

export const MissionLogisticsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <MissionHeader />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.subtitleContainer}>
          <View style={styles.line} />
          <Text style={styles.subtitle}>MISSION STEP 03</Text>
          <View style={styles.line} />
        </View>

        <Text style={styles.title}>Seamless Logistics</Text>

        <Text style={styles.bodyText}>
          We are engineering a new standard for surplus management through industrial precision and automated coordination.
        </Text>

        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageOverlayText}>A New Standard for Surplus</Text>
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Icon name="leaf" size={24} color={theme.colors.primary} />
            <Text style={styles.chipTitle}>0% Landfill Policy</Text>
            <Text style={styles.chipText}>Guaranteed diversion of all collected materials to certified processing centers.</Text>
          </View>
          <View style={styles.chip}>
            <Icon name="routes" size={24} color={theme.colors.primary} />
            <Text style={styles.chipTitle}>Optimized Routing</Text>
            <Text style={styles.chipText}>AI-driven fleet management to minimize carbon footprint per kilogram of cargo.</Text>
          </View>
        </View>

        <View style={styles.banner}>
          <Icon name="transit-connection-variant" size={32} color={theme.colors.textInverse} />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>B2B Integration</Text>
            <Text style={styles.bannerText}>Enterprise-grade API connectivity for real-time surplus tracking and automated compliance reporting.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>INFRASTRUCTURE CAPABILITY</Text>
        <View style={styles.statsList}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Fleet Capacity</Text>
            <Text style={styles.statValue}>14.2 Tons/Day</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average Pickup Lead Time</Text>
            <Text style={styles.statValue}>2.4 Hours</Text>
          </View>
          <View style={styles.statRowBorder}>
            <Text style={styles.statLabel}>Logistics Efficiency Rating</Text>
            <Text style={styles.statValueHighlight}>98.2%</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerRow}>
        <Button 
          title="← Back"
          variant="outlined"
          style={styles.flex1}
          onPress={() => navigation.goBack()} 
        />
        <View style={{ width: theme.spacing.md }} />
        <Button 
          title="Next Pillar →"
          style={styles.flex1}
          onPress={() => navigation.navigate('MissionCorePillars')} 
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
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary,
  },
  subtitle: {
    ...theme.typography.label,
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.sm,
    letterSpacing: 1,
  },
  title: {
    ...theme.typography.h1,
    color: '#1E293B',
    marginBottom: theme.spacing.md,
  },
  bodyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: '#334155', // Slate 700
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  imageOverlayText: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  chipTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  chipText: {
    ...theme.typography.bodySmall,
    fontSize: 12,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryDark,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  bannerTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  bannerTitle: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  sectionTitle: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  statsList: {},
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statRowBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  statValue: {
    ...theme.typography.label,
    fontWeight: 'bold',
  },
  statValueHighlight: {
    ...theme.typography.label,
    fontWeight: 'bold',
    color: theme.colors.primary,
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
});
