import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/api';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: 'punahchakra://reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={require('../assets/logo_icon.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Reset Password</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!sent ? (
          <>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Icon name="lock-reset" size={40} color="#15A800" />
            </View>

            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>
              Enter the email address linked to your account. We'll send you a link to reset your password.
            </Text>

            {/* Email input */}
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputRow}>
              <Icon name="email-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
            </View>

            {/* Send button */}
            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.sendBtnText}>Sending...</Text>
              ) : (
                <>
                  <Icon name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Send Reset Link</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backLink}>
              <Icon name="arrow-left" size={16} color="#15A800" />
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Success state */
          <>
            <View style={styles.successCircle}>
              <Icon name="check-circle-outline" size={52} color="#15A800" />
            </View>

            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.subtitle}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.hint}>
              Didn't receive it? Check your spam folder or try again.
            </Text>

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => { setSent(false); setEmail(''); }}
              activeOpacity={0.85}
            >
              <Icon name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.sendBtnText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7} style={styles.backLink}>
              <Icon name="arrow-left" size={16} color="#15A800" />
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#15A800',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    backgroundColor: '#F8F9FE',
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#15A800',
  },
  hint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 24,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 28,
    width: '100%',
    height: 52,
    gap: 8,
    marginBottom: 20,
  },
  sendBtnDisabled: {
    opacity: 0.65,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15A800',
  },
});
