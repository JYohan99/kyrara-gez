import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { PresupuestoEnriquecido } from '@/datos/tipos';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';

export interface PropiedadesTarjetaCategoriaPresupuesto {
  budget: PresupuestoEnriquecido;
  onPress: () => void;
}
export type BudgetCategoryCardProps = PropiedadesTarjetaCategoriaPresupuesto;

export const TarjetaCategoriaPresupuesto: React.FC<PropiedadesTarjetaCategoriaPresupuesto> = ({
  budget,
  onPress,
}) => {
  const isOver = budget.isOverBudget;
  const isNear = budget.isNearLimit;
  const progressColor = isOver
    ? COLORS.cashflowExpense
    : isNear
    ? '#FF8A9E'
    : budget.percent === 100
    ? COLORS.primary
    : COLORS.secondaryContainer;

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.categoryCardTop}>
        <View style={styles.categoryLeftCol}>
          <View
            style={[
              styles.catIconBox,
              { backgroundColor: `${budget.categoryColor}25` },
            ]}
          >
            <MaterialIcons
              name={budget.categoryIcon as any || 'category'}
              size={22}
              color={budget.categoryColor || COLORS.primary}
            />
          </View>
          <View style={styles.catTitleCol}>
            <View style={styles.catNameRow}>
              <Text style={[styles.catName, TYPOGRAPHY.headlineSm]}>
                {budget.categoryName}
              </Text>
              {isOver && (
                <View style={styles.statusPillExpense}>
                  <Text style={[styles.statusPillTextExpense, TYPOGRAPHY.labelCaps]}>
                    Excedido
                  </Text>
                </View>
              )}
              {!isOver && isNear && (
                <View style={styles.statusPillWarning}>
                  <Text style={[styles.statusPillTextWarning, TYPOGRAPHY.labelCaps]}>
                    Cerca del límite
                  </Text>
                </View>
              )}
              {!isOver && !isNear && budget.percent === 100 && (
                <View style={styles.statusPillDone}>
                  <Text style={[styles.statusPillTextDone, TYPOGRAPHY.labelCaps]}>
                    Completado
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.catSubtext, TYPOGRAPHY.bodySm]}>
              Presupuesto fijado
            </Text>
          </View>
        </View>

        <MaterialIcons
          name="more-vert"
          size={20}
          color={COLORS.onSurfaceVariant}
        />
      </View>

      {/* 3-Column Stats Row */}
      <View style={styles.catStatsGrid}>
        <View style={styles.statColLeft}>
          <Text style={[styles.statLabel, TYPOGRAPHY.labelCaps]}>Límite</Text>
          <Text style={[styles.statValue, TYPOGRAPHY.numericTable]}>
            {formatCurrency(budget.monthlyLimit, { showDecimals: false })}
          </Text>
        </View>

        <View style={styles.statColCenter}>
          <Text style={[styles.statLabel, TYPOGRAPHY.labelCaps]}>
            Gastado ({budget.percent}%)
          </Text>
          <Text
            style={[
              styles.statValue,
              TYPOGRAPHY.numericTable,
              isOver && { color: COLORS.cashflowExpense },
            ]}
          >
            {formatCurrency(budget.spent, { showDecimals: false })}
          </Text>
        </View>

        <View style={styles.statColRight}>
          <Text
            style={[
              styles.statLabel,
              TYPOGRAPHY.labelCaps,
              { color: isNear ? COLORS.cashflowExpense : COLORS.secondary },
            ]}
          >
            Disponible
          </Text>
          <Text
            style={[
              styles.statValue,
              TYPOGRAPHY.numericTable,
              {
                color: isNear
                  ? COLORS.cashflowExpense
                  : COLORS.secondary,
                fontWeight: '700',
              },
            ]}
          >
            {formatCurrency(budget.remaining, { showDecimals: false })}
          </Text>
        </View>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.catProgressBarTrack}>
        <View
          style={[
            styles.catProgressBarFill,
            {
              width: `${Math.min(100, budget.percent)}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainer,
    gap: 14,
  },
  categoryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitleCol: {
    flex: 1,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    color: COLORS.onSurface,
  },
  statusPillExpense: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  statusPillTextExpense: {
    color: COLORS.cashflowExpense,
    fontSize: 9,
  },
  statusPillWarning: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 183, 77, 0.15)',
  },
  statusPillTextWarning: {
    color: '#FFB74D',
    fontSize: 9,
  },
  statusPillDone: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
  },
  statusPillTextDone: {
    color: COLORS.secondary,
    fontSize: 9,
  },
  catSubtext: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  catStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statColLeft: {
    alignItems: 'flex-start',
  },
  statColCenter: {
    alignItems: 'center',
  },
  statColRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.onSurface,
  },
  catProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
    overflow: 'hidden',
  },
  catProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export const BudgetCategoryCard = TarjetaCategoriaPresupuesto;
