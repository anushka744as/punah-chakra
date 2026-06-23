import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';

import { DonatorDashboardScreen } from '../screens/DonatorDashboardScreen';
import { ScheduleDonationScreen } from '../screens/ScheduleDonationScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingVertical: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DonatorDashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Collection" 
        component={ScheduleDonationScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="truck-delivery" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UserProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
