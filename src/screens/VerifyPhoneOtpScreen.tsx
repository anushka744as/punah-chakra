import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { sendPhoneOtp, verifyPhoneOtp } from '../services/api';
import { USER_LOGGED_IN_KEY, LAST_ROLE_KEY } from '../navigation/AppNavigator';

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_LENGTH = 6;

export const VerifyPhoneOtpScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { phone, fullName, email, pincode } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = useCallback(
    async (otpValue?: string) => {
      const otp = (otpValue ?? code).trim();
      if (otp.length < OTP_LENGTH) {
        Alert.alert('Invalid Code', 'Please enter the code we texted you.');
        return;
      }

      setLoading(true);
      try {
        const res = await verifyPhoneOtp(phone, otp, fullName, email, pincode);
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
    },
    [code, phone, fullName, email, pincode, navigation]
  );

  // Android SMS User Consent API: shows the system "Allow <app> to read this message?"
  // dialog when the OTP text arrives, then hands the message back to us — no SMS
  // permission needed and no change to the DLT-registered message template required.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const otpVerify = await import('@pushpendersingh/react-native-otp-verify');
        subscription = otpVerify.addSmsListener((message: any) => {
          if (cancelled || message?.status !== 'success' || !message.message) return;
          const otp = otpVerify.extractOtp(message.message);
          if (otp && otp.length === OTP_LENGTH) {
            setCode(otp);
            handleVerify(otp);
          }
        });
        await otpVerify.requestPhoneNumber();
      } catch {
        // Play Services unavailable or consent denied — user can still type the code manually.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendPhoneOtp(phone, fullName);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode('');
      inputRefs.current[0]?.focus();
      Alert.alert('Code Sent', `A new code was sent to ${phone}.`);
    } catch (err: any) {
      Alert.alert('Could Not Resend Code', err?.message || 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, '');

    if (digits.length > 1) {
      // Handles pasting/autofill of the full code into a single box.
      const next = digits.slice(0, OTP_LENGTH);
      setCode(next);
      if (next.length === OTP_LENGTH) {
        inputRefs.current[OTP_LENGTH - 1]?.blur();
        handleVerify(next);
      } else {
        inputRefs.current[next.length]?.focus();
      }
      return;
    }

    const chars = code.split('');
    chars[index] = digits;
    const next = chars.join('').slice(0, OTP_LENGTH);
    setCode(next);

    if (digits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digits && next.length === OTP_LENGTH) {
      inputRefs.current[index]?.blur();
      handleVerify(next);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, theme.spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify mobile number</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, theme.spacing.xl) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Verify with OTP</Text>
          <Text style={styles.subtitle}>Sent via SMS to {phone}</Text>

          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpBox, code[index] && styles.otpBoxFilled]}
                value={code[index] || ''}
                onChangeText={(t) => handleDigitChange(t, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                textContentType="oneTimeCode"
                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            {cooldown > 0 ? (
              <Text style={styles.resendText}>
                Resend OTP in <Text style={styles.resendTimer}>00:{cooldown.toString().padStart(2, '0')}</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title="Confirm OTP"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={() => handleVerify()}
            style={styles.submitBtn}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 32,
  },
  headerTitle: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 17,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    flexGrow: 1,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
  },
  otpBoxFilled: {
    borderColor: theme.colors.primary,
  },
  resendRow: {
    marginBottom: theme.spacing.xl,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  resendTimer: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  resendLink: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
});
