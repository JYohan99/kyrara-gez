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
import { COLORES } from '../tema/colores';
import { TIPOGRAFIA } from '../tema/tipografia';
import { TarjetaVidrio } from './TarjetaVidrio';
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
      <View style={estilos.cajaIcono}>
        <MaterialIcons name={icono} size={32} color={colorIcono} />
      </View>
      <Text style={[estilos.titulo, TIPOGRAFIA.titularPequeno]}>{titulo}</Text>
      {Boolean(descripcion) && (
        <Text style={[estilos.descripcion, TIPOGRAFIA.cuerpoPequeno]}>
          {descripcion}
        </Text>
      )}

      {Boolean(textoBoton && onBotonPress) && (
        <TouchableOpacity
          style={estilos.botonAccion}
          onPress={handleBotonPress}
          activeOpacity={0.8}
        >
          {Boolean(iconoBoton) && (
            <MaterialIcons
              name={iconoBoton}
              size={16}
              color={COLORES.secundario}
              style={estilos.iconoEnBoton}
            />
          )}
          <Text style={[estilos.textoBoton, TIPOGRAFIA.etiquetaMayusculas]}>
            {textoBoton}
          </Text>
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
  cajaIcono: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORES.superficieContenedorAlto,
    alignItems: 'center',
    justifyContent: 'center',
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
  botonAccion: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORES.superficieContenedorAlto,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconoEnBoton: {
    marginRight: 2,
  },
  textoBoton: {
    color: COLORES.secundario,
  },
});

// Alias compatibles en inglés
export const EmptyState = EstadoVacio;
export type EmptyStateProps = PropiedadesEstadoVacio;
