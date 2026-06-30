import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.ink },
  },
  secondary: {
    container: {
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.hairlineStrong,
    },
    text: { color: colors.ink },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primaryDeep },
  },
  destructive: {
    container: { backgroundColor: colors.destructiveSoft },
    text: { color: colors.destructive },
  },
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, v.container, isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <Text style={[styles.text, v.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.5,
  },
});
