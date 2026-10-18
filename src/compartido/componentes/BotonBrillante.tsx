import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES } from '../tema/colores';
import { TIPOGRAFIA } from '../tema/tipografia';

interface PropiedadesBotonBrillante {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const BotonBrillante: React.FC<PropiedadesBotonBrillante> = ({
  title,
  onPress,
  style,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
}) => {
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[estilos.botonFantasma, disabled && estilos.deshabilitado, style]}
      >
        {loading ? (
          <ActivityIndicator color={COLORES.primario} size="small" />
        ) : (
          <View style={estilos.filaContenido}>
            {icon && <View style={estilos.contenedorIcono}>{icon}</View>}
            <Text style={[estilos.textoFantasma, TIPOGRAFIA.titularPequeno]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const coloresDegradado: [string, string] =
    variant === 'secondary'
      ? [COLORES.secundarioContenedor, COLORES.terciario]
      : [COLORES.primarioContenedor, COLORES.primarioInverso];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        estilos.envoltorioResplandor,
        variant === 'primary' && estilos.resplandorPrimario,
        disabled && estilos.deshabilitado,
        style,
      ]}
    >
      <LinearGradient
        colors={coloresDegradado}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={estilos.botonDegradado}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={estilos.filaContenido}>
            {icon && <View style={estilos.contenedorIcono}>{icon}</View>}
            <Text style={[estilos.textoPrimario, TIPOGRAFIA.titularPequeno]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Alias compatible
export const GlowButton = BotonBrillante;

const estilos = StyleSheet.create({
  envoltorioResplandor: {
    borderRadius: 14,
    shadowColor: COLORES.primarioContenedor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  resplandorPrimario: {
    shadowColor: '#8A4FFF',
  },
  botonDegradado: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenedorIcono: {
    marginRight: 8,
  },
  textoPrimario: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  botonFantasma: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: COLORES.superficieContenedorAlto,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORES.bordeCristal,
  },
  textoFantasma: {
    color: COLORES.enSuperficie,
    fontWeight: '600',
  },
  deshabilitado: {
    opacity: 0.5,
  },
});
