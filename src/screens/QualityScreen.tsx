import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CONDITIONS = [
  'Clean & Dry',
  'Minor Wear',
  'Torn / Damaged',
  'Stained',
  'Wet / Moldy',
  'Heavy Odor',
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const QualityScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleCondition = (item: string) => {
    if (selectedConditions.includes(item)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== item));
    } else {
      setSelectedConditions([...selectedConditions, item]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quality</Text>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Batch Identifier Card */}
        <View style={styles.batchCard}>
          <Text style={styles.batchLabel}>BATCH IDENTIFIER</Text>
          <Text style={styles.batchTitle}>Mixed Textile Cluster #REC-9821</Text>

          <View style={styles.pillsRow}>
            {/* Weight Pill */}
            <View style={styles.weightPill}>
              <Text style={styles.pillLabel}>WEIGHT</Text>
              <Text style={styles.weightVal}>12.4 kg</Text>
            </View>

            {/* Origin Pill */}
            <View style={styles.originPill}>
              <Text style={styles.pillLabelRed}>ORIGIN</Text>
              <Text style={styles.originVal}>Sector B-4</Text>
            </View>
          </View>
        </View>

        {/* Condition Checklist */}
        <Text style={styles.sectionLabel}>CONDITION CHECKLIST</Text>
        <View style={styles.checklistGrid}>
          {CONDITIONS.map((c) => {
            const isChecked = selectedConditions.includes(c);
            return (
              <TouchableOpacity
                key={c}
                style={styles.checkCard}
                onPress={() => toggleCondition(c)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                  {isChecked && <Icon name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkCardText}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Assessment Notes */}
        <Text style={styles.sectionLabel}>ASSESSMENT NOTES</Text>
        <View style={styles.textareaContainer}>
          <TextInput
            placeholder="Enter detailed observations..."
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={styles.refuseBtn}
            onPress={() => navigation.navigate('Collection')}
            activeOpacity={0.8}
          >
            <Icon name="close-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.refuseBtnText}>REFUSE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => navigation.navigate('Confirmation')}
            activeOpacity={0.8}
          >
            <View style={styles.checkIconCircle}>
              <Icon name="check-circle-outline" size={18} color="#15A800" />
            </View>
            <Text style={styles.acceptBtnText}>ACCEPT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15A800',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  userAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 24,
  },
  batchLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  batchTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightPill: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#15A800',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  weightVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15A800',
  },
  originPill: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLabelRed: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  originVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#991B1B',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  checklistGrid: {
    gap: 10,
    marginBottom: 24,
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#15A800',
    borderColor: '#15A800',
  },
  checkCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  textareaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    padding: 14,
    marginBottom: 28,
  },
  textarea: {
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  refuseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 25,
    height: 52,
    gap: 8,
  },
  refuseBtnText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 25,
    height: 52,
    gap: 8,
  },
  checkIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

