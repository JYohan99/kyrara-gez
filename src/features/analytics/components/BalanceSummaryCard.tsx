import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { formatCurrency } from '@/shared/utils/currency';

export interface BalanceSummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  expenseRate: number;
  isSurplus: boolean;
}

export const BalanceSummaryCard: React.FC<BalanceSummaryCardProps> = ({
  totalIncome,
  totalExpense,
  netSavings,
  savingsRate,
  expenseRate,
  isSurplus,
}) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderTitleGroup}>
          <MaterialIcons name="balance" size={18} color={COLORS.secondary} />
          <Text style={[styles.cardTitle, TYPOGRAPHY.headlineSm]}>
            Balance del Período
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isSurplus ? styles.statusBadgeIncome : styles.statusBadgeExpense,
          ]}
        >
          <MaterialIcons
            name={isSurplus ? 'trending-up' : 'trending-down'}
            size={14}
            color={isSurplus ? COLORS.cashflowIncome : COLORS.cashflowExpense}
          />
          <Text
            style={[
              styles.statusBadgeText,
              TYPOGRAPHY.labelCaps,
              { color: isSurplus ? COLORS.cashflowIncome : COLORS.cashflowExpense },
            ]}
          >
            {isSurplus ? 'Superávit' : 'Déficit'}
          </Text>
        </View>
      </View>

      {/* Grid: Ingresos vs Gastos */}
      <View style={styles.twoColumnGrid}>
        <View style={styles.metricBox}>
          <View style={styles.metricLabelRow}>
            <MaterialIcons name="arrow-downward" size={15} color={COLORS.cashflowIncome} />
            <Text style={[styles.metricLabel, TYPOGRAPHY.labelCaps]}>INGRESOS</Text>
          </View>
          <Text style={[styles.metricIncomeValue, TYPOGRAPHY.titleBalance]}>
            +{formatCurrency(totalIncome)}
          </Text>
          <Text style={[styles.metricSubtext, TYPOGRAPHY.bodySm]}>
            100% de la masa
          </Text>
        </View>

        <View style={styles.metricBox}>
          <View style={styles.metricLabelRow}>
            <MaterialIcons name="arrow-upward" size={15} color={COLORS.cashflowExpense} />
            <Text style={[styles.metricLabel, TYPOGRAPHY.labelCaps]}>GASTOS</Text>
          </View>
          <Text style={[styles.metricExpenseValue, TYPOGRAPHY.titleBalance]}>
            -{formatCurrency(totalExpense)}
          </Text>
          <Text style={[styles.metricSubtext, TYPOGRAPHY.bodySm]}>
            {expenseRate.toFixed(1)}% consumido
          </Text>
        </View>
      </View>

      {/* Dual Segment Proportion Bar */}
      <View style={styles.proportionContainer}>
        <View style={styles.proportionTrack}>
          <View
            style={[
              styles.proportionExpenseFill,
              { width: `${Math.min(100, Math.max(totalExpense > 0 ? 5 : 0, expenseRate))}%` },
            ]}
          />
          <View
            style={[
              styles.proportionSavingsFill,
              { width: `${Math.min(100, Math.max(netSavings > 0 ? 5 : 0, savingsRate))}%` },
            ]}
          />
        </View>

        <View style={styles.proportionLegendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendDotExpense} />
            <Text style={[styles.legendText, TYPOGRAPHY.bodySm]}>
              Gastado ({formatCurrency(totalExpense, { showDecimals: false })})
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={styles.legendDotIncome} />
            <Text style={[styles.legendTextIncome, TYPOGRAPHY.numericTable]}>
              Tasa de ahorro: {savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 28, 29, 0.95)',
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: COLORS.onSurface,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeIncome: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  statusBadgeExpense: {
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
  },
  statusBadgeText: {
    fontSize: 10,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHighest,
    gap: 4,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  metricIncomeValue: {
    color: COLORS.cashflowIncome,
  },
  metricExpenseValue: {
    color: COLORS.cashflowExpense,
  },
  metricSubtext: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  proportionContainer: {
    gap: 8,
    paddingTop: 4,
  },
  proportionTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  proportionExpenseFill: {
    height: '100%',
    backgroundColor: COLORS.cashflowExpense,
  },
  proportionSavingsFill: {
    height: '100%',
    backgroundColor: COLORS.cashflowIncome,
  },
  proportionLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotExpense: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cashflowExpense,
  },
  legendDotIncome: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cashflowIncome,
  },
  legendText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  legendTextIncome: {
    color: COLORS.cashflowIncome,
    fontSize: 11,
  },
});
