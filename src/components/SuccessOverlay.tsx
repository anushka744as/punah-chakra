import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#10B981', '#F59E0B', '#0B6B30', '#F472B6', '#60A5FA', '#FACC15'];

export const Confetti = ({ count = 34 }: { count?: number }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        x: Math.random() * W,
        drift: (Math.random() - 0.5) * 120,
        size: 7 + Math.random() * 7,
        round: Math.random() > 0.5,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 500,
        duration: 1800 + Math.random() * 1400,
        spin: 2 + Math.random() * 3,
        v: new Animated.Value(0),
      })),
    [count]
  );

  useEffect(() => {
    pieces.forEach(p =>
      Animated.timing(p.v, {
        toValue: 1,
        delay: p.delay,
        duration: p.duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start()
    );
  }, [pieces]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(p => (
        <Animated.View
          key={p.key}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, H * 0.95] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin * 360}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
};

type Props = { visible: boolean; title: string; message: string; buttonText?: string; onDone: () => void };

// Celebration shown after a pickup is booked: confetti + a bouncing check on a card.
export const SuccessOverlay = ({ visible, title, message, buttonText = 'Back to Home', onDone }: Props) => {
  const pop = useRef(new Animated.Value(0)).current;
  const cardIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    cardIn.setValue(0);
    Animated.parallel([
      Animated.spring(cardIn, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 18, speed: 10 }),
      ]),
    ]).start();
  }, [visible, pop, cardIn]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDone}>
      <View style={styles.backdrop}>
        {visible && <Confetti />}
        <Animated.View
          style={[
            styles.card,
            { opacity: cardIn, transform: [{ scale: cardIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] },
          ]}
        >
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: pop }] }]}>
            <Icon name="check" size={46} color={theme.colors.surface} />
          </Animated.View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={onDone} activeOpacity={0.85}>
            <Text style={styles.btnText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 28, padding: 26, alignItems: 'center' },
  checkCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, textAlign: 'center' },
  msg: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  btn: { backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 32 },
  btnText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
});
