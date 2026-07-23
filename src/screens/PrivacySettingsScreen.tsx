import React, { useState } from 'react';
import { supabase } from '../services/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PrivacySettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleProfileNav = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch {
      navigation.navigate('Profile');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setUpdating(false);
      if (error) {
        Alert.alert('Error', 'Could not update password. Please try again.');
      } else {
        setModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Password updated successfully.');
      }
    } catch {
      setUpdating(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <TouchableOpacity onPress={handleProfileNav} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>
          Manage how your account is protected and how your data is used.
        </Text>

        <View style={styles.card}>
          {/* Change Password */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="lock-outline" size={22} color="#64748B" />
            <Text style={styles.itemText}>Change password</Text>
            <Icon name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={handleDeleteAccount}
          >
            <Icon name="trash-can-outline" size={22} color="#DC2626" />
            <Text style={[styles.itemText, styles.dangerText]}>Delete account</Text>
            <Icon name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Read our <Text style={styles.linkText}>Privacy Policy</Text> and <Text style={styles.linkText}>Terms of Service</Text>.
        </Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
            />

            <Text style={styles.modalLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
            />

            <Text style={styles.modalLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
            />

            <TouchableOpacity
              style={styles.updatePasswordBtn}
              onPress={handleChangePassword}
              disabled={updating}
            >
              <Text style={styles.updatePasswordBtnText}>
                {updating ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 20,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  dangerText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
  },
  linkText: {
    color: '#15A800',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  updatePasswordBtn: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  updatePasswordBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

