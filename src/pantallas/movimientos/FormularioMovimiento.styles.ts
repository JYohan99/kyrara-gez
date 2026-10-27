import { StyleSheet, Platform } from 'react-native';
import { COLORES as COLORS } from '@/compartido/tema';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '92%',
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollArea: {
    flexShrink: 1,
    width: '100%',
  },
  formScrollContent: {
    width: '100%',
    paddingBottom: 24,
  },

  // Barra Superior
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  circularCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 38,
  },

  // Cápsula Segmentada de Tipo
  segmentedCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181C1E',
    borderRadius: 24,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentedItem: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedItemInactive: {
    width: 34,
    height: 34,
  },
  segmentedItemActiveExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 138, 158, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentedItemActiveIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(87, 245, 171, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentedItemActiveTransfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentedLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Monto Principal
  heroAmountContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    position: 'relative',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  heroCurrencySymbol: {
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  heroAmountText: {
    fontWeight: '800',
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  heroAmountPlaceholder: {
    color: 'rgba(255, 255, 255, 0.28)',
  },
  cursorBar: {
    width: 2.5,
    borderRadius: 1.25,
    marginLeft: 3,
  },
  hiddenAmountInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },

  // Cápsula de Fecha
  dateRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  dateCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181C1E',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateCapsuleText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },

  // Selector de Cuenta Individual
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  accountIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfoCol: {
    flexShrink: 1,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  accountBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 1,
  },

  // Fila de Traspaso 50/50 Estrictamente Simétrica
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  transferCol: {
    flex: 1,
    minWidth: 0,
  },
  transferCard: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  transferIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  transferInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 2,
  },
  transferRoleLabel: {
    color: COLORS.outline,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transferAccountName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  transferAccountBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 1,
  },
  transferArrowDown: {
    flexShrink: 0,
  },
  transferArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    flexShrink: 0,
  },

  // Entradas de Concepto y Notas
  inputsSection: {
    marginBottom: 6,
  },
  modernInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputIconPrefix: {
    marginRight: 10,
  },
  modernTextInput: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '500',
  },

  // Categorías
  categoriesContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#161A1C',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryPillInModal: {
    minWidth: '47%',
    flex: 1,
  },
  categoryPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryPillText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryDropdownFixedBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161A1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },

  // Botón Principal
  bottomBar: {
    marginTop: 22,
    marginBottom: 6,
  },
  guardarButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guardarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Modales Selectores
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#14181A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerModalTitle: {
    color: COLORS.onSurface,
  },
  modalAccountScroll: {
    maxHeight: 320,
  },
  accountOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 12,
  },
  accountOptionItemSelected: {
    backgroundColor: 'rgba(165, 231, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  accountOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountOptionInfo: {
    flex: 1,
  },
  accountOptionName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  accountOptionBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  modalCategoryScroll: {
    maxHeight: 360,
  },
  categoriesGridInModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
