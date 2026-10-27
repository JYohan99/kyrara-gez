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
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  formatearEntradaDinero,
  convertirMontoACentavos,
} from '@/compartido/utilidades/moneda';
import { ModalSelectorFecha } from '@/compartido/componentes/ModalSelectorFecha';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { Deuda, TipoDeuda } from '@/datos/tipos';
import { crearDeuda, actualizarDeuda } from '@/datos/consultas/deudas';

export interface PropiedadesModalDeuda {
  visible: boolean;
  onClose: () => void;
  deudaParaEditar?: Deuda | null;
  tipoInicial?: TipoDeuda;
}

const OPCIONES_AVISO = [
  { label: 'El mismo día', dias: 0 },
  { label: '1 día antes', dias: 1 },
  { label: '3 días antes', dias: 3 },
  { label: '1 semana antes', dias: 7 },
];

function fechaAISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parsearISOAFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface PropiedadesContenidoModalDeuda {
  deudaParaEditar?: Deuda | null;
  tipoInicial?: TipoDeuda;
  onClose: () => void;
}

const ContenidoModalDeuda: React.FC<PropiedadesContenidoModalDeuda> = ({
  deudaParaEditar,
  tipoInicial = 'RECEIVABLE',
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const [tipo, setTipo] = useState<TipoDeuda>(() => deudaParaEditar?.type || tipoInicial);
  const [persona, setPersona] = useState(() => deudaParaEditar?.person || '');
  const [concepto, setConcepto] = useState(() => deudaParaEditar?.concept || '');
  const [montoTexto, setMontoTexto] = useState(() => {
    if (!deudaParaEditar) return '';
    const centavosStr = (deudaParaEditar.totalAmount / 100).toFixed(2).replace('.', ',');
    return formatearEntradaDinero(centavosStr);
  });
  const [fechaEmision, setFechaEmision] = useState<Date>(() => {
    if (deudaParaEditar?.issueDate) return parsearISOAFecha(deudaParaEditar.issueDate);
    return new Date();
  });
  const [tieneVencimiento, setTieneVencimiento] = useState(() => Boolean(deudaParaEditar?.dueDate));
  const [fechaVencimiento, setFechaVencimiento] = useState<Date>(() => {
    if (deudaParaEditar?.dueDate) return parsearISOAFecha(deudaParaEditar.dueDate);
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d;
  });
  const [tieneAviso, setTieneAviso] = useState(() => deudaParaEditar?.reminderDaysBefore !== undefined);
  const [diasAviso, setDiasAviso] = useState<number>(() => deudaParaEditar?.reminderDaysBefore ?? 1);
  const [notas, setNotas] = useState(() => deudaParaEditar?.notes || '');

  // Estados de selectores de fecha
  const [mostrarSelectorEmision, setMostrarSelectorEmision] = useState(false);
  const [mostrarSelectorVencimiento, setMostrarSelectorVencimiento] = useState(false);

  const handleMontoChange = (val: string) => {
    const formatted = formatearEntradaDinero(val);
    setMontoTexto(formatted);
  };

  const handleGuardar = () => {
    triggerSelection();
    if (!persona.trim()) {
      triggerError();
      Alert.alert('Dato requerido', 'Por favor ingresa el nombre de la persona o entidad.');
      return;
    }
    if (!concepto.trim()) {
      triggerError();
      Alert.alert('Dato requerido', 'Por favor ingresa el concepto o motivo de la deuda.');
      return;
    }

    const centavos = convertirMontoACentavos(montoTexto);
    if (centavos <= 0) {
      triggerError();
      Alert.alert('Importe inválido', 'El importe debe ser mayor a cero.');
      return;
    }

    try {
      const issueDateStr = fechaAISO(fechaEmision);
      const dueDateStr = tieneVencimiento ? fechaAISO(fechaVencimiento) : undefined;
      const reminderDays = tieneVencimiento && tieneAviso ? diasAviso : undefined;

      if (deudaParaEditar) {
        actualizarDeuda(deudaParaEditar.id, {
          type: tipo,
          person: persona.trim(),
          concept: concepto.trim(),
          totalAmount: centavos,
          issueDate: issueDateStr,
          dueDate: dueDateStr || null,
          notes: notas.trim() || null,
          reminderDaysBefore: reminderDays !== undefined ? reminderDays : null,
          reminderTime: '09:00',
        });
      } else {
        crearDeuda({
          type: tipo,
          person: persona.trim(),
          concept: concepto.trim(),
          totalAmount: centavos,
          issueDate: issueDateStr,
          dueDate: dueDateStr,
          notes: notas.trim() || undefined,
          reminderDaysBefore: reminderDays,
          reminderTime: '09:00',
        });
      }

      triggerSuccess();
      onClose();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error', err.message || 'No se pudo guardar la deuda.');
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
            <Text style={[styles.sheetTitle, TYPOGRAPHY.headlineSm]}>
              {deudaParaEditar ? 'Editar Deuda' : 'Nueva Deuda'}
            </Text>
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
          {/* Segmented Type Selector */}
          <View style={styles.typeSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.typeTab,
                tipo === 'RECEIVABLE' && styles.typeTabActiveReceivable,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                triggerSelection();
                setTipo('RECEIVABLE');
              }}
            >
              <MaterialIcons
                name="call-received"
                size={18}
                color={tipo === 'RECEIVABLE' ? '#0B0F10' : COLORS.cashflowIncome}
              />
              <Text
                style={[
                  styles.typeTabText,
                  TYPOGRAPHY.labelCaps,
                  tipo === 'RECEIVABLE' && styles.typeTabTextActive,
                ]}
              >
                Me deben
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeTab,
                tipo === 'PAYABLE' && styles.typeTabActivePayable,
              ]}
              activeOpacity={0.8}
              onPress={() => {
                triggerSelection();
                setTipo('PAYABLE');
              }}
            >
              <MaterialIcons
                name="call-made"
                size={18}
                color={tipo === 'PAYABLE' ? '#FFFFFF' : COLORS.cashflowExpense}
              />
              <Text
                style={[
                  styles.typeTabText,
                  TYPOGRAPHY.labelCaps,
                  tipo === 'PAYABLE' && styles.typeTabTextActive,
                ]}
              >
                Debo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Persona */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>
              {tipo === 'RECEIVABLE' ? 'Persona que te debe' : 'Persona o entidad acreedora'}
            </Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="person-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, TYPOGRAPHY.bodyMd]}
                placeholder={tipo === 'RECEIVABLE' ? 'Ej: Juan Pérez' : 'Ej: Banco, Alquiler, Juan'}
                placeholderTextColor={COLORS.onSurfaceVariant}
                value={persona}
                onChangeText={setPersona}
              />
            </View>
          </View>

          {/* Concepto */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>Concepto / Motivo</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="description" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, TYPOGRAPHY.bodyMd]}
                placeholder="Ej: Préstamo para repuesto, Cena compartida..."
                placeholderTextColor={COLORS.onSurfaceVariant}
                value={concepto}
                onChangeText={setConcepto}
              />
            </View>
          </View>

          {/* Importe */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>Importe Total ($)</Text>
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

          {/* Fecha de Emisión */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>Fecha de Registro / Préstamo</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              activeOpacity={0.7}
              onPress={() => {
                triggerSelection();
                setMostrarSelectorEmision(true);
              }}
            >
              <MaterialIcons name="event" size={20} color={COLORS.primary} />
              <Text style={[styles.datePickerText, TYPOGRAPHY.bodyMd]}>
                {fechaAISO(fechaEmision)}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Vencimiento Opcional */}
          <View style={styles.fieldGroup}>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, TYPOGRAPHY.bodyMd]}>Fecha límite / Vencimiento</Text>
                <Text style={[styles.switchSubLabel, TYPOGRAPHY.bodySm]}>
                  Define cuándo debe quedar saldada
                </Text>
              </View>
              <Switch
                value={tieneVencimiento}
                onValueChange={v => {
                  triggerSelection();
                  setTieneVencimiento(v);
                }}
                trackColor={{ false: '#26292b', true: COLORS.primaryContainer }}
                thumbColor={tieneVencimiento ? '#FFFFFF' : '#8A8D8E'}
              />
            </View>

            {tieneVencimiento && (
              <TouchableOpacity
                style={[styles.datePickerBtn, styles.dueDateActiveBox]}
                activeOpacity={0.7}
                onPress={() => {
                  triggerSelection();
                  setMostrarSelectorVencimiento(true);
                }}
              >
                <MaterialIcons name="alarm" size={20} color={COLORS.primaryFixedDim} />
                <Text style={[styles.datePickerText, TYPOGRAPHY.bodyMd]}>
                  Vence el {fechaAISO(fechaVencimiento)}
                </Text>
                <MaterialIcons name="edit-calendar" size={18} color={COLORS.primaryFixedDim} />
              </TouchableOpacity>
            )}
          </View>

          {/* Recordatorio previo (solo si tiene vencimiento) */}
          {tieneVencimiento && (
            <View style={styles.fieldGroup}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.switchLabel, TYPOGRAPHY.bodyMd]}>Aviso de recordatorio</Text>
                  <Text style={[styles.switchSubLabel, TYPOGRAPHY.bodySm]}>
                    Notificación local antes de vencer
                  </Text>
                </View>
                <Switch
                  value={tieneAviso}
                  onValueChange={v => {
                    triggerSelection();
                    setTieneAviso(v);
                  }}
                  trackColor={{ false: '#26292b', true: COLORS.primaryContainer }}
                  thumbColor={tieneAviso ? '#FFFFFF' : '#8A8D8E'}
                />
              </View>

              {tieneAviso && (
                <View style={styles.reminderChipsRow}>
                  {OPCIONES_AVISO.map(opc => (
                    <TouchableOpacity
                      key={opc.dias}
                      style={[
                        styles.reminderChip,
                        diasAviso === opc.dias && styles.reminderChipActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerSelection();
                        setDiasAviso(opc.dias);
                      }}
                    >
                      <Text
                        style={[
                          styles.reminderChipText,
                          TYPOGRAPHY.labelCaps,
                          diasAviso === opc.dias && styles.reminderChipTextActive,
                        ]}
                      >
                        {opc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Notas opcionales */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, TYPOGRAPHY.labelCaps]}>Notas u Observaciones (Opcional)</Text>
            <View style={[styles.inputBox, styles.inputBoxMultiline]}>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline, TYPOGRAPHY.bodySm]}
                placeholder="Detalles sobre acuerdos, cuenta bancaria acordada o plazos..."
                placeholderTextColor={COLORS.onSurfaceVariant}
                multiline
                numberOfLines={3}
                value={notas}
                onChangeText={setNotas}
              />
            </View>
          </View>

          {/* Botón Guardar */}
          <View style={styles.submitRow}>
            <BotonBrillante
              title={deudaParaEditar ? 'Guardar Cambios' : 'Registrar Deuda'}
              icon={<MaterialIcons name="check" size={20} color="#FFFFFF" />}
              onPress={handleGuardar}
            />
          </View>
        </ScrollView>
      </View>

      {/* Selector de fecha de emisión */}
      <ModalSelectorFecha
        visible={mostrarSelectorEmision}
        selectedDate={fechaEmision}
        onSelectDate={d => {
          setFechaEmision(d);
          setMostrarSelectorEmision(false);
        }}
        onClose={() => setMostrarSelectorEmision(false)}
      />

      {/* Selector de fecha de vencimiento */}
      <ModalSelectorFecha
        visible={mostrarSelectorVencimiento}
        selectedDate={fechaVencimiento}
        onSelectDate={d => {
          setFechaVencimiento(d);
          setMostrarSelectorVencimiento(false);
        }}
        onClose={() => setMostrarSelectorVencimiento(false)}
      />
    </KeyboardAvoidingView>
  );
};

