import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { restoreDatabaseFromJson } from '@/core/database';
import { triggerSuccess, triggerError } from '@/shared/utils/haptics';

export interface RestoreModalProps {
  visible: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  visible,
  onClose,
  onRestored,
}) => {
  const [inputText, setInputText] = useState('');

  const handleExecuteRestore = () => {
    if (!inputText.trim()) {
      triggerError();
      Alert.alert('Datos requeridos', 'Pega el texto JSON de tu respaldo.');
      return;
    }

    try {
      const result = restoreDatabaseFromJson(inputText.trim());
      triggerSuccess();
      setInputText('');
      onClose();
      if (onRestored) onRestored();

      Alert.alert(
        'Bóveda Restaurada con Éxito',
        `Se importaron:\n• ${result.accounts} cuentas\n• ${result.categories} categorías\n• ${result.transactions} transacciones\n• ${result.budgets} presupuestos.`
      );
    } catch (err: any) {
      console.error('Error executing restore:', err);
      triggerError();
      Alert.alert('Error al restaurar', err.message || 'Verifica que el texto sea un JSON de Kyrara Gez válido.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalDrawer, { maxHeight: '85%' }]}>
          <View style={styles.drawerHandle} />
          <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
            Restaurar Copia de Seguridad
          </Text>
          <Text style={[styles.modalSubtitle, TYPOGRAPHY.bodySm]}>
            Pega a continuación el contenido de tu archivo .kyrarabez o JSON de respaldo.
          </Text>

          <TextInput
            style={styles.restoreTextInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={8}
            placeholder='Pega aquí el contenido JSON {"version": "1.0.4", "data": ...}'
            placeholderTextColor={COLORS.outline}
          />

          <View style={styles.modalActionsRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
            >
              <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: COLORS.secondaryContainer }]}
              onPress={handleExecuteRestore}
            >
              <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps, { color: '#003543' }]}>
                Restaurar Ahora
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    padding: 22,
    gap: 14,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: COLORS.onSurface,
  },
  modalSubtitle: {
    color: COLORS.onSurfaceVariant,
  },
  restoreTextInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    color: COLORS.onSurface,
    fontSize: 11,
    fontFamily: 'monospace',
    height: 140,
    textAlignVertical: 'top',
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
