import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { ModalSelectorFecha } from '@/compartido/componentes/ModalSelectorFecha';
import {
  Compromiso,
  OcurrenciaCompromiso,
  TipoProgramacionCompromiso,
} from '@/datos/tipos';
import {
  crearCompromiso,
  actualizarCompromiso,
  editarSoloEstaOcurrencia,
  obtenerRecordatoriosPorCompromiso,
} from '@/datos/consultas/agenda';
import {
  vibracionExito as triggerSuccess,
  vibracionError as triggerError,
  vibracionSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalCompromiso {
  visible: boolean;
  initialDate?: string; // 'YYYY-MM-DD'
  editingCommitment?: OcurrenciaCompromiso | Compromiso | null;
  onClose: () => void;
  onSaved?: () => void;
}

interface ItemRecordatorioForm {
  id: string;
  daysBefore: number;
  time: string;
}

const OPCIONES_ANTICIPACION = [
  { label: 'El mismo día', value: 0 },
  { label: '1 día antes', value: 1 },
  { label: '2 días antes', value: 2 },
  { label: '3 días antes', value: 3 },
  { label: '1 semana antes', value: 7 },
];

interface PropiedadesContenidoModalCompromiso {
  initialDate?: string;
  editingCommitment?: OcurrenciaCompromiso | Compromiso | null;
  onClose: () => void;
  onSaved?: () => void;
}

const ContenidoModalCompromiso: React.FC<PropiedadesContenidoModalCompromiso> = ({
  initialDate,
  editingCommitment,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(editingCommitment);

  const [title, setTitle] = useState(() => editingCommitment?.title || '');
  const [date, setDate] = useState(() => {
    if (editingCommitment) {
      return ('occurrenceDate' in editingCommitment && editingCommitment.occurrenceDate)
        ? editingCommitment.occurrenceDate
        : editingCommitment.date;
    }
    return initialDate || new Date().toISOString().slice(0, 10);
  });
  const [hasTime, setHasTime] = useState(() => Boolean(editingCommitment?.time));
  const [time, setTime] = useState(() => editingCommitment?.time || '09:00');
  const [relatedPerson, setRelatedPerson] = useState(() => editingCommitment?.relatedPerson || '');
  const [description, setDescription] = useState(() => editingCommitment?.description || '');
  const [recurrenceType, setRecurrenceType] = useState<TipoProgramacionCompromiso>(
    () => editingCommitment?.recurrenceType || 'SINGLE'
  );

  const [reminders, setReminders] = useState<ItemRecordatorioForm[]>(() => {
    if (editingCommitment) {
      try {
        const baseId = editingCommitment.seriesId || editingCommitment.id;
        const rems = obtenerRecordatoriosPorCompromiso(baseId);
        return rems.map((r, idx) => ({
          id: `rem_${idx}_${Date.now()}`,
          daysBefore: r.daysBefore,
          time: r.time,
        }));
      } catch {
        return [];
      }
    }
    return [{ id: `rem_default_${Date.now()}`, daysBefore: 0, time: '09:00' }];
  });

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsedDate = useMemo(() => {
    const parts = date.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [date]);

  const handleAddReminder = () => {
    triggerSelection();
    setReminders(prev => [
      ...prev,
      {
        id: `rem_${Date.now()}_${Math.random()}`,
        daysBefore: prev.length === 0 ? 0 : 1,
        time: hasTime ? time : '09:00',
      },
    ]);
  };

  const handleRemoveReminder = (id: string) => {
    triggerSelection();
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateReminderDays = (id: string, days: number) => {
    triggerSelection();
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, daysBefore: days } : r))
    );
  };

  const handleSave = async (modoEdicion?: 'OCCURRENCE' | 'SERIES') => {
    if (!title.trim()) {
      triggerError();
      Alert.alert('Título requerido', 'Por favor ingresa un título para el compromiso.');
      return;
    }

    setSaving(true);
    try {
      const datosBase = {
        title: title.trim(),
        date,
        time: hasTime ? time : undefined,
        relatedPerson: relatedPerson.trim() || undefined,
        description: description.trim() || undefined,
        recurrenceType,
        reminders: reminders.map(r => ({ daysBefore: r.daysBefore, time: r.time })),
      };

      if (!isEditing) {
        await crearCompromiso(datosBase);
        triggerSuccess();
        onSaved?.();
        onClose();
      } else if (editingCommitment) {
        const esRecurrente = editingCommitment.recurrenceType === 'MONTHLY';
        const occurrenceDate =
          ('occurrenceDate' in editingCommitment && editingCommitment.occurrenceDate)
            ? editingCommitment.occurrenceDate
            : editingCommitment.date;

        if (esRecurrente && !modoEdicion) {
          Alert.alert(
            'Modificar compromiso recurrente',
            '¿Deseas aplicar estos cambios solo a este compromiso o a toda la serie mensual?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setSaving(false) },
              {
                text: 'Solo esta ocurrencia',
                onPress: () => handleSave('OCCURRENCE'),
              },
              {
                text: 'Toda la serie',
                onPress: () => handleSave('SERIES'),
              },
            ]
          );
          return;
        }

        if (esRecurrente && modoEdicion === 'OCCURRENCE') {
          await editarSoloEstaOcurrencia(editingCommitment, occurrenceDate, datosBase);
        } else {
          const baseId = editingCommitment.seriesId || editingCommitment.id;
          await actualizarCompromiso(baseId, datosBase);
        }

        triggerSuccess();
        onSaved?.();
        onClose();
      }
    } catch (err: any) {
      console.error('Error al guardar compromiso:', err);
      triggerError();
      Alert.alert('Error', err.message || 'No se pudo guardar el compromiso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.drawerHandle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.drawerScrollContent}
      >
        {/* Header */}
        <View style={styles.modalHeaderRow}>
          <View style={styles.modalTitleBox}>
            <MaterialIcons name="event" size={22} color={COLORS.primary} />
            <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
              {isEditing ? 'Editar Compromiso' : 'Nuevo Compromiso'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Campo: Título (Obligatorio) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Título *</Text>
          <TextInput
            style={[styles.textInput, TYPOGRAPHY.bodySm]}
            placeholder="Ej: Reunión de equipo, Pago de alquiler, Cita médica"
            placeholderTextColor={COLORS.outline}
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEditing}
          />
        </View>

        {/* Fila: Fecha y Hora */}
        <View style={styles.rowTwoCols}>
          {/* Fecha */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Fecha *</Text>
            <TouchableOpacity
              style={styles.dateSelectorBtn}
              onPress={() => setDatePickerVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="calendar-today" size={16} color={COLORS.primary} />
              <Text style={[styles.dateSelectorText, TYPOGRAPHY.numericTable]}>{date}</Text>
            </TouchableOpacity>
          </View>

          {/* Hora Opcional */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.switchLabelRow}>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Hora</Text>
              <Switch
                value={hasTime}
                onValueChange={v => {
                  triggerSelection();
                  setHasTime(v);
                }}
                trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryContainer }}
                thumbColor={hasTime ? COLORS.primary : COLORS.outline}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            {hasTime ? (
              <TextInput
                style={[styles.textInput, TYPOGRAPHY.numericTable, { textAlign: 'center' }]}
                placeholder="09:00"
                placeholderTextColor={COLORS.outline}
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            ) : (
              <View style={styles.disabledTimeBox}>
                <Text style={[styles.disabledTimeText, TYPOGRAPHY.labelCaps]}>Todo el día</Text>
              </View>
            )}
          </View>
        </View>

        {/* Selector de Tipo de Programación: Único o Mensual */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Tipo de programación</Text>
          <View style={styles.recurrenceSwitchTrack}>
            <TouchableOpacity
              style={[
                styles.recurrenceOptionBtn,
                recurrenceType === 'SINGLE' && styles.recurrenceOptionActive,
              ]}
              onPress={() => {
                triggerSelection();
                setRecurrenceType('SINGLE');
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="event-available"
                size={16}
                color={recurrenceType === 'SINGLE' ? '#FFFFFF' : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.recurrenceOptionText,
                  TYPOGRAPHY.labelCaps,
                  recurrenceType === 'SINGLE' && styles.recurrenceOptionTextActive,
                ]}
              >
                Compromiso único
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.recurrenceOptionBtn,
                recurrenceType === 'MONTHLY' && styles.recurrenceOptionActive,
              ]}
              onPress={() => {
                triggerSelection();
                setRecurrenceType('MONTHLY');
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="update"
                size={16}
                color={recurrenceType === 'MONTHLY' ? '#FFFFFF' : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.recurrenceOptionText,
                  TYPOGRAPHY.labelCaps,
                  recurrenceType === 'MONTHLY' && styles.recurrenceOptionTextActive,
                ]}
              >
                Mensual (Día {parseInt(date.split('-')[2] || '1', 10)})
              </Text>
            </TouchableOpacity>
          </View>
          {recurrenceType === 'MONTHLY' && (
            <Text style={[styles.helperNoticeText, TYPOGRAPHY.bodySm]}>
              Se repetirá cada mes el día {parseInt(date.split('-')[2] || '1', 10)}. En meses que no contengan este día (ej: 31 de feb), se omitirá automáticamente.
            </Text>
          )}
        </View>

        {/* Campo: Persona relacionada (Opcional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Persona relacionada (Opcional)</Text>
          <View style={styles.inputWithIconRow}>
            <MaterialIcons name="person-outline" size={18} color={COLORS.onSurfaceVariant} />
            <TextInput
              style={[styles.textInputInside, TYPOGRAPHY.bodySm]}
              placeholder="Ej: Dr. Pérez, Carlos, Proveedor"
              placeholderTextColor={COLORS.outline}
              value={relatedPerson}
              onChangeText={setRelatedPerson}
            />
          </View>
        </View>

        {/* Campo: Notas / Descripción (Opcional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Notas o descripción (Opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput, TYPOGRAPHY.bodySm]}
            placeholder="Detalles adicionales, recordatorios especiales o ubicación..."
            placeholderTextColor={COLORS.outline}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Sección: Recordatorios y Avisos */}
        <View style={styles.inputGroup}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.flexRowCenter}>
              <MaterialIcons name="notifications-none" size={16} color={COLORS.primary} />
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps, { marginBottom: 0, marginLeft: 6 }]}>
                Recordatorios ({reminders.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleAddReminder}
              style={styles.addReminderPill}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={14} color={COLORS.primary} />
              <Text style={[styles.addReminderPillText, TYPOGRAPHY.labelCaps]}>Añadir aviso</Text>
            </TouchableOpacity>
          </View>

          {reminders.length === 0 ? (
            <View style={styles.noRemindersBox}>
              <Text style={[styles.noRemindersText, TYPOGRAPHY.bodySm]}>
                Sin recordatorios. No se enviarán notificaciones para este compromiso.
              </Text>
            </View>
          ) : (
            <View style={styles.remindersList}>
              {reminders.map(rem => (
                <View key={rem.id} style={styles.reminderCard}>
                  <View style={styles.reminderCardLeft}>
                    <MaterialIcons name="alarm" size={16} color={COLORS.primary} />
                    <View style={styles.daysBeforePillsRow}>
                      {OPCIONES_ANTICIPACION.map(opc => {
                        const selected = rem.daysBefore === opc.value;
                        return (
                          <TouchableOpacity
                            key={opc.value}
                            style={[styles.daysPill, selected && styles.daysPillSelected]}
                            onPress={() => handleUpdateReminderDays(rem.id, opc.value)}
                          >
                            <Text
                              style={[
                                styles.daysPillText,
                                TYPOGRAPHY.labelCaps,
                                selected && styles.daysPillTextSelected,
                              ]}
                            >
                              {opc.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveReminder(rem.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="remove-circle-outline" size={18} color={COLORS.cashflowExpense} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => handleSave()}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9B5CFF', '#6A1FE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtnGradient}
            >
              <Text style={[styles.saveBtnText, TYPOGRAPHY.labelCaps]}>
                {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Compromiso'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de selección de fecha */}
      <ModalSelectorFecha
        visible={datePickerVisible}
        selectedDate={parsedDate}
        onSelectDate={(newD: Date) => {
          const y = newD.getFullYear();
          const m = (newD.getMonth() + 1).toString().padStart(2, '0');
          const d = newD.getDate().toString().padStart(2, '0');
          setDate(`${y}-${m}-${d}`);
          setDatePickerVisible(false);
        }}
        onClose={() => setDatePickerVisible(false)}
      />
    </View>
  );
};

export const ModalCompromiso: React.FC<PropiedadesModalCompromiso> = ({
  visible,
  initialDate,
  editingCommitment,
  onClose,
  onSaved,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {visible && (
          <ContenidoModalCompromiso
            initialDate={initialDate}
            editingCommitment={editingCommitment}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
    flexShrink: 1,
  },
  scrollArea: {
    flexShrink: 1,
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
    paddingBottom: 36,
    gap: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: COLORS.onSurface,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.onSurface,
  },
  textAreaInput: {
    minHeight: 74,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateSelectorText: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  switchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 20,
    marginBottom: 4,
  },
  disabledTimeBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledTimeText: {
    color: COLORS.outline,
    fontSize: 10,
  },
  recurrenceSwitchTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  recurrenceOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  recurrenceOptionActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  recurrenceOptionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  recurrenceOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helperNoticeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingHorizontal: 12,
  },
  textInputInside: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    color: COLORS.onSurface,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addReminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 79, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.35)',
  },
  addReminderPillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  noRemindersBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  noRemindersText: {
    color: COLORS.outline,
    fontSize: 12,
    textAlign: 'center',
  },
  remindersList: {
    gap: 8,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  reminderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  daysBeforePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  daysPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  daysPillSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  daysPillText: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
  },
  daysPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.onSurface,
  },
  saveBtn: {
    flex: 2,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