export const ModalDeuda: React.FC<PropiedadesModalDeuda> = ({
  visible,
  onClose,
  deudaParaEditar,
  tipoInicial = 'RECEIVABLE',
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ContenidoModalDeuda
        key={deudaParaEditar ? deudaParaEditar.id : `nueva_${tipoInicial}`}
        deudaParaEditar={deudaParaEditar}
        tipoInicial={tipoInicial}
        onClose={onClose}
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  indicatorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetTitle: {
    color: COLORS.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    marginBottom: 18,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  typeTabActiveReceivable: {
    backgroundColor: COLORS.cashflowIncome,
  },
  typeTabActivePayable: {
    backgroundColor: COLORS.cashflowExpense,
  },
  typeTabText: {
    color: COLORS.onSurfaceVariant,
  },
  typeTabTextActive: {
    color: '#0B0F10',
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: COLORS.primaryFixedDim,
    marginBottom: 6,
    letterSpacing: 0.8,
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
  inputBoxMultiline: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: 10,
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
  textInputMultiline: {
    textAlignVertical: 'top',
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
  dueDateActiveBox: {
    marginTop: 8,
    borderColor: 'rgba(209, 188, 255, 0.3)',
    backgroundColor: 'rgba(138, 79, 255, 0.08)',
  },
  datePickerText: {
    color: COLORS.onSurface,
    flex: 1,
    marginLeft: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: COLORS.onSurface,
  },
  switchSubLabel: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  reminderChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reminderChipActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.3)',
    borderColor: COLORS.primary,
  },
  reminderChipText: {
    color: COLORS.onSurfaceVariant,
  },
  reminderChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  submitRow: {
    marginTop: 10,
  },
});
