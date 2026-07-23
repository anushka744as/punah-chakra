import React, { useState } from 'react';
import { Alert, TextInput, View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase, createDonationRequest } from '../services/api';

export const ScheduleDonationScreen = ({ navigation }: any) => {
  const [selectedType, setSelectedType] = useState('CLOTHES');
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedWindow, setSelectedWindow] = useState('Morning');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = Array.from({ length: 4 }).map((_, index) => {
    const value = new Date();
    value.setDate(value.getDate() + index + 1);

    return {
      day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(value),
      date: new Intl.DateTimeFormat('en-IN', { day: '2-digit' }).format(value),
      label: new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(value),
    };
  });

  const confirmRequest = async () => {
    if (submitting) return;
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      Alert.alert('Pickup address required', 'Add the collection address before confirming the request.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitting(false);
        Alert.alert('Sign In Required', 'Please sign in to schedule a donation pickup.');
        navigation.navigate('Login');
        return;
      }

      await createDonationRequest({
        category: selectedType,
        pickup_day: dateOptions[selectedDate].label,
        time_slot: selectedWindow,
        address: trimmedAddress,
        instructions: notes.trim(),
        weight_kg: 5.0,
      }, user.id);

      setSubmitting(false);
      Alert.alert('Pickup Scheduled', 'Your donation request has been successfully created!');
      navigation.navigate('Home');
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Error Scheduling Pickup', err?.message || 'Could not create donation request.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Icon name="menu" size={24} color={theme.colors.textInverse} />
        <View style={styles.headerLogo}>
          <Icon name="recycle" size={18} color={theme.colors.primaryDark} />
          <Text style={styles.logoText}>PUNAHCHAKRA</Text>
        </View>
        <Icon name="lock-outline" size={24} color={theme.colors.textInverse} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Detail your items for the next pickup</Text>

        {/* Item Types Grid */}
        <Text style={styles.label}>ITEM TYPE</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={[styles.gridItem, selectedType === 'CLOTHES' && styles.gridItemSelected]}
            onPress={() => setSelectedType('CLOTHES')}
          >
            <Icon name="tshirt-crew-outline" size={20} color={selectedType === 'CLOTHES' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.gridItemText, selectedType === 'CLOTHES' && styles.gridItemTextSelected]}>CLOTHES</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.gridItem, selectedType === 'SHOES' && styles.gridItemSelected]}
            onPress={() => setSelectedType('SHOES')}
          >
            <Icon name="shoe-sneaker" size={20} color={selectedType === 'SHOES' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.gridItemText, selectedType === 'SHOES' && styles.gridItemTextSelected]}>SHOES</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.gridItem, selectedType === 'PAPER' && styles.gridItemSelected]}
            onPress={() => setSelectedType('PAPER')}
          >
            <Icon name="newspaper-variant-outline" size={20} color={selectedType === 'PAPER' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.gridItemText, selectedType === 'PAPER' && styles.gridItemTextSelected]}>PAPER</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.gridItem, selectedType === 'E-WASTE' && styles.gridItemSelected]}
            onPress={() => setSelectedType('E-WASTE')}
          >
            <Icon name="laptop" size={20} color={selectedType === 'E-WASTE' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[styles.gridItemText, selectedType === 'E-WASTE' && styles.gridItemTextSelected]}>E-WASTE</Text>
          </TouchableOpacity>
        </View>

        {/* Collection Window */}
        <Text style={styles.label}>COLLECTION WINDOW</Text>
        <View style={styles.windowRow}>
          {['Morning', 'Afternoon', 'Evening'].map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.windowOption, selectedWindow === item && styles.windowOptionSelected]}
              onPress={() => setSelectedWindow(item)}
            >
              <Text style={[styles.windowText, selectedWindow === item && styles.windowTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selector */}
        <Text style={styles.label}>SELECT DATE</Text>
        <View style={styles.dateSelector}>
          {dateOptions.map((item, index) => (
            <TouchableOpacity 
              key={item.label} 
              style={[styles.dateItem, selectedDate === index && styles.dateItemSelected]}
              onPress={() => setSelectedDate(index)}
            >
              <Text style={[styles.dateDay, selectedDate === index && styles.dateTextSelected]}>{item.day}</Text>
              <Text style={[styles.dateNumber, selectedDate === index && styles.dateTextSelected]}>{item.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>PICKUP ADDRESS</Text>
        <TextInput
          style={styles.textInput}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter collection address"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional pickup notes"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />

        <Button 
          title="CONFIRM REQUEST"
          style={styles.confirmBtn}
          onPress={confirmRequest}
        />
        
        <Text style={styles.footerNote}>COLLECTION HANDLED BY REGIONAL FLEET</Text>
      </ScrollView>

      {submitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>Scheduling Pickup...</Text>
            <Text style={styles.loadingSub}>Saving donation request to Supabase</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  logoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  content: {
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.body,
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  gridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 2,
  },
  gridItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#ECFDF5',
  },
  gridItemText: {
    ...theme.typography.label,
    fontSize: 12,
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  gridItemTextSelected: {
    color: theme.colors.primary,
  },
  windowRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
  },
  windowOption: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderWidth: 1,
    flex: 1,
    marginRight: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: 2,
  },
  windowOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  windowText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  windowTextSelected: {
    color: theme.colors.textInverse,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  dateItemSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateDay: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dateNumber: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  dateTextSelected: {
    color: theme.colors.textInverse,
  },
  textInput: {
    ...theme.typography.body,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    minHeight: 52,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 88,
  },
  confirmBtn: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  footerNote: {
    fontSize: 10,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loadingCard: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  loadingSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
