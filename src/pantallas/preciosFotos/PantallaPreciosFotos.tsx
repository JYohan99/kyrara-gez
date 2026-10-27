import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORES as COLORS } from '@/compartido/tema';
import { EncabezadoSuperior } from '@/compartido/componentes/EncabezadoSuperior';
import { PestanaPreciosFotos } from './PestanaPreciosFotos';

export function PantallaPreciosFotos() {
  return (
    <View style={styles.screen}>
      <EncabezadoSuperior
        seccion="PRODUCTOS"
        modoVolver
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PestanaPreciosFotos />
      </ScrollView>
    </View>
  );
}

export const PantallaProductos = PantallaPreciosFotos;
export const ProductsScreen = PantallaPreciosFotos;
export const PhotoProductsScreen = PantallaPreciosFotos;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
});
