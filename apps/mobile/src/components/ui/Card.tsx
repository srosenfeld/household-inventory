import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface CardProps {
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Card({ onPress, selected, style, children }: CardProps) {
  const cardStyle = [styles.card, selected && styles.selected, style];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
});
