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
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { setSecurityPin, removeSecurityPin } from '@/core/database';
import { triggerSuccess, triggerError } from '@/shared/utils/haptics';

export interface PinModalProps {
  visible: boolean;
  hasPin: boolean;
  onClose: () => void;
  onPinChanged: (hasPin: boolean) => void;
}

interface PinModalDrawerProps {
  hasPin: boolean;
  onClose: () => void;
  onPinChanged: (hasPin: boolean) => void;
}

const PinModalDrawer: React.FC<PinModalDrawerProps> = ({
  hasPin,
  onClose,
  onPinChanged,
}) => {
  const insets = useSafeAreaInsets();
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const handleSavePin = () => {
    if (newPinInput.length !== 4) {
      triggerError();
      Alert.alert('PIN inválido', 'El PIN debe ser exactamente de 4 dígitos numéricos.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      triggerError();
      Alert.alert('PIN no coincide', 'La confirmación del PIN no coincide con el primero.');
      return;
    }

    try {
      setSecurityPin(newPinInput);
      triggerSuccess();
      onPinChanged(true);
      onClose();
      Alert.alert('PIN Activado', 'Tu Bóveda local ahora está protegida con código PIN.');
    } catch (err) {
      console.error('Error setting PIN:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo guardar el PIN.');
    }
  };

  const handleRemovePin = () => {
    try {
      removeSecurityPin();
      triggerSuccess();
      onPinChanged(false);
      onClose();
      Alert.alert('PIN Desactivado', 'Se ha eliminado la protección por PIN.');
    } catch (err) {
      console.error('Error removing PIN:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo desactivar el PIN.');
    }
  };

  return (
    <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.drawerHandle} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.drawerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
          {hasPin ? 'Cambiar Código PIN' : 'Crear Código PIN'}
        </Text>
        <Text style={[styles.modalSubtitle, TYPOGRAPHY.bodySm]}>
          El PIN protegerá el acceso a tu terminal local.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nuevo PIN (4 dígitos)</Text>
          <TextInput
            style={[styles.textInput, styles.pinInput]}
            value={newPinInput}
            onChangeText={setNewPinInput}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholder="••••"
            placeholderTextColor={COLORS.outline}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Confirmar PIN</Text>
          <TextInput
            style={[styles.textInput, styles.pinInput]}
            value={confirmPinInput}
            onChangeText={setConfirmPinInput}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholder="••••"
            placeholderTextColor={COLORS.outline}
          />
        </View>

        <View style={styles.modalActionsRow}>
          {hasPin && (
            <TouchableOpacity
              style={[styles.modalCancelBtn, styles.deactivateBtn]}
              onPress={handleRemovePin}
            >
              <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps, { color: COLORS.cashflowExpense }]}>
                Desactivar
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={onClose}
          >
            <Text style={[styles.modalCancelText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalSaveBtn}
            onPress={handleSavePin}
          >
            <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>Guardar PIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export const PinModal: React.FC<PinModalProps> = ({
  visible,
  hasPin,
  onClose,
  onPinChanged,
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
          <PinModalDrawer
            hasPin={hasPin}
            onClose={onClose}
            onPinChanged={onPinChanged}
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
  pinInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 22,
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
  deactivateBtn: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
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
