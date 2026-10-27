import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  formatearEntradaDinero,
  convertirMontoACentavos,
  formatearMoneda as formatCurrency,
} from '@/compartido/utilidades/moneda';
import { ModalSelectorFecha } from '@/compartido/componentes/ModalSelectorFecha';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { Deuda } from '@/datos/tipos';
import { useCuentasBoveda } from '@/datos/hooks';
import { registrarPagoDeuda } from '@/datos/consultas/deudas';

export interface PropiedadesModalPagoDeuda {
  visible: boolean;
  onClose: () => void;
  deuda: Deuda | null;
  onPagoCompletado?: () => void;
}

function fechaAISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface PropiedadesContenidoModalPagoDeuda {
  deuda: Deuda;
  onClose: () => void;
  onPagoCompletado?: () => void;
}

const ContenidoModalPagoDeuda: React.FC<PropiedadesContenidoModalPagoDeuda> = ({
  deuda,
  onClose,
  onPagoCompletado,
}) => {
  const insets = useSafeAreaInsets();
  const { accounts } = useCuentasBoveda();
  const cuentasActivas = accounts.filter(a => !a.isArchived);

  const [montoTexto, setMontoTexto] = useState(() => {
    const restanteStr = (deuda.remainingAmount / 100).toFixed(2).replace('.', ',');
    return formatearEntradaDinero(restanteStr);
  });
  const [fechaPago, setFechaPago] = useState<Date>(() => new Date());
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string | undefined>(() => {
    return cuentasActivas.length > 0 ? cuentasActivas[0].id : undefined;
  });
  const [notas, setNotas] = useState('');
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false);

  const esCobro = deuda.type === 'RECEIVABLE';

  const handleMontoChange = (val: string) => {
    setMontoTexto(formatearEntradaDinero(val));
  };

  const handleSeleccionarTotal = () => {
    triggerSelection();
    const restanteStr = (deuda.remainingAmount / 100).toFixed(2).replace('.', ',');
    setMontoTexto(formatearEntradaDinero(restanteStr));
  };

  const handleSeleccionarMitad = () => {
    triggerSelection();
    const mitadCents = Math.round(deuda.remainingAmount / 2);
    const mitadStr = (mitadCents / 100).toFixed(2).replace('.', ',');
    setMontoTexto(formatearEntradaDinero(mitadStr));
  };

  const handleRegistrar = () => {
    triggerSelection();
    const centavos = convertirMontoACentavos(montoTexto);
    if (centavos <= 0) {
      triggerError();
      Alert.alert('Importe inválido', 'Ingresa un importe mayor a cero.');
      return;
    }

    if (centavos > deuda.remainingAmount) {
      triggerError();
      Alert.alert(
        'Importe excedido',
        `El monto abonado no puede ser mayor al saldo restante de ${formatCurrency(deuda.remainingAmount)}.`
      );
      return;
    }

    try {
      registrarPagoDeuda(deuda.id, {
        amount: centavos,
        date: fechaAISO(fechaPago),
        accountId: cuentaSeleccionadaId,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      if (onPagoCompletado) onPagoCompletado();
      onClose();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error al registrar pago', err.message || 'Ocurrió un error inesperado.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.modalOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />

      <View
        style={[
          styles.sheetContainer,
          { paddingBottom: Math.max(insets.bottom + 12, 20) },
        ]}
      >
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.indicatorBar} />
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.sheetTitle, TYPOGRAPHY.headlineSm]}>
                {esCobro ? 'Registrar Cobro' : 'Registrar Pago'}
              </Text>
              <Text style={[styles.sheetSubtitle, TYPOGRAPHY.bodySm]}>
                {deuda.concept} — {deuda.person}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Balance Summary Card */}
          <GlassCard variant="low" style={styles.balanceSummaryCard}>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceColLabel, TYPOGRAPHY.labelCaps]}>Total Deuda</Text>
              <Text style={[styles.balanceColValue, TYPOGRAPHY.numericTable]}>
                {formatCurrency(deuda.totalAmount)}
              </Text>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceCol}>
              <Text style={[styles.balanceColLabel, TYPOGRAPHY.labelCaps]}>Ya Pagado</Text>
              <Text style={[styles.balanceColValue, { color: COLORS.cashflowIncome }, TYPOGRAPHY.numericTable]}>
                {formatCurrency(deuda.paidAmount)}
              </Text>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceCol}>
              <Text style={[styles.balanceColLabel, TYPOGRAPHY.labelCaps]}>Saldo Pendiente</Text>
              <Text
                style={[
                  styles.balanceColValue,
                  { color: esCobro ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                  TYPOGRAPHY.numericTable,
                ]}
              >
                {formatCurrency(deuda.remainingAmount)}
              </Text>
            </View>
          </GlassCard>

          {/* Importe a Abonar */}
          <View style={styles.fieldGroup}>
            <View style={styles.amountHeaderRow}>
              <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>
                {esCobro ? 'Importe Cobrado ($)' : 'Importe Pagado ($)'}
              </Text>
              {/* Atajos de importe */}
              <View style={styles.quickAmountRow}>
                <TouchableOpacity
                  style={styles.quickAmountChip}
                  onPress={handleSeleccionarMitad}
                >
                  <Text style={[styles.quickAmountText, TYPOGRAPHY.labelCaps]}>50%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountChip}
                  onPress={handleSeleccionarTotal}
                >
                  <Text style={[styles.quickAmountText, TYPOGRAPHY.labelCaps]}>Total Restante</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.inputBox, styles.inputBoxAmount]}>
              <Text style={[styles.currencyPrefix, TYPOGRAPHY.headlineSm]}>$</Text>
              <TextInput
                style={[styles.amountInput, TYPOGRAPHY.headlineSm]}
                placeholder="0,00"
                placeholderTextColor={COLORS.onSurfaceVariant}
                keyboardType="numeric"
                value={montoTexto}
                onChangeText={handleMontoChange}
              />
            </View>
          </View>

          {/* Fecha del movimiento */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>Fecha del Cobro / Pago</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              activeOpacity={0.7}
              onPress={() => {
                triggerSelection();
                setMostrarSelectorFecha(true);
              }}
            >
              <MaterialIcons name="event" size={20} color={COLORS.primary} />
              <Text style={[styles.datePickerText, TYPOGRAPHY.bodyMd]}>
                {fechaAISO(fechaPago)}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Selector de Cuenta Financiera */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>
              {esCobro ? '¿A qué cuenta ingresa el dinero?' : '¿De qué cuenta sale el dinero?'}
            </Text>

            <View style={styles.accountsList}>
              {cuentasActivas.map(acc => {
                const isSelected = cuentaSeleccionadaId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accountOption, isSelected && styles.accountOptionSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerSelection();
                      setCuentaSeleccionadaId(acc.id);
                    }}
                  >
                    <View style={styles.accountLeft}>
                      <View style={[styles.accountIconCircle, isSelected && styles.accountIconCircleSelected]}>
                        <MaterialIcons
                          name={(acc.icon as any) || 'account-balance-wallet'}
                          size={18}
                          color={isSelected ? '#0B0F10' : COLORS.primary}
                        />
                      </View>
                      <View>
                        <Text style={[styles.accountName, isSelected && styles.accountNameSelected, TYPOGRAPHY.bodyMd]}>
                          {acc.name}
                        </Text>
                        <Text style={[styles.accountBalance, TYPOGRAPHY.bodySm]}>
                          Saldo: {formatCurrency(acc.currentBalance)}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <MaterialIcons name="check-circle" size={22} color={COLORS.primary} />
                    ) : (
                      <MaterialIcons name="radio-button-unchecked" size={20} color={COLORS.onSurfaceVariant} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Opción sin cuenta */}
              <TouchableOpacity
                style={[
                  styles.accountOption,
                  cuentaSeleccionadaId === undefined && styles.accountOptionSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  triggerSelection();
                  setCuentaSeleccionadaId(undefined);
                }}
              >
                <View style={styles.accountLeft}>
                  <View style={styles.accountIconCircle}>
                    <MaterialIcons name="block" size={18} color={COLORS.onSurfaceVariant} />
                  </View>
                  <View>
                    <Text style={[styles.accountName, cuentaSeleccionadaId === undefined && styles.accountNameSelected, TYPOGRAPHY.bodyMd]}>
                      Sin cuenta bancaria / física
                    </Text>
                    <Text style={[styles.accountBalance, TYPOGRAPHY.bodySm]}>
                      Solo actualiza la deuda, no altera saldos
                    </Text>
                  </View>
                </View>

                {cuentaSeleccionadaId === undefined ? (
                  <MaterialIcons name="check-circle" size={22} color={COLORS.primary} />
                ) : (
                  <MaterialIcons name="radio-button-unchecked" size={20} color={COLORS.onSurfaceVariant} />
                )}
              </TouchableOpacity>
            </View>

            {/* Nota de garantía de saldo */}
            <View style={styles.balanceInfoCallout}>
              <MaterialIcons name="verified-user" size={16} color={COLORS.primary} style={{ marginTop: 1 }} />
              <Text style={[styles.balanceInfoText, TYPOGRAPHY.bodySm]}>
                Al seleccionar una cuenta, se creará un movimiento contable en tus transacciones y su saldo se actualizará una sola vez de forma protegida.
              </Text>
            </View>
          </View>

          {/* Notas opcionales */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>Comprobante o Nota (Opcional)</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="edit-note" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, TYPOGRAPHY.bodyMd]}
                placeholder="Ej: Transferencia Itaú #8392, En mano..."
                placeholderTextColor={COLORS.onSurfaceVariant}
                value={notas}
                onChangeText={setNotas}
              />
            </View>
          </View>

          {/* Botón Confirmar */}
          <View style={styles.submitRow}>
            <BotonBrillante
              title={esCobro ? 'Confirmar Cobro' : 'Confirmar Pago'}
              icon={<MaterialIcons name="check-circle" size={20} color="#FFFFFF" />}
              onPress={handleRegistrar}
            />
          </View>
        </ScrollView>
      </View>

      <ModalSelectorFecha
        visible={mostrarSelectorFecha}
        selectedDate={fechaPago}
        onSelectDate={d => {
          setFechaPago(d);
          setMostrarSelectorFecha(false);
        }}
        onClose={() => setMostrarSelectorFecha(false)}
      />
    </KeyboardAvoidingView>
  );
};

