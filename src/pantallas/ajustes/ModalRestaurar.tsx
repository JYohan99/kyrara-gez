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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { restaurarBaseDatosDesdeJson as restoreDatabaseFromJson } from '@/datos/consultas/respaldos';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

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

  const handlePickFile = async () => {
    try {
      triggerSelection();
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        setInputText(fileContent);

        Alert.alert(
          'Archivo Seleccionado',
          `Se cargó "${asset.name}". ¿Deseas restaurar la bóveda ahora?`,
          [
            { text: 'Revisar primero', style: 'cancel' },
            {
              text: 'Restaurar Ahora',
              style: 'default',
              onPress: () => {
                try {
                  const result = restoreDatabaseFromJson(fileContent);
                  triggerSuccess();
                  setInputText('');
                  onClose();
                  if (onRestored) onRestored();

                  Alert.alert(
                    'Bóveda Restaurada con Éxito',
                    `Se importaron correctamente:\n• ${result.accounts} cuentas\n• ${result.categories} categorías\n• ${result.transactions} transacciones\n• ${result.budgets} presupuestos${result.debts ? `\n• ${result.debts} deudas` : ''}.`
                  );
                } catch (err: any) {
                  triggerError();
                  Alert.alert(
                    'Error al restaurar',
                    err.message || 'Verifica que el archivo sea un respaldo válido de Kyrara Gez.'
                  );
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('Error al seleccionar archivo:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
    }
  };

  const handleExecuteRestore = () => {
    if (!inputText.trim()) {
      triggerError();
      Alert.alert('Datos requeridos', 'Selecciona un archivo .json o pega el texto de tu respaldo.');
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
        `Se importaron correctamente:\n• ${result.accounts} cuentas\n• ${result.categories} categorías\n• ${result.transactions} transacciones\n• ${result.budgets} presupuestos${result.debts ? `\n• ${result.debts} deudas` : ''}.`
      );
    } catch (err: any) {
      console.error('Error executing restore:', err);
      triggerError();
      Alert.alert(
        'Error al restaurar',
        err.message || 'Verifica que el texto sea un JSON de Kyrara Gez válido.'
      );
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
            keyboardDismissMode="interactive"
            style={styles.scrollArea}
            contentContainerStyle={styles.drawerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
              Restaurar Bóveda Local
            </Text>
            <Text style={[styles.modalSubtitle, TYPOGRAPHY.bodySm]}>
              Puedes seleccionar un archivo de respaldo guardado en tu teléfono o pegar el texto JSON directamente.
            </Text>

            {/* Botón principal para seleccionar archivo del móvil */}
            <TouchableOpacity
              style={styles.pickFileBtn}
              onPress={handlePickFile}
              activeOpacity={0.8}
            >
              <View style={styles.pickFileIconBox}>
                <MaterialIcons name="folder-open" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.pickFileTextCol}>
                <Text style={[styles.pickFileTitle, TYPOGRAPHY.bodyMd]}>
                  Seleccionar archivo del teléfono
                </Text>
                <Text style={[styles.pickFileSubtitle, TYPOGRAPHY.labelCaps]}>
                  BUSCAR ARCHIVO .JSON O .KYRARABEZ
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, TYPOGRAPHY.labelCaps]}>O PEGA EL TEXTO</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.restoreTextInput}
              value={inputText}
              onChangeText={setInputText}
              multiline
              placeholder='{"version": "1.0.4", "data": { ... }}'
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
    maxHeight: '88%',
    flexShrink: 1,
  },
  scrollArea: {
    flexShrink: 1,
  },
  drawerScrollContent: {
    gap: 14,
    paddingBottom: 28,
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
    lineHeight: 18,
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  pickFileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickFileTextCol: {
    flex: 1,
  },
  pickFileTitle: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  pickFileSubtitle: {
    color: COLORS.primary,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderGlass,
  },
  dividerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  restoreTextInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    color: COLORS.onSurface,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
