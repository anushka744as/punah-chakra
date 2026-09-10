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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Card } from '../components/Card';
import { sendPhoneOtp } from '../services/api';

export const PhoneSignUpScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmedName = fullName.trim();
    const digits = phone.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (digits.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    const fullPhone = `+91${digits}`;

    setLoading(true);
    try {
      await sendPhoneOtp(fullPhone, trimmedName);
      setLoading(false);
      navigation.navigate('VerifyOtp', { phone: fullPhone, fullName: trimmedName });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Could Not Send Code', err?.message || 'Please try again.');
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
            <Text style={styles.title}>Sign Up with Phone</Text>
            <Text style={styles.subtitle}>We'll text you a one-time code to verify your number.</Text>
          </View>

          <Card variant="outlined" style={styles.formCard}>
            <InputField
              label="FULL NAME"
              placeholder="Johnathan Doe"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <InputField
                placeholder="98765 43210"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
                containerStyle={{ marginBottom: 0, flex: 1 }}
              />
            </View>

            <Button
              title="SEND OTP →"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSendOtp}
              style={styles.submitBtn}
            />
          </Card>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Prefer email? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.loginText}>SIGN UP WITH EMAIL</Text>
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
  label: {
    ...theme.typography.label,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  countryCode: {
    height: 48,
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
});
