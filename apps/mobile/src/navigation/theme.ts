import { colors, typography } from '../theme';

export const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.navigation.headerBg,
  },
  headerTintColor: colors.navigation.headerTitle,
  headerTitleStyle: {
    fontWeight: typography.sectionTitle.fontWeight,
    color: colors.navigation.headerTitle,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: colors.canvasSoft,
  },
};

export const authStackScreenOptions = {
  ...stackScreenOptions,
  headerBackTitleVisible: false,
};
