import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme/theme';
import { Confetti } from './SuccessOverlay';
import { ProceduralTree } from './ProceduralTree';
import { MilestoneBar } from './ImpactTree';
import { useReducedMotion } from '../hooks/useTreeProgress';
import type { Reveal } from '../hooks/useTreeProgress';
import { TREE_STAGES, journeyFraction, leavesOf, stageIndexOf } from '../utils/treeGrowth';

const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(1));

const shareText = (stageName: string, kg: number) =>
  Share.share({ message: `My PunahChakra tree is now a ${stageName.toLowerCase()}: ${fmt(kg)} kg rescued from landfill. Give your items a second chance!` }).catch(() => {});

type GrowthProps = {
  visible: boolean;
  reveal: Reveal | null;
  seed: number;
  onSeeDonated: () => void;
  onClose: () => void;
};

// After a pickup is completed: the tree before, and now, with the new leaves growing in one by one.
export const GrowthModal = ({ visible, reveal, seed, onSeeDonated, onClose }: GrowthProps) => {
  const reduced = useReducedMotion();
  const beforeLeaves = reveal ? leavesOf(reveal.before) : [];
  const nowLeaves = reveal ? leavesOf(reveal.now) : [];
  const [shown, setShown] = useState(beforeLeaves.length);

  useEffect(() => {
    if (!visible || !reveal) return;
    const start = beforeLeaves.length;
    const end = nowLeaves.length;
    if (reduced || end <= start) {
      setShown(end);
      return;
    }
    setShown(start);
    const step = Math.min(120, 2400 / (end - start));
    let n = start;
    const t = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= end) clearInterval(t);
    }, step);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reveal, reduced]);

  if (!reveal) return null;
  const newIds = reveal.added.map(p => p.id);
  const oldPct = Math.round(journeyFraction(reveal.kgBefore) * 100);
  const newPct = Math.round(journeyFraction(reveal.kgNow) * 100);
  const idx = stageIndexOf(reveal.kgNow);
  const next = idx < TREE_STAGES.length - 1 ? TREE_STAGES[idx + 1] : null;
  const stage = TREE_STAGES[idx];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={g.screen}>
        <ScrollView contentContainerStyle={g.content}>
          <Text style={g.title}>Pickup #{reveal.now.length} completed</Text>
          <Text style={g.sub}>Your tree just grew</Text>

          <View style={g.row}>
            <View style={[g.card, { opacity: 0.6 }]}>
              <Text style={g.cardLabel}>BEFORE</Text>
              <ProceduralTree seed={seed} kg={reveal.kgBefore} leaves={beforeLeaves} width={140} />
            </View>
            <View style={[g.card, g.cardNow]}>
              <Text style={[g.cardLabel, { color: theme.colors.primaryDark }]}>NOW</Text>
              <ProceduralTree seed={seed} kg={reveal.kgNow} leaves={nowLeaves} visibleCount={shown} highlightIds={newIds} width={140} />
            </View>
          </View>

          <Text style={g.leafLine}>
            +{reveal.itemsAdded} new leaf{reveal.itemsAdded === 1 ? '' : 'ves'}, one per item you gave
          </Text>

          <View style={g.tiles}>
            <View style={g.tile}>
              <Text style={g.tileNum}>+{fmt(reveal.kgNow - reveal.kgBefore)} kg</Text>
              <Text style={g.tileLabel}>saved today</Text>
            </View>
            <View style={g.tile}>
              <Text style={g.tileNum}>+{reveal.itemsAdded}</Text>
              <Text style={g.tileLabel}>items rehomed</Text>
            </View>
          </View>

          <View style={g.progress}>
            <MilestoneBar kg={reveal.kgNow} old={reveal.kgBefore} />
            <Text style={g.pct}>{oldPct}% → {newPct}%</Text>
            <Text style={g.next}>
              {next ? `${fmt(Math.max(0, Math.ceil((next.min - reveal.kgNow) * 10) / 10))} kg more to become a ${next.name.toLowerCase()}` : `You reached ${stage.name}!`}
            </Text>
          </View>

          <TouchableOpacity style={g.btnPrimary} onPress={() => shareText(stage.name, reveal.kgNow)} activeOpacity={0.85}>
            <Text style={g.btnPrimaryText}>Share my growth</Text>
          </TouchableOpacity>
          <TouchableOpacity style={g.btnGhost} onPress={onSeeDonated} activeOpacity={0.85}>
            <Text style={g.btnGhostText}>See what I donated</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ paddingVertical: 12 }}>
            <Text style={g.continue}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

