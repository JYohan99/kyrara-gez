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
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { restaurarBaseDatosDesdeJson as restoreDatabaseFromJson } from '@/datos/consultas/respaldos';
import { gatillarExito as triggerSuccess, gatillarError as triggerError } from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalRestaurar {
  visible: boolean;
  onClose: () => void;
  onRestored?: () => void;
}
export type RestoreModalProps = PropiedadesModalRestaurar;

export const ModalRestaurar: React.FC<PropiedadesModalRestaurar> = ({
  visible,
  onClose,
  onRestored,
}) => {
  const insets = useSafeAreaInsets();
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
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.drawerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
              Restaurar Bóveda Local
            </Text>
            <Text style={[styles.modalSubtitle, TYPOGRAPHY.bodySm]}>
              Pega a continuación la copia de seguridad en formato JSON. Esta acción combinará o actualizará los registros existentes.
            </Text>

            <TextInput
              style={styles.restoreTextInput}
              value={inputText}
              onChangeText={setInputText}
              multiline
              placeholder='{"version": 1, "exportedAt": "...", "accounts": [...]}'
              placeholderTextColor={COLORS.outline}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onClose}
              >
                <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleExecuteRestore}
              >
                <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>Restaurar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const RestoreModal = ModalRestaurar;

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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 120,
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
