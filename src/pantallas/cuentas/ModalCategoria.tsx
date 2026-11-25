import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { crearCategoria as createCategory } from '@/datos/consultas/categorias';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { ModalObsidiana, BotonBrillante } from '@/compartido/componentes';

export interface PropiedadesModalCategoria {
  visible: boolean;
  flowType: 'EXPENSE' | 'INCOME';
  onClose: () => void;
  onSaved?: () => void;
}

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
  const nameInputRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shopping-bag');
  const [color, setColor] = useState('#8A4FFF');

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) {
      triggerError();
      Alert.alert('Nombre requerido', 'Ingresa un nombre para la categorÃ­a.');
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
      Alert.alert('Error', 'No se pudo crear la categorÃ­a.');
    }
  };

  return (
    <ModalObsidiana
      visible={visible}
      onCerrar={onClose}
      titulo={`Nueva CategorÃ­a de ${flowType === 'EXPENSE' ? 'Gasto' : 'Ingreso'}`}
      subtitulo="Personaliza nombre, icono y color"
      icono="category"
      tono={flowType === 'EXPENSE' ? 'gasto' : 'ingreso'}
      maxHeight="85%"
      footer={<BotonBrillante title="Guardar" onPress={handleSave} />}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        contentContainerStyle={styles.drawerScrollContent}
      >
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nombre</Text>
          <TextInput
            ref={nameInputRef}
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
      </ScrollView>
    </ModalObsidiana>
  );
};

export const CategoryModal = ModalCategoria;

const styles = StyleSheet.create({
  scrollArea: {
    flexShrink: 1,
    paddingHorizontal: 20,
  },
  drawerScrollContent: {
    gap: 14,
    paddingBottom: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
  },
  textInput: {
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  iconChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 13, 15, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: 'rgba(209, 188, 255, 0.5)',
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
});
