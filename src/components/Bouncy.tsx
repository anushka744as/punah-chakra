import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

// Pressable that squishes down on touch and springs back — gives tiles a playful feel.
// The outer animated view carries the tile's own style (so it still lays out in its parent);
// the inner Pressable only re-applies the child-layout bits so content arranges the same way.
type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number };

export const Bouncy = ({ style, scaleTo = 0.94, onPressIn, onPressOut, children, ...rest }: Props) => {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 14 : 0 }).start();
  const f = StyleSheet.flatten(style) || {};
  const inner: ViewStyle = {
    flexDirection: f.flexDirection,
    alignItems: f.alignItems,
    justifyContent: f.justifyContent,
    gap: f.gap,
    flexWrap: f.flexWrap,
  };
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        {...rest}
        style={inner}
        onPressIn={e => { to(scaleTo); onPressIn?.(e); }}
        onPressOut={e => { to(1); onPressOut?.(e); }}
      >
        {children as React.ReactNode}
      </Pressable>
    </Animated.View>
  );
};
