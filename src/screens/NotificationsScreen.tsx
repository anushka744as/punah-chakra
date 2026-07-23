import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, fetchUserNotifications } from '../services/api';

export const NotificationsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await fetchUserNotifications(user.id);
        if (data && data.length > 0) {
          setNotifications(data.map((n: any) => ({
            id: n.id,
            tag: n.tag || 'UPDATE',
            title: n.title,
            body: n.body,
            time_ago: n.time_ago || 'Just now',
            icon: 'bell-outline',
            iconBg: '#ECFDF5',
            iconColor: '#15A800',
          })));
        } else {
          setNotifications([]);
        }
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/logo_icon.png')}
            style={styles.headerLogoImg}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Alerts</Text>
        </View>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <Text style={styles.pageSubtitle}>Stay updated on your recycling impact.</Text>

        {loading ? (
          <Text style={{ textAlign: 'center', color: '#94A3B8', marginVertical: 32 }}>Loading...</Text>
        ) : notifications.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 }}>
            <Icon name="bell-off-outline" size={40} color="#94A3B8" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#475569' }}>No notifications yet</Text>
            <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
              Alerts about your pickup schedules and rewards will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.notifCard}>
              <View style={styles.notifHeaderRow}>
                <View style={[styles.iconBg, { backgroundColor: n.iconBg || '#ECFDF5' }]}>
                  <Icon name={n.icon || 'bell-outline'} size={22} color={n.iconColor || '#15A800'} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.topMetaRow}>
                    <Text style={styles.tagLabelGreen}>{n.tag}</Text>
                    <Text style={styles.timeAgo}>{n.time_ago}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <Text style={styles.cardBody}>{n.body}</Text>
                  {n.hasActions && (
                    <View style={styles.btnActionRow}>
                      <TouchableOpacity style={styles.actionBtnGreen} activeOpacity={0.8}>
                        <Text style={styles.actionBtnGreenText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnOutlined} activeOpacity={0.8}>
                        <Text style={styles.actionBtnOutlinedText}>Reschedule</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {n.grade && (
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeText}>Grade: {n.grade}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
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
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  notifCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    gap: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagLabelGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15A800',
    letterSpacing: 0.8,
  },
  tagLabelDark: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  btnActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtnGreen: {
    backgroundColor: '#15A800',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionBtnGreenText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnOutlined: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  actionBtnOutlinedText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#15A800',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

