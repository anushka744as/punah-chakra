import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DonationItem } from '../services/api';
import {
  TreePickup,
  leavesOf,
  seedFromString,
  stageIndexOf,
  toTreePickups,
  totalItems,
  totalKg,
} from '../utils/treeGrowth';

const GLOW_MS = 48 * 60 * 60 * 1000;
const k = (userId: string, name: string) => `tree:${userId}:${name}`;

type Stored = {
  loaded: boolean;
  seen: string[] | null; // completed pickup ids the user has already been shown
  celebrated: number; // highest stage index already celebrated
  glow: { ids: string[]; until: number } | null;
  name: string;
};

export type Reveal = {
  before: TreePickup[];
  now: TreePickup[];
  added: TreePickup[];
  kgBefore: number;
  kgNow: number;
  itemsAdded: number;
  stageBefore: number;
  stageNow: number;
  levelUp: boolean;
};

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
};

export function useTreeProgress(userId: string | undefined, donations: DonationItem[]) {
  const uid = userId || 'anon';
  const pickups = useMemo(() => toTreePickups(donations), [donations]);
  const [store, setStore] = useState<Stored>({ loaded: false, seen: null, celebrated: 0, glow: null, name: '' });

  // Load everything remembered for this user.
  useEffect(() => {
    let cancelled = false;
    setStore(s => ({ ...s, loaded: false }));
    (async () => {
      try {
        const [seen, cel, glow, name] = await Promise.all([
          AsyncStorage.getItem(k(uid, 'seen')),
          AsyncStorage.getItem(k(uid, 'celebrated')),
          AsyncStorage.getItem(k(uid, 'glow')),
          AsyncStorage.getItem(k(uid, 'name')),
        ]);
        if (cancelled) return;
        setStore({
          loaded: true,
          seen: seen ? JSON.parse(seen) : null,
          celebrated: cel ? Number(cel) : 0,
          glow: glow ? JSON.parse(glow) : null,
          name: name || '',
        });
      } catch {
        if (!cancelled) setStore(s => ({ ...s, loaded: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // First time we see real data for this user: treat everything already completed as seen, so an
  // existing user doesn't get a "your tree grew" screen for pickups from before this feature.
  useEffect(() => {
    if (!store.loaded || store.seen !== null || donations.length === 0) return;
    const seen = pickups.map(p => p.id);
    const celebrated = stageIndexOf(totalKg(pickups));
    setStore(s => ({ ...s, seen, celebrated }));
    AsyncStorage.setItem(k(uid, 'seen'), JSON.stringify(seen)).catch(() => {});
    AsyncStorage.setItem(k(uid, 'celebrated'), String(celebrated)).catch(() => {});
  }, [store.loaded, store.seen, donations.length, pickups, uid]);

  const seenSet = useMemo(() => new Set(store.seen || []), [store.seen]);
  const pending = useMemo(() => (store.seen ? pickups.filter(p => !seenSet.has(p.id)) : []), [pickups, seenSet, store.seen]);

  const leaves = useMemo(() => leavesOf(pickups), [pickups]);
  const kg = useMemo(() => totalKg(pickups), [pickups]);
  const items = useMemo(() => totalItems(pickups), [pickups]);
  const glowIds = store.glow && Date.now() < store.glow.until ? store.glow.ids : [];

  // A frozen before/after snapshot, so the reveal screen doesn't change under the user's eyes.
  const makeReveal = useCallback((): Reveal | null => {
    if (pending.length === 0) return null;
    const pendingIds = new Set(pending.map(p => p.id));
    const before = pickups.filter(p => !pendingIds.has(p.id));
    const kgBefore = totalKg(before);
    const kgNow = totalKg(pickups);
    const stageBefore = stageIndexOf(kgBefore);
    const stageNow = stageIndexOf(kgNow);
    return {
      before,
      now: pickups,
      added: pending,
      kgBefore,
      kgNow,
      itemsAdded: totalItems(pending),
      stageBefore,
      stageNow,
      levelUp: stageNow > stageBefore && stageNow > store.celebrated,
    };
  }, [pending, pickups, store.celebrated]);

  const acknowledge = useCallback(
    (addedIds: string[]) => {
      const seen = [...(store.seen || []), ...addedIds];
      const glow = { ids: addedIds, until: Date.now() + GLOW_MS };
      setStore(s => ({ ...s, seen, glow }));
      AsyncStorage.setItem(k(uid, 'seen'), JSON.stringify(seen)).catch(() => {});
      AsyncStorage.setItem(k(uid, 'glow'), JSON.stringify(glow)).catch(() => {});
    },
    [store.seen, uid]
  );

  const markCelebrated = useCallback(
    (stageIdx: number) => {
      setStore(s => ({ ...s, celebrated: Math.max(s.celebrated, stageIdx) }));
      AsyncStorage.setItem(k(uid, 'celebrated'), String(stageIdx)).catch(() => {});
    },
    [uid]
  );

  const clearGlow = useCallback(() => {
    setStore(s => ({ ...s, glow: null }));
    AsyncStorage.removeItem(k(uid, 'glow')).catch(() => {});
  }, [uid]);

  const setName = useCallback(
    (name: string) => {
      const clean = name.trim().slice(0, 24);
      setStore(s => ({ ...s, name: clean }));
      AsyncStorage.setItem(k(uid, 'name'), clean).catch(() => {});
    },
    [uid]
  );

  return {
    seed: seedFromString(uid),
    pickups,
    leaves,
    kg,
    items,
    glowIds,
    name: store.name,
    pending,
    ready: store.loaded && store.seen !== null,
    makeReveal,
    acknowledge,
    markCelebrated,
    clearGlow,
    setName,
  };
}
