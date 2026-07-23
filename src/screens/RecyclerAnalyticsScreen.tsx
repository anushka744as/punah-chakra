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

export const RecyclerAnalyticsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Facility Analytics</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Monthly Yield"
            value="128.4"
            unit="Tons"
            trend="+15%"
            trendPositive={true}
            icon={<Icon name="chart-bell-curve" size={20} color={theme.colors.primary} />}
          />
          <StatCard
            title="Landfill Diversion"
            value="98.6"
            unit="%"
            trend="+0.8%"
            trendPositive={true}
            icon={<Icon name="dump-truck" size={20} color="#15A800" />}
          />
        </View>

        <Card variant="outlined" style={styles.chartMockCard}>
          <Text style={styles.chartTitle}>Monthly Recovery Breakdown</Text>
          <View style={styles.chartMockArea}>
            <Icon name="chart-timeline-variant" size={60} color={theme.colors.primary} />
            <Text style={styles.chartMockText}>Visual Trend Analytics</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  chartMockCard: {
    padding: theme.spacing.lg,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chartMockArea: {
    height: 180,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartMockText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
