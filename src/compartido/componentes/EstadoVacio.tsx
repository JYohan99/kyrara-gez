import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES } from '../tema/colores';
import { TIPOGRAFIA } from '../tema/tipografia';
import { TarjetaVidrio } from './TarjetaVidrio';
import { OrbeGlossy } from './OrbeGlossy';
import { vibracionSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesEstadoVacio {
  icono?: keyof typeof MaterialIcons.glyphMap;
  colorIcono?: string;
  titulo: string;
  descripcion?: string;
  textoBoton?: string;
  iconoBoton?: keyof typeof MaterialIcons.glyphMap;
  onBotonPress?: () => void;
  variante?: 'tarjeta' | 'transparente';
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const EstadoVacio: React.FC<PropiedadesEstadoVacio> = ({
  icono = 'info-outline',
  colorIcono = COLORES.secundario,
  titulo,
  descripcion,
  textoBoton,
  iconoBoton,
  onBotonPress,
  variante = 'tarjeta',
  children,
  style,
}) => {
  const handleBotonPress = () => {
    triggerSelection();
    onBotonPress?.();
  };

  const contenido = (
    <>
      <OrbeGlossy tamano={64} tono="obsidiana" sombra style={estilos.orbeIcono}>
        <MaterialIcons name={icono} size={30} color={colorIcono} />
      </OrbeGlossy>
      <Text style={[estilos.titulo, TIPOGRAFIA.titularPequeno]}>{titulo}</Text>
      {Boolean(descripcion) && (
        <Text style={[estilos.descripcion, TIPOGRAFIA.cuerpoPequeno]}>
          {descripcion}
        </Text>
      )}

      {Boolean(textoBoton && onBotonPress) && (
        <TouchableOpacity
          onPress={handleBotonPress}
          activeOpacity={0.82}
          style={estilos.botonTouch}
        >
          <LinearGradient
            colors={['#5CE0FF', '#00B8E6', '#00566A']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={estilos.botonAccion}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
              style={estilos.botonBrillo}
            />
            {Boolean(iconoBoton) && (
              <MaterialIcons
                name={iconoBoton}
                size={16}
                color="#FFFFFF"
                style={estilos.iconoEnBoton}
              />
            )}
            <Text style={[estilos.textoBoton, TIPOGRAFIA.etiquetaMayusculas]}>
              {textoBoton}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {children}
    </>
  );

  if (variante === 'transparente') {
    return <View style={[estilos.contenedorTransparente, style]}>{contenido}</View>;
  }

  return <TarjetaVidrio style={[estilos.tarjeta, style]}>{contenido}</TarjetaVidrio>;
};

const estilos = StyleSheet.create({
  tarjeta: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  contenedorTransparente: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  orbeIcono: {
    marginBottom: 4,
  },
  titulo: {
    color: COLORES.enSuperficie,
    textAlign: 'center',
  },
  descripcion: {
    color: COLORES.enSuperficieVariante,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  botonTouch: {
    marginTop: 6,
    borderRadius: 999,
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  botonBrillo: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: '46%',
    borderRadius: 999,
  },
  iconoEnBoton: {
    marginRight: 6,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
