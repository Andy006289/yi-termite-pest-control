/* theme.ts — design tokens carried over from the Assessment 1 style guide and the
   Assessment 2 css/styles.css (:root variables), so the app matches the website. */

export const colors = {
  green900: '#0F3D28',
  green700: '#1F6B45',
  green500: '#237A4F',
  green100: '#DFEFE5',
  green50: '#F0F7F2',
  amber500: '#F4A340',
  amber600: '#DD8A1E',
  amber100: '#FDEBD3',
  amber700: '#94580A',
  bg: '#F7F8F5',
  surface: '#FFFFFF',
  ink: '#263238',
  ink2: '#546E7A',
  ink3: '#5F737C',
  line: '#E1E6E3',
  danger: '#BF3434',
  danger100: '#FBE3E3',
  info: '#1F5BD6',
  info100: '#E3ECFD',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 };
/** Minimum touch target (Apple HIG: 44 × 44 pt). */
export const TAP = 44;

export const fonts = {
  head: 'Poppins_600SemiBold',
  headBold: 'Poppins_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
};

/* Same values as --shadow-sm / --shadow-md in the website CSS (boxShadow is supported natively on iOS). */
export const shadow = {
  sm: { boxShadow: '0 1px 3px rgba(15, 61, 40, 0.08)' },
  md: { boxShadow: '0 6px 16px -4px rgba(15, 61, 40, 0.14)' },
};

export const toneColors = {
  green: { bg: colors.green50, fg: colors.green900, icon: colors.green700 },
  amber: { bg: colors.amber100, fg: colors.amber700, icon: colors.amber700 },
  red: { bg: colors.danger100, fg: colors.danger, icon: colors.danger },
  info: { bg: colors.info100, fg: colors.info, icon: colors.info },
};
