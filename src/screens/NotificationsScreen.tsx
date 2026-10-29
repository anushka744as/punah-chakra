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
import { theme } from '../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, fetchUserNotifications, markAllNotificationsRead } from '../services/api';
import { formatTimeAgo } from '../utils/timeAgo';

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
            time_ago: formatTimeAgo(n.created_at),
            icon: 'bell-outline',
            iconBg: theme.colors.primaryContainer,
            iconColor: theme.colors.primary,
          })));
        } else {
          setNotifications([]);
        }
        markAllNotificationsRead(user.id).catch(() => {});
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="arrow-left" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
          )}
          <Image
            source={require('../assets/logo_transparent.png')}
            style={styles.headerLogoImg}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Alerts</Text>
        </View>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <Text style={styles.pageSubtitle}>Stay updated on your recycling impact.</Text>

        {loading ? (
          <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginVertical: 32 }}>Loading...</Text>
        ) : notifications.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 }}>
            <Icon name="bell-off-outline" size={40} color={theme.colors.textSecondary} />
            <Text style={{ fontSize: 16, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary }}>No notifications yet</Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
              Alerts about your pickup schedules will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.notifCard}>
              <View style={styles.notifHeaderRow}>
                <View style={[styles.iconBg, { backgroundColor: n.iconBg || theme.colors.primaryContainer }]}>
                  <Icon name={n.icon || 'bell-outline'} size={22} color={n.iconColor || theme.colors.primary} />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
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
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  notifCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  tagLabelDark: {
    fontSize: 10,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  timeAgo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.bodySemiBold,
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  btnActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtnGreen: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionBtnGreenText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
  },
  actionBtnOutlined: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
  },
  actionBtnOutlinedText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 4,
  },
  gradeText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
});

