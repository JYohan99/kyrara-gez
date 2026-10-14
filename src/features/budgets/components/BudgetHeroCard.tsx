import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { formatCurrency } from '@/shared/utils/currency';

export interface BudgetHeroCardProps {
  monthName: string;
  remainingTotal: number;
  totalLimit: number;
  totalSpent: number;
  totalPercent: number;
  dayPacePercent: number;
  currentDay: number;
  paceDiff: number;
  dailyAvailable: number;
  daysRemaining: number;
  bankBalance: number;
}

export const BudgetHeroCard: React.FC<BudgetHeroCardProps> = ({
  monthName,
  remainingTotal,
  totalLimit,
  totalSpent,
  totalPercent,
  dayPacePercent,
  currentDay,
  paceDiff,
  dailyAvailable,
  daysRemaining,
  bankBalance,
}) => {
  return (
    <GlassCard style={styles.heroCard}>
      {/* Header Row */}
      <View style={styles.heroHeaderRow}>
        <View style={styles.heroTitleGroup}>
          <View style={styles.heroTitleDot} />
          <Text style={[styles.heroCategoryLabel, TYPOGRAPHY.labelCaps]}>
            Presupuesto General de {monthName}
          </Text>
        </View>

        <View
          style={[
            styles.percentBadge,
            totalPercent >= 90
              ? styles.percentBadgeWarning
              : styles.percentBadgeNormal,
          ]}
        >
          <Text
            style={[
              styles.percentBadgeText,
              TYPOGRAPHY.labelCaps,
              { color: totalPercent >= 90 ? COLORS.cashflowExpense : COLORS.secondary },
            ]}
          >
            {totalPercent}% consumido
          </Text>
        </View>
      </View>

      {/* Main Available Balance */}
      <View style={styles.heroBalanceSection}>
        <Text style={[styles.heroBalanceSubtitle, TYPOGRAPHY.bodySm]}>
          Dinero disponible restante
        </Text>
        <Text
          style={[
            styles.heroBalanceAmount,
            TYPOGRAPHY.displayHeroMobile,
            { color: remainingTotal < 0 ? COLORS.cashflowExpense : COLORS.secondary },
          ]}
        >
          {formatCurrency(remainingTotal)}
        </Text>
      </View>

      {/* Grid: Límite Total & Gasto Acumulado */}
      <View style={styles.heroGrid}>
        <View style={styles.heroGridBox}>
          <Text style={[styles.gridLabel, TYPOGRAPHY.labelCaps]}>Límite Total</Text>
          <Text style={[styles.gridValue, TYPOGRAPHY.numericTable]}>
            {formatCurrency(totalLimit)}
          </Text>
        </View>

        <View style={styles.heroGridBox}>
          <Text style={[styles.gridLabel, TYPOGRAPHY.labelCaps]}>Gasto Acumulado</Text>
          <Text
            style={[
              styles.gridValue,
              TYPOGRAPHY.numericTable,
              { color: COLORS.cashflowExpense },
            ]}
          >
            {formatCurrency(totalSpent)}
          </Text>
        </View>
      </View>

      {/* Progress Bar with Pace Indicators */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, totalPercent)}%`,
                backgroundColor:
                  totalPercent >= 100
                    ? COLORS.cashflowExpense
                    : totalPercent >= 90
                    ? '#FFB4AB'
                    : COLORS.secondaryContainer,
              },
            ]}
          />
        </View>

        {/* Pace Indicators */}
        <View style={styles.paceMarkersContainer}>
          <View
            style={[
              styles.paceMarkerDay,
              { left: `${Math.min(94, Math.max(6, dayPacePercent))}%` },
            ]}
          >
            <View style={styles.paceMarkerPip} />
            <Text style={[styles.paceMarkerText, TYPOGRAPHY.labelCaps]}>
              Día {currentDay} ({dayPacePercent}%)
            </Text>
          </View>

          <View
            style={[
              styles.paceMarkerSpend,
              { left: `${Math.min(95, Math.max(10, totalPercent))}%` },
            ]}
          >
            <Text
              style={[
                styles.paceDiffText,
                TYPOGRAPHY.labelCaps,
                {
                  color:
                    paceDiff > 0
                      ? COLORS.cashflowExpense
                      : COLORS.cashflowIncome,
                },
              ]}
            >
              {paceDiff > 0 ? `+${paceDiff}% ritmo` : `${paceDiff}% ritmo`}
            </Text>
          </View>
        </View>
      </View>

      {/* Insight Speed Badge & Bank Reference */}
      <View style={styles.insightSection}>
        <View style={styles.insightBadge}>
          <MaterialIcons name="speed" size={20} color={COLORS.secondary} />
          <Text style={[styles.insightText, TYPOGRAPHY.bodySm]}>
            Te quedan{' '}
            <Text style={styles.insightHighlight}>
              {formatCurrency(dailyAvailable)}/día
            </Text>{' '}
            para los {daysRemaining} días restantes del mes.
          </Text>
        </View>

        <View style={styles.bankReferenceRow}>
          <Text style={[styles.bankReferenceLabel, TYPOGRAPHY.bodySm]}>
            En cuentas bancarias:
          </Text>
          <Text style={[styles.bankReferenceValue, TYPOGRAPHY.numericTable]}>
            {formatCurrency(bankBalance)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 28, 29, 0.95)',
    gap: 14,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  heroCategoryLabel: {
    color: COLORS.secondary,
    letterSpacing: 1.1,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentBadgeNormal: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
  },
  percentBadgeWarning: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  percentBadgeText: {
    fontSize: 10,
  },
  heroBalanceSection: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  heroBalanceSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  heroBalanceAmount: {
    fontWeight: '700',
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  heroGridBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHighest,
    gap: 4,
  },
  gridLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  gridValue: {
    color: COLORS.onSurface,
  },
  progressContainer: {
    gap: 8,
    paddingTop: 4,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainerHighest,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  paceMarkersContainer: {
    height: 20,
    position: 'relative',
  },
  paceMarkerDay: {
    position: 'absolute',
    transform: [{ translateX: -30 }],
    alignItems: 'center',
  },
  paceMarkerPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.onSurface,
    marginBottom: 2,
  },
  paceMarkerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  paceMarkerSpend: {
    position: 'absolute',
    transform: [{ translateX: -30 }],
    alignItems: 'center',
    top: 2,
  },
  paceDiffText: {
    fontSize: 9,
  },
  insightSection: {
    gap: 10,
    paddingTop: 6,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.15)',
  },
  insightText: {
    color: COLORS.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  insightHighlight: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  bankReferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  bankReferenceLabel: {
    color: COLORS.onSurfaceVariant,
  },
  bankReferenceValue: {
    color: COLORS.onSurface,
  },
});
