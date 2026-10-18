import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { crearCategoria as createCategory } from '@/datos/consultas/categorias';
import { gatillarExito as triggerSuccess, gatillarError as triggerError, gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalCategoria {
  visible: boolean;
  flowType: 'EXPENSE' | 'INCOME';
  onClose: () => void;
  onSaved?: () => void;
}
export type CategoryModalProps = PropiedadesModalCategoria;

const AVAILABLE_ICONS = [
  'restaurant',
  'directions-car',
  'home',
  'favorite',
  'shopping-bag',
  'school',
  'movie',
  'bolt',
  'fitness-center',
  'pets',
];

const AVAILABLE_COLORS = [
  '#8A4FFF',
  '#00D2FF',
  '#57F5AB',
  '#FF8A9E',
  '#FFB74D',
  '#55D8E9',
  '#D1BCFF',
];

export const ModalCategoria: React.FC<PropiedadesModalCategoria> = ({
  visible,
  flowType,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shopping-bag');
  const [color, setColor] = useState('#8A4FFF');

  const handleSave = () => {
    if (!name.trim()) {
      triggerError();
      Alert.alert('Nombre requerido', 'Ingresa un nombre para la categoría.');
      return;
    }

    try {
      createCategory({
        name: name.trim(),
        flowType,
        icon,
        color,
      });

      triggerSuccess();
      setName('');
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Error creating category:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo crear la categoría.');
    }
  };

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
        <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.drawerHandle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={styles.drawerScrollContent}
          >
            <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
              Nueva Categoría de {flowType === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nombre</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Gimnasio, Mascotas, Cursos"
                placeholderTextColor={COLORS.outline}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Icono sugerido</Text>
              <View style={styles.iconChipsRow}>
                {AVAILABLE_ICONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconChip, icon === ic && styles.iconChipActive]}
                    onPress={() => {
                      triggerSelection();
                      setIcon(ic);
                    }}
                  >
                    <MaterialIcons
                      name={ic as any}
                      size={20}
                      color={icon === ic ? '#FFFFFF' : COLORS.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Color</Text>
              <View style={styles.colorChipsRow}>
                {AVAILABLE_COLORS.map(col => (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorDot,
                      { backgroundColor: col },
                      color === col && styles.colorDotActive,
                    ]}
                    onPress={() => {
                      triggerSelection();
                      setColor(col);
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onClose}
              >
                <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
              >
                <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const CategoryModal = ModalCategoria;

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
  },
  drawerScrollContent: {
    gap: 14,
    paddingBottom: 8,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: COLORS.onSurface,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.onSurface,
    fontSize: 15,
  },
  iconChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  colorChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
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
