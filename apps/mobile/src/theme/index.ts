import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export { colors, spacing, typography };

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
    padding: spacing.screenPadding,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
  },
  hairlineBorder: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emptyText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});

export const theme = { colors, spacing, typography, commonStyles };