type LevelProps = {
  visible: boolean;
  reveal: Reveal | null;
  seed: number;
  name: string;
  onSaveName: (name: string) => void;
  onClose: () => void;
};

// Full-screen moment when a pickup pushes the tree into a new stage.
export const LevelUpModal = ({ visible, reveal, seed, name, onSaveName, onClose }: LevelProps) => {
  const reduced = useReducedMotion();
  const grow = useRef(new Animated.Value(0)).current;
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    if (!visible) return;
    setNaming(false);
    setDraft(name);
    grow.setValue(reduced ? 1 : 0);
    if (!reduced) Animated.timing(grow, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduced]);

  if (!reveal) return null;
  const from = TREE_STAGES[reveal.stageBefore];
  const to = TREE_STAGES[reveal.stageNow];
  const next = reveal.stageNow < TREE_STAGES.length - 1 ? TREE_STAGES[reveal.stageNow + 1] : null;
  const title =
    reveal.stageBefore === 0 ? 'Your seed sprouted!' : `Your ${from.name.toLowerCase()} grew into a ${to.name.toLowerCase()}!`;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={l.screen}>
        {visible && !reduced && <Confetti count={40} />}
        <Text style={l.level}>LEVEL {to.level} UNLOCKED</Text>
        <View style={l.art}>
          <Animated.View style={[StyleSheet.absoluteFill, l.center, { opacity: grow.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            <ProceduralTree seed={seed} kg={reveal.kgBefore} leaves={leavesOf(reveal.before)} width={260} />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, l.center, { opacity: grow, transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}
          >
            <ProceduralTree seed={seed} kg={reveal.kgNow} leaves={leavesOf(reveal.now)} width={260} />
          </Animated.View>
        </View>
        <Text style={l.title}>{title}</Text>
        <Text style={l.sub}>{fmt(reveal.kgNow)} kg of donated items got a second life.</Text>
        {next && <Text style={l.next}>Next stop: {next.name} at {next.min} kg.</Text>}

        {naming ? (
          <View style={l.nameBox}>
            <TextInput
              style={l.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="e.g. Neem"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={24}
              autoFocus
            />
            <TouchableOpacity
              style={l.btnPrimary}
              activeOpacity={0.85}
              onPress={() => {
                onSaveName(draft);
                setNaming(false);
              }}
            >
              <Text style={l.btnPrimaryText}>Save name</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={l.btns}>
            <TouchableOpacity style={l.btnPrimary} onPress={() => shareText(to.name, reveal.kgNow)} activeOpacity={0.85}>
              <Text style={l.btnPrimaryText}>Share my {to.name.toLowerCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={l.btnGhost} onPress={() => setNaming(true)} activeOpacity={0.85}>
              <Text style={l.btnGhostText}>Name my tree</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={onClose} style={{ paddingVertical: 14 }}>
          <Text style={l.continue}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const g = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  title: { fontSize: 24, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, textAlign: 'center' },
  sub: { fontSize: 15, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 10, alignItems: 'center' },
  cardNow: { borderColor: '#FFC83D', borderWidth: 2 },
  cardLabel: { alignSelf: 'flex-start', fontSize: 10, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  leafLine: { textAlign: 'center', fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primaryDark, marginTop: 14 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tile: { flex: 1, backgroundColor: theme.colors.primaryContainer, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  tileNum: { fontSize: 20, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  tileLabel: { fontSize: 11, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  progress: { marginTop: 18, backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  pct: { textAlign: 'center', fontSize: 16, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginTop: 10 },
  next: { textAlign: 'center', fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primaryDark, marginTop: 4 },
  btnPrimary: { marginTop: 18, backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
  btnGhost: { marginTop: 10, borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.primary, paddingVertical: 13, alignItems: 'center' },
  btnGhostText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  continue: { textAlign: 'center', fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
});

const l = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center', padding: 24 },
  level: { fontSize: 12, letterSpacing: 1.2, fontFamily: theme.fonts.bodyBold, color: theme.colors.primaryDark },
  art: { width: 260, height: 220, marginVertical: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, textAlign: 'center' },
  sub: { fontSize: 15, fontFamily: theme.fonts.body, color: theme.colors.text, textAlign: 'center', marginTop: 6 },
  next: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primaryDark, textAlign: 'center', marginTop: 4 },
  btns: { width: '100%', marginTop: 8 },
  nameBox: { width: '100%', marginTop: 12 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: theme.fonts.body, color: theme.colors.text },
  btnPrimary: { marginTop: 14, backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
  btnGhost: { marginTop: 10, backgroundColor: theme.colors.surface, borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  btnGhostText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  continue: { textAlign: 'center', fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
});
