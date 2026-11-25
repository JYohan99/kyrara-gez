import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY, COMMON_STYLES } from '@/compartido/tema';
import { EncabezadoSuperior, BotonFlotanteAccion, EstadoVacio, TarjetaVidrio, OrbeGlossy, ChipFiltro } from '@/compartido/componentes';
import { clonarPresupuestos as cloneBudgets } from '@/datos/consultas/presupuestos';
import { PresupuestoEnriquecido } from '@/datos/tipos';
import { usePresupuestosBoveda as useVaultBudgets, useCuentasBoveda as useVaultAccounts, useCategoriasBoveda as useVaultCategories } from '@/datos/hooks';
import { gatillarSeleccion as triggerSelection, gatillarExito as triggerSuccess } from '@/compartido/utilidades/hapticos';
import { NOMBRES_MESES as MONTH_NAMES } from '@/compartido/utilidades/fecha';

import { TarjetaProgresoPresupuesto as BudgetHeroCard } from './TarjetaProgresoPresupuesto';
import { TarjetaCategoriaPresupuesto as BudgetCategoryCard } from './TarjetaCategoriaPresupuesto';
import { ModalPresupuesto as BudgetModal } from './ModalPresupuesto';
import { ModalCopiarPresupuesto as CloneBudgetModal } from './ModalCopiarPresupuesto';

type SortMode = 'PERCENT' | 'LIMIT' | 'NAME';

export function PantallaPresupuestos() {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  });

  const [sortMode, setSortMode] = useState<SortMode>('PERCENT');

  // Hooks reactivos de la bÃ³veda
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
    Alert.alert('Presupuestos duplicados', `Se copiaron ${count} lÃ­mites de ${previousMonthName}.`);
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
        <TarjetaVidrio variant="low" style={styles.navToolbarCard}>
          <OrbeGlossy
            tamano={36}
            tono="obsidiana"
            onPress={handlePrevMonth}
            accessibilityLabel="Mes anterior"
          >
            <MaterialIcons name="chevron-left" size={20} color={COLORS.onSurface} />
          </OrbeGlossy>

          <View style={styles.monthCenterInfo}>
            <Text style={[styles.monthCenterTitle, TYPOGRAPHY.headlineSm]}>
              {monthName} {year}
            </Text>
            <View style={styles.dayProgressRow}>
              <View style={styles.pulseDot} />
              <Text style={[styles.dayProgressText, TYPOGRAPHY.labelCaps]}>
                DÃ­a {currentDay} de {totalDays}
              </Text>
            </View>
          </View>

          <OrbeGlossy
            tamano={36}
            tono="obsidiana"
            onPress={handleNextMonth}
            accessibilityLabel="Mes siguiente"
          >
            <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurface} />
          </OrbeGlossy>
        </TarjetaVidrio>

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
              LÃ­mites por CategorÃ­a
            </Text>
            <View style={styles.countBadge}>
              <Text style={[styles.countBadgeText, TYPOGRAPHY.labelCaps]}>
                {budgets.length}
              </Text>
            </View>
          </View>

          <ChipFiltro
            etiqueta={
              sortMode === 'PERCENT'
                ? '% Gastado'
                : sortMode === 'LIMIT'
                ? 'LÃ­mite'
                : 'Nombre'
            }
            icono="sort"
            activo
            tono="cian"
            onPress={toggleSort}
          />
        </View>

        {/* Empty state or Budget List */}
        {sortedBudgets.length === 0 ? (
          <EstadoVacio
            icono="donut-large"
            colorIcono={COLORS.primary}
            titulo="Define tus topes mensuales"
            descripcion="Asigna un lÃ­mite de gasto a categorÃ­as como AlimentaciÃ³n o Transporte para recibir alertas visuales antes de superarlo."
          >
            <View style={styles.emptyActionsRow}>
              <ChipFiltro
                etiqueta="Crear lÃ­mite"
                icono="add"
                activo
                tono="cian"
                mayusculas
                onPress={openNewModal}
              />
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

        {/* BOTTOM FAST-ACTION CARD: Duplicar patrÃ³n */}
        {sortedBudgets.length > 0 && (
          <TarjetaVidrio variant="surface" style={styles.bottomBannerCard}>
            <View style={styles.bottomBannerLeft}>
              <OrbeGlossy tamano={42} tono="violeta" sombra>
                <MaterialIcons name="history-toggle-off" size={20} color="#FFFFFF" />
              </OrbeGlossy>
              <View style={styles.bottomBannerTextCol}>
                <Text style={[styles.bottomBannerCaps, TYPOGRAPHY.labelCaps]}>
                  DUPLICAR PATRÃ“N
                </Text>
                <Text style={[styles.bottomBannerTitle, TYPOGRAPHY.bodySm]}>
                  Copia los lÃ­mites de {previousMonthName} en 1 toque
                </Text>
              </View>
            </View>

            <ChipFiltro
              etiqueta="Aplicar"
              activo
              tono="violeta"
              mayusculas
              onPress={() => setCloneModalVisible(true)}
            />
          </TarjetaVidrio>
        )}
      </ScrollView>

      {/* BotÃ³n Circular Flotante (FAB) - Nuevo Presupuesto */}
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
  navToolbarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  monthCenterInfo: {
    alignItems: 'center',
  },
  monthCenterTitle: {
    color: '#FFFFFF',
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
    fontSize: 9.5,
  },
  categoriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    gap: 8,
  },
  catTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 210, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.2)',
  },
  countBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  budgetList: {
    gap: 12,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  bottomBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    gap: 10,
  },
  bottomBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
});

