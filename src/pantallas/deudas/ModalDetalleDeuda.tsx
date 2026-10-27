import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
  gatillarAdvertencia as triggerWarning,
} from '@/compartido/utilidades/hapticos';
import { Deuda, PagoDeuda } from '@/datos/tipos';
import {
  obtenerPagosDeuda,
  eliminarPagoDeuda,
  cancelarDeuda,
  eliminarDeuda,
  obtenerDeudaPorId,
} from '@/datos/consultas/deudas';
import { ModalPagoDeuda } from './ModalPagoDeuda';

export interface PropiedadesModalDetalleDeuda {
  visible: boolean;
  deudaId: string | null;
  onClose: () => void;
  onEditar?: (deuda: Deuda) => void;
}

export const ModalDetalleDeuda: React.FC<PropiedadesModalDetalleDeuda> = ({
  visible,
  deudaId,
  onClose,
  onEditar,
}) => {
  const insets = useSafeAreaInsets();
  const [revision, setRevision] = useState(0);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

  const deuda = useMemo(() => {
    if (!visible || !deudaId) return null;
    void revision;
    return obtenerDeudaPorId(deudaId);
  }, [visible, deudaId, revision]);

  const pagos = useMemo(() => {
    if (!deuda) return [];
    void revision;
    return obtenerPagosDeuda(deuda.id);
  }, [deuda, revision]);

  const recargarDetalle = () => {
    setRevision(r => r + 1);
  };

  if (!deuda) return null;

  const esCobro = deuda.type === 'RECEIVABLE';
  const esPagada = deuda.status === 'PAID';
  const esCancelada = deuda.status === 'CANCELLED';

  const handleEliminarPago = (pago: PagoDeuda) => {
    triggerWarning();
    Alert.alert(
      'Revertir Pago',
      `¿Deseas anular el abono de ${formatCurrency(pago.amount)} realizado el ${pago.date}?${
        pago.accountName ? `\n\nSe revertirá el movimiento contable en "${pago.accountName}".` : ''
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revertir',
          style: 'destructive',
          onPress: () => {
            try {
              eliminarPagoDeuda(pago.id);
              triggerSuccess();
              recargarDetalle();
            } catch (err: any) {
              triggerError();
              Alert.alert('Error', err.message || 'No se pudo revertir el pago.');
            }
          },
        },
      ]
    );
  };

  const handleCancelarDeuda = () => {
    triggerWarning();
    Alert.alert(
      'Cancelar Deuda',
      '¿Deseas marcar esta deuda como cancelada? Conservará su historial pero no figurará como pendiente.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Marcar Cancelada',
          style: 'destructive',
          onPress: () => {
            try {
              cancelarDeuda(deuda.id);
              triggerSuccess();
              recargarDetalle();
            } catch (err: any) {
              triggerError();
              Alert.alert('Error', err.message || 'No se pudo cancelar la deuda.');
            }
          },
        },
      ]
    );
  };

  const handleEliminarDeuda = () => {
    triggerWarning();
    Alert.alert(
      'Eliminar Registro',
      '¿Estás seguro de que deseas eliminar permanentemente esta deuda? Si tiene pagos con movimientos en cuentas, también serán revertidos.',
      [
        { text: 'No eliminar', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: () => {
            try {
              eliminarDeuda(deuda.id);
              triggerSuccess();
              onClose();
            } catch (err: any) {
              triggerError();
              Alert.alert('Error', err.message || 'No se pudo eliminar la deuda.');
            }
          },
        },
      ]
    );
  };

  const colorEstado = esPagada
    ? COLORS.cashflowIncome
    : deuda.isOverdue
    ? COLORS.cashflowExpense
    : deuda.isDueSoon
    ? '#FFB74D'
    : esCancelada
    ? COLORS.onSurfaceVariant
    : deuda.status === 'PARTIAL'
    ? COLORS.secondary
    : COLORS.primary;

  const textoEstado = esPagada
    ? 'PAGADA'
    : deuda.isOverdue
    ? 'VENCIDA'
    : deuda.isDueSoon
    ? 'PRÓXIMA A VENCER'
    : esCancelada
    ? 'CANCELADA'
    : deuda.status === 'PARTIAL'
    ? 'PAGO PARCIAL'
    : 'PENDIENTE';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
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
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor: esCobro
                        ? 'rgba(87, 245, 171, 0.15)'
                        : 'rgba(255, 138, 158, 0.15)',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={esCobro ? 'call-received' : 'call-made'}
                    size={14}
                    color={esCobro ? COLORS.cashflowIncome : COLORS.cashflowExpense}
                  />
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: esCobro ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                      TYPOGRAPHY.labelCaps,
                    ]}
                  >
                    {esCobro ? 'ME DEBEN' : 'DEBO'}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { borderColor: colorEstado }]}>
                  <Text style={[styles.statusBadgeText, { color: colorEstado }, TYPOGRAPHY.labelCaps]}>
                    {textoEstado}
                  </Text>
                </View>
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
            contentContainerStyle={styles.scrollContent}
          >
            {/* Voucher Card */}
            <GlassCard variant="high" style={styles.voucherCard}>
              <View style={styles.voucherHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={[styles.avatarLetter, TYPOGRAPHY.headlineSm]}>
                    {deuda.person ? deuda.person[0].toUpperCase() : '?'}
                  </Text>
                </View>

                <View style={styles.voucherHeaderInfo}>
                  <Text style={[styles.personName, TYPOGRAPHY.headlineSm]}>
                    {deuda.person}
                  </Text>
                  <Text style={[styles.conceptText, TYPOGRAPHY.bodyMd]}>
                    {deuda.concept}
                  </Text>
                </View>
              </View>

              <View style={styles.voucherDivider} />

              {/* Main Amount Figure */}
              <View style={styles.amountDisplayRow}>
                <View>
                  <Text style={[styles.amountLabel, TYPOGRAPHY.labelCaps]}>
                    {esPagada ? 'Total Saldado' : 'Saldo Pendiente'}
                  </Text>
                  <Text
                    style={[
                      styles.mainAmount,
                      { color: esCobro ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                      TYPOGRAPHY.displayHeroMobile,
                    ]}
                  >
                    {formatCurrency(deuda.remainingAmount)}
                  </Text>
                </View>

                <View style={styles.progressCircleBox}>
                  <Text style={[styles.progressPercent, TYPOGRAPHY.headlineSm]}>
                    {deuda.progressPercentage}%
                  </Text>
                  <Text style={[styles.progressLabel, TYPOGRAPHY.labelCaps]}>Cubierto</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${deuda.progressPercentage ?? 0}%`,
                      backgroundColor: esCobro ? COLORS.cashflowIncome : COLORS.primary,
                    },
                  ]}
                />
              </View>

              {/* Secondary Figures */}
              <View style={styles.figuresStrip}>
                <View style={styles.figureItem}>
                  <Text style={[styles.figureLabel, TYPOGRAPHY.labelCaps]}>Monto Total</Text>
                  <Text style={[styles.figureValue, TYPOGRAPHY.numericTable]}>
                    {formatCurrency(deuda.totalAmount)}
                  </Text>
                </View>

                <View style={styles.figureItem}>
                  <Text style={[styles.figureLabel, TYPOGRAPHY.labelCaps]}>Total Abonado</Text>
                  <Text style={[styles.figureValue, { color: COLORS.cashflowIncome }, TYPOGRAPHY.numericTable]}>
                    {formatCurrency(deuda.paidAmount)}
                  </Text>
                </View>
              </View>

              {/* Dates and Reminders */}
              <View style={styles.datesGrid}>
                <View style={styles.dateCol}>
                  <View style={styles.dateColHeader}>
                    <MaterialIcons name="calendar-today" size={14} color={COLORS.onSurfaceVariant} />
                    <Text style={[styles.dateColLabel, TYPOGRAPHY.labelCaps]}>Emisión</Text>
                  </View>
                  <Text style={[styles.dateColValue, TYPOGRAPHY.bodyMd]}>{deuda.issueDate}</Text>
                </View>

                <View style={styles.dateCol}>
                  <View style={styles.dateColHeader}>
                    <MaterialIcons
                      name="alarm"
                      size={14}
                      color={deuda.isOverdue ? COLORS.cashflowExpense : COLORS.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.dateColLabel,
                        deuda.isOverdue && { color: COLORS.cashflowExpense },
                        TYPOGRAPHY.labelCaps,
                      ]}
                    >
                      Vencimiento
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.dateColValue,
                      deuda.isOverdue && { color: COLORS.cashflowExpense },
                      TYPOGRAPHY.bodyMd,
                    ]}
                  >
                    {deuda.dueDate || 'Sin plazo fijado'}
                  </Text>
                </View>
              </View>

              {deuda.notes ? (
                <View style={styles.notesBox}>
                  <Text style={[styles.notesLabel, TYPOGRAPHY.labelCaps]}>Notas:</Text>
                  <Text style={[styles.notesContent, TYPOGRAPHY.bodySm]}>{deuda.notes}</Text>
                </View>
              ) : null}
            </GlassCard>

            {/* Quick Action Button to Record Payment */}
            {!esPagada && !esCancelada && (
              <View style={styles.primaryActionBox}>
                <BotonBrillante
                  title={esCobro ? 'Registrar Cobro / Abono' : 'Registrar Pago / Abono'}
                  icon={<MaterialIcons name={esCobro ? 'add-circle-outline' : 'payment'} size={20} color="#FFFFFF" />}
                  onPress={() => {
                    triggerSelection();
                    setMostrarModalPago(true);
                  }}
                />
              </View>
            )}

            {/* Secondary Management Options */}
            <View style={styles.managementBar}>
              {onEditar && (
                <TouchableOpacity
                  style={styles.manageBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerSelection();
                    onEditar(deuda);
                  }}
                >
                  <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                  <Text style={[styles.manageBtnText, { color: COLORS.primary }, TYPOGRAPHY.labelCaps]}>
                    Editar
                  </Text>
                </TouchableOpacity>
              )}

              {!esCancelada && (
                <TouchableOpacity
                  style={styles.manageBtn}
                  activeOpacity={0.7}
                  onPress={handleCancelarDeuda}
                >
                  <MaterialIcons name="cancel" size={16} color={COLORS.onSurfaceVariant} />
                  <Text style={[styles.manageBtnText, { color: COLORS.onSurfaceVariant }, TYPOGRAPHY.labelCaps]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.manageBtn}
                activeOpacity={0.7}
                onPress={handleEliminarDeuda}
              >
                <MaterialIcons name="delete-outline" size={16} color={COLORS.cashflowExpense} />
                <Text style={[styles.manageBtnText, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment History Section */}
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Text style={[styles.historySectionTitle, TYPOGRAPHY.headlineSm]}>
                  Historial de Pagos y Abonos
                </Text>
                <View style={styles.historyCountBadge}>
                  <Text style={[styles.historyCountText, TYPOGRAPHY.labelCaps]}>
                    {pagos.length} {pagos.length === 1 ? 'registro' : 'registros'}
                  </Text>
                </View>
              </View>

              {pagos.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <MaterialIcons name="receipt" size={32} color={COLORS.onSurfaceVariant} style={{ opacity: 0.5 }} />
                  <Text style={[styles.emptyHistoryText, TYPOGRAPHY.bodySm]}>
                    Aún no se han registrado pagos para esta deuda.
                  </Text>
                </View>
              ) : (
                <View style={styles.paymentsList}>
                  {pagos.map(pago => (
                    <View key={pago.id} style={styles.paymentCard}>
                      <View style={styles.paymentCardLeft}>
                        <View style={styles.paymentIconBox}>
                          <MaterialIcons
                            name={esCobro ? 'arrow-downward' : 'arrow-upward'}
                            size={16}
                            color={esCobro ? COLORS.cashflowIncome : COLORS.cashflowExpense}
                          />
                        </View>

                        <View>
                          <Text style={[styles.paymentAmount, TYPOGRAPHY.numericTable]}>
                            {formatCurrency(pago.amount)}
                          </Text>
                          <Text style={[styles.paymentDate, TYPOGRAPHY.bodySm]}>
                            {pago.date}
                            {pago.accountName ? ` • ${pago.accountName}` : ' • Sin cuenta'}
                          </Text>
                          {pago.notes ? (
                            <Text style={[styles.paymentNote, TYPOGRAPHY.bodySm]}>
                              «{pago.notes}»
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.deletePaymentBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => handleEliminarPago(pago)}
                      >
                        <MaterialIcons name="delete-outline" size={18} color={COLORS.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal para registrar un nuevo abono */}
      <ModalPagoDeuda
        visible={mostrarModalPago}
        deuda={deuda}
        onClose={() => setMostrarModalPago(false)}
        onPagoCompletado={() => {
          recargarDetalle();
        }}
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
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#101415',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.borderGlassHighlight,
    maxHeight: '92%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statusBadgeText: {
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  voucherCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  voucherHeaderInfo: {
    flex: 1,
  },
  personName: {
    color: COLORS.onSurface,
  },
  conceptText: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: COLORS.borderGlass,
    marginVertical: 14,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  mainAmount: {
    fontWeight: '700',
  },
  progressCircleBox: {
    alignItems: 'flex-end',
  },
  progressPercent: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  progressLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  figuresStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  figureItem: {
    flex: 1,
    alignItems: 'center',
  },
  figureLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    marginBottom: 2,
  },
  figureValue: {
    color: COLORS.onSurface,
    fontSize: 13,
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
  },
  dateColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateColLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  dateColValue: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  notesBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  notesLabel: {
    color: COLORS.primaryFixedDim,
    fontSize: 9,
    marginBottom: 2,
  },
  notesContent: {
    color: COLORS.onSurfaceVariant,
  },
  primaryActionBox: {
    marginBottom: 14,
  },
  managementBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  manageBtnText: {
    fontSize: 10,
  },
  historySection: {
    marginTop: 6,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historySectionTitle: {
    color: COLORS.onSurface,
  },
  historyCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyCountText: {
    color: COLORS.onSurfaceVariant,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  emptyHistoryText: {
    color: COLORS.onSurfaceVariant,
  },
  paymentsList: {
    gap: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0B0F10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentAmount: {
    color: COLORS.onSurface,
    fontSize: 14,
  },
  paymentDate: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 1,
  },
  paymentNote: {
    color: COLORS.primaryFixedDim,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  deletePaymentBtn: {
    padding: 6,
  },
});
