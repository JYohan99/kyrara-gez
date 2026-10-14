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
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { triggerSelection } from '@/shared/utils/haptics';

export type TransactionFilterType = 'all' | 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface TransactionsFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: TransactionFilterType;
  onFilterChange: (f: TransactionFilterType) => void;
}

export const TransactionsFilterBar: React.FC<TransactionsFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={COLORS.outline} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Buscar por comercio, concepto o nota..."
          placeholderTextColor={COLORS.outline}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <MaterialIcons name="close" size={18} color={COLORS.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsRow}
      >
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          onPress={() => {
            triggerSelection();
            onFilterChange('all');
          }}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'all' && styles.filterPillTextActive,
              TYPOGRAPHY.labelCaps,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'EXPENSE' && styles.filterPillExpenseActive]}
          onPress={() => {
            triggerSelection();
            onFilterChange('EXPENSE');
          }}
        >
          <View style={[styles.dot, { backgroundColor: COLORS.cashflowExpense }]} />
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'EXPENSE' && { color: COLORS.cashflowExpense, fontWeight: '700' },
              TYPOGRAPHY.labelCaps,
            ]}
          >
            Gastos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'INCOME' && styles.filterPillIncomeActive]}
          onPress={() => {
            triggerSelection();
            onFilterChange('INCOME');
          }}
        >
          <View style={[styles.dot, { backgroundColor: COLORS.cashflowIncome }]} />
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'INCOME' && { color: COLORS.cashflowIncome, fontWeight: '700' },
              TYPOGRAPHY.labelCaps,
            ]}
          >
            Ingresos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'TRANSFER' && styles.filterPillTransferActive]}
          onPress={() => {
            triggerSelection();
            onFilterChange('TRANSFER');
          }}
        >
          <MaterialIcons name="sync-alt" size={14} color={COLORS.cashflowTransfer} />
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'TRANSFER' && { color: COLORS.primary, fontWeight: '700' },
              TYPOGRAPHY.labelCaps,
            ]}
          >
            Traspasos
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  filterPillActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  filterPillExpenseActive: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  filterPillIncomeActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
  },
  filterPillTransferActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    color: COLORS.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
});
