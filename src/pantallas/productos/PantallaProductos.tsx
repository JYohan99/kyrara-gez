import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORES as COLORS } from '@/compartido/tema';
import { EncabezadoSuperior, BotonFlotanteAccion } from '@/compartido/componentes';
import { PestanaProductos } from './PestanaProductos';

export function PantallaProductos() {
  const newProductRef = useRef<(() => void) | null>(null);

  return (
    <View style={styles.screen}>
      <EncabezadoSuperior
        seccion="PRODUCTOS"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PestanaProductos onNewProductRef={newProductRef} />
      </ScrollView>

      {/* Botón Circular Flotante (FAB) - Nuevo Producto */}
      <BotonFlotanteAccion
        onPress={() => newProductRef.current?.()}
        accessibilityLabel="Nuevo producto"
      />
    </View>
  );
}

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
