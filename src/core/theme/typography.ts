export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const TYPOGRAPHY = {
  displayHero: {
    fontFamily: FONTS.bold,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  displayHeroMobile: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  headlineLg: {
    fontFamily: FONTS.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  headlineSm: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  titleBalance: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  labelCaps: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  numericTable: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
};
