import { StyleSheet } from 'react-native';
import { COLORES } from './colores';

/**
 * Catálogo central de estilos comunes de Kyrara Gez.
 * Diseñado para evitar la duplicación de hojas de estilo en pantallas y componentes.
 */
export const ESTILOS_COMUNES = StyleSheet.create({
  // --- Estructura base de pantallas ---
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.superficieBase,
  },
  scrollContenido: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 16,
  },
  scrollContenidoAjustado: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 12,
  },

  // --- Flexbox utilitarios ---
  filaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filaEspaciada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaFinal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  centroTotal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexUno: {
    flex: 1,
  },
  filaGap6: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filaGap8: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filaGap12: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // --- Encabezados de sección estándar ---
  filaEncabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tituloSeccionPrincipal: {
    color: COLORES.enSuperficie,
  },
  subtituloSeccion: {
    color: COLORES.enSuperficieVariante,
    marginTop: 2,
  },

  // --- Insignias y etiquetas pequeñas ---
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORES.superficieContenedorMasAlto,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeTexto: {
    color: COLORES.enSuperficieVariante,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // --- Separadores y divisores ---
  divisorHorizontal: {
    height: 1,
    backgroundColor: COLORES.bordeCristal,
    width: '100%',
    marginVertical: 12,
  },

  // --- Buscador estándar ---
  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.superficieContenedorBajo,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORES.bordeCristal,
    gap: 10,
  },
  inputBuscador: {
    flex: 1,
    color: COLORES.enSuperficie,
    fontSize: 14,
  },
});

// Alias en inglés para compatibilidad
export const COMMON_STYLES = StyleSheet.create({
  screen: ESTILOS_COMUNES.pantalla,
  scrollContent: ESTILOS_COMUNES.scrollContenido,
  scrollContentTight: ESTILOS_COMUNES.scrollContenidoAjustado,
  rowCenter: ESTILOS_COMUNES.filaCentro,
  rowBetween: ESTILOS_COMUNES.filaEspaciada,
  rowEnd: ESTILOS_COMUNES.filaFinal,
  centerAll: ESTILOS_COMUNES.centroTotal,
  flexOne: ESTILOS_COMUNES.flexUno,
  rowGap6: ESTILOS_COMUNES.filaGap6,
  rowGap8: ESTILOS_COMUNES.filaGap8,
  rowGap12: ESTILOS_COMUNES.filaGap12,
  sectionHeaderRow: ESTILOS_COMUNES.filaEncabezadoSeccion,
  mainSectionTitle: ESTILOS_COMUNES.tituloSeccionPrincipal,
  mainSectionSubtitle: ESTILOS_COMUNES.subtituloSeccion,
  badgePill: ESTILOS_COMUNES.badgePill,
  badgeText: ESTILOS_COMUNES.badgeTexto,
  horizontalDivider: ESTILOS_COMUNES.divisorHorizontal,
  searchContainer: ESTILOS_COMUNES.contenedorBuscador,
  searchInput: ESTILOS_COMUNES.inputBuscador,
});
