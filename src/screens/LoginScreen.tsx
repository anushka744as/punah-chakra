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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { sendPhoneOtp } from '../services/api';
import { USER_LOGGED_IN_KEY, LAST_ROLE_KEY } from '../navigation/AppNavigator';

export const LoginScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>(route?.params?.mode === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'signup';

  const handleDevBypass = async (role: 'user' | 'admin') => {
    await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    await AsyncStorage.setItem(LAST_ROLE_KEY, role);
    navigation.replace(role === 'admin' ? 'CollectorDashboard' : 'MainTabs');
  };

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

    setLoading(true);
    try {
      await sendPhoneOtp(fullPhone, trimmedName || undefined);
      setLoading(false);
      navigation.navigate('VerifyOtp', { phone: fullPhone, fullName: trimmedName || undefined });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Could Not Send Code', err?.message || 'Please try again.');
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
            <Text style={styles.tagline}>A Greener Tomorrow{'\n'}Starts With You</Text>
          </View>

          {/* Card */}
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

          {__DEV__ && (
            <View style={styles.devBypassRow}>
              <TouchableOpacity onPress={() => handleDevBypass('user')} style={styles.devBypassBtn}>
                <Text style={styles.devBypassText}>DEV: Skip as User</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDevBypass('admin')} style={styles.devBypassBtn}>
                <Text style={styles.devBypassText}>DEV: Skip as Admin</Text>
              </TouchableOpacity>
            </View>
          )}
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
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  logoIconImg: {
    width: 88,
    height: 88,
    marginBottom: theme.spacing.sm,
  },
  logoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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
  devBypassRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  devBypassBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderStyle: 'dashed',
  },
  devBypassText: {
    fontSize: 12,
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodySemiBold,
  },
});
