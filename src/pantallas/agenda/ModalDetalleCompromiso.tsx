import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { OcurrenciaCompromiso, Compromiso } from '@/datos/tipos';
import {
  completarOcurrenciaCompromiso,
  cancelarOcurrenciaCompromiso,
  detenerFuturasRepeticiones,
  eliminarCompromiso,
  actualizarCompromiso,
} from '@/datos/consultas/agenda';
import {
  vibracionExito as triggerSuccess,
  vibracionSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalDetalleCompromiso {
  visible: boolean;
  commitment: OcurrenciaCompromiso | Compromiso | null;
  onClose: () => void;
  onEdit: (comp: OcurrenciaCompromiso | Compromiso) => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ModalDetalleCompromiso: React.FC<PropiedadesModalDetalleCompromiso> = ({
  visible,
  commitment,
  onClose,
  onEdit,
}) => {
  const insets = useSafeAreaInsets();

  if (!commitment) return null;

  const occurrenceDate =
    ('occurrenceDate' in commitment && commitment.occurrenceDate)
      ? commitment.occurrenceDate
      : commitment.date;

  const [anioStr, mesStr, diaStr] = occurrenceDate.split('-');
  const diaNum = parseInt(diaStr, 10);
  const mesNom = MESES[parseInt(mesStr, 10) - 1] || '';
  const fechaFormateada = `${diaNum} de ${mesNom} de ${anioStr}`;

  const esRecurrente = commitment.recurrenceType === 'MONTHLY';
  const esCompletado = commitment.status === 'COMPLETED';
  const esCancelado = commitment.status === 'CANCELLED';

  const handleToggleCompleted = async () => {
    triggerSelection();
    try {
      if (esCompletado) {
        // Reabrir
        if (commitment.recurrenceType === 'SINGLE') {
          await actualizarCompromiso(commitment.id, { status: 'PENDING' });
        } else {
          // Si era recurrente y tenía excepción, cancelar o reactivar
          const baseId = commitment.seriesId || commitment.id;
          await actualizarCompromiso(baseId, { status: 'PENDING' });
        }
      } else {
        await completarOcurrenciaCompromiso(commitment, occurrenceDate);
      }
      triggerSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado.');
    }
  };

  const handleCancelOccurrence = async () => {
    triggerSelection();
    Alert.alert(
      'Cancelar compromiso',
      esRecurrente
        ? '¿Deseas cancelar solo esta ocurrencia mensual o detener toda la serie futura?'
        : '¿Deseas marcar este compromiso como cancelado? No se enviarán avisos.',
      esRecurrente
        ? [
            { text: 'Volver', style: 'cancel' },
            {
              text: 'Solo esta ocurrencia',
              onPress: async () => {
                await cancelarOcurrenciaCompromiso(commitment, occurrenceDate);
                triggerSuccess();
                onClose();
              },
            },
            {
              text: 'Detener toda la serie',
              style: 'destructive',
              onPress: async () => {
                const seriesId = commitment.seriesId || commitment.id;
                await detenerFuturasRepeticiones(seriesId);
                triggerSuccess();
                onClose();
              },
            },
          ]
        : [
            { text: 'Volver', style: 'cancel' },
            {
              text: 'Cancelar compromiso',
              style: 'destructive',
              onPress: async () => {
                await cancelarOcurrenciaCompromiso(commitment, occurrenceDate);
                triggerSuccess();
                onClose();
              },
            },
          ]
    );
  };

  const handleDelete = () => {
    triggerSelection();
    Alert.alert(
      'Eliminar compromiso',
      esRecurrente
        ? '¿Deseas eliminar definitivamente este compromiso y todas sus repeticiones?'
        : '¿Deseas eliminar definitivamente este compromiso?',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const idAEliminar = commitment.seriesId || commitment.id;
            await eliminarCompromiso(idAEliminar);
            triggerSuccess();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.drawerHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerScrollContent}
          >
            {/* Header del modal */}
            <View style={styles.modalHeaderRow}>
              <View
                style={[
                  styles.statusBadge,
                  esCompletado
                    ? styles.statusBadgeCompleted
                    : esCancelado
                      ? styles.statusBadgeCancelled
                      : styles.statusBadgePending,
                ]}
              >
                <MaterialIcons
                  name={
                    esCompletado
                      ? 'check-circle'
                      : esCancelado
                        ? 'cancel'
                        : 'schedule'
                  }
                  size={14}
                  color={
                    esCompletado
                      ? COLORS.cashflowIncome
                      : esCancelado
                        ? COLORS.cashflowExpense
                        : COLORS.primary
                  }
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    TYPOGRAPHY.labelCaps,
                    {
                      color: esCompletado
                        ? COLORS.cashflowIncome
                        : esCancelado
                          ? COLORS.cashflowExpense
                          : COLORS.primary,
                    },
                  ]}
                >
                  {esCompletado ? 'Completado' : esCancelado ? 'Cancelado' : 'Pendiente'}
                </Text>
              </View>

              <View style={styles.headerActionBtns}>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onEdit(commitment);
                  }}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.cashflowExpense} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Título Principal */}
            <Text style={[styles.commitmentTitle, TYPOGRAPHY.headlineSm]}>
              {commitment.title}
            </Text>

            {/* Tarjeta de Datos Clave */}
            <GlassCard variant="surface" style={styles.infoCard}>
              {/* Fecha y Hora */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <MaterialIcons name="calendar-today" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, TYPOGRAPHY.labelCaps]}>Fecha y Hora</Text>
                  <Text style={[styles.infoValue, TYPOGRAPHY.numericTable]}>
                    {fechaFormateada}
                    {commitment.time ? ` • ${commitment.time} hs` : ' • Todo el día'}
                  </Text>
                </View>
              </View>

              {/* Persona Relacionada */}
              {Boolean(commitment.relatedPerson) && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <MaterialIcons name="person" size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, TYPOGRAPHY.labelCaps]}>Persona relacionada</Text>
                    <Text style={[styles.infoValue, TYPOGRAPHY.bodySm]}>
                      {commitment.relatedPerson}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tipo de programación */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <MaterialIcons
                    name={esRecurrente ? 'update' : 'event-available'}
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, TYPOGRAPHY.labelCaps]}>Modalidad</Text>
                  <Text style={[styles.infoValue, TYPOGRAPHY.bodySm]}>
                    {esRecurrente
                      ? `Recurrente mensual (cada día ${parseInt(diaStr, 10)})`
                      : 'Compromiso único'}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Descripción / Notas si existen */}
            {Boolean(commitment.description) && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionTitle, TYPOGRAPHY.labelCaps]}>Notas</Text>
                <GlassCard variant="low" style={styles.notesCard}>
                  <Text style={[styles.notesText, TYPOGRAPHY.bodySm]}>
                    {commitment.description}
                  </Text>
                </GlassCard>
              </View>
            )}

            {/* Recordatorios configurados */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, TYPOGRAPHY.labelCaps]}>Recordatorios programados</Text>
              {'reminders' in commitment && commitment.reminders && commitment.reminders.length > 0 ? (
                <View style={styles.remindersList}>
                  {commitment.reminders.map((rem, idx) => (
                    <View key={rem.id || idx} style={styles.reminderRow}>
                      <MaterialIcons name="notifications-active" size={16} color={COLORS.primary} />
                      <Text style={[styles.reminderText, TYPOGRAPHY.bodySm]}>
                        {rem.daysBefore === 0
                          ? `El mismo día a las ${rem.time} hs`
                          : rem.daysBefore === 1
                            ? `1 día antes a las ${rem.time} hs`
                            : `${rem.daysBefore} días antes a las ${rem.time} hs`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noRemindersNote, TYPOGRAPHY.bodySm]}>
                  Este compromiso no tiene recordatorios configurados.
                </Text>
              )}
            </View>

            {/* Botones de Acción Primaria */}
            <View style={styles.primaryActionsRow}>
              <TouchableOpacity
                style={[
                  styles.toggleCompleteBtn,
                  esCompletado ? styles.toggleCompleteBtnReopen : styles.toggleCompleteBtnDone,
                ]}
                onPress={handleToggleCompleted}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={esCompletado ? 'restart-alt' : 'check'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={[styles.toggleCompleteBtnText, TYPOGRAPHY.labelCaps]}>
                  {esCompletado ? 'Reabrir como pendiente' : 'Marcar como completado'}
                </Text>
              </TouchableOpacity>

              {!esCancelado && !esCompletado && (
                <TouchableOpacity
                  style={styles.cancelActionBtn}
                  onPress={handleCancelOccurrence}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="block" size={16} color={COLORS.cashflowExpense} />
                  <Text style={[styles.cancelActionBtnText, TYPOGRAPHY.labelCaps]}>
                    {esRecurrente ? 'Opciones de cancelación' : 'Cancelar compromiso'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: '#121719',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderGlassHighlight,
    maxHeight: '88%',
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outline,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  drawerScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.35)',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.35)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 158, 0.35)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  commitmentTitle: {
    color: COLORS.onSurface,
  },
  infoCard: {
    padding: 14,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  infoValue: {
    color: COLORS.onSurface,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  notesCard: {
    padding: 14,
  },
  notesText: {
    color: COLORS.onSurface,
    lineHeight: 18,
  },
  remindersList: {
    gap: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  reminderText: {
    color: COLORS.onSurface,
  },
  noRemindersNote: {
    color: COLORS.outline,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  primaryActionsRow: {
    gap: 10,
    paddingTop: 8,
  },
  toggleCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
  },
  toggleCompleteBtnDone: {
    backgroundColor: COLORS.cashflowIncome,
  },
  toggleCompleteBtnReopen: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  toggleCompleteBtnText: {
    color: '#0B0F10',
    fontWeight: '700',
  },
  toggleCompleteBtnTextReopen: {
    color: COLORS.onSurface,
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 158, 0.3)',
  },
  cancelActionBtnText: {
    color: COLORS.cashflowExpense,
  },
});
