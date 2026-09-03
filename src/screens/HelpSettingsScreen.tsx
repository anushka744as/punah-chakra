import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { InputField } from '../components/InputField';

const FAQS = [
  {
    question: 'How do I schedule a pickup?',
    answer: 'Open the Donate tab, select the item types you\'re giving (clothes, shoes, blankets/bedsheets, or bags), pick a pickup slot for the next day onwards, and confirm your address. Your request starts as "Pending" until a nearby collector confirms it — you\'ll get a notification once that happens, and again once the pickup is completed.',
  },
  {
    question: 'What materials can I donate?',
    answer: 'Clothes, shoes, blankets/bedsheets, and bags. Hazardous or heavily soiled items are not accepted.',
  },
  {
    question: 'Can I reschedule or cancel?',
    answer: 'Yes — as long as a collector hasn\'t confirmed your pickup yet, you can edit or cancel it from your Profile\'s Recent Activity list. Once a collector confirms, the pickup is locked in.',
  },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HelpSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
  });

  const handleEmailSupport = () => {
    Linking.openURL('mailto:info.punahchakra@gmail.com').catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>Need a hand?</Text>
          <Text style={styles.bannerSubtitle}>Search our FAQs or contact support directly.</Text>

          <TouchableOpacity
            style={styles.emailBtn}
            onPress={handleEmailSupport}
            activeOpacity={0.85}
          >
            <Icon name="email-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.emailBtnText} numberOfLines={1} adjustsFontSizeToFit>
              Email Support
            </Text>
          </TouchableOpacity>
          <Text style={styles.emailAddressText}>info.punahchakra@gmail.com</Text>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>FAQs</Text>

        <InputField
          placeholder="Search FAQs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Icon name="magnify" size={20} color={theme.colors.textSecondary} />}
          containerStyle={styles.searchField}
        />

        <View style={styles.faqCard}>
          {filteredFaqs.length === 0 ? (
            <Text style={styles.noResultsText}>No FAQs match "{searchQuery}".</Text>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === FAQS.indexOf(faq);
              return (
                <View key={faq.question}>
                  <TouchableOpacity
                    style={styles.faqHeaderRow}
                    onPress={() => toggleAccordion(FAQS.indexOf(faq))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.questionText}>{faq.question}</Text>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.answerText}>{faq.answer}</Text>
                    </View>
                  )}

                  {index < filteredFaqs.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
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
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: theme.colors.primaryContainer,
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
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    height: 48,
    paddingHorizontal: 20,
    gap: 8,
  },
  emailBtnText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
  },
  emailAddressText: {
    color: theme.colors.primaryContainer,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 14,
  },
  searchField: {
    marginBottom: 14,
  },
  noResultsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    padding: 20,
    textAlign: 'center',
  },
  faqCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    paddingRight: 10,
  },
  faqAnswerContainer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  answerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});

