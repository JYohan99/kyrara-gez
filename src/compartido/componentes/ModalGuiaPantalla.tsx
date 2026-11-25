import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '../tema';
import { GUIAS_PANTALLAS, GuiaPantalla } from '../constantes/guiasPantallas';
import { gatillarSeleccion as triggerSelection } from '../utilidades/hapticos';
import { ModalObsidiana } from './ModalObsidiana';
import { TarjetaVidrio } from './TarjetaVidrio';
import { OrbeGlossy } from './OrbeGlossy';
import { BotonBrillante } from './BotonBrillante';

export interface PropiedadesModalGuiaPantalla {
  visible: boolean;
  seccion: string;
  onClose: () => void;
}

export const ModalGuiaPantalla: React.FC<PropiedadesModalGuiaPantalla> = ({
  visible,
  seccion,
  onClose,
}) => {
  const guia: GuiaPantalla =
    GUIAS_PANTALLAS[seccion.toUpperCase()] || GUIAS_PANTALLAS['INICIO'];

  const handleClose = () => {
    triggerSelection();
    onClose();
  };

  return (
    <ModalObsidiana
      visible={visible}
      onCerrar={handleClose}
      titulo={guia.titulo}
      subtitulo={guia.subtitulo}
      icono="help-outline"
      tono="violeta"
      conTeclado={false}
      maxHeight="85%"
      footer={<BotonBrillante title="¡Entendido!" onPress={handleClose} />}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {guia.elementos.map((item, idx) => (
          <TarjetaVidrio key={idx} variant="low" style={styles.elementoCard}>
            <OrbeGlossy tamano={38} tono="obsidiana">
              <MaterialIcons
                name={item.icono}
                size={20}
                color={item.colorIcono || COLORS.secondary}
              />
            </OrbeGlossy>

            <View style={styles.elementoInfo}>
              <Text style={[styles.elementoTitulo, TYPOGRAPHY.headlineSm]}>
                {item.titulo}
              </Text>
              <Text style={[styles.elementoDescripcion, TYPOGRAPHY.bodySm]}>
                {item.descripcion}
              </Text>
            </View>
          </TarjetaVidrio>
        ))}
      </ScrollView>
    </ModalObsidiana>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    flexShrink: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 14,
  },
  elementoCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  elementoInfo: {
    flex: 1,
    gap: 3,
  },
  elementoTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  elementoDescripcion: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
  },
});
