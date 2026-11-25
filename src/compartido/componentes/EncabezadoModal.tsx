import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OrbeGlossy, TonoOrbeGlossy } from './OrbeGlossy';

export type TonoOrbeModal = Exclude<TonoOrbeGlossy, 'obsidiana'>;

export interface PropiedadesEncabezadoModal {
  titulo: string;
  subtitulo?: string;
  icono: keyof typeof MaterialIcons.glyphMap;
  tono?: TonoOrbeModal;
  onCerrar?: () => void;
  accionDerecha?: React.ReactNode;
  mostrarManija?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Encabezado unificado para los modales de la app con manija superior,
 * orbe de ícono 3D glossy a la izquierda y botón cerrar 3D a la derecha.
 */
export const EncabezadoModal: React.FC<PropiedadesEncabezadoModal> = ({
  titulo,
  subtitulo,
  icono,
  tono = 'cian',
  onCerrar,
  accionDerecha,
  mostrarManija = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {mostrarManija && <View style={styles.handle} />}

      <View style={styles.row}>
        <View style={styles.leftGroup}>
          <OrbeGlossy tamano={42} tono={tono} sombra>
            <MaterialIcons name={icono} size={20} color="#FFFFFF" />
          </OrbeGlossy>

          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {titulo}
            </Text>
            {subtitulo ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitulo}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightGroup}>
          {accionDerecha}
          {onCerrar ? (
            <OrbeGlossy
              tamano={36}
              tono="obsidiana"
              onPress={onCerrar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cerrar modal"
            >
              <MaterialIcons name="close" size={18} color="#DCE6EC" />
            </OrbeGlossy>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(165, 231, 255, 0.12)',
    marginBottom: 12,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(165, 231, 255, 0.28)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#95A3AD',
    fontSize: 11.5,
    marginTop: 2,
  },
});
