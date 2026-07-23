import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

export const OnboardingLogisticsScreen = ({ navigation }: any) => {
  const [vehicleType, setVehicleType] = useState('electric_van');
  const [operatingZone, setOperatingZone] = useState('Central District');
  const [dailyCapacity, setDailyCapacity] = useState('1500');

  const handleFinish = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Badge label="Fleet Setup" variant="info" style={styles.badge} />
          <Text style={styles.title}>Logistics Fleet Configuration</Text>
          <Text style={styles.subtitle}>
            Register vehicle capacities and operating zones for optimized collection dispatches.
          </Text>
        </View>

        <Card variant="outlined" style={styles.formCard}>
          <Text style={styles.sectionHeader}>Primary Vehicle Type</Text>
          <View style={styles.vehicleOptions}>
            <TouchableOpacity
              style={[styles.vehicleCard, vehicleType === 'electric_van' && styles.vehicleSelected]}
              onPress={() => setVehicleType('electric_van')}
            >
              <Icon name="truck-electric" size={32} color={vehicleType === 'electric_van' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={styles.vehicleLabel}>EV Van (500-1500kg)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vehicleCard, vehicleType === 'heavy_truck' && styles.vehicleSelected]}
              onPress={() => setVehicleType('heavy_truck')}
            >
              <Icon name="truck-cargo-container" size={32} color={vehicleType === 'heavy_truck' ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={styles.vehicleLabel}>Heavy Truck (5T+)</Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Primary Service Zone / Sector"
            placeholder="e.g. North Sector, Industrial Zone 4"
            value={operatingZone}
            onChangeText={setOperatingZone}
          />

          <InputField
            label="Estimated Daily Payload Capacity (kg)"
            placeholder="1500"
            value={dailyCapacity}
            onChangeText={setDailyCapacity}
            keyboardType="numeric"
          />

          <Button
            title="Complete Fleet Onboarding"
            variant="primary"
            size="lg"
            rightIcon={<Icon name="check-circle" size={20} color="#FFF" />}
            onPress={handleFinish}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  backBtn: {
    marginBottom: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  badge: {
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  vehicleOptions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  vehicleCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vehicleSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 2,
  },
  vehicleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
});
