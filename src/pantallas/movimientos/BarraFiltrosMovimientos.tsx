import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORES } from '@/compartido/tema';
import { BarraBusqueda, ChipFiltro } from '@/compartido/componentes';

export type TipoFiltroMovimiento = 'all' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface PropiedadesBarraFiltrosMovimientos {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: TipoFiltroMovimiento;
  onFilterChange: (f: TipoFiltroMovimiento) => void;
}

export const BarraFiltrosMovimientos: React.FC<PropiedadesBarraFiltrosMovimientos> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <View style={estilos.contenedor}>
      {/* Barra de Búsqueda */}
      <BarraBusqueda
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Buscar por comercio, concepto o nota..."
      />

      {/* Píldoras de Filtro */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.filaPildorasFiltro}
      >
        <ChipFiltro
          etiqueta="Todos"
          activo={activeFilter === 'all'}
          tono="cian"
          mayusculas
          onPress={() => onFilterChange('all')}
        />
        <ChipFiltro
          etiqueta="Gastos"
          activo={activeFilter === 'EXPENSE'}
          tono="gasto"
          colorPunto={COLORES.gasto}
          mayusculas
          onPress={() => onFilterChange('EXPENSE')}
        />
        <ChipFiltro
          etiqueta="Ingresos"
          activo={activeFilter === 'INCOME'}
          tono="ingreso"
          colorPunto={COLORES.ingreso}
          mayusculas
          onPress={() => onFilterChange('INCOME')}
        />
        <ChipFiltro
          etiqueta="Traspasos"
          activo={activeFilter === 'TRANSFER'}
          tono="violeta"
          icono="sync-alt"
          colorPunto={undefined}
          mayusculas
          onPress={() => onFilterChange('TRANSFER')}
        />
      </ScrollView>
    </View>
  );
};

// Alias compatibles
export type TransactionFilterType = TipoFiltroMovimiento;
export const TransactionsFilterBar = BarraFiltrosMovimientos;

const estilos = StyleSheet.create({
  contenedor: {
    gap: 12,
  },
  filaPildorasFiltro: {
    flexDirection: 'row',
    gap: 8,
  },
});
