import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';

interface ProgressRingProps {
  progress: number; // 0 - 1
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
  centerValue: string;
  centerLabel: string;
  valueColor?: string;
  labelColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 78,
  strokeWidth = 7,
  trackColor = 'rgba(255,255,255,0.18)',
  fillColor = theme.colors.secondary,
  centerValue,
  centerLabel,
  valueColor = theme.colors.textInverse,
  labelColor = 'rgba(255,255,255,0.7)',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: valueColor }]}>{centerValue}</Text>
        <Text style={[styles.label, { color: labelColor }]}>{centerLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    lineHeight: 22,
  },
  label: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 8,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
