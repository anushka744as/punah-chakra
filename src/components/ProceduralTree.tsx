import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { LEAF_SPACING, TreeLeaf, leafSlot, stageIndexOf } from '../utils/treeGrowth';

const W = 260;
const H = 220;
const GROUND = 200;
const CX = 130;
const MAX_DRAWN_LEAVES = 160;
const SHADES = ['#22A559', '#16803F', '#2DBE6C', '#3FCB7F'];
const TRUNK = '#8D6E4C';
const GLOW = '#FFC83D';

// Trunk height and thickness grow smoothly with total kg.
const trunkShape = (kg: number) => ({
  h: 10 + 66 * (1 - Math.exp(-kg / 45)),
  w: 3 + 9 * (1 - Math.exp(-kg / 60)),
});

const SideTree = ({ x, s }: { x: number; s: number }) => (
  <G>
    <Polygon points={`${x - 3 * s},${GROUND} ${x - 2 * s},${GROUND - 30 * s} ${x + 2 * s},${GROUND - 30 * s} ${x + 3 * s},${GROUND}`} fill={TRUNK} />
    <Circle cx={x} cy={GROUND - 42 * s} r={20 * s} fill="#16803F" />
    <Circle cx={x - 9 * s} cy={GROUND - 34 * s} r={13 * s} fill="#22A559" />
    <Circle cx={x + 9 * s} cy={GROUND - 34 * s} r={13 * s} fill="#2DBE6C" />
  </G>
);

type Props = {
  seed: number;
  kg: number;
  leaves: TreeLeaf[];
  /** Draw only the first N leaves (used to animate leaves appearing one by one). */
  visibleCount?: number;
  /** pickupIds whose leaves should glow. */
  highlightIds?: string[];
  width?: number;
  onLeafPress?: (pickupId: string) => void;
};

export const ProceduralTree = ({ seed, kg, leaves, visibleCount, highlightIds = [], width = 200, onLeafPress }: Props) => {
  const stage = stageIndexOf(kg);
  const { h: trunkH, w: trunkW } = trunkShape(kg);
  const topY = GROUND - trunkH;
  const shown = Math.min(visibleCount ?? leaves.length, MAX_DRAWN_LEAVES, leaves.length);
  const glowSet = useMemo(() => new Set(highlightIds), [highlightIds]);

  const slots = useMemo(() => {
    const out = [];
    for (let i = 0; i < Math.min(leaves.length, MAX_DRAWN_LEAVES); i++) out.push(leafSlot(seed, i));
    return out;
  }, [seed, leaves.length]);

  const isSeed = kg <= 0 && leaves.length === 0;
  const canopyCx = CX;
  const canopyCy = topY - 6;

  // Crop the canvas to the plant, so a seed or sprout isn't surrounded by empty space.
  const canopyTop = shown > 0 ? canopyCy - 0.85 * LEAF_SPACING * Math.sqrt(shown + 0.6) - 10 : topY - 12;
  const contentTop = isSeed ? GROUND - 32 : Math.min(canopyTop, stage >= 6 ? GROUND - 92 : canopyTop);
  const y0 = Math.max(0, Math.floor(contentTop - 6));
  const vbH = H - y0;

  return (
    <Svg width={width} height={(width * vbH) / W} viewBox={`0 ${y0} ${W} ${vbH}`}>
      <Ellipse cx={CX} cy={GROUND + 4} rx={96} ry={11} fill="#CFE8D5" />

      {isSeed ? (
        <G>
          <Ellipse cx={CX} cy={GROUND - 4} rx={30} ry={13} fill="#A47B52" />
          <Ellipse cx={CX} cy={GROUND - 15} rx={8} ry={10} fill="#6B4A2B" />
        </G>
      ) : (
        <G>
          {stage >= 6 && (
            <G>
              <SideTree x={42} s={0.9} />
              <SideTree x={218} s={0.8} />
            </G>
          )}
          {/* trunk */}
          <Polygon
            points={`${CX - trunkW * 0.65},${GROUND} ${CX - trunkW * 0.5},${topY} ${CX + trunkW * 0.5},${topY} ${CX + trunkW * 0.65},${GROUND}`}
            fill={TRUNK}
          />
          {stage >= 2 && (
            <G>
              <Line x1={CX} y1={topY + trunkH * 0.35} x2={CX - 22 - stage * 3} y2={topY - 4} stroke={TRUNK} strokeWidth={Math.max(2, trunkW * 0.3)} strokeLinecap="round" />
              <Line x1={CX} y1={topY + trunkH * 0.25} x2={CX + 22 + stage * 3} y2={topY - 6} stroke={TRUNK} strokeWidth={Math.max(2, trunkW * 0.3)} strokeLinecap="round" />
            </G>
          )}

          {/* leaves: one per donated item */}
          {slots.slice(0, shown).map((s, i) => {
            const leaf = leaves[i];
            const glowing = glowSet.has(leaf.pickupId);
            const cx = canopyCx + s.x;
            const cy = canopyCy + s.y;
            return (
              <G key={i} onPress={onLeafPress ? () => onLeafPress(leaf.pickupId) : undefined}>
                {glowing && <Circle cx={cx} cy={cy} r={9.5} fill={GLOW} opacity={0.6} />}
                <Ellipse
                  cx={cx}
                  cy={cy}
                  rx={6.2}
                  ry={3.7}
                  rotation={s.rot}
                  origin={`${cx}, ${cy}`}
                  fill={glowing ? '#B6E04A' : SHADES[s.shade]}
                  stroke={glowing ? '#7BA21B' : 'none'}
                  strokeWidth={glowing ? 0.8 : 0}
                />
              </G>
            );
          })}

          {/* blossoms once it is a blooming tree */}
          {stage >= 5 &&
            slots.slice(0, shown).map((s, i) =>
              i % 6 === 0 ? <Circle key={`b${i}`} cx={canopyCx + s.x * 0.9} cy={canopyCy + s.y * 0.9} r={2.6} fill="#F472B6" /> : null
            )}
        </G>
      )}
    </Svg>
  );
};
