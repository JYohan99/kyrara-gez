import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { formatCurrency } from '@/shared/utils/currency';

export interface TransactionsSummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

export const TransactionsSummaryCard: React.FC<TransactionsSummaryCardProps> = ({
  totalIncome,
  totalExpense,
  netSavings,
}) => {
  return (
    <GlassCard variant="low" style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryTitleRow}>
          <View style={styles.liveDot} />
          <Text style={[styles.summaryCaps, TYPOGRAPHY.labelCaps]}>Balance neto del período</Text>
        </View>
      </View>

      <View style={styles.summaryBalanceRow}>
        <Text
          style={[
            styles.summaryBalance,
            netSavings >= 0 ? styles.positiveColor : styles.negativeColor,
            TYPOGRAPHY.displayHeroMobile,
          ]}
        >
          {netSavings >= 0 ? '+ ' : ''}
          {formatCurrency(netSavings)}
        </Text>
      </View>

      {/* Submetrics Split */}
      <View style={styles.submetricsGrid}>
        <View style={styles.submetricCol}>
          <View style={styles.submetricHeading}>
            <MaterialIcons name="arrow-downward" size={14} color={COLORS.cashflowIncome} />
            <Text style={[styles.submetricLabel, TYPOGRAPHY.labelCaps]}>Ingresos</Text>
          </View>
          <Text style={[styles.submetricValue, TYPOGRAPHY.numericTable]}>
            +{formatCurrency(totalIncome)}
          </Text>
        </View>

        <View style={styles.submetricCol}>
          <View style={styles.submetricHeading}>
            <MaterialIcons name="arrow-upward" size={14} color={COLORS.cashflowExpense} />
            <Text style={[styles.submetricLabel, TYPOGRAPHY.labelCaps]}>Gastos</Text>
          </View>
          <Text style={[styles.submetricValue, TYPOGRAPHY.numericTable]}>
            -{formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  summaryCaps: {
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  summaryBalanceRow: {
    alignItems: 'flex-start',
  },
  summaryBalance: {
    fontWeight: '700',
  },
  positiveColor: {
    color: COLORS.cashflowIncome,
  },
  negativeColor: {
    color: COLORS.cashflowExpense,
  },
  submetricsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  submetricCol: {
    flex: 1,
    gap: 2,
  },
  submetricHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  submetricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  submetricValue: {
    color: COLORS.onSurface,
  },
});
