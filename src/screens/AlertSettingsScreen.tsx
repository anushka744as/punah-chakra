import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const AlertSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [pickupReminders, setPickupReminders] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@alert_pickup_reminders').then(v => {
      if (v !== null) setPickupReminders(v === 'true');
    });
    AsyncStorage.getItem('@alert_status_updates').then(v => {
      if (v !== null) setStatusUpdates(v === 'true');
    });
  }, []);

  const togglePickupReminders = async (val: boolean) => {
    setPickupReminders(val);
    await AsyncStorage.setItem('@alert_pickup_reminders', String(val));
  };

  const toggleStatusUpdates = async (val: boolean) => {
    setStatusUpdates(val);
    await AsyncStorage.setItem('@alert_status_updates', String(val));
  };

  const handleProfileNav = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch {
      navigation.navigate('Profile');
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
        <Text style={styles.headerTitle}>Collection Alerts</Text>
        <TouchableOpacity onPress={handleProfileNav} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Item 1 */}
          <View style={styles.itemRow}>
            <View style={styles.iconBg}>
              <Icon name="truck-delivery-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Pickup reminders</Text>
              <Text style={styles.itemSubtitle}>Get notified before scheduled pickups</Text>
            </View>
            <Switch
              value={pickupReminders}
              onValueChange={togglePickupReminders}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <View style={styles.divider} />

          {/* Item 2 */}
          <View style={styles.itemRow}>
            <View style={styles.iconBg}>
              <Icon name="recycle" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Status updates</Text>
              <Text style={styles.itemSubtitle}>When a collector accepts or completes a job</Text>
            </View>
            <Switch
              value={statusUpdates}
              onValueChange={toggleStatusUpdates}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </View>
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});

