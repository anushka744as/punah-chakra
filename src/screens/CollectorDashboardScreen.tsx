import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const CollectorDashboardScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collector Hub</Text>
        <Icon name="bell-outline" size={24} color={theme.colors.textInverse} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Today's Route</Text>
          <Text style={styles.summarySubtitle}>3 Pickups remaining</Text>
        </View>

        <View style={styles.listSection}>
          <Card style={styles.pickupCard}>
            <View style={styles.pickupHeader}>
              <View>
                <Text style={styles.pickupTime}>10:00 AM</Text>
                <Text style={styles.pickupLocation}>Sector 4, Dwarka</Text>
              </View>
              <Chip label="Pending" status="pending" />
            </View>
            <View style={styles.pickupDetails}>
              <Text style={styles.detailText}>Materials: Paper, Plastic</Text>
              <Text style={styles.detailText}>Est. Weight: 5kg</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('QualityAssessment')}
            >
              <Text style={styles.actionButtonText}>Start Collection</Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.pickupCard}>
            <View style={styles.pickupHeader}>
              <View>
                <Text style={styles.pickupTime}>12:30 PM</Text>
                <Text style={styles.pickupLocation}>Vasant Kunj</Text>
              </View>
              <Chip label="Pending" status="pending" />
            </View>
            <View style={styles.pickupDetails}>
              <Text style={styles.detailText}>Materials: E-Waste</Text>
              <Text style={styles.detailText}>Est. Weight: 2kg</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Start Collection</Text>
            </TouchableOpacity>
          </Card>
          
          <Card style={styles.pickupCardCompleted}>
            <View style={styles.pickupHeader}>
              <View>
                <Text style={styles.pickupTimeCompleted}>08:00 AM</Text>
                <Text style={styles.pickupLocationCompleted}>Janakpuri</Text>
              </View>
              <Chip label="Collected" status="collected" />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl, // For safe area
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  content: {
    padding: theme.spacing.md,
  },
  summaryContainer: {
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    ...theme.typography.h2,
    color: theme.colors.primaryDark,
  },
  summarySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  listSection: {
    flex: 1,
  },
  pickupCard: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  pickupCardCompleted: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    opacity: 0.7,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  pickupTime: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  pickupLocation: {
    ...theme.typography.body,
    fontWeight: '500',
    marginTop: theme.spacing.xs,
  },
  pickupTimeCompleted: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  pickupLocationCompleted: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  pickupDetails: {
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailText: {
    ...theme.typography.bodySmall,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
  },
});
