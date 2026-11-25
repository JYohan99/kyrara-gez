import { StyleSheet } from 'react-native';
import { COLORES as COLORS } from '@/compartido/tema';

export const estilosOperaciones = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
  },
  form: {
    paddingVertical: 12,
    gap: 14,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(9, 13, 15, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
  },
  productBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  productBannerStock: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.secundario,
  },
  formGroup: {
    gap: 6,
  },
  inputsRowDouble: {
    flexDirection: 'row',
    gap: 10,
  },
  formGroupHalf: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.enSuperficieVariante,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    color: COLORS.enSuperficieVariante,
    marginRight: 6,
    fontWeight: '700',
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    color: COLORS.enSuperficie,
    fontSize: 14,
    paddingVertical: 8,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 8,
    height: 'auto',
  },
  textAreaInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  helperText: {
    color: COLORS.secundario,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipItem: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipItemActive: {
    backgroundColor: 'rgba(209, 188, 255, 0.15)',
    borderColor: COLORS.primario,
  },
  chipText: {
    color: COLORS.enSuperficieVariante,
    fontSize: 11,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primario,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 13, 15, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
  },
  cancelBtnText: {
    color: COLORS.enSuperficieVariante,
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtnWrapper: {
    flex: 1,
  },
});
