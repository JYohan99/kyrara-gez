import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { COLORES as COLORS } from '@/compartido/tema';
import { EncabezadoSuperior } from '@/compartido/componentes/EncabezadoSuperior';
import { useSeguridadBoveda as useVaultSecurity } from '@/datos/hooks';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

import { PestanaAjustes } from './PestanaAjustes';
import { ModalPin } from './ModalPin';
import { ModalRestaurar } from './ModalRestaurar';
import { ModalVisorRespaldo } from './ModalVisorRespaldo';

export function PantallaAjustes() {
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
      {/* Encabezado Superior unificado con flecha de retorno */}
      <EncabezadoSuperior
        seccion="AJUSTES"
        modoVolver={true}
        onPressVolver={handleBack}
      />

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
});
