import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vibracionSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesBotonFlotante {
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  accessibilityLabel?: string;
  colors?: [string, string, ...string[]];
  posicion?: 'inferior-derecha' | 'inferior-izquierda' | 'superior-derecha';
  style?: ViewStyle;
}

/**
 * Botón flotante de acción (FAB) estilo orbe de cristal 3D hiperrealista
 * con bisel metálico titanio/obsidiana y paleta en tonos morados neón de la app (#D1BCFF, #8A4FFF).
 * Incorpora reflejos de lente curvados y arco inferior concéntrico para evitar cortes y formas rectangulares.
 * Ubicado por defecto en la esquina inferior derecha.
 */
export const BotonFlotanteAccion: React.FC<PropiedadesBotonFlotante> = ({
  onPress,
  icon = 'add',
  accessibilityLabel = 'Crear nuevo registro',
  colors,
  posicion = 'inferior-derecha',
  style,
}) => {
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    triggerSelection();
    onPress();
  };

  const topCalculado = (insets.top > 0 ? insets.top : 20) + 76;

  const posicionEstilo =
    posicion === 'inferior-derecha'
      ? styles.posicionInferiorDerecha
      : posicion === 'inferior-izquierda'
      ? styles.posicionInferiorIzquierda
      : [styles.posicionSuperiorDerecha, { top: topCalculado }];

  // Paleta de degradado esférico radial
  const c1 = colors?.[0] ?? '#D6C4FF';
  const c2 = colors?.[1] ?? '#A879FF';
  const c3 = colors?.[2] ?? '#8A4FFF';
  const c4 = colors?.[3] ?? '#5A12C9';
  const c5 = colors?.[4] ?? '#2B0568';
  const c6 = colors?.[5] ?? '#150235';

  return (
    <TouchableOpacity
      style={[styles.fabWrapper, posicionEstilo, style]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.svgContainer}>
        <Svg width={60} height={60} viewBox="0 0 60 60">
          <Defs>
            {/* 1. Bisel metálico titanio/obsidiana con reflejos angulares */}
            <SvgLinearGradient id="metallicBezel" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
              <Stop offset="0%" stopColor="#8A76A6" />
              <Stop offset="20%" stopColor="#4D3B63" />
              <Stop offset="42%" stopColor="#241836" />
              <Stop offset="65%" stopColor="#120A1D" />
              <Stop offset="82%" stopColor="#423158" />
              <Stop offset="100%" stopColor="#766292" />
            </SvgLinearGradient>

            {/* 2. Degradado esférico radial del orbe de cristal violeta */}
            <RadialGradient
              id="glassOrbRadial"
              cx="45%"
              cy="36%"
              r="55%"
              fx="40%"
              fy="30%"
            >
              <Stop offset="0%" stopColor={c1} stopOpacity="1" />
              <Stop offset="25%" stopColor={c2} stopOpacity="1" />
              <Stop offset="55%" stopColor={c3} stopOpacity="1" />
              <Stop offset="80%" stopColor={c4} stopOpacity="1" />
              <Stop offset="95%" stopColor={c5} stopOpacity="1" />
              <Stop offset="100%" stopColor={c6} stopOpacity="1" />
            </RadialGradient>

            {/* 3. Reflejo especular superior curvado (sin cortes, transición elíptica suave) */}
            <SvgLinearGradient id="topHighlightGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.82" />
              <Stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <Stop offset="75%" stopColor="#E9DDFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#D1BCFF" stopOpacity="0" />
            </SvgLinearGradient>

            {/* 4. Reflejo concéntrico inferior (arco suave en vez de barra rectangular) */}
            <SvgLinearGradient id="bottomRimGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#D1BCFF" stopOpacity="0" />
              <Stop offset="45%" stopColor="#D1BCFF" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.75" />
            </SvgLinearGradient>
          </Defs>

          {/* Bisel metálico exterior */}
          <Circle
            cx="30"
            cy="30"
            r="28.8"
            fill="url(#metallicBezel)"
            stroke="rgba(209, 188, 255, 0.4)"
            strokeWidth="0.8"
          />

          {/* Ranura oscura interior de profundidad */}
          <Circle
            cx="30"
            cy="30"
            r="26.2"
            fill="#0C0716"
            stroke="rgba(0, 0, 0, 0.85)"
            strokeWidth="0.8"
          />

          {/* Orbe de cristal 3D con sombreado esférico radial */}
          <Circle cx="30" cy="30" r="23.6" fill="url(#glassOrbRadial)" />

          {/* Brillo especular superior: elipse contenida con margen, no se corta arriba */}
          <Ellipse
            cx="30"
            cy="18.5"
            rx="13.5"
            ry="7.5"
            fill="url(#topHighlightGrad)"
          />

          {/* Micro destello focal en la cúpula superior izquierda */}
          <Ellipse
            cx="26"
            cy="16"
            rx="4.5"
            ry="2.2"
            fill="#FFFFFF"
            opacity="0.65"
          />

          {/* Brillo inferior curvado: arco concéntrico que sigue la circunferencia del orbe */}
          <Path
            d="M 15 42 A 20.8 20.8 0 0 0 45 42"
            stroke="url(#bottomRimGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>

        {/* Icono de agregar (+) perfectamente centrado con relieve 3D */}
        <View style={styles.iconOverlay} pointerEvents="none">
          <MaterialIcons
            name={icon}
            size={30}
            color="#FFFFFF"
            style={styles.iconStyle}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    zIndex: 99,
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 10,
  },
  posicionInferiorDerecha: {
    bottom: 22,
    right: 20,
  },
  posicionInferiorIzquierda: {
    bottom: 22,
    left: 20,
  },
  posicionSuperiorDerecha: {
    right: 18,
  },
  svgContainer: {
    width: 60,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    textShadowColor: 'rgba(20, 0, 48, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
});

// Alias en inglés para compatibilidad
export const FloatingActionButton = BotonFlotanteAccion;
export type FloatingActionButtonProps = PropiedadesBotonFlotante;

