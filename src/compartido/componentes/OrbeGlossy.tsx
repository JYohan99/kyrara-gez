import React from 'react';
import {
  Insets,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS } from '../tema';
import { gatillarSeleccion } from '../utilidades/hapticos';

export type TonoOrbeGlossy = 'cian' | 'violeta' | 'ingreso' | 'gasto' | 'obsidiana';

export const GRADIENTES_ORBE_GLOSSY: Record<TonoOrbeGlossy, [string, string, string]> = {
  cian: ['#6CE5FF', COLORS.secundarioContenedor, COLORS.enSecundarioContenedor],
  violeta: ['#B894FF', COLORS.primarioContenedor, COLORS.enPrimario],
  ingreso: ['#7BFAC0', '#24BF7A', '#0D5E3C'],
  gasto: ['#FFA3B4', '#E6526E', '#7D172B'],
  obsidiana: ['#2B3E47', '#132026', '#0A1114'],
};

const BRILLO_INTENSIVO: [string, string] = [
  'rgba(255, 255, 255, 0.6)',
  'rgba(255, 255, 255, 0.05)',
];

const BRILLO_SUTIL: [string, string] = [
  'rgba(255, 255, 255, 0.34)',
  'rgba(255, 255, 255, 0.03)',
];

export interface PropiedadesOrbeGlossy {
  children: React.ReactNode;
  tamano?: number;
  tono?: TonoOrbeGlossy;
  coloresPersonalizados?: [string, string, string];
  onPress?: () => void;
  accessibilityLabel?: string;
  hitSlop?: Insets;
  sombra?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Orbe circular 3D glossy con bisel metálico oscuro, esfera degradada y reflejo
 * especular superior. Usado en encabezados, buscadores y tarjetas de listas.
 */
export const OrbeGlossy: React.FC<PropiedadesOrbeGlossy> = ({
  children,
  tamano = 40,
  tono = 'cian',
  coloresPersonalizados,
  onPress,
  accessibilityLabel,
  hitSlop,
  sombra = false,
  style,
}) => {
  const radio = tamano / 2;
  const colores = coloresPersonalizados ?? GRADIENTES_ORBE_GLOSSY[tono];
  const esOscuro = tono === 'obsidiana' || Boolean(coloresPersonalizados);

  const contenido = (
    <LinearGradient
      colors={colores}
      locations={[0, 0.54, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.sphere, { borderRadius: radio - 2 }]}
    >
      <LinearGradient
        colors={esOscuro ? BRILLO_SUTIL : BRILLO_INTENSIVO}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={styles.gloss}
      />
      {children}
    </LinearGradient>
  );

  const bezelStyle = [
    styles.bezel,
    {
      width: tamano,
      height: tamano,
      borderRadius: radio,
      borderColor: esOscuro ? 'rgba(165, 231, 255, 0.24)' : 'rgba(255, 255, 255, 0.22)',
    },
    sombra && styles.shadow,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={bezelStyle}
        onPress={() => {
          gatillarSeleccion();
          onPress();
        }}
        activeOpacity={0.78}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {contenido}
      </TouchableOpacity>
    );
  }

  return <View style={bezelStyle}>{contenido}</View>;
};

const styles = StyleSheet.create({
  bezel: {
    padding: 2,
    backgroundColor: 'rgba(5, 8, 10, 0.86)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  sphere: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 1.5,
    left: 4,
    right: 4,
    height: '46%',
    borderRadius: 999,
  },
});
