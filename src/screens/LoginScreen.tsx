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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { signInUser } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_LOGGED_IN_KEY, LAST_ROLE_KEY } from '../navigation/AppNavigator';

export const LoginScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Sign In Required', 'Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInUser(trimmedEmail, trimmedPassword);
      setLoading(false);
      await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
      const role = (res as any)?.profile?.role;
      if (role === 'collector') {
        await AsyncStorage.setItem(LAST_ROLE_KEY, 'collector');
        navigation.replace('CollectorDashboard');
      } else {
        await AsyncStorage.setItem(LAST_ROLE_KEY, 'donor');
        navigation.replace('MainTabs');
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Sign In Error', err?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Banner */}
          <View style={[styles.topBanner, { paddingTop: Math.max(insets.top, 24) }]}>
            <Image
              source={require('../assets/logo_icon.png')}
              style={styles.logoIconImg}
              resizeMode="contain"
            />
            <Text style={styles.bannerTitle}>Sign In</Text>
            <Text style={styles.bannerSubtitle}>
              Enter your credentials to access the logistics dashboard.
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <InputField
              label="EMAIL ADDRESS"
              placeholder="name@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>PASSWORD</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordInputContainer}>
              <InputField
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                containerStyle={{ marginBottom: 0, flex: 1 }}
                rightIcon={
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    <Icon name={secureText ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6C7A71" />
                  </TouchableOpacity>
                }
              />
            </View>

            <Button
              title="SIGN IN"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={styles.submitBtn}
            />

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to the platform? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupText}>CREATE AN ACCOUNT</Text>
              </TouchableOpacity>
            </View>

            {/* Platform Badges */}
            <View style={styles.badgesRow}>
              <View style={styles.badgeItem}>
                <Icon name="shield-check-outline" size={24} color="#475569" />
                <Text style={styles.badgeLabel}>SECURE</Text>
              </View>
              <View style={styles.badgeItem}>
                <Icon name="robot-industrial-outline" size={24} color="#475569" />
                <Text style={styles.badgeLabel}>INDUSTRIAL</Text>
              </View>
              <View style={styles.badgeItem}>
                <Icon name="factory" size={24} color="#475569" />
                <Text style={styles.badgeLabel}>ENTERPRISE</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topBanner: {
    backgroundColor: '#15A800',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    padding: 24,
    paddingTop: 36,
  },
  logoIconImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    lineHeight: 20,
  },
  formContainer: {
    padding: 24,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.5,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15A800',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    height: 52,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  signupText: {
    fontSize: 13,
    color: '#15A800',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
  },
  badgeItem: {
    alignItems: 'center',
    gap: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
});
