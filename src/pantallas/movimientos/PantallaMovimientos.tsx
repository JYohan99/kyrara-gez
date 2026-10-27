import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY, COMMON_STYLES } from '@/compartido/tema';
import { EncabezadoSuperior, BotonFlotanteAccion, EstadoVacio } from '@/compartido/componentes';
import { eliminarMovimiento as deleteTransaction } from '@/datos';
import { MovimientoEnriquecido as EnrichedTransaction } from '@/datos/tipos';
import { useMovimientosBoveda as useVaultTransactions } from '@/datos/hooks';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { vibracionExito as triggerSuccess } from '@/compartido/utilidades/hapticos';

import { FilaMovimiento as TransactionRow } from './FilaMovimiento';
import { TarjetaResumenMovimientos as TransactionsSummaryCard } from './TarjetaResumenMovimientos';
import {
  BarraFiltrosMovimientos as TransactionsFilterBar,
  TipoFiltroMovimiento as TransactionFilterType,
} from './BarraFiltrosMovimientos';
import { ModalNuevoMovimiento as NewTransactionModal } from './ModalNuevoMovimiento';
import { ModalDetalleMovimiento as TransactionDetailModal } from './ModalDetalleMovimiento';

export function PantallaMovimientos() {
  const [activeFilter, setActiveFilter] = useState<TransactionFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);


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
        const monthNames = [
          'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        key = `${txDate.getDate()} de ${monthNames[txDate.getMonth()]}`;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });

    return groups;
  }, [transactions]);

  return (
    <View style={COMMON_STYLES.screen}>
      {/* Top Header */}
      <EncabezadoSuperior seccion="MOVIMIENTOS" />

      <ScrollView
        contentContainerStyle={COMMON_STYLES.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header Row */}
        <View style={COMMON_STYLES.sectionHeaderRow}>
          <View>
            <Text style={[COMMON_STYLES.mainSectionTitle, TYPOGRAPHY.headlineLg]}>
              Movimientos
            </Text>
            <Text style={[COMMON_STYLES.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
              Historial de Bóveda
            </Text>
          </View>
        </View>
        {/* Status Strip */}
        <View style={styles.statusStrip}>
          <Text style={[styles.periodSubtitle, TYPOGRAPHY.bodySm]}>
            Resumen contable del mes actual
          </Text>
          <View style={styles.recordsCountBadge}>
            <Text style={[styles.recordsCountText, TYPOGRAPHY.labelCaps]}>
              {summary.count} Registros
            </Text>
          </View>
        </View>

        {/* Hero Summary Card */}
        <TransactionsSummaryCard
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          netSavings={summary.netSavings}
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
            {Object.entries(groupedTransactions).map(([dateGroup, items]) => (
              <View key={dateGroup} style={styles.dateGroupContainer}>
                {/* Date Group Header */}
                <View style={styles.dateGroupHeader}>
                  <Text style={[styles.dateGroupTitle, TYPOGRAPHY.headlineSm]}>{dateGroup}</Text>
                  <Text style={[styles.dateGroupSubtitle, TYPOGRAPHY.labelCaps]}>
                    {items.length} {items.length === 1 ? 'operación' : 'operaciones'}
                  </Text>
                </View>

                {/* Items in this date */}
                <View style={styles.itemsStack}>
                  {items.map(tx => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      onPress={() => {
                        setSelectedTransaction(tx);
                        setDetailModalVisible(true);
                      }}
                      onLongPress={() => handleDelete(tx)}
                    />
                  ))}
                </View>
              </View>
            ))}
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
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodSubtitle: {
    color: COLORS.onSurfaceVariant,
  },
  recordsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  recordsCountText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  feedContainer: {
    gap: 16,
  },
  dateGroupContainer: {
    gap: 8,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  dateGroupTitle: {
    color: COLORS.onSurface,
  },
  dateGroupSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  itemsStack: {
    gap: 8,
  },
});

// Alias compatible
export const TransactionsScreen = PantallaMovimientos;

