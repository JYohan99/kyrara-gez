export const FUENTES = {
  regular: 'Inter_400Regular',
  media: 'Inter_500Medium',
  semiNegrita: 'Inter_600SemiBold',
  negrita: 'Inter_700Bold',
};

export const TIPOGRAFIA = {
  titularHero: {
    fontFamily: FUENTES.negrita,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  titularHeroMovil: {
    fontFamily: FUENTES.negrita,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  titularGrande: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  titularPequeno: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  tituloSaldo: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  cuerpoGrande: {
    fontFamily: FUENTES.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  cuerpoMedio: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  cuerpoPequeno: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  etiquetaMayusculas: {
    fontFamily: FUENTES.negrita,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  tablaNumerica: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  // Alias compatibles en inglés
  displayHero: {
    fontFamily: FUENTES.negrita,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  displayHeroMobile: {
    fontFamily: FUENTES.negrita,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  headlineLg: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  headlineSm: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  titleBalance: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontFamily: FUENTES.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  labelCaps: {
    fontFamily: FUENTES.negrita,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  numericTable: {
    fontFamily: FUENTES.semiNegrita,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
};

// Alias compatibles para transición transparente
export const FONTS = FUENTES;
export const TYPOGRAPHY = TIPOGRAFIA;

