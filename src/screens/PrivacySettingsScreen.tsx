import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteMyAccount } from '../services/api';
import { useAppData } from '../data/AppDataContext';

export const PrivacySettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { signOut } = useAppData();

  const handleProfileNav = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch {
      navigation.navigate('Profile');
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
          onPress: async () => {
            try {
              await deleteMyAccount();
              await signOut();
              Alert.alert('Account Deleted', 'Your account and data have been deleted.');
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message || 'Please try again, or email info.punahchakra@gmail.com.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <TouchableOpacity onPress={handleProfileNav} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>
          Manage how your account is protected and how your data is used.
        </Text>

        <View style={styles.card}>
          {/* Delete Account */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={handleDeleteAccount}
          >
            <Icon name="trash-can-outline" size={22} color={theme.colors.error} />
            <Text style={[styles.itemText, styles.dangerText]}>Delete account</Text>
            <Icon name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Read our <Text style={styles.linkText}>Privacy Policy</Text> and <Text style={styles.linkText}>Terms of Service</Text>.
        </Text>
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
    paddingTop: 20,
  },
  pageSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
  },
  dangerText: {
    color: theme.colors.error,
    fontFamily: theme.fonts.bodyBold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  linkText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bodyBold,
  },
});

