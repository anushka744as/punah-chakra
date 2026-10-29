import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { HomeScreen } from '../screens/HomeScreen';
import { DonateScreen } from '../screens/DonateScreen';
import { PickupMapScreen } from '../screens/PickupMapScreen';
import { CollectionDrivesScreen } from '../screens/CollectionDrivesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../theme/theme';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bodyBold,
          fontSize: 11,
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
              <Icon
                name={focused ? 'home' : 'home-outline'}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={PickupMapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconBox, focused && styles.activeIconBox]}>
              <Icon
                name={focused ? 'map' : 'map-outline'}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
                size={22}
              />
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
            <View style={[styles.fabCircle, focused && styles.fabCircleActive]}>
              <Icon name="plus" color={theme.colors.textInverse} size={22} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Drives"
        component={CollectionDrivesScreen}
        options={{
          tabBarLabel: 'Drives',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconBox, focused && styles.activeIconBox]}>
              <Icon
                name={focused ? 'calendar-star' : 'calendar-star'}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
                size={22}
              />
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
              <Icon
                name={focused ? 'account' : 'account-outline'}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
                size={22}
              />
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
    backgroundColor: theme.colors.primaryContainer,
  },
  fabCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    marginTop: -22,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabCircleActive: {
    backgroundColor: theme.colors.primary,
  },
});
