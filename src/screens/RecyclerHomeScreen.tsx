import React from 'react';
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
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

export const RecyclerHomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Badge label="Facility Hub" variant="primary" style={{ marginBottom: 4 }} />
            <Text style={styles.title}>GreenLoop Facility #04</Text>
            <Text style={styles.subtitle}>Intake Stream & Plant Processing</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('RecyclerAnalytics')}>
            <Icon name="chart-bar" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Facility Overview Metrics */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Daily Intake"
            value="4.8"
            unit="Tons"
            trend="+12%"
            trendPositive={true}
            icon={<Icon name="scale" size={20} color={theme.colors.primary} />}
          />
          <StatCard
            title="Line Efficiency"
            value="94.2"
            unit="%"
            trend="+3.1%"
            trendPositive={true}
            icon={<Icon name="cog-sync" size={20} color="#15A800" />}
          />
        </View>

        {/* Sub-Navigation Bar for Recycler Hub */}
        <View style={styles.navRow}>
          <Button
            title="Inventory"
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="package-variant-closed" size={16} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('RecyclerInventory')}
          />
          <Button
            title="Sorting Line"
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="dolly" size={16} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('RecyclerProcessing')}
          />
          <Button
            title="Analytics"
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="chart-line" size={16} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('RecyclerAnalytics')}
          />
        </View>

        {/* Active Intake Stream */}
        <Text style={styles.sectionTitle}>Incoming Shipments</Text>

        <Card variant="outlined" style={styles.shipmentCard}>
          <View style={styles.shipmentHeader}>
            <Text style={styles.shipmentTitle}>Shipment #SHP-9921</Text>
            <Badge label="Unloading" variant="warning" />
          </View>
          <Text style={styles.shipmentSub}>Payload: 1.2 Tons PET Bales  •  Driver: Fleet Unit 08</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  shipmentCard: {
    padding: theme.spacing.md,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shipmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  shipmentSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
