import React from 'react';
import {
  DimensionValue,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EncabezadoModal, TonoOrbeModal } from './EncabezadoModal';

export interface PropiedadesModalObsidiana {
  visible: boolean;
  onCerrar: () => void;
  titulo?: string;
  subtitulo?: string;
  icono?: keyof typeof MaterialIcons.glyphMap;
  tono?: TonoOrbeModal;
  accionDerecha?: React.ReactNode;
  footer?: React.ReactNode;
  usaModalNativo?: boolean;
  conTeclado?: boolean;
  maxHeight?: DimensionValue;
  sheetStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Contenedor base 3D obsidiana para todos los bottom-sheet modals de la app.
 * Unifica backdrop táctil, KeyboardAvoidingView, safe-area inferior, manija superior,
 * EncabezadoModal y footer opcional.
 */
export const ModalObsidiana: React.FC<PropiedadesModalObsidiana> = ({
  visible,
  onCerrar,
  titulo,
  subtitulo,
  icono,
  tono = 'cian',
  accionDerecha,
  footer,
  usaModalNativo = true,
  conTeclado = true,
  maxHeight = '90%',
  sheetStyle,
  children,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const sheetContent = (
    <View
      style={[
        styles.sheet,
        { maxHeight, paddingBottom: Math.max(insets.bottom, 16) },
        sheetStyle,
      ]}
      onStartShouldSetResponder={() => true}
    >
      <View style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
      </View>

      {titulo ? (
        <EncabezadoModal
          titulo={titulo}
          subtitulo={subtitulo}
          icono={icono ?? 'info-outline'}
          tono={tono}
          accionDerecha={accionDerecha}
          onCerrar={onCerrar}
          style={styles.header}
        />
      ) : null}

      {children}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  const inner = conTeclado ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : usaModalNativo ? 'height' : undefined}
      style={usaModalNativo ? styles.overlay : styles.keyboardAvoid}
    >
      {usaModalNativo && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCerrar}
        />
      )}
      {sheetContent}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onCerrar}
      />
      {sheetContent}
    </View>
  );

  if (!usaModalNativo) {
    return (
      <View style={styles.absoluteOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCerrar}
        />
        {inner}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      {inner}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 11, 0.82)',
    justifyContent: 'flex-end',
  },
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 9, 11, 0.84)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 30,
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#101518',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.18)',
    overflow: 'hidden',
    flexShrink: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(165, 231, 255, 0.25)',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 231, 255, 0.1)',
  },
});
