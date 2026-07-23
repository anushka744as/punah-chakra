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

const INVENTORY = [
  { category: 'Clear PET Flakes', quantity: '14.2 Tons', capacity: '75% Full', status: 'Optimal' },
  { category: 'HDPE Granules', quantity: '8.5 Tons', capacity: '42% Full', status: 'Normal' },
  { category: 'Corrugated Cardboard', quantity: '22.0 Tons', capacity: '90% Full', status: 'High' },
  { category: 'Aluminum Ingot Stock', quantity: '5.1 Tons', capacity: '25% Full', status: 'Normal' },
];

export const RecyclerInventoryScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Material Inventory</Text>
        </View>

        <View style={styles.list}>
          {INVENTORY.map((item, idx) => (
            <Card key={idx} variant="outlined" style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.catTitle}>{item.category}</Text>
                <Badge
                  label={item.status}
                  variant={item.status === 'High' ? 'warning' : 'success'}
                />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Text style={styles.capText}>{item.capacity}</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: item.capacity as any },
                    item.status === 'High' && { backgroundColor: theme.colors.warning },
                  ]}
                />
              </View>
            </Card>
          ))}
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
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  list: {
    gap: theme.spacing.md,
  },
  itemCard: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  qtyText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  capText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});
