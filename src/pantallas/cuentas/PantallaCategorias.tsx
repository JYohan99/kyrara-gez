import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { COMMON_STYLES } from '@/compartido/tema';
import { EncabezadoSuperior, BotonFlotanteAccion } from '@/compartido/componentes';
import { PestanaCategorias as CategoriesTab } from './PestanaCategorias';
import { ModalCategoria as CategoryModal } from './ModalCategoria';

export function PantallaCategorias() {
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryFlowType, setCategoryFlowType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const handleOpenNewCategory = (flowType: 'EXPENSE' | 'INCOME') => {
    setCategoryFlowType(flowType);
    setCategoryModalVisible(true);
  };

  return (
    <View style={COMMON_STYLES.screen}>
      {/* Top Header */}
      <EncabezadoSuperior seccion="CATEGORÍAS" />

      <ScrollView
        contentContainerStyle={COMMON_STYLES.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CategoriesTab onNewCategory={handleOpenNewCategory} />
      </ScrollView>

      {/* Botón Circular Flotante (FAB) */}
      <BotonFlotanteAccion
        onPress={() => handleOpenNewCategory('EXPENSE')}
        accessibilityLabel="Nueva categoría"
      />

      {/* Modal de Categorías */}
      <CategoryModal
        visible={categoryModalVisible}
        flowType={categoryFlowType}
        onClose={() => setCategoryModalVisible(false)}
      />
    </View>
  );
}

export const CategoriesScreen = PantallaCategorias;
export const PantallaCuentas = PantallaCategorias;
export const AccountsVaultScreen = PantallaCategorias;

