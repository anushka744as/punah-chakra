import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FAQS = [
  {
    question: 'How do I schedule a pickup?',
    answer: 'Open the Donate tab, choose the material type, pick a slot, and confirm your address. You will receive a notification once a collector accepts.',
  },
  {
    question: 'What materials can I donate?',
    answer: 'Clothes, textiles, paper, cardboard, e-waste, and recyclable containers. Hazardous waste is not accepted.',
  },
  {
    question: 'How is my impact calculated?',
    answer: 'Impact points and CO₂ offsets are calculated using lifecycle analysis standards for each kilogram of material recovered.',
  },
  {
    question: 'Can I reschedule or cancel?',
    answer: 'Yes, you can reschedule or cancel scheduled collection requests through the Alerts screen up to 2 hours prior to the slot.',
  },
  {
    question: 'How do collectors verify batches?',
    answer: 'Collectors use the Quality tool on-site to score each batch. You\'ll see the result in your activity feed.',
  },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HelpSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(4); // Default 4 expanded like in Image 3

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>Need a hand?</Text>
          <Text style={styles.bannerSubtitle}>Search our FAQs or contact support directly.</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.chatBtn} activeOpacity={0.8}>
              <Icon name="message-outline" size={18} color="#FFFFFF" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailBtn} activeOpacity={0.8}>
              <Icon name="email-outline" size={18} color="#15A800" />
              <Text style={styles.emailBtnText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>FAQs</Text>

        <View style={styles.faqCard}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={faq.question}>
                <TouchableOpacity
                  style={styles.faqHeaderRow}
                  onPress={() => toggleAccordion(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}

                {index < FAQS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
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
    paddingTop: 20,
  },
  bannerCard: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 25,
    height: 48,
    gap: 8,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 48,
    gap: 8,
  },
  emailBtnText: {
    color: '#15A800',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    paddingRight: 10,
  },
  faqAnswerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});

