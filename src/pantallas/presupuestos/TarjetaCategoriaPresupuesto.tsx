import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { IconoCategoria } from '@/compartido/componentes/IconoCategoria';
import { TarjetaVidrio } from '@/compartido/componentes/TarjetaVidrio';
import { OrbeGlossy } from '@/compartido/componentes/OrbeGlossy';
import { BarraProgreso3D } from '@/compartido/componentes/BarraProgreso3D';
import { PresupuestoEnriquecido } from '@/datos/tipos';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';

export interface PropiedadesTarjetaCategoriaPresupuesto {
  budget: PresupuestoEnriquecido;
  onPress: () => void;
}

export const TarjetaCategoriaPresupuesto: React.FC<PropiedadesTarjetaCategoriaPresupuesto> = ({
  budget,
  onPress,
}) => {
  const isOver = budget.isOverBudget;
  const isNear = budget.isNearLimit;
  const tonoProgreso = isOver
    ? 'gasto'
    : isNear
    ? 'alerta'
    : budget.percent === 100
    ? 'violeta'
    : 'cian';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
    >
      <TarjetaVidrio variant="surface" style={styles.categoryCard}>
        <View style={styles.categoryCardTop}>
          <View style={styles.categoryLeftCol}>
            <OrbeGlossy tamano={44} tono="obsidiana">
              <IconoCategoria
                icon={budget.categoryIcon}
                size={22}
                color={budget.categoryColor || COLORS.primary}
              />
            </OrbeGlossy>
          <View style={styles.catTitleCol}>
            <View style={styles.catNameRow}>
              <Text style={[styles.catName, TYPOGRAPHY.headlineSm]} numberOfLines={1}>
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
          name="chevron-right"
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
      <BarraProgreso3D
        porcentaje={budget.percent}
        tono={tonoProgreso}
        altura={8}
      />
      </TarjetaVidrio>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    padding: 16,
    borderRadius: 18,
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
  catTitleCol: {
    flex: 1,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    color: '#FFFFFF',
    flexShrink: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 13, 15, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.08)',
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
});

export const BudgetCategoryCard = TarjetaCategoriaPresupuesto;
