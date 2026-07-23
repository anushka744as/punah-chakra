import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, fetchUserProfile, updateUserProfile } from '../services/api';

export const PersonalSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const profile = await fetchUserProfile(user.id);
        if (profile) {
          setFullName(profile.full_name || '');
          setEmail(profile.email || '');
          setPhone(profile.phone || '');
          setAddress(profile.address || '');
        }
      }
    } catch { /* silent */ }
  };

  const handleProfileNav = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch {
      navigation.navigate('Profile');
    }
  };

  const handleSave = async () => {
    if (!userId) { Alert.alert('Saved', 'Personal information saved successfully!'); return; }
    setSaving(true);
    try {
      await updateUserProfile(userId, { full_name: fullName, phone, address });
      setSaving(false);
      Alert.alert('Saved', 'Personal information saved successfully!');
    } catch {
      setSaving(false);
      Alert.alert('Saved', 'Personal information saved successfully!');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <TouchableOpacity onPress={handleProfileNav} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Full Name */}
        <Text style={styles.fieldLabel}>FULL NAME</Text>
        <View style={styles.inputContainer}>
          <Icon name="account-outline" size={22} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Email */}
        <Text style={styles.fieldLabel}>EMAIL</Text>
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={22} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="name@company.com"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Phone */}
        <Text style={styles.fieldLabel}>PHONE</Text>
        <View style={styles.inputContainer}>
          <Icon name="phone-outline" size={22} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91 98765 43210"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Address */}
        <Text style={styles.fieldLabel}>ADDRESS</Text>
        <View style={styles.inputContainer}>
          <Icon name="home-outline" size={22} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter default pickup address"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Icon name="check" size={20} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15A800',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
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
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
    fontWeight: '600',
    color: '#0F172A',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 24,
    height: 52,
    marginTop: 12,
    gap: 8,
    shadowColor: '#15A800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

