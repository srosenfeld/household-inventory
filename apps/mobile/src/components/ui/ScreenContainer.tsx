import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps extends ViewProps {
  padded?: boolean;
  safe?: boolean;
  children: React.ReactNode;
}

export function ScreenContainer({
  padded = true,
  safe = false,
  style,
  children,
  ...props
}: ScreenContainerProps) {
  const content = (
    <View style={[styles.container, padded && styles.padded, style]} {...props}>
      {children}
    </View>
  );

  if (safe) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
  },
  container: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
  },
  padded: {
    padding: spacing.screenPadding,
  },
});
