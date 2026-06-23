import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const LoginScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Logo */}
        <View style={styles.headerLogo}>
          <Icon name="recycle" size={20} color={theme.colors.primary} />
          <Text style={styles.logoText}>PUNAHCHAKRA</Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Enter your credentials to access the logistics dashboard.</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <InputField 
            label="EMAIL ADDRESS"
            placeholder="name@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.passwordHeader}>
            <Text style={styles.label}>PASSWORD</Text>
            <TouchableOpacity>
              <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.passwordInputContainer}>
            <InputField 
              placeholder="••••••••"
              secureTextEntry
              containerStyle={{ marginBottom: 0 }}
            />
            <Icon name="eye-outline" size={20} color={theme.colors.textSecondary} style={styles.eyeIcon} />
          </View>

          <Button 
            title="SIGN IN →"
            style={styles.signInButton}
            onPress={() => navigation.navigate('Welcome')}
          />
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>New to the platform? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.registerLink}>CREATE AN ACCOUNT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        {/* Footer Badges */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Icon name="shield-check-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>SECURE</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="factory" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>INDUSTRIAL</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="domain" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.badgeText}>ENTERPRISE</Text>
          </View>
        </View>

        {/* Footer Text */}
        <View style={styles.footerTextContainer}>
          <Text style={styles.copyrightText}>© 2024 RECYCLE PRO LOGISTICS CORP.</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>PRIVACY POLICY</Text>
            <Text style={styles.footerLink}>TERMS OF SERVICE</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.xl,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  logoText: {
    ...theme.typography.label,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  titleSection: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.label,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.xs,
  },
  forgotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  signInButton: {
    marginTop: theme.spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  registerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    ...theme.typography.bodySmall,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  spacer: {
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  badge: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  badgeText: {
    fontSize: 8,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footerTextContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  copyrightText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
  },
  footerLink: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginHorizontal: 8,
  },
});
