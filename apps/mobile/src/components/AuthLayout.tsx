import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

interface AuthLayoutProps {
  children: React.ReactNode;
  scrollProps?: ScrollViewProps;
}

export function AuthLayout({ children, scrollProps }: AuthLayoutProps) {
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        <View style={styles.brand}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Household Inventory</Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.screenPadding,
    paddingTop: 48,
    paddingBottom: 40,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  brandText: {
    ...typography.heading,
    fontSize: 22,
    color: colors.ink,
  },
});
