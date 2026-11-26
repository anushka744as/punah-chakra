import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '../components/Button';
import { useAppData } from '../data/AppDataContext';
import { theme } from '../theme/theme';
import { getStatusLabel, type UserProfile } from '../services/api';
import { stripAddressMeta } from '../utils/address';
import { displayStatus } from '../utils/orderAnalytics';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const ProfileDetailScreen = ({ navigation, route }: any) => {
  const { donations, profile, updateProfile } = useAppData();
  const type = route.params?.type ?? 'personal';
  const [draftProfile, setDraftProfile] = React.useState<UserProfile>(profile ?? { id: '', email: '', full_name: '', phone: '', address: '' } as UserProfile);

  const titleMap: Record<string, string> = {
    personal: 'Personal Information',
    history: 'Collection History',
    privacy: 'Privacy & Security',
    help: 'Help Center',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Button
          title="BACK"
          variant="secondary"
          style={styles.backButton}
          textStyle={styles.backButtonText}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{titleMap[type]}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {type === 'personal' && (
          <View>
            <EditableRow
              label="Name"
              value={draftProfile?.full_name || ''}
              icon="account-outline"
              placeholder="Add your name"
              onChangeText={full_name => setDraftProfile(current => ({ ...current!, full_name }))}
            />
            <EditableRow
              label="Email"
              value={draftProfile?.email || ''}
              icon="email-outline"
              placeholder="Add your email"
              onChangeText={email => setDraftProfile(current => ({ ...current!, email }))}
            />
            <EditableRow
              label="Phone"
              value={draftProfile?.phone || ''}
              icon="phone-outline"
              placeholder="Add your phone number"
              onChangeText={phone => setDraftProfile(current => ({ ...current!, phone }))}
            />
            <EditableRow
              label="Default pickup address"
              value={draftProfile?.address || ''}
              icon="map-marker-outline"
              placeholder="Add a default pickup address"
              onChangeText={address => setDraftProfile(current => ({ ...current!, address }))}
              multiline
            />
            <Button
              title="SAVE CHANGES"
              style={styles.saveButton}
              onPress={() => {
                updateProfile(draftProfile as any);
                Alert.alert('Saved', 'Personal information updated for this app session.');
              }}
            />
          </View>
        )}

        {type === 'history' && (
          <View>
            {donations.length === 0 ? (
              <EmptyState
                icon="history"
                title="No collection history yet"
                body="Confirmed donation requests will appear here after you schedule them."
              />
            ) : (
              donations.map(item => (
                <View key={item.id} style={styles.historyItem}>
                  <Icon name="truck-delivery-outline" size={24} color={theme.colors.primaryDark} />
                  <View style={styles.historyBody}>
                    <Text style={styles.historyTitle}>{item.category}</Text>
                    <Text style={styles.historyText}>
                      {item.pickup_day} · {item.time_slot}
                    </Text>
                    <Text style={styles.historyText}>{stripAddressMeta(item.address)}</Text>
                    <Text style={styles.historyMeta}>Requested {item.created_at ? formatDate(item.created_at) : 'Unknown'}</Text>
                  </View>
                  <Text style={styles.status}>{displayStatus(item).toUpperCase()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {type === 'privacy' && (
          <View>
            <InfoRow label="Location access" value="Requested only for map centering" icon="crosshairs-gps" />
            <InfoRow label="Map provider" value="OpenStreetMap via Leaflet" icon="map-outline" />
            <InfoRow label="Stored donation data" value="This demo stores session data locally in app memory" icon="database-outline" />
          </View>
        )}

        {type === 'help' && (
          <View>
            <InfoRow label="Schedule a donation" value="Open Collection and confirm the item type, date, time window, and pickup address." icon="calendar-plus" />
            <InfoRow label="Impact map" value="Open View Impact Map and allow location permission to center the map near you." icon="map-marker-radius" />
            <InfoRow label="Account details" value="Personal information is shown only when data exists in the app." icon="account-check-outline" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={24} color={theme.colors.textSecondary} />
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const EditableRow = ({
  icon,
  label,
  value,
  placeholder,
  onChangeText,
  multiline,
}: {
  icon: string;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) => (
  <View style={styles.editableRow}>
    <Icon name={icon} size={24} color={theme.colors.textSecondary} />
    <View style={styles.infoBody}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </View>
  </View>
);

const EmptyState = ({ icon, title, body }: { icon: string; title: string; body: string }) => (
  <View style={styles.emptyState}>
    <Icon name={icon} size={40} color={theme.colors.textSecondary} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryDark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 10,
  },
  headerTitle: {
    color: theme.colors.textInverse,
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 58,
  },
  content: {
    padding: theme.spacing.md,
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
  },
  editableRow: {
    alignItems: 'flex-start',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
  },
  infoBody: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    ...theme.typography.body,
  },
  input: {
    ...theme.typography.body,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
  historyItem: {
    alignItems: 'flex-start',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
  },
  historyBody: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  historyTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyText: {
    ...theme.typography.bodySmall,
  },
  historyMeta: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
  },
  status: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
    marginTop: theme.spacing.md,
  },
  emptyBody: {
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
