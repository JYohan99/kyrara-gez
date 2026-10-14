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
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { NewTransactionModal } from '@/shared/components/NewTransactionModal';
import { TransactionDetailModal } from '@/shared/components/TransactionDetailModal';
import { deleteTransaction } from '@/core/database';
import { EnrichedTransaction } from '@/core/database/types';
import { useVaultTransactions } from '@/core/state';
import { formatCurrency } from '@/shared/utils/currency';
import { triggerSuccess } from '@/shared/utils/haptics';

import { TransactionRow } from './components/TransactionRow';
import { TransactionsSummaryCard } from './components/TransactionsSummaryCard';
import { TransactionsFilterBar, TransactionFilterType } from './components/TransactionsFilterBar';

export function TransactionsScreen() {
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
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, TYPOGRAPHY.headlineSm]}>Movimientos</Text>
          <Text style={[styles.headerSubtitle, TYPOGRAPHY.labelCaps]}>Historial de Bóveda</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <Text style={[styles.addBtnText, TYPOGRAPHY.labelCaps]}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
  topHeader: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerTitle: {
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
  },
  addBtnText: {
    color: '#FFFFFF',
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
