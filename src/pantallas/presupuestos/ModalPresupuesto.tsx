import React, { useState } from 'react';
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
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { guardarPresupuesto as setBudget, eliminarPresupuesto as deleteBudget } from '@/datos/consultas/presupuestos';
import { PresupuestoEnriquecido, PresupuestoEnriquecido as EnrichedBudget, Categoria, Categoria as Category } from '@/datos/tipos';
import { convertirMontoACentavos as parseAmountToCents } from '@/compartido/utilidades/moneda';
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
export type BudgetModalProps = PropiedadesModalPresupuesto;

interface BudgetModalDrawerProps {
  period: string;
  editingBudget?: EnrichedBudget | null;
  categories: Category[];
  existingBudgets: EnrichedBudget[];
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

  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    if (editingBudget) return editingBudget.categoryId;
    const unusedCat = categories.find(c => !existingBudgets.some(b => b.categoryId === c.id));
    return unusedCat ? unusedCat.id : categories[0]?.id || '';
  });

  const [limitInput, setLimitInput] = useState(() => {
    return editingBudget ? (editingBudget.monthlyLimit / 100).toString() : '5000';
  });

  const adjustLimit = (delta: number) => {
    triggerSelection();
    const val = parseInt(limitInput, 10) || 0;
    const next = Math.max(0, val + delta);
    setLimitInput(next.toString());
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

      <View style={styles.drawerHeader}>
        <View>
          <Text style={[styles.drawerTitle, TYPOGRAPHY.headlineSm]}>
            {isEditing && editingBudget
              ? `Editar: ${editingBudget.categoryName}`
              : 'Nuevo Presupuesto'}
          </Text>
          <Text style={[styles.drawerSubtitle, TYPOGRAPHY.bodySm]}>
            Ajusta el tope máximo mensual
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.drawerCloseBtn}
        >
          <MaterialIcons name="close" size={18} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

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
                  <MaterialIcons
                    name={cat.icon as any || 'category'}
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
          value={limitInput}
          onChangeText={setLimitInput}
          keyboardType="numeric"
          style={[styles.amountInput, TYPOGRAPHY.displayHeroMobile]}
          placeholder="0"
          placeholderTextColor={COLORS.outline}
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
        <TouchableOpacity
          onPress={onClose}
          style={styles.modalCancelBtn}
        >
          <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={styles.modalSaveBtn}
        >
          <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>
            Guardar Límite
          </Text>
        </TouchableOpacity>
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
    backgroundColor: COLORS.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
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
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitle: {
    color: COLORS.onSurface,
  },
  drawerSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  drawerCloseBtn: {
    padding: 6,
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
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginRight: 8,
  },
  catChipSelected: {
    backgroundColor: COLORS.primaryContainer,
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
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
  },
  amountCurrencyPrefix: {
    color: COLORS.secondary,
    marginRight: 6,
  },
  amountInput: {
    color: COLORS.onSurface,
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
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
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
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.onSurface,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
  },
});

export const BudgetModal = ModalPresupuesto;
