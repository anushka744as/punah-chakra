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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Card } from '../components/Card';
import { sendPhoneOtp, verifyPhoneOtp } from '../services/api';
import { USER_LOGGED_IN_KEY, LAST_ROLE_KEY } from '../navigation/AppNavigator';

const RESEND_COOLDOWN_SECONDS = 30;

export const VerifyPhoneOtpScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { phone, fullName } = route.params || {};
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
      const res = await verifyPhoneOtp(phone, code.trim(), fullName);
      setLoading(false);
      await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
      await AsyncStorage.setItem(LAST_ROLE_KEY, 'user');
      Alert.alert('Account Created', 'Successfully registered!', [
        {
          text: 'Continue',
          onPress: () => navigation.replace('MainTabs'),
        },
      ]);
      void res;
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Verification Failed', err?.message || 'That code is invalid or expired. Please try again.');
    }
  }, [code, phone, fullName, navigation]);

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

          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.subtitle}>Enter the code we texted to {phone}.</Text>
          </View>

          <Card variant="outlined" style={styles.formCard}>
            <InputField
              label="VERIFICATION CODE"
              placeholder="123456"
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Button
              title="VERIFY & CONTINUE →"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleVerify}
              style={styles.submitBtn}
            />
          </Card>

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
  scrollContent: {
    padding: theme.spacing.lg,
  },
  backBtn: {
    marginBottom: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  formCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
