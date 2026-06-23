import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const SignUpScreen = ({ navigation }: any) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerLogo}>
              <Icon name="recycle" size={20} color={theme.colors.textInverse} />
              <Text style={styles.logoText}>PUNAHCHAKRA</Text>
            </View>
            <Icon name="help-circle-outline" size={24} color={theme.colors.textInverse} />
          </View>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Sign Up</Text>
            <Text style={styles.headerSubtitle}>INDUSTRIAL EFFICIENCY STARTS HERE</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <InputField 
            label="FULL NAME"
            placeholder="Johnathan Doe"
            autoCapitalize="words"
          />
          
          <InputField 
            label="EMAIL ADDRESS"
            placeholder="corp@recyclepro.io"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.passwordInputContainer}>
            <InputField 
              label="PASSWORD"
              placeholder="••••••••"
              secureTextEntry
              containerStyle={{ marginBottom: 0 }}
            />
            <Icon name="eye-outline" size={20} color={theme.colors.textSecondary} style={styles.eyeIcon} />
          </View>

          <Button 
            title="SIGN UP"
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Welcome')}
          />
          
          <Button 
            title="CONTINUE WITH CORPORATE SSO"
            variant="outlined"
            style={styles.ssoButton}
            textStyle={styles.ssoButtonText}
            onPress={() => {}}
          />
          
          {/* Checkbox Section */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
              onPress={() => setAgreed(!agreed)}
            >
              {agreed && <Icon name="check" size={16} color={theme.colors.primary} />}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>
              I agree to the <Text style={styles.linkText}>Service Level Agreement</Text> and the <Text style={styles.linkText}>Sustainability Data Policy</Text>.
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Icon name="robot-industrial" size={120} color={theme.colors.border} style={styles.watermark} />
          <Text style={styles.footerText}>Already part of the network?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>LOG IN INSTEAD</Text>
          </TouchableOpacity>
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
  },
  headerSection: {
    backgroundColor: theme.colors.primaryDark,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 10,
    color: theme.colors.primaryLight,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  formSection: {
    padding: theme.spacing.xl,
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 36, // Adjust based on label height
  },
  signUpButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  ssoButton: {
    marginBottom: theme.spacing.xl,
    borderColor: theme.colors.border,
  },
  ssoButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceVariant,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  linkText: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  footerContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.3,
  },
  footerText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  loginLink: {
    ...theme.typography.label,
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
});
