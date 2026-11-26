import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
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
  /** Grow the tree in from a seed the first time it is shown. */
  intro?: boolean;
};

const READY_TIMEOUT_MS = 25000; // first load after boot can be slow; real failures report an error sooner

const toPayload = (seed: number, pickups: TreePickup[], newIds: string[], reduced: boolean, intro = false) => ({
  seed,
  pickups: pickups.map(p => ({ id: p.id, items: p.itemsCount, kg: p.kg })),
  newIds,
  reduced,
  intro,
});

// 3D tree in a WebView (three.js). Falls back to the flat SVG tree if 3D can't start.
export type ShareMeta = { kg: number | string; stage: string; name?: string; items: number; pickups: number; emblem?: string; wordmark?: string };
export type Tree3DHandle = { snapshot: (meta: ShareMeta) => Promise<string | null> };

export const Tree3D = forwardRef<Tree3DHandle, Props>(function Tree3D(
  { seed, pickups, newIds = [], height, reduced = false, fromPickups, playKey, showBefore, intro = false },
  ref
) {
  const web = useRef<any>(null);
  const pendingSnap = useRef<((v: string | null) => void) | null>(null);
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

  // Ask the 3D scene for a finished share picture (base64 PNG); null if 3D isn't running.
  useImperativeHandle(ref, () => ({
    snapshot: (meta: ShareMeta) =>
      new Promise<string | null>(resolve => {
        if (!ready || failed || !web.current) return resolve(null);
        pendingSnap.current = resolve;
        web.current.injectJavaScript(
          `try{window.__tree.snapshot(${JSON.stringify(meta)},function(d){window.ReactNativeWebView.postMessage('snapshot:'+(d||''));});}catch(e){window.ReactNativeWebView.postMessage('snapshot:');};true;`
        );
        setTimeout(() => {
          if (pendingSnap.current === resolve) {
            pendingSnap.current = null;
            resolve(null);
          }
        }, 8000);
      }),
  }));

  const nowPayload = useMemo(() => JSON.stringify(toPayload(seed, pickups, newIds, reduced, intro)), [seed, pickups, newIds, reduced, intro]);
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
          else if (m.startsWith('snapshot:')) {
            const done = pendingSnap.current;
            pendingSnap.current = null;
            done?.(m.length > 9 ? m.slice(9) : null);
          }
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
});

const styles = StyleSheet.create({
  box: { width: '100%' },
  web: { flex: 1, backgroundColor: 'transparent' },
  fallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
