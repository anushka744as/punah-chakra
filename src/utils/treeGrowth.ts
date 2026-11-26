import { DonationItem } from '../services/api';
import { isPickupDone } from './orderAnalytics';

// All growth tuning lives here. `min` = total kg donated needed to unlock the stage.
export const TREE_STAGES = [
  { level: 1, name: 'Seed', min: 0, treeName: '' },
  { level: 2, name: 'Sprout', min: 1, treeName: 'Tulsi' },
  { level: 3, name: 'Sapling', min: 5, treeName: 'Neem' },
  { level: 4, name: 'Young tree', min: 15, treeName: 'Peepal' },
  { level: 5, name: 'Tree', min: 35, treeName: 'Banyan' },
  { level: 6, name: 'Blooming tree', min: 75, treeName: 'Gulmohar' },
  { level: 7, name: 'Grove', min: 150, treeName: 'Our grove' },
] as const;

export const MAX_STAGE_INDEX = TREE_STAGES.length - 1;

export const stageIndexOf = (kg: number): number => {
  let idx = 0;
  TREE_STAGES.forEach((s, i) => {
    if (kg >= s.min) idx = i;
  });
  return idx;
};

// 0..1 along the whole 7-stage journey (used by the milestone progress bar).
export const journeyFraction = (kg: number): number => {
  const idx = stageIndexOf(kg);
  if (idx >= MAX_STAGE_INDEX) return 1;
  const cur = TREE_STAGES[idx].min;
  const next = TREE_STAGES[idx + 1].min;
  return (idx + (kg - cur) / (next - cur)) / MAX_STAGE_INDEX;
};

export type TreePickup = {
  id: string;
  date: string; // pickup_day, as stored
  items: string[]; // category labels
  itemsCount: number; // 1 leaf per item
  kg: number;
  createdAt: string;
};

export type TreeLeaf = { slot: number; pickupId: string };

const itemsOf = (category?: string): string[] =>
  (category || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

// Completed pickups, oldest first (so leaf N always belongs to the same pickup).
export const toTreePickups = (donations: DonationItem[], now: Date = new Date()): TreePickup[] =>
  donations
    .filter(d => isPickupDone(d, now))
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
    .map(d => {
      const items = itemsOf(d.category);
      return {
        id: d.id,
        date: d.pickup_day,
        items,
        itemsCount: Math.max(1, items.length),
        kg: Number(d.weight_kg) || 0,
        createdAt: d.created_at || '',
      };
    });

export const leavesOf = (pickups: TreePickup[]): TreeLeaf[] => {
  const out: TreeLeaf[] = [];
  pickups.forEach(p => {
    for (let i = 0; i < p.itemsCount; i++) out.push({ slot: out.length, pickupId: p.id });
  });
  return out;
};

export const totalKg = (pickups: TreePickup[]) => pickups.reduce((s, p) => s + p.kg, 0);
export const totalItems = (pickups: TreePickup[]) => pickups.reduce((s, p) => s + p.itemsCount, 0);

// ---- deterministic leaf slots --------------------------------------------------------------
export const seedFromString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const LEAF_SPACING = 7.4;
const GOLDEN = 2.399963;

// Slot i is a pure function of (seed, i): same spot every visit, and slots spiral outward from the
// trunk so a bigger tree is just the same tree with more leaves.
export const leafSlot = (seed: number, i: number) => {
  const rnd = mulberry32(seed + i * 7919);
  const theta = i * GOLDEN + (rnd() - 0.5) * 0.5;
  const r = LEAF_SPACING * Math.sqrt(i + 0.6) + (rnd() - 0.5) * 2;
  return {
    x: Math.cos(theta) * r,
    y: Math.sin(theta) * r * 0.85,
    rot: Math.round(rnd() * 180),
    shade: Math.floor(rnd() * 4),
    pick: rnd(),
  };
};
