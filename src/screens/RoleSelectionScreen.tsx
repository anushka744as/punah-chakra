import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

interface RoleOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  color: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'citizen',
    title: 'Citizen / Household Donor',
    subtitle: 'Schedule waste pickups, track household recycling, earn EcoPoints.',
    icon: 'home-heart',
    badge: 'Popular',
    color: '#15A800',
  },
  {
    id: 'recycler',
    title: 'Recycling Facility / Processor',
    subtitle: 'Manage material intake, sorting lines, inventory, and end-product analytics.',
    icon: 'factory',
    badge: 'Commercial',
    color: '#15A800',
  },
  {
    id: 'logistics',
    title: 'Logistics / Fleet Fleet',
    subtitle: 'Manage driver routes, vehicle capacities, pickup confirmations.',
    icon: 'truck-delivery',
    badge: 'Operations',
    color: '#1E40AF',
  },
  {
    id: 'quality',
    title: 'Quality Inspector',
    subtitle: 'Inspect waste purity, issue certifications, approve batch distributions.',
    icon: 'clipboard-check',
    badge: 'Audit',
    color: '#D97706',
  },
];

export const RoleSelectionScreen = ({ navigation }: any) => {
  const [selectedRole, setSelectedRole] = useState('citizen');

  const handleConfirm = () => {
    if (selectedRole === 'recycler') {
      navigation.navigate('OnboardingPillars');
    } else if (selectedRole === 'logistics') {
      navigation.navigate('OnboardingLogistics');
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Select Your Role</Text>
          <Text style={styles.subtitle}>
            Choose how you will participate in the PunahChakra ecosystem.
          </Text>
        </View>

        <View style={styles.rolesList}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <Card
                key={role.id}
                variant={isSelected ? 'elevated' : 'outlined'}
                style={isSelected ? { ...styles.roleCard, ...styles.selectedRoleCard } : styles.roleCard}
                onPress={() => setSelectedRole(role.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: isSelected ? role.color : theme.colors.surfaceContainerLow }]}>
                    <Icon name={role.icon} size={28} color={isSelected ? '#FFF' : role.color} />
                  </View>
                  <Badge label={role.badge} variant={isSelected ? 'primary' : 'neutral'} />
                </View>

                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleSubtitle}>{role.subtitle}</Text>

                {isSelected && (
                  <View style={styles.checkIndicator}>
                    <Icon name="check-circle" size={22} color={theme.colors.primary} />
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        <Button
          title="Continue"
          variant="primary"
          size="lg"
          rightIcon={<Icon name="arrow-right" size={20} color="#FFF" />}
          onPress={handleConfirm}
          style={styles.continueBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  backBtn: {
    marginBottom: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  rolesList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  roleCard: {
    position: 'relative',
    padding: theme.spacing.lg,
  },
  selectedRoleCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  roleSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  checkIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  continueBtn: {
    width: '100%',
  },
});
