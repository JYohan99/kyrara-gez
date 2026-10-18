import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { COLORES } from '../tema/colores';

interface PropiedadesEmblemaKyrara {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const EmblemaKyrara: React.FC<PropiedadesEmblemaKyrara> = ({
  size = 64,
  style,
  imageStyle,
}) => {
  return (
    <View style={[estilos.contenedor, { width: size, height: size }, style]}>
      <Image
        source={require('../../../assets/logo.png')}
        style={[
          estilos.imagen,
          { width: size, height: size, borderRadius: Math.round(size * 0.22) },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

// Alias compatible
export const KyraraEmblem = EmblemaKyrara;

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORES.primarioContenedor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  imagen: {
    overflow: 'hidden',
  },
});
