import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY, COMMON_STYLES } from '@/compartido/tema';
import { EncabezadoSuperior, BotonFlotanteAccion, EstadoVacio } from '@/compartido/componentes';
import { clonarPresupuestos as cloneBudgets, sembrarPresupuestosRecomendados as seedRecommendedBudgets } from '@/datos/consultas/presupuestos';
import { PresupuestoEnriquecido } from '@/datos/tipos';
import { usePresupuestosBoveda as useVaultBudgets, useCuentasBoveda as useVaultAccounts, useCategoriasBoveda as useVaultCategories } from '@/datos/hooks';
import { gatillarSeleccion as triggerSelection, gatillarExito as triggerSuccess } from '@/compartido/utilidades/hapticos';

import { TarjetaProgresoPresupuesto as BudgetHeroCard } from './TarjetaProgresoPresupuesto';
import { TarjetaCategoriaPresupuesto as BudgetCategoryCard } from './TarjetaCategoriaPresupuesto';
import { ModalPresupuesto as BudgetModal } from './ModalPresupuesto';
import { ModalCopiarPresupuesto as CloneBudgetModal } from './ModalCopiarPresupuesto';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type SortMode = 'PERCENT' | 'LIMIT' | 'NAME';

export function PantallaPresupuestos() {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  });

  const [sortMode, setSortMode] = useState<SortMode>('PERCENT');

  // Hooks reactivos de la bóveda
  const { budgets } = useVaultBudgets(period);
  const { totalBalance: bankBalance } = useVaultAccounts();
  const { categories: expenseCategories } = useVaultCategories('EXPENSE');

  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<PresupuestoEnriquecido | null>(null);
  const [cloneModalVisible, setCloneModalVisible] = useState(false);

  // Parse Year and Month
  const [year, month] = useMemo(() => {
    const [yStr, mStr] = period.split('-');
    return [parseInt(yStr, 10), parseInt(mStr, 10)];
  }, [period]);

  const monthName = MONTH_NAMES[month - 1] || '';
  const previousPeriod = useMemo(() => {
    const prevDate = new Date(year, month - 2, 1);
    const py = prevDate.getFullYear();
    const pm = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    return `${py}-${pm}`;
  }, [year, month]);

  const previousMonthName = useMemo(() => {
    const pm = month === 1 ? 12 : month - 1;
    return MONTH_NAMES[pm - 1];
  }, [month]);

  // Days calculation for pace indicator
  const { currentDay, totalDays, dayPacePercent, daysRemaining } = useMemo(() => {
    const total = new Date(year, month, 0).getDate();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const isPastMonth = (now.getFullYear() > year) || (now.getFullYear() === year && now.getMonth() + 1 > month);

    const cur = isCurrentMonth ? now.getDate() : isPastMonth ? total : 1;
    const pace = Math.min(100, Math.round((cur / total) * 100));
    const remaining = Math.max(1, total - cur);

    return {
      currentDay: cur,
      totalDays: total,
      dayPacePercent: pace,
      daysRemaining: remaining,
    };
  }, [year, month]);

  // General Totals
  const { totalLimit, totalSpent, remainingTotal, totalPercent, paceDiff, dailyAvailable } = useMemo(() => {
    const limit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const spent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const rem = limit - spent;
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const diff = pct - dayPacePercent;
    const daily = rem > 0 ? Math.round(rem / daysRemaining) : 0;

    return {
      totalLimit: limit,
      totalSpent: spent,
      remainingTotal: rem,
      totalPercent: pct,
      paceDiff: diff,
      dailyAvailable: daily,
    };
  }, [budgets, dayPacePercent, daysRemaining]);

  // Month navigation
  const handlePrevMonth = () => {
    triggerSelection();
    const d = new Date(year, month - 2, 1);
    const py = d.getFullYear();
    const pm = (d.getMonth() + 1).toString().padStart(2, '0');
    setPeriod(`${py}-${pm}`);
  };

  const handleNextMonth = () => {
    triggerSelection();
    const d = new Date(year, month, 1);
    const py = d.getFullYear();
    const pm = (d.getMonth() + 1).toString().padStart(2, '0');
    setPeriod(`${py}-${pm}`);
  };

  // Sorting
  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      if (sortMode === 'PERCENT') {
        return b.percent - a.percent;
      } else if (sortMode === 'LIMIT') {
        return b.monthlyLimit - a.monthlyLimit;
      } else {
        return a.categoryName.localeCompare(b.categoryName);
      }
    });
  }, [budgets, sortMode]);

  const toggleSort = () => {
    triggerSelection();
    if (sortMode === 'PERCENT') setSortMode('LIMIT');
    else if (sortMode === 'LIMIT') setSortMode('NAME');
    else setSortMode('PERCENT');
  };

  const openEditModal = (budget: PresupuestoEnriquecido) => {
    triggerSelection();
    setEditingBudget(budget);
    setModalVisible(true);
  };

  const openNewModal = () => {
    triggerSelection();
    setEditingBudget(null);
    setModalVisible(true);
  };

  const handleCloneMonth = () => {
    const count = cloneBudgets(previousPeriod, period);
    setCloneModalVisible(false);
    triggerSuccess();
    Alert.alert('Presupuestos duplicados', `Se copiaron ${count} límites de ${previousMonthName}.`);
  };

  const handleSeedDefaults = () => {
    triggerSelection();
    seedRecommendedBudgets(period);
    triggerSuccess();
  };

  return (
    <View style={COMMON_STYLES.screen}>
      {/* Top Header */}
      <EncabezadoSuperior
        seccion="PRESUPUESTOS"
        etiquetaPeriodo={`${monthName.substring(0, 3)} ${year}`}
      />

      <ScrollView
        contentContainerStyle={COMMON_STYLES.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Navigator Toolbar */}
        <View style={styles.navToolbar}>
          <View style={styles.monthSelector}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navArrowBtn}
              accessibilityLabel="Mes anterior"
            >
              <MaterialIcons name="chevron-left" size={20} color={COLORS.onSurface} />
            </TouchableOpacity>

            <View style={styles.monthCenterInfo}>
              <Text style={[styles.monthCenterTitle, TYPOGRAPHY.headlineSm]}>
                {monthName} {year}
              </Text>
              <View style={styles.dayProgressRow}>
                <View style={styles.pulseDot} />
                <Text style={[styles.dayProgressText, TYPOGRAPHY.labelCaps]}>
                  Día {currentDay} de {totalDays}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrowBtn}
              accessibilityLabel="Mes siguiente"
            >
              <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

        </View>

        {/* HERO CARD: Presupuesto General */}
        <BudgetHeroCard
          monthName={monthName}
          remainingTotal={remainingTotal}
          totalLimit={totalLimit}
          totalSpent={totalSpent}
          totalPercent={totalPercent}
          dayPacePercent={dayPacePercent}
          currentDay={currentDay}
          paceDiff={paceDiff}
          dailyAvailable={dailyAvailable}
          daysRemaining={daysRemaining}
          bankBalance={bankBalance}
        />

        {/* CATEGORIES SECTION */}
        <View style={styles.categoriesHeaderRow}>
          <View style={styles.catTitleWithCount}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.titleBalance]}>
              Límites por Categoría
            </Text>
            <View style={styles.countBadge}>
              <Text style={[styles.countBadgeText, TYPOGRAPHY.labelCaps]}>
                {budgets.length} Activas
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={toggleSort} activeOpacity={0.7}>
            <Text style={[styles.sortButtonText, TYPOGRAPHY.labelCaps]}>
              Ordenar:{' '}
              {sortMode === 'PERCENT'
                ? '% Gastado'
                : sortMode === 'LIMIT'
                ? 'Límite'
                : 'Nombre'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty state or Budget List */}
        {sortedBudgets.length === 0 ? (
          <EstadoVacio
            icono="donut-large"
            colorIcono={COLORS.primary}
            titulo="Define tus topes mensuales"
            descripcion="Asigna un límite de gasto a categorías como Alimentación o Transporte para recibir alertas visuales antes de superarlo."
          >
            <View style={styles.emptyActionsRow}>
              <TouchableOpacity
                style={styles.emptySeedBtn}
                onPress={handleSeedDefaults}
                activeOpacity={0.8}
              >
                <MaterialIcons name="auto-awesome" size={18} color="#FFFFFF" />
                <Text style={[styles.emptySeedBtnText, TYPOGRAPHY.labelCaps]}>
                  Cargar sugeridos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyNewBtn}
                onPress={openNewModal}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={18} color={COLORS.primary} />
                <Text style={[styles.emptyNewBtnText, TYPOGRAPHY.labelCaps]}>
                  Crear límite
                </Text>
              </TouchableOpacity>
            </View>
          </EstadoVacio>
        ) : (
          <View style={styles.budgetList}>
            {sortedBudgets.map(b => (
              <BudgetCategoryCard
                key={b.id}
                budget={b}
                onPress={() => openEditModal(b)}
              />
            ))}
          </View>
        )}

        {/* BOTTOM FAST-ACTION CARD: Duplicar patrón */}
        {sortedBudgets.length > 0 && (
          <View style={styles.bottomBannerCard}>
            <View style={styles.bottomBannerLeft}>
              <View style={styles.bottomBannerIconBox}>
                <MaterialIcons name="history-toggle-off" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.bottomBannerTextCol}>
                <Text style={[styles.bottomBannerCaps, TYPOGRAPHY.labelCaps]}>
                  DUPLICAR PATRÓN
                </Text>
                <Text style={[styles.bottomBannerTitle, TYPOGRAPHY.bodySm]}>
                  Copia los límites de {previousMonthName} en 1 toque
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bottomBannerApplyBtn}
              onPress={() => {
                triggerSelection();
                setCloneModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.bottomBannerApplyText, TYPOGRAPHY.labelCaps]}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Botón Circular Flotante (FAB) - Nuevo Presupuesto */}
      <BotonFlotanteAccion
        onPress={openNewModal}
        accessibilityLabel="Nuevo presupuesto"
      />

      {/* MODAL: EDIT / CREATE BUDGET */}
      <BudgetModal
        visible={modalVisible}
        period={period}
        editingBudget={editingBudget}
        categories={expenseCategories}
        existingBudgets={budgets}
        onClose={() => setModalVisible(false)}
      />

      {/* MODAL: CLONE CONFIRMATION */}
      <CloneBudgetModal
        visible={cloneModalVisible}
        previousMonthName={previousMonthName}
        monthName={monthName}
        year={year}
        onConfirm={handleCloneMonth}
        onClose={() => setCloneModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterInfo: {
    alignItems: 'flex-start',
  },
  monthCenterTitle: {
    color: COLORS.onSurface,
  },
  dayProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cashflowIncome,
  },
  dayProgressText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  categoriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  catTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  countBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  sortButtonText: {
    color: COLORS.secondary,
    letterSpacing: 0.8,
  },
  budgetList: {
    gap: 12,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  emptySeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
  },
  emptySeedBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  emptyNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  emptyNewBtnText: {
    color: COLORS.primary,
    fontSize: 10,
  },
  bottomBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(24, 28, 29, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bottomBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bottomBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBannerTextCol: {
    flex: 1,
  },
  bottomBannerCaps: {
    color: COLORS.primary,
    fontSize: 9,
  },
  bottomBannerTitle: {
    color: COLORS.onSurface,
    marginTop: 2,
  },
  bottomBannerApplyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  bottomBannerApplyText: {
    color: COLORS.onSurface,
    fontSize: 10,
  },
});

export const BudgetsScreen = PantallaPresupuestos;
