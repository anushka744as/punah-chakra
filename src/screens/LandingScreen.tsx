import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

const { width } = Dimensions.get('window');

export const LandingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, theme.spacing.lg),
            paddingBottom: Math.max(insets.bottom, theme.spacing.xl) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.topHeader}>
          <View style={styles.logoRow}>
            <Image
              source={require('../assets/logo_icon.png')}
              style={styles.logoIconImg}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>PunahChakra</Text>
          </View>
          <Badge label="Circular Economy" variant="primary" />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Badge label="Waste to Resource Platform" variant="success" style={styles.heroBadge} />
          <Text style={styles.heroTitle}>Transforming Waste into Sustainable Wealth</Text>
          <Text style={styles.heroDescription}>
            Schedule pickups, donate items, and track your eco impact with real-time collection updates.
          </Text>

          <View style={styles.heroButtonGroup}>
            <Button
              title="Get Started"
              variant="primary"
              size="lg"
              rightIcon={<Icon name="arrow-right" size={20} color="#FFF" />}
              onPress={() => navigation.navigate('SignUp')}
              style={styles.mainCta}
            />
            <Button
              title="Sign In"
              variant="outlined"
              size="lg"
              onPress={() => navigation.navigate('Login')}
              style={styles.secondaryCta}
            />
          </View>
        </View>

        {/* Value Proposition Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why PunahChakra?</Text>

          <Card variant="elevated" style={styles.featureCard}>
            <View style={[styles.featureIconBg, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name="truck-fast" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureTitle}>On-Demand Collection</Text>
            <Text style={styles.featureDesc}>
              Schedule door-step pickup for recyclable materials with doorstep verification.
            </Text>
          </Card>

          <Card variant="elevated" style={styles.featureCard}>
            <View style={[styles.featureIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="leaf" size={28} color="#92400E" />
            </View>
            <Text style={styles.featureTitle}>Verified Eco Impact</Text>
            <Text style={styles.featureDesc}>
              Track CO2 offset, landfill space saved, and earn EcoPoints for every pickup.
            </Text>
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
  scrollContent: {
    padding: theme.spacing.lg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconImg: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  heroSection: {
    marginBottom: theme.spacing.xxl,
  },
  heroBadge: {
    marginBottom: theme.spacing.sm,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 40,
    marginBottom: theme.spacing.md,
  },
  heroDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  heroButtonGroup: {
    gap: theme.spacing.md,
  },
  mainCta: {
    width: '100%',
  },
  secondaryCta: {
    width: '100%',
  },
  featuresSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    marginBottom: theme.spacing.md,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
