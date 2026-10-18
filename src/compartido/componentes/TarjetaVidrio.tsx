import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORES } from '../tema/colores';

interface PropiedadesTarjetaVidrio {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'high' | 'low' | 'lowest';
  bordered?: boolean;
}

export const TarjetaVidrio: React.FC<PropiedadesTarjetaVidrio> = ({
  children,
  style,
  variant = 'surface',
  bordered = true,
}) => {
  const obtenerColorSuperficie = () => {
    switch (variant) {
      case 'low':
        return COLORES.superficieContenedorBajo;
      case 'high':
        return COLORES.superficieContenedorAlto;
      case 'lowest':
        return COLORES.superficieContenedorMasBajo;
      case 'surface':
      default:
        return COLORES.superficieContenedor;
    }
  };

  return (
    <View
      style={[
        estilos.tarjeta,
        {
          backgroundColor: obtenerColorSuperficie(),
          borderColor: bordered ? COLORES.bordeCristal : 'transparent',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Alias compatible
export const GlassCard = TarjetaVidrio;

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
