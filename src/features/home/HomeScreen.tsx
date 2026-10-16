import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { KyraraEmblem } from '@/shared/components/KyraraEmblem';
import { NewTransactionModal } from '@/shared/components/NewTransactionModal';
import { TransactionDetailModal } from '@/shared/components/TransactionDetailModal';
import { MonthlyReportModal } from '@/shared/components/MonthlyReportModal';
import { triggerSelection } from '@/shared/utils/haptics';
import { getCategoryExpenseBreakdown, FlowType } from '@/core/database';
import { EnrichedTransaction } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';
import { useVaultAccounts, useVaultTransactions } from '@/core/state';
import { TransactionRow } from '@/features/transactions';

export function HomeScreen() {
  // Hooks reactivos de la bóveda
  const { accounts, totalBalance: totalCents } = useVaultAccounts();
  const { transactions: recentTransactions, summary } = useVaultTransactions({ limit: 4 });

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<FlowType>('EXPENSE');
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const currentMonthLabel = useMemo(() => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const breakdown = useMemo(() => {
    void summary;
    try {
      return getCategoryExpenseBreakdown();
    } catch {
      return [];
    }
  }, [summary]);

  const smartInsight = useMemo(() => {
    const hasTransactions = summary.count > 0;
    if (!hasTransactions) {
      return {
        title: 'Bóveda Local Autónoma',
        body: 'Tus datos residen exclusivamente en este dispositivo. Añade tus primeros ingresos o gastos para generar auditorías y métricas automáticas.',
        icon: 'shield',
        iconColor: COLORS.cashflowIncome,
        tag: 'Modo Seguro',
        tagColor: COLORS.onSurfaceVariant,
        canOpenReport: false,
      };
    }

    const isSurplus = summary.netSavings >= 0;
    const topCat = breakdown.length > 0 ? breakdown[0] : null;

    if (summary.totalIncome > 0 && summary.totalExpense > 0) {
      const savingsRate = Math.round((summary.netSavings / summary.totalIncome) * 100);
      if (isSurplus) {
        return {
          title: `Tasa de Ahorro: ${savingsRate}% del mes`,
          body: `Has retenido +${formatCurrency(summary.netSavings)}. ${
            topCat ? `Tu mayor egreso es ${topCat.categoryName} (${topCat.percent.toFixed(0)}%).` : ''
          } Toca para ver el informe ejecutivo.`,
          icon: 'savings',
          iconColor: COLORS.cashflowIncome,
          tag: 'Salud Óptima',
          tagColor: COLORS.cashflowIncome,
          canOpenReport: true,
        };
      } else {
        return {
          title: `Déficit Detectado: -${formatCurrency(Math.abs(summary.netSavings))}`,
          body: `Los gastos superan tus ingresos este mes. ${
            topCat ? `El ${topCat.percent.toFixed(0)}% se fue en ${topCat.categoryName}.` : ''
          } Toca para revisar el balance detallado.`,
          icon: 'warning',
          iconColor: COLORS.cashflowExpense,
          tag: 'Atención',
          tagColor: COLORS.cashflowExpense,
          canOpenReport: true,
        };
      }
    } else if (summary.totalIncome > 0) {
      return {
        title: `Ingresos Acumulados: +${formatCurrency(summary.totalIncome)}`,
        body: 'Excelente inicio de período. Aún no registras gastos este mes. Toca para ver el balance mensual.',
        icon: 'trending-up',
        iconColor: COLORS.cashflowIncome,
        tag: '100% Ahorro',
        tagColor: COLORS.cashflowIncome,
        canOpenReport: true,
      };
    } else {
      return {
        title: `Gastos del Mes: -${formatCurrency(summary.totalExpense)}`,
        body: `${
          topCat ? `Tu mayor gasto está en ${topCat.categoryName} (${topCat.percent.toFixed(0)}%).` : ''
        } Recuerda registrar tus ingresos para calcular tu tasa de ahorro. Toca para ver el informe.`,
        icon: 'analytics',
        iconColor: COLORS.secondary,
        tag: 'Egresos',
        tagColor: COLORS.secondary,
        canOpenReport: true,
      };
    }
  }, [summary, breakdown]);

  const openModal = (type: FlowType) => {
    triggerSelection();
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <KyraraEmblem size={36} />
          <View style={styles.headerTitles}>
            <Text style={[styles.brandName, TYPOGRAPHY.headlineSm]}>Kyrara Gez</Text>
            <Text style={[styles.screenSubtitle, TYPOGRAPHY.labelCaps]}>Inicio</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.monthBadge}>
            <Text style={[styles.monthText, TYPOGRAPHY.labelCaps]}>{currentMonthLabel}</Text>
            <MaterialIcons name="expand-more" size={16} color={COLORS.secondary} />
          </View>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Line */}
        <View style={styles.statusRow}>
          <View style={styles.dateSelector}>
            <MaterialIcons name="calendar-today" size={14} color={COLORS.secondary} />
            <Text style={[styles.dateText, TYPOGRAPHY.numericTable]}>{currentMonthLabel}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, TYPOGRAPHY.labelCaps]}>Al día • Local</Text>
          </View>
        </View>

        {/* Hero Card: Dinero Disponible */}
        <GlassCard style={styles.heroCard}>
          {/* Ambient Glows */}
          <View style={styles.heroGlowPurple} />
          <View style={styles.heroGlowCyan} />

          <View style={styles.heroHeader}>
            <View style={styles.heroLabelRow}>
              <Text style={[styles.heroLabel, TYPOGRAPHY.labelCaps]}>Dinero disponible</Text>
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  setIsBalanceHidden(!isBalanceHidden);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeBtn}
              >
                <MaterialIcons
                  name={isBalanceHidden ? 'visibility-off' : 'visibility'}
                  size={18}
                  color={COLORS.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.flowBadge}>
              <MaterialIcons name="auto-awesome" size={12} color={COLORS.primary} />
            </View>
          </View>

          {/* Hero Figure */}
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceNumber, TYPOGRAPHY.displayHeroMobile]}>
              {formatCurrency(totalCents, { hidden: isBalanceHidden })}
            </Text>
          </View>

          {/* Cashflow Quick Metrics Strip */}
          <View style={styles.metricsStrip}>
            {/* Ingresos */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeading}>
                <MaterialIcons name="trending-up" size={14} color={COLORS.cashflowIncome} />
                <Text style={[styles.metricLabel, { color: COLORS.cashflowIncome }, TYPOGRAPHY.labelCaps]}>
                  Ingresos
                </Text>
              </View>
              <Text style={[styles.metricValue, TYPOGRAPHY.numericTable]}>
                +{formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            {/* Gastos */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeading}>
                <MaterialIcons name="trending-down" size={14} color={COLORS.cashflowExpense} />
                <Text style={[styles.metricLabel, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                  Gastos
                </Text>
              </View>
              <Text style={[styles.metricValue, TYPOGRAPHY.numericTable]}>
                -{formatCurrency(summary.totalExpense)}
              </Text>
            </View>

            {/* Superávit */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeading}>
                <MaterialIcons name="savings" size={14} color={COLORS.primary} />
                <Text style={[styles.metricLabel, { color: COLORS.primary }, TYPOGRAPHY.labelCaps]}>
                  Superávit
                </Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  summary.netSavings >= 0 ? { color: COLORS.primaryFixedDim } : { color: COLORS.cashflowExpense },
                  TYPOGRAPHY.numericTable,
                ]}
              >
                {summary.netSavings >= 0 ? '+' : ''}
                {formatCurrency(summary.netSavings)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Operational Actions (Gasto, Ingreso, Traspaso) */}
        <GlassCard variant="low" style={styles.quickActionsCard}>
          <View style={styles.sectionHeaderSimple}>
            <Text style={[styles.sectionTitleCaps, TYPOGRAPHY.labelCaps]}>Acceso rápido</Text>
            <Text style={[styles.sectionLink, TYPOGRAPHY.labelCaps]}>Operar</Text>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionBtnExpense}
              activeOpacity={0.7}
              onPress={() => openModal('EXPENSE')}
            >
              <MaterialIcons name="remove-circle-outline" size={18} color={COLORS.cashflowExpense} />
              <Text style={[styles.actionBtnText, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                Gasto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnIncome}
              activeOpacity={0.7}
              onPress={() => openModal('INCOME')}
            >
              <MaterialIcons name="add-circle-outline" size={18} color={COLORS.cashflowIncome} />
              <Text style={[styles.actionBtnText, { color: COLORS.cashflowIncome }, TYPOGRAPHY.labelCaps]}>
                Ingreso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnTransfer}
              activeOpacity={0.7}
              onPress={() => openModal('TRANSFER')}
            >
              <MaterialIcons name="swap-horiz" size={18} color={COLORS.primary} />
              <Text style={[styles.actionBtnText, { color: COLORS.primary }, TYPOGRAPHY.labelCaps]}>
                Traspaso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnReport}
              activeOpacity={0.7}
              onPress={() => {
                triggerSelection();
                setReportModalVisible(true);
              }}
            >
              <MaterialIcons name="assessment" size={17} color={COLORS.secondary} />
              <Text style={[styles.actionBtnText, { color: COLORS.secondary }, TYPOGRAPHY.labelCaps]}>
                Informe
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Mis Cuentas */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.headlineSm]}>Mis cuentas</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/cuentas')}>
              <Text style={[styles.sectionActionText, TYPOGRAPHY.labelCaps]}>
                {accounts.length} configuradas
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.accountsGrid}>
            {accounts.map(acc => (
              <GlassCard key={acc.id} variant="high" style={styles.accountCard}>
                <View style={styles.accountCardTop}>
                  <View
                    style={[
                      styles.accountIconBox,
                      {
                        backgroundColor:
                          acc.type === 'CASH'
                            ? `${COLORS.cashflowIncome}20`
                            : acc.type === 'BANK'
                              ? `${COLORS.secondaryContainer}20`
                              : `${COLORS.primaryContainer}20`,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={
                        acc.type === 'CASH'
                          ? 'payments'
                          : acc.type === 'BANK'
                            ? 'account-balance'
                            : acc.type === 'PREPAID'
                              ? 'credit-card'
                              : 'lock'
                      }
                      size={18}
                      color={
                        acc.type === 'CASH'
                          ? COLORS.cashflowIncome
                          : acc.type === 'BANK'
                            ? COLORS.secondary
                            : COLORS.primary
                      }
                    />
                  </View>
                  <Text style={[styles.accountTypeBadge, TYPOGRAPHY.labelCaps]}>
                    {acc.type === 'CASH'
                      ? 'Físico'
                      : acc.type === 'BANK'
                        ? 'Banco'
                        : acc.type === 'PREPAID'
                          ? 'Virtual'
                          : 'Vault'}
                  </Text>
                </View>

                <View style={styles.accountCardBottom}>
                  <Text style={[styles.accountCardName, TYPOGRAPHY.bodySm]}>{acc.name}</Text>
                  <Text style={[styles.accountCardBalance, TYPOGRAPHY.numericTable]}>
                    {formatCurrency(acc.currentBalance, { hidden: isBalanceHidden })}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Section: Últimos Movimientos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.headlineSm]}>Últimos movimientos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/movimientos')}>
              <View style={styles.viewAllRow}>
                <Text style={[styles.viewAllText, TYPOGRAPHY.labelCaps]}>Ver todos</Text>
                <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <GlassCard variant="surface" style={styles.recentEmptyCard}>
              <MaterialIcons name="receipt-long" size={24} color={COLORS.outline} />
              <Text style={[styles.recentEmptyText, TYPOGRAPHY.bodySm]}>
                Aún no has registrado transacciones este mes.
              </Text>
              <TouchableOpacity onPress={() => openModal('EXPENSE')}>
                <Text style={[styles.recentAddLink, TYPOGRAPHY.labelCaps]}>
                  + Añadir un gasto o ingreso
                </Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <View style={styles.recentList}>
              {recentTransactions.map(tx => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onPress={() => {
                    triggerSelection();
                    setSelectedTransaction(tx);
                    setDetailModalVisible(true);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Resumen Inteligente */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.insightHeaderLeft}>
              <MaterialIcons name="insights" size={18} color={COLORS.tertiary} />
              <Text style={[styles.sectionTitle, TYPOGRAPHY.headlineSm]}>Resumen inteligente</Text>
            </View>
            {smartInsight.canOpenReport ? (
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  setReportModalVisible(true);
                }}
              >
                <View style={styles.viewAllRow}>
                  <Text style={[styles.sectionActionText, { color: smartInsight.tagColor }, TYPOGRAPHY.labelCaps]}>
                    {smartInsight.tag} • Ver Informe
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color={smartInsight.tagColor} />
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.sectionActionText, TYPOGRAPHY.labelCaps]}>{smartInsight.tag}</Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={smartInsight.canOpenReport ? 0.7 : 1}
            onPress={() => {
              if (smartInsight.canOpenReport) {
                triggerSelection();
                setReportModalVisible(true);
              }
            }}
          >
            <GlassCard variant="low" style={styles.insightCard}>
              <View style={[styles.insightIconBox, { backgroundColor: `${smartInsight.iconColor}20` }]}>
                <MaterialIcons name={smartInsight.icon as any} size={20} color={smartInsight.iconColor} />
              </View>
              <View style={styles.insightTextContainer}>
                <Text style={[styles.insightTitle, TYPOGRAPHY.bodyMd]}>
                  {smartInsight.title}
                </Text>
                <Text style={[styles.insightBody, TYPOGRAPHY.bodySm]}>
                  {smartInsight.body}
                </Text>
              </View>
              {smartInsight.canOpenReport && (
                <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.outline} style={{ alignSelf: 'center' }} />
              )}
            </GlassCard>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* New Transaction Modal */}
      <NewTransactionModal
        visible={modalVisible}
        initialType={modalType}
        onClose={() => setModalVisible(false)}
      />

      {/* Monthly Report Executive Modal */}
      <MonthlyReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        monthName={currentMonthLabel}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netSavings={summary.netSavings}
        savingsRate={
          summary.totalIncome > 0
            ? Math.max(0, Math.min(100, Math.round((summary.netSavings / summary.totalIncome) * 1000) / 10))
            : 0
        }
        topCategories={breakdown.map(c => ({
          name: c.categoryName,
          amount: c.totalAmount,
          percentage: c.percent,
          color: c.categoryColor || COLORS.secondary,
        }))}
        budgetHealthScore={
          summary.totalIncome === 0 && summary.totalExpense === 0
            ? 100
            : summary.netSavings >= 0
              ? Math.min(100, 75 + Math.round((summary.netSavings / (summary.totalIncome || 1)) * 25))
              : Math.max(30, Math.round(75 - (Math.abs(summary.netSavings) / (summary.totalExpense || 1)) * 40))
        }
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitles: {
    flexDirection: 'column',
  },
  brandName: {
    color: COLORS.onSurface,
  },
  screenSubtitle: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  monthText: {
    color: COLORS.onSurfaceVariant,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cashflowIncome,
  },
  liveText: {
    color: COLORS.cashflowIncome,
    fontSize: 9,
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(24, 28, 29, 0.95)',
    position: 'relative',
    overflow: 'hidden',
    gap: 12,
  },
  heroGlowPurple: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  heroGlowCyan: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLabel: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  eyeBtn: {
    padding: 2,
  },
  flowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  flowBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
  },
  balanceRow: {
    marginVertical: 4,
  },
  balanceNumber: {
    color: COLORS.onSurface,
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricCol: {
    flex: 1,
    gap: 2,
  },
  metricHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 9,
  },
  metricValue: {
    color: COLORS.onSurface,
  },
  quickActionsCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  sectionHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleCaps: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  sectionLink: {
    color: COLORS.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnExpense: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 138, 158, 0.1)',
  },
  actionBtnIncome: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
  },
  actionBtnTransfer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(138, 79, 255, 0.1)',
  },
  actionBtnReport: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  actionBtnText: {
    fontSize: 10,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  sectionActionText: {
    color: COLORS.primary,
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accountCard: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeBadge: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  accountCardBottom: {
    gap: 2,
  },
  accountCardName: {
    color: COLORS.onSurfaceVariant,
  },
  accountCardBalance: {
    color: COLORS.onSurface,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: COLORS.primary,
  },
  recentEmptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  recentEmptyText: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  recentAddLink: {
    color: COLORS.secondary,
    marginTop: 4,
  },
  recentList: {
    gap: 8,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightCard: {
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  insightIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextContainer: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    color: COLORS.onSurface,
  },
  insightBody: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
});
