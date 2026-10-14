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
import { createAccount, updateAccount, updateAccountBalance } from '@/core/database';
import { Account, AccountType } from '@/core/database/types';
import { parseAmountToCents } from '@/shared/utils/currency';
import { triggerSuccess, triggerError } from '@/shared/utils/haptics';

export interface AccountModalProps {
  visible: boolean;
  editingAccount?: Account | null;
  onClose: () => void;
  onSaved?: () => void;
}

interface AccountModalDrawerProps {
  editingAccount?: Account | null;
  onClose: () => void;
  onSaved?: () => void;
}

const AccountModalDrawer: React.FC<AccountModalDrawerProps> = ({
  editingAccount,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(editingAccount);
  const [name, setName] = useState(editingAccount?.name ?? '');
  const [accountType, setAccountType] = useState<AccountType>(editingAccount?.type ?? 'BANK');
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

  return (
    <View style={styles.modalDrawer}>
      <View style={styles.drawerHandle} />
      <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>
        {isEditing ? 'Ajustar Cuenta' : 'Nueva Cuenta'}
      </Text>

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
            {(['BANK', 'CASH', 'PREPAID', 'VAULT'] as AccountType[]).map(t => (
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
    </View>
  );
};

export const AccountModal: React.FC<AccountModalProps> = ({
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
      <View style={styles.modalOverlay}>
        {visible && (
          <AccountModalDrawer
            key={editingAccount ? `edit-${editingAccount.id}` : 'new-account'}
            editingAccount={editingAccount}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
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
