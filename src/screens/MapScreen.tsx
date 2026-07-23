import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

const HUBS = [
  {
    id: 1,
    name: 'GreenLoop Processing Hub #04',
    address: 'Sector 18, Industrial Area',
    distance: '1.2 km away',
    types: ['Plastics', 'E-Waste'],
    status: 'Open Today',
  },
  {
    id: 2,
    name: 'EcoRecycle Material Depot',
    address: 'Plot 45, Tech Zone Phase 2',
    distance: '3.5 km away',
    types: ['Metals', 'Glass', 'Paper'],
    status: 'Open Today',
  },
];

export const MapScreen = ({ navigation }: any) => {
  const [selectedHub, setSelectedHub] = useState(HUBS[0]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Interactive Simulation Box */}
      <View style={styles.mapCanvas}>
        <Icon name="map" size={80} color={theme.colors.borderVariant} />
        <Text style={styles.mapCanvasText}>Interactive Collection Map View</Text>

        {/* Floating Pins */}
        <TouchableOpacity
          style={[styles.mapPin, { top: '35%', left: '40%' }]}
          onPress={() => setSelectedHub(HUBS[0])}
        >
          <Icon name="map-marker" size={32} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapPin, { top: '55%', left: '65%' }]}
          onPress={() => setSelectedHub(HUBS[1])}
        >
          <Icon name="map-marker" size={32} color={theme.colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Floating Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Nearby Collection Points</Text>

        <Card variant="outlined" style={styles.selectedHubCard}>
          <View style={styles.hubHeader}>
            <Text style={styles.hubName}>{selectedHub.name}</Text>
            <Badge label={selectedHub.status} variant="success" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Icon name="map-marker-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.hubDistance}>{selectedHub.distance}</Text>
          </View>

          <View style={styles.tagsRow}>
            {selectedHub.types.map((t) => (
              <Badge key={t} label={t} variant="neutral" size="sm" />
            ))}
          </View>

          <Button
            title="Navigate to Drop Center"
            variant="primary"
            size="md"
            rightIcon={<Icon name="navigation" size={18} color="#FFF" />}
            onPress={() => {}}
            style={styles.navBtn}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapCanvasText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  mapPin: {
    position: 'absolute',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderVariant,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  selectedHubCard: {
    padding: theme.spacing.md,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hubName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hubAddress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  hubDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  navBtn: {
    width: '100%',
  },
});
