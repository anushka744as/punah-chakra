import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme/theme';
import { Confetti } from './SuccessOverlay';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { EMBLEM_DATA_URI, WORDMARK_DATA_URI } from '../utils/shareLogos';
import { Tree3D, Tree3DHandle } from './Tree3D';
import { useReducedMotion } from '../hooks/useTreeProgress';
import type { Reveal } from '../hooks/useTreeProgress';
import { TREE_STAGES, TreePickup, stageIndexOf, totalItems } from '../utils/treeGrowth';

const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(1));

// Shares a finished picture of the user's tree (made by the 3D scene); falls back to text if that's not possible.
const shareTree = async (tree: Tree3DHandle | null, stageName: string, kg: number, now: TreePickup[], name?: string) => {
  try {
    const b64 = await tree?.snapshot({
      kg: fmt(kg),
      stage: stageName,
      name: name || TREE_STAGES[stageIndexOf(kg)].treeName,
      items: totalItems(now),
      pickups: now.length,
      emblem: EMBLEM_DATA_URI,
      wordmark: WORDMARK_DATA_URI,
    });
    if (b64) {
      const file = new File(Paths.cache, 'my-impact-tree.png');
      if (file.exists) file.delete();
      file.create();
      file.write(b64, { encoding: 'base64' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: 'Share my impact tree' });
        return;
      }
    }
  } catch {
    // fall through to the text share
  }
  shareText(stageName, kg);
};

const shareText = (stageName: string, kg: number) =>
  Share.share({ message: `My PunahChakra tree is now a ${stageName.toLowerCase()}: ${fmt(kg)} kg rescued from landfill. Give your items a second chance!` }).catch(() => {});

type GrowthProps = {
  visible: boolean;
  reveal: Reveal | null;
  seed: number;
  name?: string;
  onSeeDonated: () => void;
  onClose: () => void;
};

// After a pickup is completed: the tree before, and now, with the new leaves growing in one by one.
export const GrowthModal = ({ visible, reveal, seed, name, onSeeDonated, onClose }: GrowthProps) => {
  const reduced = useReducedMotion();
  const treeRef = useRef<Tree3DHandle>(null);
  const [holdBefore, setHoldBefore] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setHoldBefore(false);
      setPlayKey(k => k + 1);
    }
  }, [visible]);

  if (!reveal) return null;
  const newIds = reveal.added.map(p => p.id);
  const stage = TREE_STAGES[stageIndexOf(reveal.kgNow)];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={g.screen}>
        <ScrollView contentContainerStyle={g.content}>
          <Text style={g.title}>Pickup #{reveal.now.length} completed</Text>
          <Text style={g.sub}>Your tree just grew</Text>

          <View style={g.treeCard}>
            <Tree3D
              ref={treeRef}
              seed={seed}
              pickups={reveal.now}
              fromPickups={reveal.before}
              newIds={newIds}
              playKey={playKey}
              showBefore={holdBefore}
              height={300}
              reduced={reduced}
            />
            <View style={g.holdRow}>
              <Pressable
                onPressIn={() => setHoldBefore(true)}
                onPressOut={() => setHoldBefore(false)}
                style={[g.holdBtn, holdBefore && g.holdBtnOn]}
                accessibilityLabel="Hold to see your tree before this pickup"
              >
                <Text style={[g.holdText, holdBefore && { color: theme.colors.surface }]}>
                  {holdBefore ? 'Before' : 'Hold to see before'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={g.leafLine}>
            +{reveal.itemsAdded} new {reveal.itemsAdded === 1 ? 'item' : 'items'} on your tree
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
            <View style={g.tile}>
              <Text style={g.tileNum}>+{reveal.added.length}</Text>
              <Text style={g.tileLabel}>pickup{reveal.added.length === 1 ? '' : 's'}</Text>
            </View>
          </View>

          <Text style={g.stageLine}>Your tree is now a {stage.name.toLowerCase()}</Text>

          <TouchableOpacity style={g.btnPrimary} onPress={() => shareTree(treeRef.current, stage.name, reveal.kgNow, reveal.now, name)} activeOpacity={0.85}>
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
  const treeRef = useRef<Tree3DHandle>(null);
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setNaming(false);
    setDraft(name);
    setPlayKey(k => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!reveal) return null;
  const from = TREE_STAGES[reveal.stageBefore];
  const to = TREE_STAGES[reveal.stageNow];
  const title =
    reveal.stageBefore === 0 && reveal.stageNow === 1
      ? 'Your seed sprouted!'
      : `Your ${from.name.toLowerCase()} grew into a ${to.name.toLowerCase()}!`;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={l.screen}>
        {visible && !reduced && <Confetti count={40} />}
        <Text style={l.level}>LEVEL {to.level} UNLOCKED</Text>
        <View style={l.art}>
          <Tree3D ref={treeRef} seed={seed} pickups={reveal.now} fromPickups={reveal.before} newIds={reveal.added.map(p => p.id)} playKey={playKey} height={260} reduced={reduced} />
        </View>
        <Text style={l.title}>{title}</Text>
        <Text style={l.sub}>{fmt(reveal.kgNow)} kg of donated items got a second life.</Text>

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
            <TouchableOpacity style={l.btnPrimary} onPress={() => shareTree(treeRef.current, to.name, reveal.kgNow, reveal.now, name)} activeOpacity={0.85}>
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
  treeCard: { backgroundColor: 'transparent' },
  holdRow: { alignItems: 'center', marginTop: 8, marginBottom: 2 },
  holdBtn: { borderRadius: 999, borderWidth: 1.5, borderColor: theme.colors.primary, paddingHorizontal: 18, paddingVertical: 8 },
  holdBtnOn: { backgroundColor: theme.colors.primary },
  holdText: { fontSize: 13, fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  row: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 10, alignItems: 'center' },
  cardNow: { borderColor: '#FFC83D', borderWidth: 2 },
  cardLabel: { alignSelf: 'flex-start', fontSize: 10, letterSpacing: 0.8, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary },
  leafLine: { textAlign: 'center', fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primaryDark, marginTop: 14 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tile: { flex: 1, backgroundColor: theme.colors.primaryContainer, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  tileNum: { fontSize: 20, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  tileLabel: { fontSize: 11, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  stageLine: { textAlign: 'center', fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginTop: 16 },
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
  art: { width: '100%', marginVertical: 8 },
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
