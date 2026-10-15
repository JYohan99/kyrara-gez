import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { formatCurrency } from '@/shared/utils/currency';
import { triggerImpactLight, triggerSelection } from '@/shared/utils/haptics';

interface MonthlyReportModalProps {
  visible: boolean;
  onClose: () => void;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  topCategories: { name: string; amount: number; percentage: number; color: string }[];
  budgetHealthScore: number;
}

export function MonthlyReportModal({
  visible,
  onClose,
  monthName,
  totalIncome,
  totalExpense,
  netSavings,
  savingsRate,
  topCategories,
  budgetHealthScore,
}: MonthlyReportModalProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const isSurplus = netSavings >= 0;

  const handleShareReport = async () => {
    triggerImpactLight();
    const topCatsText = topCategories
      .slice(0, 3)
      .map(
        (c, idx) =>
          `  ${idx + 1}. ${c.name}: ${formatCurrency(c.amount)} (${c.percentage.toFixed(1)}%)`
      )
      .join('\n');

    const message = `📊 INFORME FINANCIERO MENSUAL • KYRARA GEZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Período: ${monthName}
Modo: Bóveda Cero Nube (Sin Rastreo ni Telemetría)

📈 RESUMEN DEL PERÍODO:
• Ingresos Totales: +${formatCurrency(totalIncome)}
• Gastos Totales:   -${formatCurrency(totalExpense)}
• Balance Neto:     ${isSurplus ? '+' : ''}${formatCurrency(netSavings)} (${isSurplus ? 'SUPERÁVIT' : 'DÉFICIT'})
• Tasa de Ahorro:   ${savingsRate.toFixed(1)}%
• Salud de Gastos:  ${budgetHealthScore}% adherencia

🏆 PRINCIPALES DESTINOS DE GASTO:
${topCatsText || '  Sin datos suficientes'}

🏛️ ESTADO DE BÓVEDA:
Los registros han sido conciliados y verificados en SQLite local con cifrado AES-256.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generado por Kyrara Gez Personal Finance Cockpit`;

    try {
      await Share.share({
        message,
        title: `Informe Mensual - ${monthName}`,
      });
    } catch {
      // Ignorar cancelaciones
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            triggerSelection();
            onClose();
          }}
        />
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <MaterialIcons name="assessment" size={16} color={COLORS.secondary} />
              <Text style={[styles.headerBadgeText, TYPOGRAPHY.labelCaps]}>
                Cierre Oficial de Mes
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" size={22} color={COLORS.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Title & Month */}
            <View style={styles.titleSection}>
              <Text style={[styles.monthTitle, TYPOGRAPHY.headlineLg]}>{monthName}</Text>
              <Text style={[styles.periodSubtitle, TYPOGRAPHY.labelCaps]}>
                Auditoría Consolidada de Bóveda
              </Text>
            </View>

            {/* Hero Card */}
            <GlassCard
              variant="surface"
              style={[
                styles.heroCard,
                {
                  borderColor: isSurplus
                    ? 'rgba(87, 245, 171, 0.25)'
                    : 'rgba(255, 138, 158, 0.25)',
                },
              ]}
            >
              <Text style={[styles.heroLabel, TYPOGRAPHY.labelCaps]}>Balance Neto Final</Text>
              <Text
                style={[
                  styles.heroAmount,
                  { color: isSurplus ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                  TYPOGRAPHY.displayHeroMobile,
                ]}
              >
                {isSurplus ? '+ ' : ''}
                {formatCurrency(netSavings)}
              </Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: isSurplus
                      ? 'rgba(87, 245, 171, 0.12)'
                      : 'rgba(255, 138, 158, 0.12)',
                  },
                ]}
              >
                <MaterialIcons
                  name={isSurplus ? 'check-circle' : 'warning'}
                  size={14}
                  color={isSurplus ? COLORS.cashflowIncome : COLORS.cashflowExpense}
                />
                <Text
                  style={[
                    styles.statusTagText,
                    { color: isSurplus ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                    TYPOGRAPHY.labelCaps,
                  ]}
                >
                  {isSurplus ? 'Superávit Financiero Saludable' : 'Déficit en el Período'}
                </Text>
              </View>
            </GlassCard>

            {/* Two Column Metrics */}
            <View style={styles.metricsGrid}>
              <GlassCard variant="surface" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <MaterialIcons name="savings" size={16} color={COLORS.secondary} />
                  <Text style={[styles.metricLabel, TYPOGRAPHY.labelCaps]}>Tasa de Ahorro</Text>
                </View>
                <Text style={[styles.metricValue, TYPOGRAPHY.headlineSm, { color: COLORS.secondary }]}>
                  {savingsRate.toFixed(1)}%
                </Text>
                <Text style={[styles.metricSub, TYPOGRAPHY.bodySm]}>
                  del total ingresado preservado
                </Text>
              </GlassCard>

              <GlassCard variant="surface" style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <MaterialIcons name="speed" size={16} color={COLORS.primary} />
                  <Text style={[styles.metricLabel, TYPOGRAPHY.labelCaps]}>Disciplina Presupuesto</Text>
                </View>
                <Text style={[styles.metricValue, TYPOGRAPHY.headlineSm, { color: COLORS.primary }]}>
                  {budgetHealthScore}%
                </Text>
                <Text style={[styles.metricSub, TYPOGRAPHY.bodySm]}>
                  dentro de límites previstos
                </Text>
              </GlassCard>
            </View>

            {/* Income & Expense Breakdown */}
            <GlassCard variant="surface" style={styles.flowCard}>
              <View style={styles.flowRow}>
                <View style={styles.flowCol}>
                  <View style={styles.flowTag}>
                    <MaterialIcons name="arrow-downward" size={14} color={COLORS.cashflowIncome} />
                    <Text style={[styles.flowLabel, TYPOGRAPHY.labelCaps]}>Ingresos Totales</Text>
                  </View>
                  <Text
                    style={[
                      styles.flowAmount,
                      TYPOGRAPHY.numericTable,
                      { color: COLORS.cashflowIncome },
                    ]}
                  >
                    +{formatCurrency(totalIncome)}
                  </Text>
                </View>

                <View style={styles.flowDivider} />

                <View style={styles.flowCol}>
                  <View style={styles.flowTag}>
                    <MaterialIcons name="arrow-upward" size={14} color={COLORS.cashflowExpense} />
                    <Text style={[styles.flowLabel, TYPOGRAPHY.labelCaps]}>Gastos Totales</Text>
                  </View>
                  <Text
                    style={[
                      styles.flowAmount,
                      TYPOGRAPHY.numericTable,
                      { color: COLORS.cashflowExpense },
                    ]}
                  >
                    -{formatCurrency(totalExpense)}
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Top Categories Breakdown */}
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, TYPOGRAPHY.labelCaps]}>
                Top 3 Categorías con Mayor Gasto
              </Text>
              <View style={styles.catStack}>
                {topCategories.slice(0, 3).map((cat, idx) => (
                  <GlassCard key={idx} variant="surface" style={styles.catRow}>
                    <View style={styles.catLeft}>
                      <View style={[styles.catRankBadge, { backgroundColor: cat.color + '22' }]}>
                        <Text style={[styles.catRankText, { color: cat.color }]}>#{idx + 1}</Text>
                      </View>
                      <View>
                        <Text style={[styles.catName, TYPOGRAPHY.bodyMd]}>{cat.name}</Text>
                        <Text style={[styles.catPerc, TYPOGRAPHY.labelCaps]}>
                          {cat.percentage.toFixed(1)}% del gasto total
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.catAmount, TYPOGRAPHY.numericTable]}>
                      -{formatCurrency(cat.amount)}
                    </Text>
                  </GlassCard>
                ))}
              </View>
            </View>

            {/* Share and Export Actions */}
            <TouchableOpacity
              style={styles.exportBtn}
              activeOpacity={0.8}
              onPress={handleShareReport}
            >
              <MaterialIcons name="share" size={18} color="#0B0F10" />
              <Text style={[styles.exportBtnText, TYPOGRAPHY.labelCaps]}>
                Exportar Informe Oficial (.TXT / Redes)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0E1314',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.borderGlass,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 222, 196, 0.1)',
  },
  headerBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  monthTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: '800',
  },
  periodSubtitle: {
    color: COLORS.outline,
    fontSize: 11,
  },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  heroLabel: {
    color: COLORS.outline,
    fontSize: 10,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    color: COLORS.outline,
    fontSize: 9,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricSub: {
    color: COLORS.outline,
    fontSize: 10,
  },
  flowCard: {
    padding: 16,
    borderRadius: 16,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  flowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowLabel: {
    color: COLORS.outline,
    fontSize: 9,
  },
  flowAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  flowDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  categoriesSection: {
    gap: 10,
  },
  sectionTitle: {
    color: COLORS.outline,
    fontSize: 11,
  },
  catStack: {
    gap: 8,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  catName: {
    color: COLORS.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  catPerc: {
    color: COLORS.outline,
    fontSize: 9,
  },
  catAmount: {
    color: COLORS.cashflowExpense,
    fontSize: 13,
    fontWeight: '700',
  },
  exportBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  exportBtnText: {
    color: '#0B0F10',
    fontSize: 12,
    fontWeight: '700',
  },
});
