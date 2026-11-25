import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS } from '../tema';
import { gatillarSeleccion } from '../utilidades/hapticos';

export type TonoChipFiltro = 'cian' | 'violeta' | 'ingreso' | 'gasto' | 'neutral';

export interface PropiedadesChipFiltro {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  tono?: TonoChipFiltro;
  icono?: keyof typeof MaterialIcons.glyphMap;
  colorPunto?: string;
  mayusculas?: boolean;
  style?: StyleProp<ViewStyle>;
}

const GRADIENTES_ACTIVOS: Record<TonoChipFiltro, [string, string, string]> = {
  cian: ['#5CE0FF', '#00B8E6', '#00566A'],
  violeta: ['#B894FF', COLORS.primarioContenedor, COLORS.enPrimario],
  ingreso: ['#7BFAC0', '#24BF7A', '#0D5E3C'],
  gasto: ['#FFA3B4', '#E6526E', '#7D172B'],
  neutral: ['#6D7C85', '#424E55', '#1F262B'],
};

const GRADIENTE_INACTIVO: [string, string, string] = ['#1F292E', '#12181B', '#0B1012'];

const BRILLO_ACTIVO: [string, string] = [
  'rgba(255, 255, 255, 0.48)',
  'rgba(255, 255, 255, 0.04)',
];

const BRILLO_INACTIVO: [string, string] = [
  'rgba(255, 255, 255, 0.14)',
  'rgba(255, 255, 255, 0)',
];

/**
 * Chip de filtro reutilizable estilo píldora glossy 3D con degradado oscuro
 * en estado inactivo y esfera/cápsula luminosa con reflejo especular cuando está activo.
 */
export const ChipFiltro: React.FC<PropiedadesChipFiltro> = ({
  etiqueta,
  activo,
  onPress,
  tono = 'cian',
  icono,
  colorPunto,
  mayusculas = false,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        gatillarSeleccion();
        onPress();
      }}
      activeOpacity={0.8}
      style={[styles.touchWrap, style]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={etiqueta}
    >
      <LinearGradient
        colors={activo ? GRADIENTES_ACTIVOS[tono] : GRADIENTE_INACTIVO}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.pill,
          activo ? styles.pillActive : styles.pillInactive,
        ]}
      >
        <LinearGradient
          colors={activo ? BRILLO_ACTIVO : BRILLO_INACTIVO}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={styles.pillGloss}
        />

        {colorPunto ? (
          <View
            style={[
              styles.dot,
              { backgroundColor: activo ? '#FFFFFF' : colorPunto },
            ]}
          />
        ) : null}

        {icono ? (
          <MaterialIcons
            name={icono}
            size={14}
            color={activo ? '#FFFFFF' : (colorPunto ?? '#95A3AD')}
          />
        ) : null}

        <Text
          style={[
            styles.label,
            activo ? styles.labelActive : styles.labelInactive,
            mayusculas && styles.labelUppercase,
          ]}
          numberOfLines={1}
        >
          {etiqueta}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchWrap: {
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  pillActive: {
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  pillInactive: {
    borderColor: 'rgba(165, 231, 255, 0.2)',
  },
  pillGloss: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: '46%',
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  labelInactive: {
    color: '#B9C4CC',
    fontWeight: '600',
  },
  labelUppercase: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
