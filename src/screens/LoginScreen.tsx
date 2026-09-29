import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { sendPhoneOtp } from '../services/api';

export const LoginScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>(route?.params?.mode === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'signup';

  const handleSendOtp = async () => {
    const trimmedName = fullName.trim();
    const digits = phone.replace(/[^0-9]/g, '');

    if (isSignUp && !trimmedName) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (digits.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    const fullPhone = `+91${digits}`;

    const trimmedEmail = email.trim();

    setLoading(true);
    try {
      await sendPhoneOtp(fullPhone, trimmedName || undefined, undefined, trimmedEmail || undefined);
      setLoading(false);
      navigation.navigate('VerifyOtp', {
        phone: fullPhone,
        fullName: trimmedName || undefined,
        email: trimmedEmail || undefined,
      });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Could Not Send Code', err?.message || 'Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/image copy 2.png')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.bgOverlay} />
      <SafeAreaView style={styles.container}>
        {/* Header Branding — fixed, does not move when switching Login/Sign Up */}
        <View style={[styles.logoRow, { marginTop: Math.max(insets.top, theme.spacing.lg) }]}>
          <View style={styles.logoCard}>
            <Image
              source={require('../assets/logo_transparent.png')}
              style={styles.logoIconImg}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/logo_wordmark_transparent.png')}
              style={styles.logoWordmark}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.tagline}>A Community Platform for{'\n'}Reuse, Redistribution, and Impact</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Bottom sheet */}
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + 16 }]}>
              <View style={styles.card}>
                {/* Tabs */}
                <View style={styles.tabRow}>
                  <TouchableOpacity style={styles.tabItem} onPress={() => setMode('signin')}>
                    <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Login</Text>
                    {!isSignUp && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.tabItem} onPress={() => setMode('signup')}>
                    <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Sign Up</Text>
                    {isSignUp && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>
                </View>

                {isSignUp && (
                  <InputField
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    leftIcon={<Icon name="account-outline" size={20} color={theme.colors.textSecondary} />}
                  />
                )}

                {isSignUp && (
                  <InputField
                    placeholder="Email (optional)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Icon name="email-outline" size={20} color={theme.colors.textSecondary} />}
                  />
                )}

                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <InputField
                    placeholder="Enter your phone number"
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                    keyboardType="number-pad"
                    maxLength={10}
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                    leftIcon={<Icon name="phone-outline" size={20} color={theme.colors.textSecondary} />}
                  />
                </View>

                <Button
                  title={isSignUp ? 'Send OTP' : 'Login'}
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleSendOtp}
                  style={styles.submitBtn}
                />
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  {isSignUp ? 'Already registered? ' : 'New to PunahChakra? '}
                </Text>
                <TouchableOpacity onPress={() => setMode(isSignUp ? 'signin' : 'signup')}>
                  <Text style={styles.signupText}>{isSignUp ? 'Login' : 'Sign Up'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 64, 29, 0.15)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  logoCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  logoIconImg: {
    width: 72,
    height: 72,
    marginBottom: theme.spacing.xs,
  },
  logoWordmark: {
    width: 220,
    height: 60,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sheet: {
    backgroundColor: 'rgba(280, 280, 229, 0.7)',
    borderRadius: theme.radius.xl,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  tabItem: {
    marginRight: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  tabText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 17,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.heading,
  },
  tabIndicator: {
    height: 3,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  countryCode: {
    height: 52,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    ...theme.typography.body,
    fontSize: 15,
    color: theme.colors.text,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  signupText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bodyBold,
    letterSpacing: 0.5,
  },
});
