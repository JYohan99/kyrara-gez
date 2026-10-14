import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { EnrichedTransaction } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';
import { triggerSelection } from '@/shared/utils/haptics';

export interface TopExpensesCardProps {
  topExpenses: EnrichedTransaction[];
  top3Percent: number;
  onSelectTransaction: (tx: EnrichedTransaction) => void;
}

const MONTH_SHORTS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const TopExpensesCard: React.FC<TopExpensesCardProps> = ({
  topExpenses,
  top3Percent,
  onSelectTransaction,
}) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.sectionCaps, TYPOGRAPHY.labelCaps]}>
            MAYOR IMPACTO
          </Text>
          <Text style={[styles.cardTitle, TYPOGRAPHY.headlineSm]}>
            Tus 3 compras más grandes
          </Text>
        </View>
        <MaterialIcons name="local-fire-department" size={20} color={COLORS.primary} />
      </View>

      {topExpenses.length > 0 ? (
        <>
          {/* Insight Tip Box */}
          <View style={styles.topTipBox}>
            <MaterialIcons name="lightbulb" size={18} color={COLORS.primary} />
            <Text style={[styles.topTipText, TYPOGRAPHY.bodySm]}>
              El{' '}
              <Text style={styles.topTipHighlight}>
                {top3Percent}% de todos tus consumos
              </Text>{' '}
              se concentró en estas {topExpenses.length} compras.
            </Text>
          </View>

          {/* Top Expenses List */}
          <View style={styles.topExpensesList}>
            {topExpenses.map((tx, idx) => {
              const txDate = new Date(tx.date);
              const dateStr = `${txDate.getDate()} ${MONTH_SHORTS[txDate.getMonth()]}`;
              const title = tx.payee || tx.note || tx.categoryName || 'Gasto';

              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.topTxItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerSelection();
                    onSelectTransaction(tx);
                  }}
                >
                  <View style={styles.topTxLeft}>
                    <View style={styles.topTxRankBadge}>
                      <Text style={[styles.topTxRankText, TYPOGRAPHY.labelCaps]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={styles.topTxInfoCol}>
                      <Text style={[styles.topTxTitle, TYPOGRAPHY.bodyMd]} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={[styles.topTxSubtext, TYPOGRAPHY.bodySm]}>
                        {tx.categoryName} • {dateStr}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.topTxAmount, TYPOGRAPHY.numericTable]}>
                    -{formatCurrency(tx.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.emptyTopExpensesBox}>
          <MaterialIcons name="receipt" size={32} color={COLORS.outline} />
          <Text style={[styles.emptyTopExpensesText, TYPOGRAPHY.bodySm]}>
            Registra compras en la pestaña Movimientos para descubrir tus mayores focos de gasto.
          </Text>
        </View>
      )}
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
  sectionCaps: {
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: COLORS.onSurface,
    marginTop: 2,
  },
  topTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 79, 255, 0.1)',
  },
  topTipText: {
    color: COLORS.onSurface,
    flex: 1,
  },
  topTipHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  topExpensesList: {
    gap: 10,
  },
  topTxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainer,
  },
  topTxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topTxRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTxRankText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  topTxInfoCol: {
    flex: 1,
  },
  topTxTitle: {
    color: COLORS.onSurface,
  },
  topTxSubtext: {
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  topTxAmount: {
    color: COLORS.cashflowExpense,
  },
  emptyTopExpensesBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTopExpensesText: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
