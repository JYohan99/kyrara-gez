import React from 'react';
import { Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { COLORES as COLORS } from '@/compartido/tema';
import { ModalObsidiana, BotonBrillante } from '@/compartido/componentes';

export interface PropiedadesModalVisorRespaldo {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export const ModalVisorRespaldo: React.FC<PropiedadesModalVisorRespaldo> = ({
  visible,
  title,
  content,
  onClose,
}) => {
  return (
    <ModalObsidiana
      visible={visible}
      onCerrar={onClose}
      titulo={title}
      subtitulo="Vista previa del respaldo local"
      icono="description"
      tono="cian"
      conTeclado={false}
      maxHeight="80%"
      footer={<BotonBrillante title="Cerrar" onPress={onClose} />}
    >
      <ScrollView style={styles.backupTextScroll}>
        <Text style={styles.backupContentText}>{content}</Text>
      </ScrollView>
    </ModalObsidiana>
  );
};


const styles = StyleSheet.create({
  backupTextScroll: {
    maxHeight: 280,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    padding: 12,
    borderRadius: 14,
  },
  backupContentText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
