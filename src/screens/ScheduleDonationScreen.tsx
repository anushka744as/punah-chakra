import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const ScheduleDonationScreen = ({ navigation }: any) => {
  const [selectedType, setSelectedType] = useState('CLOTHES');
  const [selectedDate, setSelectedDate] = useState('13');

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
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroHindiLogo}>पुनः</Text>
          </View>
          <View style={styles.saveBox}>
            <Text style={styles.saveText}>SAVE</Text>
            <Text style={styles.saveNumber}>68K</Text>
          </View>
        </View>

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
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>Morning</Text>
          <Icon name="chevron-down" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Date Selector */}
        <Text style={styles.label}>SELECT DATE</Text>
        <View style={styles.dateSelector}>
          {[
            { day: 'Thu', date: '13' },
            { day: 'Fri', date: '14' },
            { day: 'Sat', date: '15' },
            { day: 'Sun', date: '16' }
          ].map((item) => (
            <TouchableOpacity 
              key={item.date} 
              style={[styles.dateItem, selectedDate === item.date && styles.dateItemSelected]}
              onPress={() => setSelectedDate(item.date)}
            >
              <Text style={[styles.dateDay, selectedDate === item.date && styles.dateTextSelected]}>{item.day}</Text>
              <Text style={[styles.dateNumber, selectedDate === item.date && styles.dateTextSelected]}>{item.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button 
          title="CONFIRM REQUEST"
          style={styles.confirmBtn}
          onPress={() => navigation.navigate('DonatorDashboard')}
        />
        
        <Text style={styles.footerNote}>COLLECTION HANDLED BY REGIONAL FLEET</Text>
      </ScrollView>
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
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  heroHindiLogo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  saveBox: {
    backgroundColor: theme.colors.primaryDark,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 10,
    color: theme.colors.textInverse,
    fontWeight: 'bold',
  },
  saveNumber: {
    fontSize: 24,
    color: theme.colors.textInverse,
    fontWeight: 'bold',
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
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderRadius: 2,
  },
  dropdownText: {
    ...theme.typography.body,
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
});
