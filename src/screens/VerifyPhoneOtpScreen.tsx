import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { sendPhoneOtp, verifyPhoneOtp } from '../services/api';
import { USER_LOGGED_IN_KEY, LAST_ROLE_KEY } from '../navigation/AppNavigator';

const RESEND_COOLDOWN_SECONDS = 30;

export const VerifyPhoneOtpScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { phone, fullName, email, pincode } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    if (code.trim().length < 4) {
      Alert.alert('Invalid Code', 'Please enter the code we texted you.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPhoneOtp(phone, code.trim(), fullName, email, pincode);
      setLoading(false);
      const role = (res as any)?.profile?.role === 'admin' ? 'admin' : 'user';
      await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
      await AsyncStorage.setItem(LAST_ROLE_KEY, role);
      Alert.alert('Account Created', 'Successfully registered!', [
        {
          text: 'Continue',
          onPress: () => navigation.replace(role === 'admin' ? 'CollectorDashboard' : 'MainTabs'),
        },
      ]);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Verification Failed', err?.message || 'That code is invalid or expired. Please try again.');
    }
  }, [code, phone, fullName, email, pincode, navigation]);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendPhoneOtp(phone, fullName);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Code Sent', `A new code was sent to ${phone}.`);
    } catch (err: any) {
      Alert.alert('Could Not Resend Code', err?.message || 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Icon name="leaf" size={40} color={theme.colors.primaryContainer} style={styles.leafTopLeft} />
      <Icon name="leaf" size={56} color={theme.colors.primaryContainer} style={styles.leafTopRight} />
      <Icon name="leaf" size={48} color={theme.colors.primaryContainer} style={styles.leafBottomLeft} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>

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
          <Text style={styles.tagline}>Verify Your Number</Text>
          <Text style={styles.subtitle}>Enter the code we texted to {phone}.</Text>

          <View style={styles.card}>
            <InputField
              label="VERIFICATION CODE"
              placeholder="123456"
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<Icon name="lock-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <Button
              title="Verify & Continue"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleVerify}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Didn't get a code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending}>
              <Text style={[styles.loginText, (cooldown > 0 || resending) && styles.loginTextDisabled]}>
                {cooldown > 0 ? `RESEND IN ${cooldown}s` : 'RESEND CODE'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
  },
  backBtn: {
    marginBottom: theme.spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loginText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  loginTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
