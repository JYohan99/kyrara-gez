import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { MonthlySavingsStat } from '@/core/database/types';

export interface MonthlySavingsBarChartCardProps {
  monthlyHistory: MonthlySavingsStat[];
  historyComparison: {
    diff: number;
    pct: number;
    isPositive: boolean;
    prevLabel: string;
  } | null;
}

export const MonthlySavingsBarChartCard: React.FC<MonthlySavingsBarChartCardProps> = ({
  monthlyHistory,
  historyComparison,
}) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.sectionCaps, TYPOGRAPHY.labelCaps]}>
            CRECIMIENTO
          </Text>
          <Text style={[styles.cardTitle, TYPOGRAPHY.headlineSm]}>
            Ahorro vs. Meses Anteriores
          </Text>
        </View>

        {historyComparison && (
          <View style={historyComparison.isPositive ? styles.statusBadgeIncome : styles.statusBadgeExpense}>
            <Text
              style={[
                styles.statusBadgeText,
                TYPOGRAPHY.labelCaps,
                { color: historyComparison.isPositive ? COLORS.cashflowIncome : COLORS.cashflowExpense },
              ]}
            >
              {historyComparison.isPositive ? '+' : ''}{historyComparison.pct}% vs {historyComparison.prevLabel}
            </Text>
          </View>
        )}
      </View>

      {/* 4-Month Column Chart */}
      <View style={styles.historyChartContainer}>
        <View style={styles.columnsRow}>
          {monthlyHistory.map((m, idx) => {
            const isCurrent = idx === monthlyHistory.length - 1;
            // Normalize bar height based on max net savings or min 15%
            const maxSavings = Math.max(1, ...monthlyHistory.map(h => Math.max(0, h.netSavings)));
            const barRatio = Math.max(0.15, Math.min(1.0, Math.max(0, m.netSavings) / maxSavings));
            const barHeightPercent = Math.round(barRatio * 85);
            const displayVal = `$${Math.round(Math.max(0, m.netSavings) / 100000)}k`;

            return (
              <View key={m.period} style={styles.barColumnWrapper}>
                <Text style={[styles.barAmountLabel, TYPOGRAPHY.labelCaps]}>
                  {displayVal}
                </Text>
                <View style={styles.barTrackArea}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${barHeightPercent}%`,
                        backgroundColor: isCurrent
                          ? COLORS.primaryContainer
                          : COLORS.surfaceContainerHighest,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barMonthLabel,
                    TYPOGRAPHY.labelCaps,
                    isCurrent && styles.barMonthLabelActive,
                  ]}
                >
                  {m.monthLabel}
                </Text>
              </View>
            );
          })}
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
  sectionCaps: {
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: COLORS.onSurface,
    marginTop: 2,
  },
  statusBadgeIncome: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  statusBadgeExpense: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
  },
  statusBadgeText: {
    fontSize: 10,
  },
  historyChartContainer: {
    paddingTop: 8,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: 8,
  },
  barColumnWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barAmountLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  barTrackArea: {
    flex: 1,
    width: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barMonthLabel: {
    color: COLORS.outline,
    fontSize: 10,
  },
  barMonthLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
