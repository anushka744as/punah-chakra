import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../theme/theme';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { CollectorDashboardScreen } from '../screens/CollectorDashboardScreen';
import { QualityAssessmentScreen } from '../screens/QualityAssessmentScreen';
import { MissionFoundationsScreen } from '../screens/MissionFoundationsScreen';
import { MissionLogisticsScreen } from '../screens/MissionLogisticsScreen';
import { MissionCorePillarsScreen } from '../screens/MissionCorePillarsScreen';
import { MissionDeploymentScreen } from '../screens/MissionDeploymentScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
        initialRouteName="Login"
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* Legacy / Collector screens */}
        <Stack.Screen name="CollectorDashboard" component={CollectorDashboardScreen} />
        <Stack.Screen name="QualityAssessment" component={QualityAssessmentScreen} />
        
        {/* Mission Flow */}
        <Stack.Screen name="MissionFoundations" component={MissionFoundationsScreen} />
        <Stack.Screen name="MissionLogistics" component={MissionLogisticsScreen} />
        <Stack.Screen name="MissionCorePillars" component={MissionCorePillarsScreen} />
        <Stack.Screen name="MissionDeployment" component={MissionDeploymentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
