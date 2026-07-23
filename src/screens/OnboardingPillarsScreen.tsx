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
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

export const OnboardingPillarsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Badge label="Pillar Setup" variant="primary" style={styles.badge} />
          <Text style={styles.title}>4 Pillars of PunahChakra</Text>
          <Text style={styles.subtitle}>
            Explore our foundational circular loop methodology before initializing facility setup.
          </Text>
        </View>

        <View style={styles.pillarsContainer}>
          <Card variant="elevated" style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="recycle-variant" size={30} color="#15A800" />
            </View>
            <Text style={styles.pillarTitle}>1. Segregation at Source</Text>
            <Text style={styles.pillarDesc}>
              Categorization into plastics, e-waste, metals, and organics right at donor locations for minimum contamination.
            </Text>
          </Card>

          <Card variant="elevated" style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="truck-snowflake" size={30} color="#1E40AF" />
            </View>
            <Text style={styles.pillarTitle}>2. Green Logistics</Text>
            <Text style={styles.pillarDesc}>
              Optimized low-emission transit routes connecting waste generators directly to verified regional recycling units.
            </Text>
          </Card>

          <Card variant="elevated" style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="cog-sync" size={30} color="#92400E" />
            </View>
            <Text style={styles.pillarTitle}>3. Scientific Processing</Text>
            <Text style={styles.pillarDesc}>
              Automated optical sorting, shredding, pelletizing, and raw material re-entry into manufacturing supply chains.
            </Text>
          </Card>

          <Card variant="elevated" style={styles.pillarCard}>
            <View style={[styles.pillarIcon, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="shield-check" size={30} color="#991B1B" />
            </View>
            <Text style={styles.pillarTitle}>4. Transparent Certification</Text>
            <Text style={styles.pillarDesc}>
              Digital carbon credit issuance and verifiable proof of recycling for municipal and ESG reporting.
            </Text>
          </Card>
        </View>

        <Button
          title="Setup Facility Parameters"
          variant="primary"
          size="lg"
          rightIcon={<Icon name="arrow-right" size={20} color="#FFF" />}
          onPress={() => navigation.navigate('RecyclerHub')}
          style={styles.ctaBtn}
        />
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
  pillarsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  pillarCard: {
    padding: theme.spacing.lg,
  },
  pillarIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  pillarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  pillarDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  ctaBtn: {
    width: '100%',
  },
});
