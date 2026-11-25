import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { EncabezadoModal } from '@/compartido/componentes/EncabezadoModal';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { IconoCategoria } from '@/compartido/componentes/IconoCategoria';
import { guardarPresupuesto as setBudget, eliminarPresupuesto as deleteBudget } from '@/datos/consultas/presupuestos';
import { PresupuestoEnriquecido, Categoria } from '@/datos/tipos';
import {
  convertirMontoACentavos as parseAmountToCents,
  formatearEntradaDinero as formatMoneyInput,
} from '@/compartido/utilidades/moneda';
import { gatillarExito as triggerSuccess, gatillarError as triggerError, gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalPresupuesto {
  visible: boolean;
  period: string;
  editingBudget?: PresupuestoEnriquecido | null;
  categories: Categoria[];
  existingBudgets: PresupuestoEnriquecido[];
  onClose: () => void;
  onSaved?: () => void;
}

interface BudgetModalDrawerProps {
  period: string;
  editingBudget?: PresupuestoEnriquecido | null;
  categories: Categoria[];
  existingBudgets: PresupuestoEnriquecido[];
  onClose: () => void;
  onSaved?: () => void;
}

const BudgetModalDrawer: React.FC<BudgetModalDrawerProps> = ({
  period,
  editingBudget,
  categories,
  existingBudgets,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(editingBudget);
  const limitInputRef = useRef<TextInput>(null);

  // Auto-enfoque al abrir modal para desplegar el teclado inmediatamente
  useEffect(() => {
    const timer = setTimeout(() => {
      limitInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    if (editingBudget) return editingBudget.categoryId;
    const unusedCat = categories.find(c => !existingBudgets.some(b => b.categoryId === c.id));
    return unusedCat ? unusedCat.id : categories[0]?.id || '';
  });

  const [limitInput, setLimitInput] = useState(() => {
    const initialCents = editingBudget ? editingBudget.monthlyLimit : 500000;
    const centavosStr = (initialCents / 100).toFixed(2).replace('.', ',');
    return formatMoneyInput(centavosStr);
  });

  const handleLimitChange = (text: string) => {
    const formatted = formatMoneyInput(text);
    setLimitInput(formatted);
  };

  const adjustLimit = (delta: number) => {
    triggerSelection();
    const currentCents = parseAmountToCents(limitInput);
    const nextCents = Math.max(0, currentCents + delta * 100);
    const centavosStr = (nextCents / 100).toFixed(2).replace('.', ',');
    setLimitInput(formatMoneyInput(centavosStr));
  };

  const handleSave = () => {
    const categoryId = editingBudget ? editingBudget.categoryId : selectedCategoryId;
    if (!categoryId) {
      triggerError();
      Alert.alert('Categoría requerida', 'Por favor selecciona una categoría.');
      return;
    }

    const amountCents = parseAmountToCents(limitInput);
    if (amountCents <= 0) {
      triggerError();
      Alert.alert('Monto inválido', 'El tope de presupuesto debe ser mayor a 0.');
      return;
    }

    try {
      setBudget({
        categoryId,
        monthlyLimit: amountCents,
        period,
        alertThreshold: 0.9,
      });

      triggerSuccess();
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Error saving budget:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo guardar el presupuesto.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar Límite',
      '¿Deseas quitar este tope presupuestario para este mes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              deleteBudget(id);
              triggerSuccess();
              onClose();
              if (onSaved) onSaved();
            } catch (err) {
              console.error('Error deleting budget:', err);
              triggerError();
              Alert.alert('Error', 'No se pudo eliminar el límite presupuestario.');
            }
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.drawerHandle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        contentContainerStyle={styles.drawerScrollContent}
      >

        <EncabezadoModal
          titulo={
            isEditing && editingBudget
              ? `Editar: ${editingBudget.categoryName}`
              : 'Nuevo Presupuesto'
          }
          subtitulo="Ajusta el tope máximo mensual"
          icono="donut-large"
          tono="violeta"
          onCerrar={onClose}
        />

        {/* Category selector if creating new */}
        {!isEditing && (
          <View style={styles.modalCategoryPicker}>
            <Text style={[styles.pickerLabel, TYPOGRAPHY.labelCaps]}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {categories.map(cat => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      triggerSelection();
                      setSelectedCategoryId(cat.id);
                    }}
                    style={[
                      styles.catChip,
                      isSelected && styles.catChipSelected,
                    ]}
                  >
                    <IconoCategoria
                      icon={cat.icon}
                      size={16}
                      color={isSelected ? '#FFFFFF' : COLORS.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        TYPOGRAPHY.labelCaps,
                        isSelected && styles.catChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Numeric input display */}
        <View style={styles.amountInputBox}>
          <Text style={[styles.amountCurrencyPrefix, TYPOGRAPHY.titleBalance]}>$</Text>
          <TextInput
            ref={limitInputRef}
            value={limitInput}
            onChangeText={handleLimitChange}
            keyboardType="decimal-pad"
            style={[styles.amountInput, TYPOGRAPHY.displayHeroMobile]}
            placeholder="0,00"
            placeholderTextColor={COLORS.outline}
            selectTextOnFocus
          />
        </View>

        {/* Quick Increment Steppers */}
        <View style={styles.steppersRow}>
          <TouchableOpacity
            onPress={() => adjustLimit(-1000)}
            style={styles.stepperBtn}
          >
            <Text style={[styles.stepperBtnText, TYPOGRAPHY.labelCaps]}>- $1.000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => adjustLimit(-500)}
            style={styles.stepperBtn}
          >
            <Text style={[styles.stepperBtnText, TYPOGRAPHY.labelCaps]}>- $500</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => adjustLimit(500)}
            style={styles.stepperBtn}
          >
            <Text style={[styles.stepperBtnText, TYPOGRAPHY.labelCaps]}>+ $500</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => adjustLimit(1000)}
            style={styles.stepperBtn}
          >
            <Text style={[styles.stepperBtnText, TYPOGRAPHY.labelCaps]}>+ $1.000</Text>
          </TouchableOpacity>
        </View>

        {/* Delete button if editing */}
        {isEditing && editingBudget && (
          <TouchableOpacity
            onPress={() => handleDelete(editingBudget.id)}
            style={styles.deleteBudgetBtn}
          >
            <MaterialIcons name="delete-outline" size={18} color={COLORS.cashflowExpense} />
            <Text style={[styles.deleteBudgetText, TYPOGRAPHY.labelCaps]}>
              Quitar este presupuesto
            </Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.modalActionButtons}>
          <BotonBrillante
            title="Guardar Límite"
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export const ModalPresupuesto: React.FC<PropiedadesModalPresupuesto> = ({
  visible,
  period,
  editingBudget,
  categories,
  existingBudgets,
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
          <BudgetModalDrawer
            key={editingBudget ? `edit-${editingBudget.id}` : 'new-budget'}
            period={period}
            editingBudget={editingBudget}
            categories={categories}
            existingBudgets={existingBudgets}
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
    backgroundColor: 'rgba(11, 15, 16, 0.8)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: '#101518',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.18)',
    paddingTop: 14,
    paddingHorizontal: 22,
    maxHeight: '85%',
    flexShrink: 1,
  },
  scrollArea: {
    flexShrink: 1,
  },
  drawerScrollContent: {
    gap: 16,
    paddingBottom: 28,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(165, 231, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalCategoryPicker: {
    gap: 8,
  },
  pickerLabel: {
    color: COLORS.onSurfaceVariant,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 13, 15, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    marginRight: 8,
  },
  catChipSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: 'rgba(209, 188, 255, 0.45)',
  },
  catChipText: {
    color: COLORS.onSurfaceVariant,
  },
  catChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    borderRadius: 18,
  },
  amountCurrencyPrefix: {
    color: COLORS.secondary,
    marginRight: 6,
  },
  amountInput: {
    color: '#FFFFFF',
    textAlign: 'center',
    minWidth: 100,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 13, 15, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: COLORS.onSurface,
    fontSize: 10,
  },
  deleteBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteBudgetText: {
    color: COLORS.cashflowExpense,
  },
  modalActionButtons: {
    marginTop: 10,
  },
});

export const BudgetModal = ModalPresupuesto;
