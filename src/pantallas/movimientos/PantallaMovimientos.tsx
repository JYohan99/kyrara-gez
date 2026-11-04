import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COMMON_STYLES } from '@/compartido/tema';
import { EncabezadoSuperior, BotonFlotanteAccion, EstadoVacio } from '@/compartido/componentes';
import { eliminarMovimiento as deleteTransaction } from '@/datos';
import { MovimientoEnriquecido as EnrichedTransaction } from '@/datos/tipos';
import { useMovimientosBoveda as useVaultTransactions } from '@/datos/hooks';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { vibracionExito as triggerSuccess, vibracionSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

import { FilaMovimiento as TransactionRow } from './FilaMovimiento';
import { TarjetaResumenMovimientos as TransactionsSummaryCard } from './TarjetaResumenMovimientos';
import {
  BarraFiltrosMovimientos as TransactionsFilterBar,
  TipoFiltroMovimiento as TransactionFilterType,
} from './BarraFiltrosMovimientos';
import { ModalNuevoMovimiento as NewTransactionModal } from './ModalNuevoMovimiento';
import { ModalDetalleMovimiento as TransactionDetailModal } from './ModalDetalleMovimiento';

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
const DIAS_SEMANA_ES = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
];

export function PantallaMovimientos() {
  const [activeFilter, setActiveFilter] = useState<TransactionFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Hook reactivo de transacciones
  const { transactions, summary } = useVaultTransactions({
    type: activeFilter === 'all' ? undefined : activeFilter,
    search: searchQuery.trim() || undefined,
  });

  const handleDelete = (tx: EnrichedTransaction) => {
    Alert.alert(
      'Eliminar Movimiento',
      `¿Deseas eliminar este movimiento de ${formatCurrency(tx.amount)}? El saldo de la cuenta se recalculará automáticamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(tx.id);
            triggerSuccess();
          },
        },
      ]
    );
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, EnrichedTransaction[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()).getTime();

      let key = '';
      if (txDay === today) {
        key = 'Hoy';
      } else if (txDay === yesterday) {
        key = 'Ayer';
      } else {
        const dia = txDate.getDate();
        const mes = MESES_ES[txDate.getMonth()];
        const diaSemana = DIAS_SEMANA_ES[txDate.getDay()];
        key = `${dia} ${mes}, ${diaSemana}`;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });

    return groups;
  }, [transactions]);

  const toggleGroup = (groupKey: string, index: number) => {
    triggerSelection();
    setCollapsedGroups(prev => {
      const isCurrentlyCollapsed =
        prev[groupKey] !== undefined ? prev[groupKey] : (groupKey !== 'Hoy' && index !== 0);
      return {
        ...prev,
        [groupKey]: !isCurrentlyCollapsed,
      };
    });
  };

  const isGroupCollapsed = (groupKey: string, index: number) => {
    if (collapsedGroups[groupKey] !== undefined) {
      return collapsedGroups[groupKey];
    }
    return groupKey !== 'Hoy' && index !== 0;
  };

  return (
    <View style={COMMON_STYLES.screen}>
      {/* Top Header */}
      <EncabezadoSuperior seccion="MOVIMIENTOS" modoVolver />

      <ScrollView
        contentContainerStyle={COMMON_STYLES.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Summary Card */}
        <TransactionsSummaryCard
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          netSavings={summary.netSavings}
          count={summary.count}
        />

        {/* Search & Filter Bar */}
        <TransactionsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Grouped Transaction List */}
        {Object.keys(groupedTransactions).length === 0 ? (
          <EstadoVacio
            icono="receipt-long"
            titulo="Sin movimientos"
            descripcion="No hay transacciones registradas que coincidan con los filtros seleccionados."
            textoBoton="+ Registrar primera operación"
            onBotonPress={() => setModalVisible(true)}
          />
        ) : (
          <View style={styles.feedContainer}>
            {Object.entries(groupedTransactions).map(([dateGroup, items], index) => {
              const collapsed = isGroupCollapsed(dateGroup, index);

              return (
                <View key={dateGroup} style={styles.tarjetaGrupoFecha}>
                  {/* Date Group Header */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleGroup(dateGroup, index)}
                    style={[
                      styles.cabeceraGrupoFecha,
                      !collapsed && styles.cabeceraGrupoFechaExpandida,
                    ]}
                  >
                    <Text style={styles.tituloGrupoFecha}>{dateGroup}</Text>

                    {collapsed ? (
                      <View style={styles.badgeYFlecha}>
                        <View style={styles.badgeConteo}>
                          <Text style={styles.textoBadgeConteo}>{items.length}</Text>
                        </View>
                        <MaterialIcons name="keyboard-arrow-down" size={22} color="#7E8286" />
                      </View>
                    ) : (
                      <MaterialIcons name="keyboard-arrow-up" size={24} color="#7E8286" />
                    )}
                  </TouchableOpacity>

                  {/* Items in this date */}
                  {!collapsed && (
                    <View>
                      {items.map((tx, idx) => (
                        <TransactionRow
                          key={tx.id}
                          transaction={tx}
                          mostrarDivisor={idx < items.length - 1}
                          onPress={() => {
                            setSelectedTransaction(tx);
                            setDetailModalVisible(true);
                          }}
                          onLongPress={() => handleDelete(tx)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Botón Circular Flotante (FAB) */}
      <BotonFlotanteAccion
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Nuevo movimiento"
      />

      {/* New Transaction Modal */}
      <NewTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* Transaction Detail Voucher Modal */}
      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  feedContainer: {
    gap: 12,
  },
  tarjetaGrupoFecha: {
    backgroundColor: '#16191B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  cabeceraGrupoFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cabeceraGrupoFechaExpandida: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tituloGrupoFecha: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgeYFlecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeConteo: {
    backgroundColor: '#2F80ED',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBadgeConteo: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

// Alias compatible
export const TransactionsScreen = PantallaMovimientos;

