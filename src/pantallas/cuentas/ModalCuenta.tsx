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
import {
  crearCuenta as createAccount,
  actualizarCuenta as updateAccount,
  actualizarSaldoCuenta as updateAccountBalance,
  eliminarCuenta as deleteAccount,
} from '@/datos/consultas/cuentas';
import { Cuenta, TipoCuenta } from '@/datos/tipos';
import { convertirMontoACentavos as parseAmountToCents } from '@/compartido/utilidades/moneda';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalCuenta {
  visible: boolean;
  editingAccount?: Cuenta | null;
  onClose: () => void;
  onSaved?: () => void;
}
export type AccountModalProps = PropiedadesModalCuenta;

interface PropiedadesContenidoModalCuenta {
  editingAccount?: Cuenta | null;
  onClose: () => void;
  onSaved?: () => void;
}

const ContenidoModalCuenta: React.FC<PropiedadesContenidoModalCuenta> = ({
  editingAccount,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(editingAccount);
  const [name, setName] = useState(editingAccount?.name ?? '');
  const [accountType, setAccountType] = useState<TipoCuenta>(editingAccount?.type ?? 'BANK');
  const [balanceStr, setBalanceStr] = useState(
    editingAccount ? (editingAccount.currentBalance / 100).toString() : ''
  );

  const handleSave = () => {
    if (!name.trim()) {
      triggerError();
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para la cuenta.');
      return;
    }

    try {
      const cents = parseAmountToCents(balanceStr);

      if (isEditing && editingAccount) {
        updateAccountBalance(editingAccount.id, cents);
        if (name.trim() !== editingAccount.name) {
          updateAccount(editingAccount.id, { name: name.trim() });
        }
      } else {
        createAccount({
          name: name.trim(),
          type: accountType,
          initialBalance: cents,
          currency: 'UYU',
        });
      }

      triggerSuccess();
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Error saving account:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo guardar la cuenta en la base de datos.');
    }
  };

  const handleDelete = () => {
    if (!editingAccount) return;

    triggerSelection();
    Alert.alert(
      'Eliminar Cuenta',
      `¿Estás seguro de que deseas eliminar "${editingAccount.name}"?\n\nEsta acción eliminará la cuenta y sus movimientos asociados de forma permanente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Cuenta',
          style: 'destructive',
          onPress: () => {
            try {
              deleteAccount(editingAccount.id);
              triggerSuccess();
              onClose();
              if (onSaved) onSaved();
            } catch (err: any) {
              console.error('Error al eliminar cuenta:', err);
              triggerError();
              Alert.alert('No se pudo eliminar', err.message || 'Error al eliminar la cuenta.');
            }
          },
        },
      ]
    );
  };

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
        <View style={styles.modalHeaderRow}>
          <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
            {isEditing ? 'Ajustar Cuenta' : 'Nueva Cuenta'}
          </Text>
          {isEditing && (
            <TouchableOpacity
              style={styles.deleteHeaderBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
              accessibilityLabel="Eliminar cuenta"
            >
              <MaterialIcons name="delete-outline" size={20} color={COLORS.cashflowExpense} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nombre de la cuenta</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Banco Santander, Efectivo, Prex"
            placeholderTextColor={COLORS.outline}
          />
        </View>

        {!isEditing && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Tipo de cuenta</Text>
            <View style={styles.typeSelectorRow}>
              {(['BANK', 'CASH', 'PREPAID', 'VAULT'] as TipoCuenta[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeSelectBtn, accountType === t && styles.typeSelectBtnActive]}
                  onPress={() => setAccountType(t)}
                >
                  <Text
                    style={[
                      styles.typeSelectBtnText,
                      TYPOGRAPHY.labelCaps,
                      accountType === t && styles.typeSelectBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>
            {isEditing ? 'Saldo Actual ($)' : 'Saldo Inicial ($)'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={balanceStr}
            onChangeText={setBalanceStr}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.outline}
          />
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
            <Text style={[styles.modalSaveText, TYPOGRAPHY.labelCaps]}>
              {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export const ModalCuenta: React.FC<PropiedadesModalCuenta> = ({
  visible,
  editingAccount,
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
          <ContenidoModalCuenta
            key={editingAccount ? `edit-${editingAccount.id}` : 'new-account'}
            editingAccount={editingAccount}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const AccountModal = ModalCuenta;

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
    gap: 14,
    paddingBottom: 24,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 158, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
  },
  typeSelectBtnActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  typeSelectBtnText: {
    color: COLORS.onSurfaceVariant,
  },
  typeSelectBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalActionsRow: {
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
