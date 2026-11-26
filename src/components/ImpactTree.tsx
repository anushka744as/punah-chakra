import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { Tree3D } from './Tree3D';
import { useReducedMotion } from '../hooks/useTreeProgress';
import type { useTreeProgress } from '../hooks/useTreeProgress';
import { TREE_STAGES, TreePickup, stageIndexOf } from '../utils/treeGrowth';

type Tree = ReturnType<typeof useTreeProgress>;

const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(1));
const leafText = (n: number) => `${n} ${n === 1 ? 'leaf' : 'leaves'}`;

export const PickupsSheet = ({
  visible,
  pickups,
  focusId,
  onClose,
}: {
  visible: boolean;
  pickups: TreePickup[];
  focusId?: string | null;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <Pressable style={sheet.backdrop} onPress={onClose} />
    <View style={sheet.card}>
      <View style={sheet.handle} />
      <Text style={sheet.title}>What you donated</Text>
      <Text style={sheet.sub}>Every leaf is one item. Tap a leaf to see which pickup it came from.</Text>
      <ScrollView style={{ maxHeight: 340 }}>
        {pickups.length === 0 ? (
          <Text style={sheet.empty}>No completed pickups yet.</Text>
        ) : (
          [...pickups].reverse().map(p => (
            <View key={p.id} style={[sheet.row, focusId === p.id && sheet.rowFocus]}>
              <Icon name="leaf" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={sheet.rowTitle}>{p.items.join(', ') || 'Donation'}</Text>
                <Text style={sheet.rowSub}>
                  {p.date} · {leafText(p.itemsCount)}
                </Text>
              </View>
              <Text style={sheet.rowKg}>{fmt(p.kg)} kg</Text>
            </View>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={sheet.btn} onPress={onClose} activeOpacity={0.85}>
        <Text style={sheet.btnText}>Close</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

export const ImpactTree = ({ tree, onSchedule }: { tree: Tree; onSchedule: () => void }) => {
  const reduced = useReducedMotion();
  const { kg, leaves, pickups, items, glowIds, seed } = tree;
  const idx = stageIndexOf(kg);
  const stage = TREE_STAGES[idx];
  const isSeed = kg <= 0 && leaves.length === 0;
  const treeName = tree.name || stage.treeName;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const openSheet = (pickupId?: string) => {
    setFocusId(pickupId || null);
    setSheetOpen(true);
    if (glowIds.length) tree.clearGlow();
  };

  const latestGlow = pickups.find(p => p.id === glowIds[glowIds.length - 1]);
  const newLeaves = pickups.filter(p => glowIds.includes(p.id)).reduce((s, p) => s + p.itemsCount, 0);
  const weekday = latestGlow ? ((): string => {
    const d = new Date(latestGlow.createdAt);
    return isNaN(d.getTime()) ? 'your' : `${d.toLocaleDateString('en-US', { weekday: 'long' })}'s`;
  })() : '';

  const body = (
    <>
      <View style={styles.headRow}>
        <Text style={styles.eyebrow}>YOUR IMPACT TREE</Text>
      </View>

      <View style={styles.artWrap}>
        {newLeaves > 0 && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>+{newLeaves} new {newLeaves === 1 ? 'leaf' : 'leaves'}</Text>
          </View>
        )}
        <View style={styles.art3d}>
          <Tree3D seed={tree.seed} pickups={pickups} newIds={glowIds} height={isSeed ? 190 : 280} reduced={reduced} intro />
          {!isSeed && <Pressable style={StyleSheet.absoluteFill} onPress={() => openSheet()} accessibilityLabel="See what you donated" />}
        </View>
      </View>

      <Text style={styles.stage}>
        {stage.name}
        {!!treeName && <Text style={styles.treeName}>  “{treeName}”</Text>}
      </Text>
      <Text style={styles.sub}>
        {isSeed ? (tree.upcoming ? '' : 'Your first pickup plants your seed') : `${stage.name} · ${leafText(leaves.length)}`}
      </Text>
      {!isSeed && <Text style={styles.sub2}>{fmt(kg)} kg rescued from landfill</Text>}
      {!!tree.upcoming && (
        <Text style={styles.waiting}>
          Pickup booked for {tree.upcoming.day}, {tree.upcoming.slot}. Your tree grows once it's done.
        </Text>
      )}

      {!isSeed && (
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileNum}>{items}</Text>
            <Text style={styles.tileLabel}>items rehomed</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileNum}>{pickups.length}</Text>
            <Text style={styles.tileLabel}>pickups done</Text>
          </View>
        </View>
      )}

      {glowIds.length > 0 ? (
        <Text style={styles.caption}>Tap the glowing leaves to see {weekday} pickup</Text>
      ) : (
        !isSeed && <Text style={styles.caption}>Tap a leaf to see what you donated</Text>
      )}
    </>
  );

  return (
    <>
      {isSeed ? (
        <Pressable style={styles.card} onPress={onSchedule} accessibilityRole="button" accessibilityLabel="Schedule your first pickup">
          {body}
        </Pressable>
      ) : (
        <View style={styles.card}>{body}</View>
      )}
      <PickupsSheet visible={sheetOpen} pickups={pickups} focusId={focusId} onClose={() => setSheetOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    // no box: the tree stands directly on the app background
    backgroundColor: 'transparent',
    padding: 6,
    marginTop: 18,
    marginBottom: 18,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  artWrap: { marginTop: 8 },
  art3d: { width: '100%' },
  newBadge: { position: 'absolute', right: 0, top: 0, zIndex: 2, backgroundColor: '#FFC83D', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  newBadgeText: { fontSize: 11, fontFamily: theme.fonts.bodyBold, color: '#5A4300' },
  stage: { fontSize: 20, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, textAlign: 'center', marginTop: 2 },
  treeName: { fontSize: 16, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primaryDark },
  sub: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 2 },
  waiting: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primaryDark, textAlign: 'center', marginTop: 8, backgroundColor: theme.colors.primaryContainer, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, overflow: 'hidden' },
  sub2: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text, textAlign: 'center', marginTop: 2 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tile: { flex: 1, backgroundColor: theme.colors.primaryContainer, borderRadius: 16, paddingVertical: 10, alignItems: 'center' },
  tileNum: { fontSize: 22, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  tileLabel: { fontSize: 11, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  caption: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12 },
});

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 28 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginBottom: 12 },
  title: { fontSize: 20, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  sub: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 12 },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, fontFamily: theme.fonts.body, paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14 },
  rowFocus: { backgroundColor: '#FFF3CC' },
  rowTitle: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  rowSub: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  rowKg: { fontSize: 14, fontFamily: theme.fonts.bodyBold, color: theme.colors.primaryDark },
  btn: { marginTop: 12, backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  btnText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
});
