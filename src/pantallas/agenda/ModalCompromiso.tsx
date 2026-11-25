import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  ModalSelectorFecha,
  BotonBrillante,
  EncabezadoModal,
  TarjetaVidrio,
  SelectorSegmentado,
  ChipFiltro,
  OrbeGlossy,
  OpcionSegmento,
} from '@/compartido/componentes';
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
  { label: 'Mismo día', value: 0 },
  { label: '1 día antes', value: 1 },
  { label: '2 días antes', value: 2 },
  { label: '3 días antes', value: 3 },
  { label: '1 semana', value: 7 },
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
  const titleInputRef = useRef<TextInput>(null);

  // Auto-enfoque al abrir modal para desplegar el teclado inmediatamente
  useEffect(() => {
    const t1 = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
    const t2 = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 350);
    const t3 = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

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

  const diaDelMes = parseInt(date.split('-')[2] || '1', 10);

  const opcionesProgramacion = useMemo<OpcionSegmento<TipoProgramacionCompromiso>[]>(
    () => [
      {
        valor: 'SINGLE',
        etiqueta: 'Único',
        icono: 'event-available',
        tonoActivo: 'cian',
      },
      {
        valor: 'MONTHLY',
        etiqueta: `Mensual (Día ${diaDelMes})`,
        icono: 'update',
        tonoActivo: 'violeta',
      },
    ],
    [diaDelMes]
  );

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

      <EncabezadoModal
        titulo={isEditing ? 'Editar Compromiso' : 'Nuevo Compromiso'}
        subtitulo="Programa un pago, tarea o recordatorio"
        icono="event"
        tono="violeta"
        onCerrar={onClose}
        style={styles.modalHeader}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.drawerScrollContent}
      >
        {/* Bloque 1: Título, Fecha y Hora */}
        <TarjetaVidrio variant="low" style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Título *</Text>
            <View style={styles.inputWithIconRow}>
              <MaterialIcons name="edit-note" size={18} color={COLORS.secondary} />
              <TextInput
                ref={titleInputRef}
                style={[styles.textInputInside, TYPOGRAPHY.bodySm]}
                placeholder="Ej: Pago de alquiler, reunión, entrega..."
                placeholderTextColor={COLORS.outline}
                value={title}
                onChangeText={setTitle}
                autoFocus={true}
              />
            </View>
          </View>

          <View style={styles.rowTwoCols}>
            {/* Fecha */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Fecha *</Text>
              <TouchableOpacity
                style={styles.dateSelectorBtn}
                onPress={() => {
                  triggerSelection();
                  setDatePickerVisible(true);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="calendar-today" size={16} color={COLORS.secondary} />
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
                  trackColor={{ false: 'rgba(255,255,255,0.12)', true: COLORS.primaryContainer }}
                  thumbColor={hasTime ? '#FFFFFF' : COLORS.outline}
                  style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
                />
              </View>
              {hasTime ? (
                <TextInput
                  style={[styles.textInput, TYPOGRAPHY.numericTable, styles.timeInput]}
                  placeholder="09:00"
                  placeholderTextColor={COLORS.outline}
                  value={time}
                  onChangeText={val => setTime(val.replace(/[^0-9:]/g, '').slice(0, 5))}
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
        </TarjetaVidrio>

        {/* Bloque 2: Tipo de Programación */}
        <TarjetaVidrio variant="low" style={styles.sectionCard}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Tipo de programación</Text>
          <SelectorSegmentado
            opciones={opcionesProgramacion}
            valorSeleccionado={recurrenceType}
            onSeleccionar={setRecurrenceType}
            compacto
          />
          {recurrenceType === 'MONTHLY' && (
            <Text style={[styles.helperNoticeText, TYPOGRAPHY.bodySm]}>
              Se repetirá cada mes el día {diaDelMes}. En meses sin ese día (ej: 31 de feb), se omitirá automáticamente.
            </Text>
          )}
        </TarjetaVidrio>

        {/* Bloque 3: Detalles Opcionales */}
        <TarjetaVidrio variant="low" style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Persona relacionada</Text>
            <View style={styles.inputWithIconRow}>
              <MaterialIcons name="person-outline" size={18} color={COLORS.onSurfaceVariant} />
              <TextInput
                style={[styles.textInputInside, TYPOGRAPHY.bodySm]}
                placeholder="Opcional (cliente, contacto, proveedor...)"
                placeholderTextColor={COLORS.outline}
                value={relatedPerson}
                onChangeText={setRelatedPerson}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Notas o descripción</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput, TYPOGRAPHY.bodySm]}
              placeholder="Agrega detalles adicionales..."
              placeholderTextColor={COLORS.outline}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </TarjetaVidrio>

        {/* Bloque 4: Recordatorios y Avisos */}
        <TarjetaVidrio variant="low" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.flexRowCenter}>
              <OrbeGlossy tamano={28} tono="violeta">
                <MaterialIcons name="notifications-none" size={14} color="#FFFFFF" />
              </OrbeGlossy>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps, styles.reminderSectionLabel]}>
                Recordatorios ({reminders.length})
              </Text>
            </View>
            <ChipFiltro
              etiqueta="Agregar"
              activo
              tono="violeta"
              onPress={handleAddReminder}
            />
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
                  <View style={styles.reminderTopRow}>
                    <View style={styles.flexRowCenter}>
                      <OrbeGlossy tamano={26} tono="obsidiana">
                        <MaterialIcons name="alarm" size={13} color={COLORS.secondary} />
                      </OrbeGlossy>
                      <Text style={styles.reminderCardTitle}>Anticipación del aviso</Text>
                    </View>
                    <OrbeGlossy
                      tamano={26}
                      tono="gasto"
                      onPress={() => handleRemoveReminder(rem.id)}
                      accessibilityLabel="Eliminar recordatorio"
                    >
                      <MaterialIcons name="close" size={14} color="#FFFFFF" />
                    </OrbeGlossy>
                  </View>

                  <View style={styles.daysBeforePillsRow}>
                    {OPCIONES_ANTICIPACION.map(opc => (
                      <ChipFiltro
                        key={opc.value}
                        etiqueta={opc.label}
                        activo={rem.daysBefore === opc.value}
                        tono="violeta"
                        onPress={() => handleUpdateReminderDays(rem.id, opc.value)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </TarjetaVidrio>

        {/* Botón de Acción Principal */}
        <View style={styles.actionsRow}>
          <BotonBrillante
            title={isEditing ? 'Guardar Cambios' : 'Crear Compromiso'}
            onPress={() => handleSave()}
            loading={saving}
            disabled={saving}
          />
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
  if (!visible) return null;

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
            key={editingCommitment ? ('id' in editingCommitment ? editingCommitment.id : 'edit') : `nuevo_${initialDate || 'hoy'}`}
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
    backgroundColor: 'rgba(6, 9, 11, 0.8)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: '#101518',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.18)',
    paddingTop: 12,
    maxHeight: '90%',
    flexShrink: 1,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(165, 231, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scrollArea: {
    flexShrink: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  timeInput: {
    textAlign: 'center',
  },
  textAreaInput: {
    minHeight: 74,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateSelectorText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 18,
  },
  disabledTimeBox: {
    backgroundColor: 'rgba(9, 13, 15, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.08)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledTimeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  helperNoticeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    paddingHorizontal: 12,
  },
  textInputInside: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderSectionLabel: {
    marginBottom: 0,
  },
  noRemindersBox: {
    backgroundColor: 'rgba(9, 13, 15, 0.52)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.08)',
  },
  noRemindersText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  remindersList: {
    gap: 10,
  },
  reminderCard: {
    backgroundColor: 'rgba(9, 13, 15, 0.58)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.1)',
    gap: 10,
  },
  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderCardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  daysBeforePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionsRow: {
    marginTop: 4,
  },
});
