import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const QualityAssessmentScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color={theme.colors.textInverse} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Quality Assessment</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Quality Assessment Form goes here.</Text>
        <Button title="Complete" onPress={() => navigation.goBack()} style={{marginTop: 20}} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryDark,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  content: {
    padding: theme.spacing.xl,
  },
  text: {
    ...theme.typography.body,
  }
});
