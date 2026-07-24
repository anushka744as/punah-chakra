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
import { signUpUser } from '../services/api';

export const SignupScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<'donor' | 'collector'>('donor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUpUser(trimmedEmail, trimmedPassword, trimmedName, role);
      setLoading(false);
      Alert.alert('Account Created', `Successfully registered as a ${role.toUpperCase()}!`, [
        {
          text: 'Continue',
          onPress: () => {
            if (role === 'collector') {
              navigation.replace('CollectorDashboard');
            } else {
              navigation.replace('MainTabs');
            }
          },
        },
      ]);
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Sign Up Failed', err?.message || 'Could not create account. Please try again.');
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Select your role and join the reuse network.</Text>
          </View>

          {/* Role Selection */}
          <Text style={styles.roleHeaderLabel}>CHOOSE YOUR ROLE</Text>
          <View style={styles.roleSelectionRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'donor' && styles.roleCardActive]}
              onPress={() => setRole('donor')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconBg}>
                <Icon name="hand-heart" size={26} color={role === 'donor' ? theme.colors.primary : '#64748B'} />
              </View>
              <Text style={[styles.roleTitle, role === 'donor' && { color: theme.colors.primary }]}>Donor</Text>
              <Text style={styles.roleSub}>Donate items & schedule pickups</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'collector' && styles.roleCardActive]}
              onPress={() => setRole('collector')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconBg}>
                <Icon name="truck-delivery" size={26} color={role === 'collector' ? theme.colors.primary : '#64748B'} />
              </View>
              <Text style={[styles.roleTitle, role === 'collector' && { color: theme.colors.primary }]}>Collector</Text>
              <Text style={styles.roleSub}>Collect items & run routes</Text>
            </TouchableOpacity>
          </View>

          <Card variant="outlined" style={styles.formCard}>
            <InputField
              label="FULL NAME"
              placeholder="Johnathan Doe"
              value={fullName}
              onChangeText={setFullName}
            />

            <InputField
              label="EMAIL ADDRESS"
              placeholder="you@company.io"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <InputField
              label="PASSWORD"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="CREATE ACCOUNT →"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSignup}
              style={styles.submitBtn}
            />
          </Card>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>SIGN IN</Text>
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
  roleHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  roleSelectionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  roleCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  roleCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#ECFDF5',
  },
  roleIconBg: {
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  roleSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
});
