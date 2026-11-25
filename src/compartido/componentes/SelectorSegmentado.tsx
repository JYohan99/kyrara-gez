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

export type TonoSegmento = 'cian' | 'violeta' | 'ingreso' | 'gasto';

export interface OpcionSegmento<T extends string = string> {
  valor: T;
  etiqueta: string;
  icono?: keyof typeof MaterialIcons.glyphMap;
  tonoActivo?: TonoSegmento;
  colorIconoInactivo?: string;
  accessibilityLabel?: string;
}

export interface PropiedadesSelectorSegmentado<T extends string = string> {
  opciones: OpcionSegmento<T>[];
  valorSeleccionado: T;
  onSeleccionar: (valor: T) => void;
  tonoPorDefecto?: TonoSegmento;
  style?: StyleProp<ViewStyle>;
  compacto?: boolean;
}

const GRADIENTES_ACTIVOS: Record<TonoSegmento, [string, string, string]> = {
  cian: ['#5CE0FF', '#00B8E6', '#00566A'],
  violeta: ['#B894FF', COLORS.primarioContenedor, COLORS.enPrimario],
  ingreso: ['#7BFAC0', '#24BF7A', '#0D5E3C'],
  gasto: ['#FFA3B4', '#E6526E', '#7D172B'],
};

const COLORES_BORDE_CARRIL: [string, string, string] = [
  'rgba(165, 231, 255, 0.38)',
  'rgba(74, 84, 92, 0.36)',
  'rgba(209, 188, 255, 0.22)',
];

const COLORES_CARRIL_INTERNO: [string, string] = ['#0A0E10', '#141B1E'];

const COLORES_BRILLO_PILDORA: [string, string] = [
  'rgba(255, 255, 255, 0.48)',
  'rgba(255, 255, 255, 0.04)',
];

/**
 * Selector segmentado reutilizable con carril cápsula obsidiana y píldora activa
 * estilo cristal 3D glossy con reflejo especular superior.
 */
export function SelectorSegmentado<T extends string = string>({
  opciones,
  valorSeleccionado,
  onSeleccionar,
  tonoPorDefecto = 'cian',
  style,
  compacto = false,
}: PropiedadesSelectorSegmentado<T>) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={COLORES_BORDE_CARRIL}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.trackRim}
      >
        <LinearGradient
          colors={COLORES_CARRIL_INTERNO}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.trackInner}
        >
          {opciones.map(opcion => {
            const activo = opcion.valor === valorSeleccionado;
            const tono = opcion.tonoActivo ?? tonoPorDefecto;

            return (
              <TouchableOpacity
                key={opcion.valor}
                style={styles.optionTouch}
                onPress={() => {
                  gatillarSeleccion();
                  onSeleccionar(opcion.valor);
                }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={opcion.accessibilityLabel ?? opcion.etiqueta}
              >
                {activo ? (
                  <LinearGradient
                    colors={GRADIENTES_ACTIVOS[tono]}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={[
                      styles.activePill,
                      compacto && styles.activePillCompact,
                    ]}
                  >
                    <LinearGradient
                      colors={COLORES_BRILLO_PILDORA}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      pointerEvents="none"
                      style={styles.pillGloss}
                    />
                    {opcion.icono ? (
                      <MaterialIcons
                        name={opcion.icono}
                        size={compacto ? 14 : 16}
                        color="#FFFFFF"
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.activeLabel,
                        compacto && styles.labelCompact,
                      ]}
                      numberOfLines={1}
                    >
                      {opcion.etiqueta}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.inactivePill,
                      compacto && styles.activePillCompact,
                    ]}
                  >
                    {opcion.icono ? (
                      <MaterialIcons
                        name={opcion.icono}
                        size={compacto ? 14 : 16}
                        color={opcion.colorIconoInactivo ?? '#8E9BA4'}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.inactiveLabel,
                        compacto && styles.labelCompact,
                      ]}
                      numberOfLines={1}
                    >
                      {opcion.etiqueta}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackRim: {
    borderRadius: 999,
    padding: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  trackInner: {
    borderRadius: 999,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  optionTouch: {
    flex: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  inactivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  activePillCompact: {
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  pillGloss: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: '46%',
    borderRadius: 999,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  inactiveLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E9BA4',
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 10.5,
  },
});
