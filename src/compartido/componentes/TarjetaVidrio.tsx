import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PropiedadesTarjetaVidrio {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'high' | 'low' | 'lowest';
  bordered?: boolean;
}

const GRADIENTES_VARIANTE: Record<
  NonNullable<PropiedadesTarjetaVidrio['variant']>,
  [string, string, string, string]
> = {
  high: ['#263339', '#1A2327', '#12191C', '#192226'],
  surface: ['#1F2A2F', '#141B1E', '#0D1214', '#131B1E'],
  low: ['#192226', '#101619', '#0A0E10', '#101619'],
  lowest: ['#131A1D', '#0C1113', '#080B0C', '#0C1113'],
};

const GRADIENTE_UBICACIONES: [number, number, number, number] = [0, 0.45, 0.62, 1];

const COLORES_BRILLO_SUPERIOR: [string, string, string] = [
  'rgba(255, 255, 255, 0.14)',
  'rgba(165, 231, 255, 0.04)',
  'rgba(255, 255, 255, 0)',
];

/**
 * Panel contenedor reutilizable con estilo obsidiana glossy 3D, borde cristal
 * y reflejo especular superior sutil, en sintonía con la barra superior y buscadores.
 */
export const TarjetaVidrio: React.FC<PropiedadesTarjetaVidrio> = ({
  children,
  style,
  variant = 'surface',
  bordered = true,
}) => {
  const coloresFondo = GRADIENTES_VARIANTE[variant] ?? GRADIENTES_VARIANTE.surface;

  return (
    <View
      style={[
        estilos.tarjeta,
        {
          borderColor: bordered ? 'rgba(165, 231, 255, 0.2)' : 'transparent',
        },
        style,
      ]}
    >
      {/* Degradado obsidiana 3D de fondo */}
      <LinearGradient
        colors={coloresFondo}
        locations={GRADIENTE_UBICACIONES}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      {/* Línea de bisel luminoso superior */}
      {bordered && <View pointerEvents="none" style={estilos.bordeSuperiorBrillo} />}

      {/* Reflejo especular superior sutil */}
      <LinearGradient
        colors={COLORES_BRILLO_SUPERIOR}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={estilos.reflejoSuperior}
      />

      {children}
    </View>
  );
};

// Alias compatible
export const GlassCard = TarjetaVidrio;

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: '#12181B',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.38,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  bordeSuperiorBrillo: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(165, 231, 255, 0.28)',
  },
  reflejoSuperior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
  },
});
