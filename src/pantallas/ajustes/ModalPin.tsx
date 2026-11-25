import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { ModalObsidiana, BotonBrillante } from '@/compartido/componentes';
import {
  establecerPinSeguridad as setSecurityPin,
  eliminarPinSeguridad as removeSecurityPin,
} from '@/datos/consultas/seguridad';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
} from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalPin {
  visible: boolean;
  hasPin: boolean;
  onClose: () => void;
  onPinChanged: (hasPin: boolean) => void;
}

const ContenidoModalPin: React.FC<Omit<PropiedadesModalPin, 'visible'>> = ({
  hasPin,
  onClose,
  onPinChanged,
}) => {
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const handleSavePin = () => {
    if (newPinInput.length !== 4) {
      triggerError();
      Alert.alert('PIN invÃ¡lido', 'El PIN debe ser exactamente de 4 dÃ­gitos numÃ©ricos.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      triggerError();
      Alert.alert('PIN no coincide', 'La confirmaciÃ³n del PIN no coincide con el primero.');
      return;
    }

    try {
      setSecurityPin(newPinInput);
      triggerSuccess();
      onPinChanged(true);
      onClose();
      Alert.alert('PIN Activado', 'Tu BÃ³veda local ahora estÃ¡ protegida con cÃ³digo PIN.');
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
      Alert.alert('PIN Desactivado', 'Se ha eliminado la protecciÃ³n por PIN.');
    } catch (err) {
      console.error('Error removing PIN:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo desactivar el PIN.');
    }
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      style={styles.scrollArea}
      contentContainerStyle={styles.drawerScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nuevo PIN (4 dÃ­gitos)</Text>
        <TextInput
          style={[styles.textInput, styles.pinInput]}
          value={newPinInput}
          onChangeText={setNewPinInput}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          placeholder="â€¢â€¢â€¢â€¢"
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
          placeholder="â€¢â€¢â€¢â€¢"
          placeholderTextColor={COLORS.outline}
        />
      </View>

      <View style={styles.modalActionsRow}>
        {hasPin && (
          <TouchableOpacity
            style={[styles.modalCancelBtn, styles.deactivateBtn]}
            onPress={handleRemovePin}
          >
            <Text
              style={[
                styles.modalCancelText,
                TYPOGRAPHY.labelCaps,
                { color: COLORS.cashflowExpense },
              ]}
            >
              Desactivar
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.saveWrap}>
          <BotonBrillante title="Guardar PIN" onPress={handleSavePin} />
        </View>
      </View>
    </ScrollView>
  );
};

export const ModalPin: React.FC<PropiedadesModalPin> = ({
  visible,
  hasPin,
  onClose,
  onPinChanged,
}) => (
  <ModalObsidiana
    visible={visible}
    onCerrar={onClose}
    titulo={hasPin ? 'Cambiar CÃ³digo PIN' : 'Crear CÃ³digo PIN'}
    subtitulo="El PIN protegerÃ¡ el acceso a tu terminal local"
    icono="lock"
    tono="violeta"
    maxHeight="85%"
  >
    <ContenidoModalPin hasPin={hasPin} onClose={onClose} onPinChanged={onPinChanged} />
  </ModalObsidiana>
);


const styles = StyleSheet.create({
  scrollArea: {
    flexShrink: 1,
    paddingHorizontal: 20,
  },
  drawerScrollContent: {
    gap: 14,
    paddingBottom: 18,
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
  pinInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 22,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 13, 15, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    alignItems: 'center',
  },
  deactivateBtn: {
    backgroundColor: 'rgba(255, 138, 158, 0.14)',
    borderColor: 'rgba(255, 138, 158, 0.3)',
  },
  modalCancelText: {
    color: COLORS.onSurface,
  },
  saveWrap: {
    flex: 1,
  },
});