export const ModalPagoDeuda: React.FC<PropiedadesModalPagoDeuda> = ({
  visible,
  onClose,
  deuda,
  onPagoCompletado,
}) => {
  if (!visible || !deuda) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ContenidoModalPagoDeuda
        key={`pago_${deuda.id}_${deuda.remainingAmount}`}
        deuda={deuda}
        onClose={onClose}
        onPagoCompletado={onPagoCompletado}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheetContainer: {
    backgroundColor: '#101415',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.borderGlassHighlight,
    maxHeight: '90%',
    flexShrink: 1,
  },
  scrollArea: {
    flexShrink: 1,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  indicatorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: COLORS.onSurface,
  },
  sheetSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  balanceSummaryCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  balanceColLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    marginBottom: 4,
  },
  balanceColValue: {
    color: COLORS.onSurface,
    fontSize: 13,
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderGlass,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: COLORS.primaryFixedDim,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickAmountChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.3)',
  },
  quickAmountText: {
    color: COLORS.primary,
    fontSize: 9,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    height: 48,
  },
  inputBoxAmount: {
    height: 54,
    borderColor: 'rgba(138, 79, 255, 0.35)',
  },
  inputIcon: {
    marginRight: 10,
  },
  currencyPrefix: {
    color: COLORS.primary,
    marginRight: 8,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    color: COLORS.onSurface,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    height: 48,
  },
  datePickerText: {
    color: COLORS.onSurface,
    flex: 1,
    marginLeft: 10,
  },
  accountsList: {
    gap: 8,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0B0F10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  accountOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(138, 79, 255, 0.1)',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  accountName: {
    color: COLORS.onSurface,
  },
  accountNameSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  accountBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  balanceInfoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(138, 79, 255, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.2)',
  },
  balanceInfoText: {
    color: COLORS.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
    fontSize: 11,
  },
  submitRow: {
    marginTop: 10,
  },
});
