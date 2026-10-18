import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { EncabezadoSuperior } from '@/compartido/componentes/EncabezadoSuperior';
import { eliminarMovimiento as deleteTransaction } from '@/datos';
import { MovimientoEnriquecido as EnrichedTransaction } from '@/datos/tipos';
import { useMovimientosBoveda as useVaultTransactions } from '@/datos/hooks';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import {
  vibracionExito as triggerSuccess,
  vibracionSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

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
    <View style={styles.screen}>
      {/* Top Header */}
      <EncabezadoSuperior seccion="MOVIMIENTOS" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.mainSectionTitle, TYPOGRAPHY.headlineLg]}>
              Movimientos
            </Text>
            <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
              Historial de Bóveda
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => {
              triggerSelection();
              setModalVisible(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Nuevo movimiento"
          >
            <LinearGradient
              colors={['#9B5CFF', '#6A1FE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtnGradient}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
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
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="receipt-long" size={32} color={COLORS.secondary} />
            </View>
            <Text style={[styles.emptyTitle, TYPOGRAPHY.headlineSm]}>Sin movimientos</Text>
            <Text style={[styles.emptyBody, TYPOGRAPHY.bodySm]}>
              No hay transacciones registradas que coincidan con los filtros seleccionados.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.emptyAddBtnText, TYPOGRAPHY.labelCaps]}>
                + Registrar primera operación
              </Text>
            </TouchableOpacity>
          </GlassCard>
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
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainSectionTitle: {
    color: COLORS.onSurface,
  },
  mainSectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  actionBtnWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 16,
  },
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
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  emptyBody: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyAddBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  emptyAddBtnText: {
    color: COLORS.secondary,
  },
});

// Alias compatible
export const TransactionsScreen = PantallaMovimientos;

