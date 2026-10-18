import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { EncabezadoSuperior } from '@/compartido/componentes/EncabezadoSuperior';
import { useCuentasBoveda as useVaultAccounts, useSeguridadBoveda as useVaultSecurity } from '@/datos/hooks';
import { Cuenta } from '@/datos/tipos';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

import { PestanaCuentas as AccountsTab } from './PestanaCuentas';
import { ModalCuenta as AccountModal } from './ModalCuenta';
import { PestanaCategorias as CategoriesTab } from './PestanaCategorias';
import { ModalCategoria as CategoryModal } from './ModalCategoria';
import {
  PestanaAjustes as SettingsTab,
} from './PestanaAjustes';
import { ModalPin as PinModal } from './ModalPin';
import { ModalRestaurar as RestoreModal } from './ModalRestaurar';
import { ModalVisorRespaldo as BackupViewerModal } from './ModalVisorRespaldo';

type MainSectionTab = 'CUENTAS' | 'CATEGORIAS' | 'AJUSTES';

export function PantallaCuentas() {
  const [activeTab, setActiveTab] = useState<MainSectionTab>('CUENTAS');

  // Hooks reactivos de la bóveda
  const { accounts } = useVaultAccounts();
  const { security } = useVaultSecurity();

  // Modales de Cuentas
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Cuenta | null>(null);

  // Modales de Categorías
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryFlowType, setCategoryFlowType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Modales de Bóveda / Ajustes
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupTitle, setBackupTitle] = useState('');
  const [backupContent, setBackupContent] = useState('');

  const handleOpenNewAccount = () => {
    setEditingAccount(null);
    setAccountModalVisible(true);
  };

  const handleOpenEditAccount = (acc: Cuenta) => {
    setEditingAccount(acc);
    setAccountModalVisible(true);
  };

  const handleOpenNewCategory = (flowType: 'EXPENSE' | 'INCOME') => {
    setCategoryFlowType(flowType);
    setCategoryModalVisible(true);
  };

  const handleShowBackupContent = (title: string, content: string) => {
    setBackupTitle(title);
    setBackupContent(content);
    setBackupModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <EncabezadoSuperior
        seccion={activeTab === 'CUENTAS' ? 'CUENTAS' : activeTab === 'CATEGORIAS' ? 'CATEGORÍAS' : 'AJUSTES'}
      />

      {/* Segmented Top Switcher (Cuentas, Categorías, Ajustes) */}
      <View style={styles.segmentSwitcherContainer}>
        <View style={styles.segmentTrack}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'CUENTAS' && styles.segmentBtnActive]}
            onPress={() => {
              triggerSelection();
              setActiveTab('CUENTAS');
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={15}
              color={activeTab === 'CUENTAS' ? COLORS.secondary : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.segmentBtnText,
                TYPOGRAPHY.labelCaps,
                activeTab === 'CUENTAS' && styles.segmentBtnTextActive,
              ]}
            >
              Cuentas ({accounts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'CATEGORIAS' && styles.segmentBtnActive]}
            onPress={() => {
              triggerSelection();
              setActiveTab('CATEGORIAS');
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="category"
              size={15}
              color={activeTab === 'CATEGORIAS' ? COLORS.primary : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.segmentBtnText,
                TYPOGRAPHY.labelCaps,
                activeTab === 'CATEGORIAS' && styles.segmentBtnTextActive,
              ]}
            >
              Categorías
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'AJUSTES' && styles.segmentBtnActive]}
            onPress={() => {
              triggerSelection();
              setActiveTab('AJUSTES');
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="tune"
              size={15}
              color={activeTab === 'AJUSTES' ? COLORS.tertiary : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.segmentBtnText,
                TYPOGRAPHY.labelCaps,
                activeTab === 'AJUSTES' && styles.segmentBtnTextActive,
              ]}
            >
              Ajustes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'CUENTAS' && (
          <AccountsTab
            onNewAccount={handleOpenNewAccount}
            onEditAccount={handleOpenEditAccount}
          />
        )}

        {activeTab === 'CATEGORIAS' && (
          <CategoriesTab
            onNewCategory={handleOpenNewCategory}
          />
        )}

        {activeTab === 'AJUSTES' && (
          <SettingsTab
            onOpenPinModal={() => setPinModalVisible(true)}
            onOpenRestoreModal={() => setRestoreModalVisible(true)}
            onShowBackupContent={handleShowBackupContent}
          />
        )}
      </ScrollView>

      {/* Modales */}
      <AccountModal
        visible={accountModalVisible}
        editingAccount={editingAccount}
        onClose={() => setAccountModalVisible(false)}
      />

      <CategoryModal
        visible={categoryModalVisible}
        flowType={categoryFlowType}
        onClose={() => setCategoryModalVisible(false)}
      />

      <PinModal
        visible={pinModalVisible}
        hasPin={security.hasPin}
        onClose={() => setPinModalVisible(false)}
        onPinChanged={() => {}}
      />

      <RestoreModal
        visible={restoreModalVisible}
        onClose={() => setRestoreModalVisible(false)}
      />

      <BackupViewerModal
        visible={backupModalVisible}
        title={backupTitle}
        content={backupContent}
        onClose={() => setBackupModalVisible(false)}
      />
    </View>
  );
}

export const AccountsVaultScreen = PantallaCuentas;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  segmentSwitcherContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtnText: {
    color: COLORS.onSurfaceVariant,
  },
  segmentBtnTextActive: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
});
