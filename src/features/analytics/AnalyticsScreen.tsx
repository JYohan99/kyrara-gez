import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { KyraraEmblem } from '@/shared/components/KyraraEmblem';
import { MonthlyReportModal } from '@/shared/components/MonthlyReportModal';
import { TransactionDetailModal } from '@/shared/components/TransactionDetailModal';
import { triggerSelection } from '@/shared/utils/haptics';
import { useVaultAnalytics } from '@/core/state';
import { EnrichedTransaction } from '@/core/database/types';

import { PeriodOption, PeriodSelectorPills } from './components/PeriodSelectorPills';
import { BalanceSummaryCard } from './components/BalanceSummaryCard';
import { TrendSplineChartCard } from './components/TrendSplineChartCard';
import { CategoryDistributionCard } from './components/CategoryDistributionCard';
import { TopExpensesCard } from './components/TopExpensesCard';
import { MonthlySavingsBarChartCard } from './components/MonthlySavingsBarChartCard';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('THIS_MONTH');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Compute start and end timestamps based on selected period
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    if (selectedPeriod === 'THIS_MONTH') {
      const start = new Date(curYear, curMonth, 1).getTime();
      const end = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999).getTime();
      return { startDate: start, endDate: end, periodLabel: `${MONTH_NAMES[curMonth]} ${curYear}` };
    }

    if (selectedPeriod === 'PREV_MONTH') {
      const start = new Date(curYear, curMonth - 1, 1).getTime();
      const end = new Date(curYear, curMonth, 0, 23, 59, 59, 999).getTime();
      const prevDate = new Date(curYear, curMonth - 1, 1);
      return { startDate: start, endDate: end, periodLabel: `${MONTH_NAMES[prevDate.getMonth()]} ${prevDate.getFullYear()}` };
    }

    if (selectedPeriod === 'LAST_3_MONTHS') {
      const start = new Date(curYear, curMonth - 2, 1).getTime();
      const end = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999).getTime();
      return { startDate: start, endDate: end, periodLabel: 'Últimos 3 meses' };
    }

    if (selectedPeriod === 'LAST_6_MONTHS') {
      const start = new Date(curYear, curMonth - 5, 1).getTime();
      const end = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999).getTime();
      return { startDate: start, endDate: end, periodLabel: 'Últimos 6 meses' };
    }

    // ALL_YEAR
    const start = new Date(curYear, 0, 1).getTime();
    const end = new Date(curYear, 11, 31, 23, 59, 59, 999).getTime();
    return { startDate: start, endDate: end, periodLabel: `Año ${curYear}` };
  }, [selectedPeriod]);

  // Hook analítico reactivo de la bóveda
  const {
    summary,
    categories,
    topExpenses,
    monthlyHistory,
    timelinePoints,
  } = useVaultAnalytics(startDate, endDate);

  // Computed metrics
  const isSurplus = summary.netSavings >= 0;
  const savingsRate = summary.totalIncome > 0
    ? Math.max(0, Math.round((summary.netSavings / summary.totalIncome) * 1000) / 10)
    : 0;

  const expenseRate = summary.totalIncome > 0
    ? Math.min(100, Math.round((summary.totalExpense / summary.totalIncome) * 1000) / 10)
    : summary.totalExpense > 0 ? 100 : 0;

  // Top 3 impact percentage
  const top3Total = useMemo(() => {
    return topExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  }, [topExpenses]);

  const top3Percent = summary.totalExpense > 0
    ? Math.round((top3Total / summary.totalExpense) * 100)
    : 0;

  // Monthly savings growth vs previous month
  const historyComparison = useMemo(() => {
    if (monthlyHistory.length < 2) return null;
    const current = monthlyHistory[monthlyHistory.length - 1];
    const prev = monthlyHistory[monthlyHistory.length - 2];
    if (prev.netSavings <= 0) return null;
    const diff = current.netSavings - prev.netSavings;
    const pct = Math.round((diff / prev.netSavings) * 1000) / 10;
    return {
      diff,
      pct,
      isPositive: diff >= 0,
      prevLabel: prev.monthLabel,
    };
  }, [monthlyHistory]);

  return (
    <View style={styles.screen}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <KyraraEmblem size={32} />
          <View style={styles.brandTextCol}>
            <Text style={[styles.brandTitle, TYPOGRAPHY.headlineSm]}>Kyrara Gez</Text>
            <Text style={[styles.brandBadge, TYPOGRAPHY.labelCaps]}>ANÁLISIS</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.reportHeaderBtn}
            activeOpacity={0.8}
            onPress={() => {
              triggerSelection();
              setReportModalVisible(true);
            }}
          >
            <MaterialIcons name="assessment" size={15} color={COLORS.secondary} />
            <Text style={[styles.reportHeaderBtnText, TYPOGRAPHY.labelCaps]}>Informe</Text>
          </TouchableOpacity>
          <View style={styles.periodPillBadge}>
            <Text style={[styles.periodPillText, TYPOGRAPHY.labelCaps]}>
              {periodLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Horizontal Period Selector Pills */}
      <PeriodSelectorPills
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. BALANCE DEL PERÍODO */}
        <BalanceSummaryCard
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          netSavings={summary.netSavings}
          savingsRate={savingsRate}
          expenseRate={expenseRate}
          isSurplus={isSurplus}
        />

        {/* 2. EVOLUCIÓN DE TU DINERO (Gráfico de Tendencia SVG Fluido) */}
        <TrendSplineChartCard
          netSavings={summary.netSavings}
          isSurplus={isSurplus}
          timelinePoints={timelinePoints}
        />

        {/* 3. GASTOS POR CATEGORÍA (Distribución) */}
        <CategoryDistributionCard
          categories={categories}
        />

        {/* 4. TUS 3 COMPRAS MÁS GRANDES (Mayor Impacto) */}
        <TopExpensesCard
          topExpenses={topExpenses}
          top3Percent={top3Percent}
          onSelectTransaction={tx => {
            setSelectedTransaction(tx);
            setDetailModalVisible(true);
          }}
        />

        {/* 5. AHORRO VS. MESES ANTERIORES (Crecimiento Histórico) */}
        <MonthlySavingsBarChartCard
          monthlyHistory={monthlyHistory}
          historyComparison={historyComparison}
        />
      </ScrollView>

      {/* Monthly Report Executive Modal */}
      <MonthlyReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        monthName={periodLabel}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netSavings={summary.netSavings}
        savingsRate={savingsRate}
        topCategories={categories.map(c => ({
          name: c.categoryName,
          amount: c.totalAmount,
          percentage: c.percent,
          color: c.categoryColor || COLORS.secondary,
        }))}
        budgetHealthScore={88}
      />

      {/* Transaction Detail Voucher Modal */}
      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  topHeader: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextCol: {
    flexDirection: 'column',
  },
  brandTitle: {
    color: COLORS.onSurface,
    lineHeight: 20,
  },
  brandBadge: {
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  reportHeaderBtnText: {
    color: COLORS.secondary,
    fontSize: 10,
  },
  periodPillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(49, 53, 54, 0.7)',
  },
  periodPillText: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 18,
  },
});
