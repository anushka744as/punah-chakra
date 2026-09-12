import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';

const IMPACT_ITEMS = [
  { icon: 'recycle', label: 'Reduce Unnecessary Waste' },
  { icon: 'package-variant', label: 'Extend the Lifecycle of Usable Goods' },
  { icon: 'account-group', label: 'Support Communities in Need' },
  { icon: 'heart-outline', label: 'Encourage Sustainable Living' },
];

export const LandingScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <Icon name="leaf" size={40} color={theme.colors.primaryContainer} style={styles.leafTopLeft} />
      <Icon name="leaf" size={56} color={theme.colors.primaryContainer} style={styles.leafTopRight} />
      <Icon name="leaf" size={48} color={theme.colors.primaryContainer} style={styles.leafBottomLeft} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, theme.spacing.lg),
            paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.logoRow}>
          <Image
            source={require('../assets/image.png')}
            style={styles.logoIconImg}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>
            Punah<Text style={{ color: theme.colors.primary }}>Chakra</Text>
          </Text>
        </View>
        <Text style={styles.tagline}>
          {'\n'}
        </Text>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Every Item Deserves Another Chance.</Text>
          <Text style={styles.heroDescription}> {'\n'}</Text>
        </View>


        {/* Hero Image */}
        <Image
          source={require('../assets/poster.jpeg')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Impact banner */}
        <View style={styles.impactBanner}>
          <Text style={styles.impactBannerText}>YOUR CONTRIBUTION CREATES IMPACT</Text>
        </View>

        <View style={styles.impactGrid}>
          {IMPACT_ITEMS.map((item) => (
            <View key={item.label} style={styles.impactItem}>
              <View style={styles.impactIconCircle}>
                <Icon name={item.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.impactLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Get Started"
          variant="primary"
          size="lg"
          rightIcon={<Icon name="arrow-right" size={20} color="#FFF" />}
          onPress={() => navigation.navigate('SignUp', { mode: 'signup' })}
          style={styles.getStartedButton}
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
  leafTopLeft: {
    position: 'absolute',
    top: 8,
    left: 4,
    transform: [{ rotate: '-20deg' }],
  },
  leafTopRight: {
    position: 'absolute',
    top: 20,
    right: -6,
    transform: [{ rotate: '30deg' }],
  },
  leafBottomLeft: {
    position: 'absolute',
    bottom: 90,
    left: -4,
    transform: [{ rotate: '15deg' }],
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  logoIconImg: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  logoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: theme.colors.secondary,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  heroSection: {
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 30,
    color: theme.colors.secondary,
    lineHeight: 36,
    marginBottom: theme.spacing.sm,
  },
  heroDescription: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  impactBanner: {
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  impactBannerText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.textInverse,
    letterSpacing: 0.5,
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  impactItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  impactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  impactLabel: {
    textAlign: 'center',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
  },
  getStartedButton: {
    width: '100%',
  },
});
