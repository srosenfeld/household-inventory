import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors } from '../theme';

const WEB_MAX_WIDTH = 960;

interface WebShellProps {
  children: React.ReactNode;
}

/** Center the app on wide viewports when running in a browser. */
export function WebShell({ children }: WebShellProps) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const constrained = width > WEB_MAX_WIDTH;

  return (
    <View style={styles.webRoot}>
      <View style={[styles.webFrame, constrained && styles.webFrameConstrained]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: colors.hairline,
    alignItems: 'center',
  },
  webFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.canvasSoft,
  },
  webFrameConstrained: {
    maxWidth: WEB_MAX_WIDTH,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.hairlineStrong,
  },
});
