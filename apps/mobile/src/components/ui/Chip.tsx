import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  const content = (
    <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.chip, selected && styles.chipSelected, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.chip, selected && styles.chipSelected, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.chipRadius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    ...typography.caption,
    color: colors.primaryDeep,
    textTransform: 'capitalize',
  },
  textSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
});
