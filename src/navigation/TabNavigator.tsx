import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { HomeScreen } from '../screens/HomeScreen';
import { DonateScreen } from '../screens/DonateScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#15A800',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconBox, focused && styles.activeIconBox]}>
              <Icon name={focused ? 'home' : 'home-outline'} color={focused ? '#15A800' : '#64748B'} size={22} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Donate"
        component={DonateScreen}
        options={{
          tabBarLabel: 'Donate',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconBox, focused && styles.activeIconBox]}>
              <Icon name={focused ? 'plus-circle' : 'plus-circle-outline'} color={focused ? '#15A800' : '#64748B'} size={22} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconBox, focused && styles.activeIconBox]}>
              <Icon name={focused ? 'bell' : 'bell-outline'} color={focused ? '#15A800' : '#64748B'} size={22} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconBox, focused && styles.activeIconBox]}>
              <Icon name={focused ? 'account' : 'account-outline'} color={focused ? '#15A800' : '#64748B'} size={22} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    width: 42,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBox: {
    backgroundColor: '#ECFDF5',
  },
});

