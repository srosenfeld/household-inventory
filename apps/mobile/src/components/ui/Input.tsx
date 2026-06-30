import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface InputProps extends TextInputProps {
  multiline?: boolean;
}

export function Input({ style, multiline, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.multiline, style]}
      placeholderTextColor={colors.inkMuted}
      multiline={multiline}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.canvas,
    borderRadius: spacing.inputRadius,
    padding: 14,
    fontSize: typography.body.fontSize,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
