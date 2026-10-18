import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES, TIPOGRAFIA } from '@/compartido/tema';
import { vibracionSeleccion } from '@/compartido/utilidades/hapticos';

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
      <View style={estilos.barraBusqueda}>
        <MaterialIcons name="search" size={20} color={COLORES.bordeContorno} />
        <TextInput
          style={estilos.entradaBusqueda}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Buscar por comercio, concepto o nota..."
          placeholderTextColor={COLORES.bordeContorno}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <MaterialIcons name="close" size={18} color={COLORES.bordeContorno} />
          </TouchableOpacity>
        )}
      </View>

      {/* Píldoras de Filtro */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.filaPildorasFiltro}
      >
        <TouchableOpacity
          style={[estilos.pildoraFiltro, activeFilter === 'all' && estilos.pildoraFiltroActiva]}
          onPress={() => {
            vibracionSeleccion();
            onFilterChange('all');
          }}
        >
          <Text
            style={[
              estilos.textoPildoraFiltro,
              activeFilter === 'all' && estilos.textoPildoraFiltroActiva,
              TIPOGRAFIA.etiquetaMayusculas,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.pildoraFiltro, activeFilter === 'EXPENSE' && estilos.pildoraFiltroGastoActiva]}
          onPress={() => {
            vibracionSeleccion();
            onFilterChange('EXPENSE');
          }}
        >
          <View style={[estilos.punto, { backgroundColor: COLORES.gasto }]} />
          <Text
            style={[
              estilos.textoPildoraFiltro,
              activeFilter === 'EXPENSE' && { color: COLORES.gasto, fontWeight: '700' },
              TIPOGRAFIA.etiquetaMayusculas,
            ]}
          >
            Gastos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.pildoraFiltro, activeFilter === 'INCOME' && estilos.pildoraFiltroIngresoActiva]}
          onPress={() => {
            vibracionSeleccion();
            onFilterChange('INCOME');
          }}
        >
          <View style={[estilos.punto, { backgroundColor: COLORES.ingreso }]} />
          <Text
            style={[
              estilos.textoPildoraFiltro,
              activeFilter === 'INCOME' && { color: COLORES.ingreso, fontWeight: '700' },
              TIPOGRAFIA.etiquetaMayusculas,
            ]}
          >
            Ingresos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.pildoraFiltro, activeFilter === 'TRANSFER' && estilos.pildoraFiltroTraspasoActiva]}
          onPress={() => {
            vibracionSeleccion();
            onFilterChange('TRANSFER');
          }}
        >
          <MaterialIcons name="sync-alt" size={14} color={COLORES.transferencia} />
          <Text
            style={[
              estilos.textoPildoraFiltro,
              activeFilter === 'TRANSFER' && { color: COLORES.primario, fontWeight: '700' },
              TIPOGRAFIA.etiquetaMayusculas,
            ]}
          >
            Traspasos
          </Text>
        </TouchableOpacity>
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
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORES.superficieContenedorMasBajo,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  entradaBusqueda: {
    flex: 1,
    color: COLORES.enSuperficie,
    fontSize: 14,
  },
  filaPildorasFiltro: {
    flexDirection: 'row',
    gap: 8,
  },
  pildoraFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORES.superficieContenedorMasBajo,
  },
  pildoraFiltroActiva: {
    backgroundColor: COLORES.superficieContenedorAlto,
  },
  pildoraFiltroGastoActiva: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  pildoraFiltroIngresoActiva: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
  },
  pildoraFiltroTraspasoActiva: {
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textoPildoraFiltro: {
    color: COLORES.enSuperficieVariante,
  },
  textoPildoraFiltroActiva: {
    color: COLORES.enSuperficie,
    fontWeight: '700',
  },
});
