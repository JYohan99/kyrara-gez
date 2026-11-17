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

// Paletas constantes y coordenadas para evitar asignaciones de memoria en cada render
const CHROME_BEZEL_COLORS: [string, string, ...string[]] = [
  '#FFFFFF',
  '#D2D8DF',
  '#8C94A0',
  '#434B56',
  '#1B1F26',
  '#4E5764',
  '#E5EAF1',
  '#9DA6B3',
];

const PRIMARY_CORE_COLORS: [string, string, ...string[]] = [
  '#B88AFF',
  '#9355FF',
  '#7320E8',
  '#46089E',
  '#1C0249',
];

const SECONDARY_CORE_COLORS: [string, string, ...string[]] = [
  '#45E5FF',
  '#00C6EC',
  '#0084BD',
  '#004778',
  '#002038',
];

const TOP_GLOSS_COLORS: [string, string, ...string[]] = [
  'rgba(255, 255, 255, 0.88)',
  'rgba(255, 255, 255, 0.42)',
  'rgba(255, 255, 255, 0.0)',
];

const PRIMARY_BOTTOM_RIM_COLORS: [string, string, ...string[]] = [
  'rgba(138, 79, 255, 0.0)',
  'rgba(235, 220, 255, 0.85)',
];

const SECONDARY_BOTTOM_RIM_COLORS: [string, string, ...string[]] = [
  'rgba(0, 210, 255, 0.0)',
  'rgba(180, 245, 255, 0.85)',
];

const GRAD_BEZEL_START = { x: 0.1, y: 0.0 };
const GRAD_BEZEL_END = { x: 0.9, y: 1.0 };
const GRAD_CORE_START = { x: 0.3, y: 0.0 };
const GRAD_CORE_END = { x: 0.7, y: 1.0 };
const GRAD_VERTICAL_START = { x: 0.5, y: 0.0 };
const GRAD_VERTICAL_END = { x: 0.5, y: 1.0 };

// Limpia cualquier signo o símbolo (ej. ✓, +, -, etc.) para mostrar estrictamente texto
const sanitizarTextoBoton = (texto: string) =>
  texto.replace(/^[\s✓✔+•\-—*#@!¡?¿]+/, '').trim();

/**
 * Botón brillante estilo cápsula de cristal 3D con bisel metálico cromo/titanio.
 * Muestra exclusivamente texto en mayúsculas con relieve tridimensional.
 */
export const BotonBrillante: React.FC<PropiedadesBotonBrillante> = React.memo(({
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

  const textoLimpio = sanitizarTextoBoton(title);

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
        colors={CHROME_BEZEL_COLORS}
        start={GRAD_BEZEL_START}
        end={GRAD_BEZEL_END}
        style={estilos.bezelOuter}
      >
        {/* 2. Ranura oscura interior de profundidad */}
        <View style={estilos.bezelGroove}>
          {/* 3. Cuerpo de cristal 3D en cápsula */}
          <LinearGradient
            colors={isSecondary ? SECONDARY_CORE_COLORS : PRIMARY_CORE_COLORS}
            start={GRAD_CORE_START}
            end={GRAD_CORE_END}
            style={estilos.cuerpoCristal}
          >
            {/* 4. Brillo especular superior de vidrio */}
            <LinearGradient
              colors={TOP_GLOSS_COLORS}
              start={GRAD_VERTICAL_START}
              end={GRAD_VERTICAL_END}
              style={estilos.reflejoSuperior}
            />

            {/* 5. Arco inferior de luz neón */}
            <LinearGradient
              colors={isSecondary ? SECONDARY_BOTTOM_RIM_COLORS : PRIMARY_BOTTOM_RIM_COLORS}
              start={GRAD_VERTICAL_START}
              end={GRAD_VERTICAL_END}
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
});

// Alias compatible
BotonBrillante.displayName = 'BotonBrillante';
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
