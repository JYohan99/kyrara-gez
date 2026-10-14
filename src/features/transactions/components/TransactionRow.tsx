import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { EnrichedTransaction } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';

export interface TransactionRowProps {
  transaction: EnrichedTransaction;
  onPress: () => void;
  onLongPress?: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction: tx,
  onPress,
  onLongPress,
}) => {
  const isExpense = tx.type === 'EXPENSE';
  const isIncome = tx.type === 'INCOME';
  const isTransfer = tx.type === 'TRANSFER';

  const iconColor = isIncome
    ? COLORS.cashflowIncome
    : isExpense
    ? COLORS.cashflowExpense
    : COLORS.cashflowTransfer;

  const iconBg = isIncome
    ? 'rgba(87, 245, 171, 0.12)'
    : isExpense
    ? 'rgba(255, 138, 158, 0.12)'
    : 'rgba(138, 79, 255, 0.15)';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <GlassCard variant="surface" style={styles.txCard}>
        <View style={styles.txLeft}>
          <View style={[styles.txIconBox, { backgroundColor: iconBg }]}>
            <MaterialIcons
              name={
                isTransfer
                  ? 'swap-horiz'
                  : isIncome
                  ? 'arrow-downward'
                  : 'local-mall'
              }
              size={20}
              color={iconColor}
            />
          </View>

          <View style={styles.txInfo}>
            <Text style={[styles.txPayee, TYPOGRAPHY.bodyMd]}>
              {tx.payee || tx.categoryName}
            </Text>
            <View style={styles.txMetaRow}>
              <Text style={[styles.txMeta, TYPOGRAPHY.bodySm]}>
                {isTransfer
                  ? `${tx.sourceAccountName} → ${tx.targetAccountName || 'Cuenta'}`
                  : `${tx.sourceAccountName} • ${tx.categoryName}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              isIncome
                ? styles.incomeAmount
                : isExpense
                ? styles.expenseAmount
                : styles.transferAmount,
              TYPOGRAPHY.numericTable,
            ]}
          >
            {isIncome ? '+ ' : isExpense ? '- ' : '⇄ '}
            {formatCurrency(tx.amount)}
          </Text>
          <Text style={[styles.txTypeTag, TYPOGRAPHY.labelCaps]}>
            {isExpense ? 'Gasto' : isIncome ? 'Ingreso' : 'Traspaso'}
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  txCard: {
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txPayee: {
    color: COLORS.onSurface,
  },
  txMetaRow: {
    marginTop: 2,
  },
  txMeta: {
    color: COLORS.onSurfaceVariant,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    letterSpacing: -0.2,
  },
  incomeAmount: {
    color: COLORS.cashflowIncome,
  },
  expenseAmount: {
    color: COLORS.cashflowExpense,
  },
  transferAmount: {
    color: COLORS.cashflowTransfer,
  },
  txTypeTag: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    marginTop: 2,
  },
});
