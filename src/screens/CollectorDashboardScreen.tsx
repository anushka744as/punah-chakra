import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '../components/Button';
import { useAppData } from '../data/AppDataContext';

export const CollectorDashboardScreen = ({ navigation }: any) => {
  const { donations } = useAppData();
  const scheduledDonations = donations.filter(item => item.status === 'scheduled');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collector Hub</Text>
        <Icon name="bell-outline" size={24} color={theme.colors.textInverse} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Today's Route</Text>
          <Text style={styles.summarySubtitle}>
            {scheduledDonations.length} scheduled pickup{scheduledDonations.length === 1 ? '' : 's'}
          </Text>
          <Button
            title="VIEW DONOR LOCATIONS MAP"
            style={styles.mapButton}
            textStyle={styles.mapButtonText}
            onPress={() => navigation.navigate('PickupMap', { mode: 'collector' })}
          />
        </View>

        <View style={styles.listSection}>
          {scheduledDonations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="truck-outline" size={32} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No donor pickups yet</Text>
              <Text style={styles.emptyText}>
                When a donor schedules a collection, the pickup address will appear here and on the donor locations map.
              </Text>
            </Card>
          ) : (
            scheduledDonations.map(item => (
              <Card key={item.id} style={styles.pickupCard}>
                <View style={styles.pickupHeader}>
                  <View style={styles.pickupHeaderText}>
                    <Text style={styles.pickupTime}>{item.time_slot}</Text>
                    <Text style={styles.pickupLocation}>{item.address}</Text>
                  </View>
                  <Chip label="Pending" status="pending" />
                </View>
                <View style={styles.pickupDetails}>
                  <Text style={styles.detailText}>Materials: {item.category}</Text>
                  <Text style={styles.detailText}>Date: {item.pickup_day}</Text>
                  {item.instructions ? <Text style={styles.detailText}>Notes: {item.instructions}</Text> : null}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonHalf]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PickupMap', { mode: 'collector', donationId: item.id })}
                  >
                    <Text style={styles.actionButtonText}>View Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonHalf]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('QualityAssessment')}
                  >
                    <Text style={styles.actionButtonText}>Start Collection</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
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
  mapButton: {
    marginTop: theme.spacing.md,
    paddingVertical: 10,
  },
  mapButtonText: {
    fontSize: 12,
  },
  listSection: {
    flex: 1,
  },
  pickupCard: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  emptyCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
  },
  emptyText: {
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  pickupHeaderText: {
    flex: 1,
    paddingRight: theme.spacing.sm,
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
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButtonHalf: {
    flex: 1,
  },
  actionButtonText: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
  },
});
