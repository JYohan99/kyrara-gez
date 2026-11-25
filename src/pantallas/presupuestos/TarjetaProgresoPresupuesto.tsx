import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard, OrbeGlossy, BarraProgreso3D } from '@/compartido/componentes';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';

export interface PropiedadesTarjetaProgresoPresupuesto {
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

export const TarjetaProgresoPresupuesto: React.FC<PropiedadesTarjetaProgresoPresupuesto> = ({
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
  const isOver = totalPercent >= 100 || remainingTotal < 0;
  const isWarning = totalPercent >= 90;

  return (
    <GlassCard variant="high" style={styles.heroCard}>
      {/* Header Row */}
      <View style={styles.heroHeaderRow}>
        <OrbeGlossy tamano={42} tono={isOver ? 'gasto' : 'cian'} sombra>
          <MaterialIcons name="donut-large" size={20} color="#FFFFFF" />
        </OrbeGlossy>

        <View style={styles.heroHeaderTextCol}>
          <Text style={[styles.heroCategoryLabel, TYPOGRAPHY.labelCaps]}>
            Presupuesto General
          </Text>
          <Text style={styles.heroMonthSub} numberOfLines={1}>
            {monthName} • Dinero disponible restante
          </Text>
        </View>

        <View
          style={[
            styles.percentBadge,
            isWarning ? styles.percentBadgeWarning : styles.percentBadgeNormal,
          ]}
        >
          <Text
            style={[
              styles.percentBadgeText,
              TYPOGRAPHY.labelCaps,
              { color: isWarning ? COLORS.cashflowExpense : COLORS.secondary },
            ]}
          >
            {totalPercent}%
          </Text>
        </View>
      </View>

      {/* Main Available Balance */}
      <View style={styles.heroBalanceSection}>
        <Text
          style={[
            styles.heroBalanceAmount,
            TYPOGRAPHY.displayHeroMobile,
            { color: remainingTotal < 0 ? COLORS.cashflowExpense : '#FFFFFF' },
          ]}
        >
          {formatCurrency(remainingTotal)}
        </Text>
      </View>

      {/* Grid: Límite Total & Gasto Acumulado */}
      <View style={styles.heroGrid}>
        <View style={styles.heroGridBox}>
          <Text style={[styles.gridLabel, TYPOGRAPHY.labelCaps]}>Límite Total</Text>
          <Text style={[styles.gridValue, TYPOGRAPHY.numericTable]} numberOfLines={1}>
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
            numberOfLines={1}
          >
            {formatCurrency(totalSpent)}
          </Text>
        </View>
      </View>

      {/* Progress Bar with Clean Non-Overlapping Pace Row */}
      <View style={styles.progressContainer}>
        <BarraProgreso3D
          porcentaje={totalPercent}
          tono={totalPercent >= 100 ? 'gasto' : totalPercent >= 90 ? 'alerta' : 'cian'}
          altura={10}
        />

        <View style={styles.paceFooterRow}>
          <View style={styles.paceDayGroup}>
            <View style={styles.paceMarkerPip} />
            <Text style={[styles.paceMarkerText, TYPOGRAPHY.labelCaps]}>
              Día {currentDay} ({dayPacePercent}% del mes)
            </Text>
          </View>

          <View
            style={[
              styles.pacePill,
              paceDiff > 0 ? styles.pacePillExpense : styles.pacePillIncome,
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
          <OrbeGlossy tamano={30} tono="cian">
            <MaterialIcons name="speed" size={16} color="#FFFFFF" />
          </OrbeGlossy>
          <Text style={[styles.insightText, TYPOGRAPHY.bodySm]}>
            Te quedan{' '}
            <Text style={styles.insightHighlight}>
              {formatCurrency(dailyAvailable)}/día
            </Text>{' '}
            para los {daysRemaining} días restantes.
          </Text>
        </View>

        <View style={styles.bankReferenceRow}>
          <Text style={[styles.bankReferenceLabel, TYPOGRAPHY.bodySm]}>
            Saldo total en cuentas:
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
    borderRadius: 22,
    gap: 14,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroHeaderTextCol: {
    flex: 1,
  },
  heroCategoryLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    letterSpacing: 1,
  },
  heroMonthSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11.5,
    marginTop: 2,
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  percentBadgeNormal: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    borderColor: 'rgba(165, 231, 255, 0.25)',
  },
  percentBadgeWarning: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
    borderColor: 'rgba(255, 138, 158, 0.35)',
  },
  percentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroBalanceSection: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  heroBalanceAmount: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  heroGridBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 13, 15, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    gap: 4,
  },
  gridLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9.5,
    textAlign: 'center',
  },
  gridValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  progressContainer: {
    gap: 8,
    paddingTop: 2,
  },
  paceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paceDayGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paceMarkerPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  paceMarkerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9.5,
  },
  pacePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pacePillIncome: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  pacePillExpense: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  paceDiffText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  insightSection: {
    gap: 10,
    paddingTop: 4,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 15,
    backgroundColor: 'rgba(9, 13, 15, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 231, 255, 0.1)',
    paddingHorizontal: 2,
  },
  bankReferenceLabel: {
    color: COLORS.onSurfaceVariant,
  },
  bankReferenceValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

// Alias compatibles
export const BudgetHeroCard = TarjetaProgresoPresupuesto;
