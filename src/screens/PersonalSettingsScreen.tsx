import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/api';
import { useAppData } from '../data/AppDataContext';

export const PersonalSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { profile, authUser, refreshProfile, updateProfile } = useAppData();

  const [fullName, setFullName] = useState(profile?.full_name || authUser?.full_name || '');
  const [email, setEmail] = useState(profile?.email || authUser?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (dbProfile) {
          if (dbProfile.full_name) setFullName(dbProfile.full_name);
          else if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);

          if (dbProfile.email) setEmail(dbProfile.email);
          else if (user.email) setEmail(user.email);

          if (dbProfile.phone) setPhone(dbProfile.phone);
          if (dbProfile.address) setAddress(dbProfile.address);
        } else {
          if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
          if (user.email) setEmail(user.email);
        }
      } else if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.email) setEmail(profile.email);
        if (profile.phone) setPhone(profile.phone);
        if (profile.address) setAddress(profile.address);
      }
    } catch { /* silent */ }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleProfileNav = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch {
      navigation.navigate('Profile');
    }
  };

  const handleSave = async () => {
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    if (!name) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address, or leave it empty.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || authUser?.id || profile?.id;
      if (!userId) {
        Alert.alert('Session expired', 'Please sign in again.');
        return;
      }

      // Phone is deliberately not written here: it is the login number, so it can only change
      // through a verified flow. Role is protected by a database trigger.
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          email: mail,
          address: address.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (error) { throw error; }

      if (updateProfile) {
        await updateProfile({ full_name: name, email: mail, address: address.trim() });
      }
      await refreshProfile();
      Alert.alert('Saved', 'Your details have been updated.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <TouchableOpacity onPress={handleProfileNav} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Full Name */}
        <Text style={styles.fieldLabel}>FULL NAME</Text>
        <View style={styles.inputContainer}>
          <Icon name="account-outline" size={22} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Email */}
        <Text style={styles.fieldLabel}>EMAIL</Text>
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={22} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="name@company.com"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Phone: this is the login number, so it is shown but cannot be edited here */}
        <Text style={styles.fieldLabel}>PHONE</Text>
        <View style={[styles.inputContainer, styles.inputLocked]}>
          <Icon name="phone-outline" size={22} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { color: theme.colors.textSecondary }]}
            value={phone}
            editable={false}
            placeholder="Not set"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <Icon name="lock-outline" size={18} color={theme.colors.textSecondary} />
        </View>
        <Text style={styles.lockedHint}>This is the number you log in with, so it can't be changed here. Contact support if you need to change it.</Text>

        {/* Address */}
        <Text style={styles.fieldLabel}>ADDRESS</Text>
        <View style={styles.inputContainer}>
          <Icon name="home-outline" size={22} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter default pickup address"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Icon name="check" size={20} color={theme.colors.surface} />
          <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    letterSpacing: -0.3,
  },
  userAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
  },
  inputLocked: {
    opacity: 0.75,
    marginBottom: 6,
  },
  lockedHint: {
    fontSize: 12,
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 17,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    height: 52,
    marginTop: 12,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    letterSpacing: 0.5,
  },
});

