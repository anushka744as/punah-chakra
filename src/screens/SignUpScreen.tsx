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
      await signUpUser(trimmedEmail, trimmedPassword, trimmedName, 'user');
      setLoading(false);
      Alert.alert('Account Created', 'Successfully registered!', [
        {
          text: 'Continue',
          onPress: () => navigation.replace('MainTabs'),
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
            <Text style={styles.subtitle}>Join the reuse network and start donating.</Text>
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
              placeholder="you@example.com"
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

          <TouchableOpacity onPress={() => navigation.navigate('PhoneSignUp')} style={styles.phoneRow}>
            <Icon name="cellphone" size={18} color={theme.colors.primary} />
            <Text style={styles.phoneRowText}>Sign up with phone number instead</Text>
          </TouchableOpacity>

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
  formCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  phoneRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  phoneRowText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
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
