import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS } from '../tema';

export type TonoProgreso3D = 'cian' | 'violeta' | 'ingreso' | 'gasto' | 'alerta';

export interface PropiedadesBarraProgreso3D {
  porcentaje: number;
  tono?: TonoProgreso3D;
  altura?: number;
  style?: StyleProp<ViewStyle>;
}

const GRADIENTES_PROGRESO: Record<TonoProgreso3D, [string, string, string]> = {
  cian: ['#6CE5FF', COLORS.secundarioContenedor, '#006B85'],
  violeta: ['#D1BCFF', COLORS.primarioContenedor, '#4E12B8'],
  ingreso: ['#84FCC6', '#24BF7A', '#0D6B43'],
  gasto: ['#FFA8B8', '#E6526E', '#8A1A30'],
  alerta: ['#FFE082', '#FFB74D', '#B26A00'],
};

/**
 * Barra de progreso estilo tubo de cristal 3D con carril obsidiana hundido,
 * relleno degradado luminoso y línea especular de brillo superior.
 */
export const BarraProgreso3D: React.FC<PropiedadesBarraProgreso3D> = ({
  porcentaje,
  tono = 'cian',
  altura = 8,
  style,
}) => {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(porcentaje) ? porcentaje : 0));

  return (
    <View
      style={[
        styles.track,
        { height: altura },
        style,
      ]}
    >
      {clamped > 0 && (
        <LinearGradient
          colors={GRADIENTES_PROGRESO[tono]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${clamped}%` }]}
        >
          <View
            pointerEvents="none"
            style={[
              styles.glossLine,
              { height: Math.max(1.5, altura * 0.28) },
            ]}
          />
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(7, 11, 13, 0.88)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.16)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  glossLine: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
