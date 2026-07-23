import React from 'react';
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
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

export const RecyclerProcessingScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Sorting & Line Processing</Text>
        </View>

        <Card variant="outlined" style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineTitle}>Optical Sorting Line A</Text>
            <Badge label="Active" variant="success" />
          </View>
          <Text style={styles.lineDesc}>Processing: PET Plastic Bottles  •  Speed: 1.5 T/hr</Text>
        </Card>

        <Card variant="outlined" style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineTitle}>Shredder Unit B</Text>
            <Badge label="Maintenance" variant="warning" />
          </View>
          <Text style={styles.lineDesc}>Scheduled blade replacement  •  Est. resume: 2 hours</Text>
        </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  lineCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  lineDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
