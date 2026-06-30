export const colors = {
  canvas: '#ffffff',
  canvasSoft: '#fafafa',
  ink: '#171717',
  inkSecondary: '#707070',
  inkMuted: '#a3a3a3',
  primary: '#3ecf8e',
  primaryDeep: '#24b47e',
  primarySoft: '#ecfdf5',
  hairline: '#ededed',
  hairlineStrong: '#dfdfdf',
  destructive: '#e5484d',
  destructiveSoft: '#fef2f2',
  warning: '#f76808',
  navigation: {
    headerBg: '#ffffff',
    headerTitle: '#171717',
    headerBorder: '#ededed',
    tabBarBg: '#ffffff',
    tabBarBorder: '#ededed',
    tabActive: '#3ecf8e',
    tabInactive: '#707070',
  },
} as const;

export type Colors = typeof colors;
