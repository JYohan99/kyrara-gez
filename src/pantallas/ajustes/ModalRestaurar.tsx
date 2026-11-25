import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  ModalObsidiana,
  TarjetaVidrio,
  OrbeGlossy,
  BotonBrillante,
} from '@/compartido/componentes';
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

export const ModalRestaurar: React.FC<PropiedadesModalRestaurar> = ({
  visible,
  onClose,
  onRestored,
}) => {
  const [inputText, setInputText] = useState('');

  const ejecutarRestauracion = (contenido: string) => {
    try {
      const result = restoreDatabaseFromJson(contenido);
      triggerSuccess();
      setInputText('');
      onClose();
      if (onRestored) onRestored();

      Alert.alert(
        'BÃ³veda Restaurada con Ã‰xito',
        `Se importaron correctamente:\nâ€¢ ${result.accounts} cuentas\nâ€¢ ${result.categories} categorÃ­as\nâ€¢ ${result.transactions} transacciones\nâ€¢ ${result.budgets} presupuestos${result.debts ? `\nâ€¢ ${result.debts} deudas` : ''}.`
      );
    } catch (err: any) {
      triggerError();
      Alert.alert(
        'Error al restaurar',
        err.message || 'Verifica que el respaldo sea un JSON vÃ¡lido de Kyrara Gez.'
      );
    }
  };

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
          `Se cargÃ³ "${asset.name}". Â¿Deseas restaurar la bÃ³veda ahora?`,
          [
            { text: 'Revisar primero', style: 'cancel' },
            {
              text: 'Restaurar Ahora',
              style: 'default',
              onPress: () => ejecutarRestauracion(fileContent),
            },
          ]
        );
      }
    } catch (err) {
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
    ejecutarRestauracion(inputText.trim());
  };

  return (
    <ModalObsidiana
      visible={visible}
      onCerrar={onClose}
      titulo="Restaurar BÃ³veda"
      subtitulo="Selecciona un respaldo o pega el texto JSON"
      icono="restore"
      tono="cian"
      maxHeight="88%"
      footer={<BotonBrillante title="Restaurar BÃ³veda" onPress={handleExecuteRestore} />}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={styles.scrollArea}
        contentContainerStyle={styles.drawerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={handlePickFile} activeOpacity={0.8}>
          <TarjetaVidrio variant="low" style={styles.pickFileBtn}>
            <OrbeGlossy tamano={42} tono="violeta" sombra>
              <MaterialIcons name="folder-open" size={20} color="#FFFFFF" />
            </OrbeGlossy>
            <View style={styles.pickFileTextCol}>
              <Text style={[styles.pickFileTitle, TYPOGRAPHY.bodyMd]}>
                Seleccionar archivo del telÃ©fono
              </Text>
              <Text style={[styles.pickFileSubtitle, TYPOGRAPHY.labelCaps]}>
                BUSCAR ARCHIVO .JSON O .KYRARABEZ
              </Text>
            </View>
          </TarjetaVidrio>
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
      </ScrollView>
    </ModalObsidiana>
  );
};


const styles = StyleSheet.create({
  scrollArea: {
    flexShrink: 1,
    paddingHorizontal: 20,
  },
  drawerScrollContent: {
    gap: 14,
    paddingBottom: 16,
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  pickFileTextCol: {
    flex: 1,
  },
  pickFileTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickFileSubtitle: {
    color: COLORS.secondary,
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
    backgroundColor: 'rgba(165, 231, 255, 0.12)',
  },
  dividerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  restoreTextInput: {
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderRadius: 14,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
  },
});
