import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { EmblemaKyrara as KyraraEmblem } from '@/compartido/componentes/EmblemaKyrara';
import { useSeguridadBoveda as useVaultSecurity } from '@/datos/hooks';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

import { PestanaAjustes } from './PestanaAjustes';
import { ModalPin } from './ModalPin';
import { ModalRestaurar } from './ModalRestaurar';
import { ModalVisorRespaldo } from './ModalVisorRespaldo';

export function PantallaAjustes() {
  const insets = useSafeAreaInsets();
  const { security } = useVaultSecurity();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupTitle, setBackupTitle] = useState('');
  const [backupContent, setBackupContent] = useState('');

  const handleBack = () => {
    triggerSelection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleShowBackupContent = (title: string, content: string) => {
    setBackupTitle(title);
    setBackupContent(content);
    setBackupModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      {/* Top Header con botón volver */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 6, 48) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver atrás"
          >
            <MaterialIcons name="arrow-back" size={22} color={COLORS.onSurface} />
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <KyraraEmblem size={34} />
            <View style={styles.brandTextCol}>
              <Text style={[styles.brandTitle, TYPOGRAPHY.headlineSm]}>Kyrara Gez</Text>
              <Text style={[styles.brandBadge, TYPOGRAPHY.labelCaps]}>AJUSTES</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PestanaAjustes
          onOpenPinModal={() => setPinModalVisible(true)}
          onOpenRestoreModal={() => setRestoreModalVisible(true)}
          onShowBackupContent={handleShowBackupContent}
        />
      </ScrollView>

      {/* Modales de Ajustes */}
      <ModalPin
        visible={pinModalVisible}
        hasPin={security.hasPin}
        onClose={() => setPinModalVisible(false)}
        onPinChanged={() => {}}
      />

      <ModalRestaurar
        visible={restoreModalVisible}
        onClose={() => setRestoreModalVisible(false)}
      />

      <ModalVisorRespaldo
        visible={backupModalVisible}
        title={backupTitle}
        content={backupContent}
        onClose={() => setBackupModalVisible(false)}
      />
    </View>
  );
}

export const SettingsScreen = PantallaAjustes;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextCol: {
    flexDirection: 'column',
  },
  brandTitle: {
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  brandBadge: {
    color: COLORS.primary,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
});
