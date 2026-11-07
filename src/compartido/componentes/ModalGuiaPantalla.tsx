import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '../tema';
import { GUIAS_PANTALLAS, GuiaPantalla } from '../constantes/guiasPantallas';
import { gatillarSeleccion as triggerSelection } from '../utilidades/hapticos';

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
  const insets = useSafeAreaInsets();

  const seccionNormalizada = seccion.toUpperCase();
  const guia: GuiaPantalla =
    GUIAS_PANTALLAS[seccionNormalizada] ||
    GUIAS_PANTALLAS['INICIO'];

  const handleClose = () => {
    triggerSelection();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Manija superior */}
          <View style={styles.drawerHandle} />

          {/* Barra superior con botón X y cápsula */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.circularCloseBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cerrar guía"
            >
              <MaterialIcons name="close" size={20} color={COLORS.onSurface} />
            </TouchableOpacity>

            <View style={styles.topBarCapsule}>
              <MaterialIcons name="help-outline" size={15} color={COLORS.primary} />
              <Text style={[styles.topBarCapsuleTitle, TYPOGRAPHY.labelCaps]}>
                GUÍA DE PANTALLA
              </Text>
            </View>

            <View style={styles.topBarSpacer} />
          </View>

          {/* Cabecera de la guía */}
          <View style={styles.headerInfo}>
            <Text style={[styles.guiaTitulo, TYPOGRAPHY.headlineSm]}>
              {guia.titulo}
            </Text>
            <Text style={[styles.guiaSubtitulo, TYPOGRAPHY.bodySm]}>
              {guia.subtitulo}
            </Text>
          </View>

          {/* Lista de elementos y funciones */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
          >
            {guia.elementos.map((item, idx) => (
              <View key={idx} style={styles.elementoCard}>
                <View
                  style={[
                    styles.iconoBox,
                    { backgroundColor: `${item.colorIcono || COLORS.primary}18` },
                  ]}
                >
                  <MaterialIcons
                    name={item.icono}
                    size={22}
                    color={item.colorIcono || COLORS.primary}
                  />
                </View>

                <View style={styles.elementoInfo}>
                  <Text style={[styles.elementoTitulo, TYPOGRAPHY.headlineSm]}>
                    {item.titulo}
                  </Text>
                  <Text style={[styles.elementoDescripcion, TYPOGRAPHY.bodySm]}>
                    {item.descripcion}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Botón inferior: Entendido */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.entendidoBtn}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={[styles.entendidoBtnText, TYPOGRAPHY.labelCaps]}>
                ¡Entendido!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    maxHeight: '85%',
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  drawerHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  circularCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181C1E',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarCapsuleTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topBarSpacer: {
    width: 38,
  },
  headerInfo: {
    marginBottom: 14,
    gap: 4,
  },
  guiaTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  guiaSubtitulo: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 14,
  },
  elementoCard: {
    flexDirection: 'row',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
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
  bottomBar: {
    marginTop: 10,
  },
  entendidoBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  entendidoBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

