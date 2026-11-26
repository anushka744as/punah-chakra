import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { TREE3D_HTML } from './tree3dHtml';
import { ProceduralTree } from './ProceduralTree';
import { TreePickup, leavesOf, totalKg } from '../utils/treeGrowth';

type Props = {
  seed: number;
  pickups: TreePickup[];
  /** pickups whose new leaves should render lime (until seen). */
  newIds?: string[];
  height: number;
  reduced?: boolean;
  /** If given, the tree first shows this (earlier) state, then grows into `pickups` on `playKey` change. */
  fromPickups?: TreePickup[];
  playKey?: number;
  /** Instantly show the `fromPickups` state (hold-to-see-before). */
  showBefore?: boolean;
};

const READY_TIMEOUT_MS = 10000;

const toPayload = (seed: number, pickups: TreePickup[], newIds: string[], reduced: boolean) => ({
  seed,
  pickups: pickups.map(p => ({ id: p.id, items: p.itemsCount, kg: p.kg })),
  newIds,
  reduced,
});

// 3D tree in a WebView (three.js). Falls back to the flat SVG tree if 3D can't start.
export const Tree3D = ({ seed, pickups, newIds = [], height, reduced = false, fromPickups, playKey, showBefore }: Props) => {
  const web = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const playedKey = useRef<number | undefined>(undefined);

  const run = useCallback((js: string) => web.current?.injectJavaScript(`try{${js}}catch(e){};true;`), []);

  // give up on 3D (offline / no WebGL) if it never reports ready
  useEffect(() => {
    if (ready || failed) return;
    const t = setTimeout(() => setFailed(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [ready, failed]);

  const nowPayload = useMemo(() => JSON.stringify(toPayload(seed, pickups, newIds, reduced)), [seed, pickups, newIds, reduced]);
  const fromPayload = useMemo(
    () => (fromPickups ? JSON.stringify(toPayload(seed, fromPickups, [], reduced)) : null),
    [seed, fromPickups, reduced]
  );

  useEffect(() => {
    if (!ready) return;
    if (fromPayload && playKey !== undefined) {
      if (playedKey.current === playKey) {
        // already played: just reflect before/now toggles
        run(`window.__tree.show(${showBefore ? fromPayload : nowPayload});`);
        return;
      }
      playedKey.current = playKey;
      run(`window.__tree.show(${fromPayload});`);
      const t = setTimeout(() => run(`window.__tree.animateTo(${nowPayload});`), 700);
      return () => clearTimeout(t);
    }
    run(`window.__tree.show(${showBefore && fromPayload ? fromPayload : nowPayload});`);
  }, [ready, nowPayload, fromPayload, playKey, showBefore, run]);

  const fallback = (
    <View style={styles.fallback}>
      <ProceduralTree seed={seed} kg={totalKg(pickups)} leaves={leavesOf(pickups)} highlightIds={newIds} width={Math.min(220, height * 0.95)} />
    </View>
  );

  if (failed) return <View style={{ height }}>{fallback}</View>;

  return (
    <View style={[styles.box, { height }]} pointerEvents="none">
      {!ready && fallback}
      <WebView
        ref={web}
        source={{ html: TREE3D_HTML, baseUrl: 'https://localhost' }}
        style={[styles.web, !ready && { opacity: 0 }]}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        androidLayerType="hardware"
        onMessage={(e: { nativeEvent: { data: string } }) => {
          const m = e.nativeEvent.data;
          if (m === 'ready') setReady(true);
          else if (m.startsWith('error:')) {
            if (__DEV__) console.warn('Tree3D', m);
            if (!ready) setFailed(true);
          }
        }}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  box: { width: '100%', borderRadius: 18, overflow: 'hidden', backgroundColor: '#eef8f1' },
  web: { flex: 1, backgroundColor: 'transparent' },
  fallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
