import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES } from '../tema/colores';
import { vibracionSeleccion as triggerSelection } from '../utilidades/hapticos';

export interface PropiedadesBotonBrillante {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * Botón brillante estilo cápsula de cristal 3D con bisel metálico cromo/titanio:
 * - Silueta de píldora alargada (stadium / capsule).
 * - Bisel exterior metálico cromado brillante con reflejos de acero.
 * - Ranura oscura interior de profundidad.
 * - Cuerpo de cristal en degradado multicapa violeta neón de la app.
 * - Lente de reflejo especular superior curvada (brillo de vidrio).
 * - Arco inferior de luz de borde neón.
 * - Sin iconos ni símbolos, únicamente tipografía en mayúsculas con relieve 3D.
 */
export const BotonBrillante: React.FC<PropiedadesBotonBrillante> = ({
  title,
  onPress,
  style,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    triggerSelection();
    onPress();
  };

  // Limpiar cualquier signo o símbolo (como ✓, +, -, etc.) para mostrar estrictamente solo letras
  const textoLimpio = title
    .replace(/^[\s✓✔+•\-—*#@!¡?¿]+/, '')
    .trim();

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[estilos.botonFantasma, disabled && estilos.deshabilitado, style]}
      >
        {loading ? (
          <ActivityIndicator color={COLORES.primario} size="small" />
        ) : (
          <Text style={estilos.textoFantasma}>{textoLimpio}</Text>
        )}
      </TouchableOpacity>
    );
  }

  const isSecondary = variant === 'secondary';

  // Bisel metálico cromado brillante con reflejos de titanio/acero
  const chromeBezelColors: [string, string, ...string[]] = [
    '#FFFFFF',
    '#D2D8DF',
    '#8C94A0',
    '#434B56',
    '#1B1F26',
    '#4E5764',
    '#E5EAF1',
    '#9DA6B3',
  ];

  // Cuerpo de cristal en tonos morados neón de la app
  const coreColors: [string, string, ...string[]] = isSecondary
    ? ['#45E5FF', '#00C6EC', '#0084BD', '#004778', '#002038']
    : ['#B88AFF', '#9355FF', '#7320E8', '#46089E', '#1C0249'];

  // Reflejo especular superior (lente de vidrio transparente con transición suave)
  const topGlossColors: [string, string, ...string[]] = [
    'rgba(255, 255, 255, 0.88)',
    'rgba(255, 255, 255, 0.42)',
    'rgba(255, 255, 255, 0.0)',
  ];

  // Brillo inferior neón (arco de resplandor en la base de la cápsula)
  const bottomRimColors: [string, string, ...string[]] = isSecondary
    ? ['rgba(0, 210, 255, 0.0)', 'rgba(180, 245, 255, 0.85)']
    : ['rgba(138, 79, 255, 0.0)', 'rgba(235, 220, 255, 0.85)'];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        estilos.envoltorioResplandor,
        isSecondary ? estilos.resplandorSecundario : estilos.resplandorPrimario,
        disabled && estilos.deshabilitado,
        style,
      ]}
    >
      {/* 1. Bisel exterior cromado con relieve metálico */}
      <LinearGradient
        colors={chromeBezelColors}
        start={{ x: 0.1, y: 0.0 }}
        end={{ x: 0.9, y: 1.0 }}
        style={estilos.bezelOuter}
      >
        {/* 2. Ranura oscura interior de profundidad */}
        <View style={estilos.bezelGroove}>
          {/* 3. Cuerpo de cristal 3D en cápsula */}
          <LinearGradient
            colors={coreColors}
            start={{ x: 0.3, y: 0.0 }}
            end={{ x: 0.7, y: 1.0 }}
            style={estilos.cuerpoCristal}
          >
            {/* 4. Brillo especular superior de vidrio (cúpula alargada) */}
            <LinearGradient
              colors={topGlossColors}
              start={{ x: 0.5, y: 0.0 }}
              end={{ x: 0.5, y: 1.0 }}
              style={estilos.reflejoSuperior}
            />

            {/* 5. Arco inferior de luz neón */}
            <LinearGradient
              colors={bottomRimColors}
              start={{ x: 0.5, y: 0.0 }}
              end={{ x: 0.5, y: 1.0 }}
              style={estilos.reflejoInferior}
            />

            {/* 6. Solo letras en mayúsculas con relieve 3D */}
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  estilos.textoPrimario,
                  isSecondary ? estilos.sombraTextoSecundaria : estilos.sombraTextoPrimaria,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {textoLimpio}
              </Text>
            )}
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Alias compatible
export const GlowButton = BotonBrillante;

const estilos = StyleSheet.create({
  envoltorioResplandor: {
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  resplandorPrimario: {
    shadowColor: '#8A4FFF',
  },
  resplandorSecundario: {
    shadowColor: '#00D2FF',
  },
  bezelOuter: {
    width: '100%',
    borderRadius: 9999,
    padding: 2.8,
    borderWidth: 1.2,
    borderColor: '#05070A',
    overflow: 'hidden',
  },
  bezelGroove: {
    width: '100%',
    borderRadius: 9999,
    padding: 1.8,
    backgroundColor: '#090B0E',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.9)',
    overflow: 'hidden',
  },
  cuerpoCristal: {
    width: '100%',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 46,
  },
  reflejoSuperior: {
    position: 'absolute',
    top: 1.5,
    left: 8,
    right: 8,
    height: '48%',
    borderRadius: 9999,
  },
  reflejoInferior: {
    position: 'absolute',
    bottom: 1.2,
    left: 14,
    right: 14,
    height: 3.5,
    borderRadius: 9999,
  },
  textoPrimario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    zIndex: 2,
  },
  sombraTextoPrimaria: {
    textShadowColor: 'rgba(15, 0, 40, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  sombraTextoSecundaria: {
    textShadowColor: 'rgba(0, 20, 30, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  botonFantasma: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 9999,
    backgroundColor: 'rgba(25, 28, 30, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(209, 188, 255, 0.3)',
  },
  textoFantasma: {
    color: COLORES.enSuperficie,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  deshabilitado: {
    opacity: 0.5,
  },
});

