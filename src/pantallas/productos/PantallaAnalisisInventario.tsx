import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';
import { useAnalisisVentasInventarioBoveda, useProductosBoveda } from '@/datos/hooks';
import { TipoFiltroPeriodoInventario, Producto } from '@/datos/tipos';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesPantallaAnalisisInventario {
  onAbrirDetalleProducto?: (producto: Producto) => void;
}

const OPCIONES_PERIODO: { key: TipoFiltroPeriodoInventario; label: string }[] = [
  { key: 'ESTE_MES', label: 'Este mes' },
  { key: 'MES_ANTERIOR', label: 'Mes anterior' },
  { key: 'ULTIMOS_30_DIAS', label: '30 días' },
  { key: 'ESTE_ANO', label: 'Este año' },
  { key: 'TODO', label: 'Histórico' },
];

export const PantallaAnalisisInventario: React.FC<PropiedadesPantallaAnalisisInventario> = ({
  onAbrirDetalleProducto,
}) => {
  const [periodo, setPeriodo] = useState<TipoFiltroPeriodoInventario>('ESTE_MES');
  const [criterioRanking, setCriterioRanking] = useState<'VENTAS' | 'GANANCIA'>('VENTAS');

  // Bóveda reactiva con datos reales
  const { analysis } = useAnalisisVentasInventarioBoveda(periodo);
  const { products } = useProductosBoveda();

  const handleSelectProduct = (productId: string) => {
    triggerSelection();
    if (!onAbrirDetalleProducto) return;
    const found = products.find(p => p.id === productId);
    if (found) {
      onAbrirDetalleProducto(found);
    }
  };

  // Calcular valor máximo para las barras de evolución temporal
  const maxBarValue = Math.max(
    ...analysis.evolution.map(p => Math.max(p.sales, p.grossProfit, p.collected, 0)),
    100
  );

  // Calcular valor máximo para el ranking de unidades o ganancia
  const maxUnitsSold = Math.max(...analysis.topSellingProducts.map(p => p.unitsSold), 1);
  const maxGrossProfit = Math.max(...analysis.topProfitableProducts.map(p => Math.max(p.grossProfit, 0)), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Selector de Período Horizontal */}
      <View style={styles.periodSelectorWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodSelectorTrack}
        >
          {OPCIONES_PERIODO.map(item => {
            const isSel = periodo === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.periodChip, isSel && styles.periodChipActive]}
                onPress={() => {
                  triggerSelection();
                  setPeriodo(item.key);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodChipText, isSel && styles.periodChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Banner de Auditoría: Distinción entre Venta y Cobro */}
      <GlassCard variant="surface" style={styles.auditCard}>
        <View style={styles.auditHeader}>
          <MaterialIcons name="insights" size={18} color={COLORS.secondary} />
          <Text style={[styles.auditTitle, TYPOGRAPHY.titularPequeno]}>
            Resumen Comercial ({analysis.labelPeriodo})
          </Text>
        </View>

        <View style={styles.financialAuditGrid}>
          {/* Venta Facturada */}
          <View style={styles.auditCol}>
            <Text style={styles.auditLabel}>Importe Vendido</Text>
            <Text style={[styles.auditValue, { color: '#57F5AB' }]}>
              {formatCurrency(analysis.totalSales)}
            </Text>
            <Text style={styles.auditSub}>Total comercializado</Text>
          </View>

          <View style={styles.auditDivider} />

          {/* Dinero Cobrado */}
          <View style={styles.auditCol}>
            <Text style={styles.auditLabel}>Cobro Efectivo</Text>
            <Text style={[styles.auditValue, { color: '#00E676' }]}>
              {formatCurrency(analysis.totalCollected)}
            </Text>
            <Text style={styles.auditSub}>
              Pendiente: {formatCurrency(analysis.totalPending)}
            </Text>
          </View>

          <View style={styles.auditDivider} />

          {/* Ganancia Bruta Real */}
          <View style={styles.auditCol}>
            <Text style={styles.auditLabel}>Ganancia Bruta</Text>
            <Text
              style={[
                styles.auditValue,
                analysis.grossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
              ]}
            >
              {formatCurrency(analysis.grossProfit)}
            </Text>
            <Text style={styles.auditSub}>
              Costo: {formatCurrency(analysis.totalCostOfGoods)}
            </Text>
          </View>
        </View>

        {analysis.marginPercent !== null && (
          <View style={styles.marginRow}>
            <Text style={styles.marginText}>Margen Bruto del Período:</Text>
            <BadgeRentabilidad margen={analysis.marginPercent} />
          </View>
        )}
      </GlassCard>

      {/* EVOLUCIÓN TEMPORAL DE VENTAS Y GANANCIAS */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="show-chart" size={18} color={COLORS.secondary} />
          <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
            Evolución de Ventas y Ganancias
          </Text>
        </View>
      </View>

      {analysis.evolution.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <MaterialIcons name="timeline" size={32} color={COLORS.onSurfaceVariant + '60'} />
          <Text style={styles.emptyStateTitle}>Sin ventas en este período</Text>
          <Text style={styles.emptyStateSub}>
            No se han registrado operaciones de venta en {analysis.labelPeriodo.toLowerCase()}.
          </Text>
        </View>
      ) : (
        <View style={styles.evolutionCard}>
          <View style={styles.evolutionLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#57F5AB' }]} />
              <Text style={styles.legendText}>Venta</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.legendText}>Ganancia Bruta</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00E676' }]} />
              <Text style={styles.legendText}>Cobrado</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evolutionChartTrack}>
            {analysis.evolution.map(point => {
              const salesHeightPercent = Math.max(6, Math.min(100, (point.sales / maxBarValue) * 100));
              const profitHeightPercent = Math.max(6, Math.min(100, (Math.max(0, point.grossProfit) / maxBarValue) * 100));
              const collectedHeightPercent = Math.max(6, Math.min(100, (point.collected / maxBarValue) * 100));

              return (
                <View key={point.dateKey} style={styles.chartBarCol}>
                  <Text style={styles.chartBarValueTop}>{formatCurrency(point.sales)}</Text>
                  <View style={styles.barsContainer}>
                    {/* Barra Venta */}
                    <View style={[styles.singleBar, styles.barSales, { height: `${salesHeightPercent}%` }]} />
                    {/* Barra Ganancia */}
                    <View style={[styles.singleBar, styles.barProfit, { height: `${profitHeightPercent}%` }]} />
                    {/* Barra Cobrado */}
                    <View style={[styles.singleBar, styles.barCollected, { height: `${collectedHeightPercent}%` }]} />
                  </View>
                  <Text style={styles.chartBarLabel}>{point.label}</Text>
                  <Text style={styles.chartBarSub}>{point.unitsSold}u</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* SECCIÓN RANKINGS DE PRODUCTOS */}
      <View style={styles.rankingHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="leaderboard" size={18} color={COLORS.secondary} />
          <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
            Ranking de Productos
          </Text>
        </View>

        <View style={styles.rankingCriteriaTrack}>
          <TouchableOpacity
            style={[styles.rankingCriteriaBtn, criterioRanking === 'VENTAS' && styles.rankingCriteriaBtnActive]}
            onPress={() => {
              triggerSelection();
              setCriterioRanking('VENTAS');
            }}
          >
            <Text style={[styles.rankingCriteriaText, criterioRanking === 'VENTAS' && styles.rankingCriteriaTextActive]}>
              Más Vendidos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rankingCriteriaBtn, criterioRanking === 'GANANCIA' && styles.rankingCriteriaBtnActive]}
            onPress={() => {
              triggerSelection();
              setCriterioRanking('GANANCIA');
            }}
          >
            <Text style={[styles.rankingCriteriaText, criterioRanking === 'GANANCIA' && styles.rankingCriteriaTextActive]}>
              Mayor Ganancia
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista del Ranking Seleccionado */}
      {(criterioRanking === 'VENTAS' ? analysis.topSellingProducts : analysis.topProfitableProducts).length === 0 ? (
        <View style={styles.emptyStateBox}>
          <MaterialIcons name="inventory" size={28} color={COLORS.onSurfaceVariant + '60'} />
          <Text style={styles.emptyStateTitle}>Sin registros en el ranking</Text>
          <Text style={styles.emptyStateSub}>
            Las ventas registradas en {analysis.labelPeriodo.toLowerCase()} aparecerán aquí ordenadas.
          </Text>
        </View>
      ) : (
        <View style={styles.rankingsList}>
          {(criterioRanking === 'VENTAS' ? analysis.topSellingProducts : analysis.topProfitableProducts).map(
            (item, index) => {
              const barPercent =
                criterioRanking === 'VENTAS'
                  ? (item.unitsSold / maxUnitsSold) * 100
                  : (Math.max(0, item.grossProfit) / maxGrossProfit) * 100;

              return (
                <TouchableOpacity
                  key={item.productId}
                  style={styles.rankingCard}
                  onPress={() => handleSelectProduct(item.productId)}
                  activeOpacity={0.8}
                >
                  <View style={styles.rankingPositionCol}>
                    <View
                      style={[
                        styles.positionCircle,
                        index === 0 && styles.posFirst,
                        index === 1 && styles.posSecond,
                        index === 2 && styles.posThird,
                      ]}
                    >
                      <Text
                        style={[
                          styles.positionText,
                          index < 3 && styles.positionTextTop,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rankingBodyCol}>
                    <View style={styles.rankingTitleRow}>
                      <Text style={styles.rankingProductName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.rankingCategory}>{item.category}</Text>
                    </View>

                    {/* Barra de progreso visual relativa */}
                    <View style={styles.rankingProgressBarTrack}>
                      <View
                        style={[
                          styles.rankingProgressBarFill,
                          {
                            width: `${Math.max(4, Math.min(100, barPercent))}%`,
                            backgroundColor:
                              criterioRanking === 'VENTAS' ? '#57F5AB' : COLORS.secondary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.rankingMetricsRow}>
                      <View style={styles.metricPair}>
                        <Text style={styles.metricKey}>Vendidas:</Text>
                        <Text style={styles.metricVal}>
                          {item.unitsSold} {item.saleUnit}s
                        </Text>
                      </View>

                      <View style={styles.metricPair}>
                        <Text style={styles.metricKey}>Venta:</Text>
                        <Text style={styles.metricVal}>{formatCurrency(item.totalSales)}</Text>
                      </View>

                      <View style={styles.metricPair}>
                        <Text style={styles.metricKey}>Ganancia:</Text>
                        <Text
                          style={[
                            styles.metricVal,
                            item.grossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                          ]}
                        >
                          {formatCurrency(item.grossProfit)}
                        </Text>
                      </View>

                      {item.marginPercent !== null && (
                        <BadgeRentabilidad margen={item.marginPercent} tamano="pequeno" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  periodSelectorWrapper: {
    marginHorizontal: -20,
  },
  periodSelectorTrack: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodChip: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  periodChipActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderColor: COLORS.secondary,
  },
  periodChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  periodChipTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  auditCard: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditTitle: {
    color: COLORS.onSurface,
  },
  financialAuditGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  auditCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  auditLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  auditValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  auditSub: {
    color: COLORS.onSurfaceVariant + '90',
    fontSize: 10,
  },
  auditDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 4,
  },
  marginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  marginText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  evolutionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  evolutionLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  evolutionChartTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    paddingVertical: 8,
    minHeight: 180,
  },
  chartBarCol: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  chartBarValueTop: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    fontWeight: '700',
  },
  barsContainer: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  singleBar: {
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barSales: {
    backgroundColor: '#57F5AB',
  },
  barProfit: {
    backgroundColor: COLORS.secondary,
  },
  barCollected: {
    backgroundColor: '#00E676',
  },
  chartBarLabel: {
    color: COLORS.onSurface,
    fontSize: 10,
    fontWeight: '600',
  },
  chartBarSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  emptyStateBox: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyStateTitle: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  rankingCriteriaTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 2,
    gap: 2,
  },
  rankingCriteriaBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rankingCriteriaBtnActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  rankingCriteriaText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  rankingCriteriaTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  rankingsList: {
    gap: 10,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankingPositionCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posFirst: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  posSecond: {
    backgroundColor: 'rgba(192, 192, 192, 0.18)',
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  posThird: {
    backgroundColor: 'rgba(205, 127, 50, 0.18)',
    borderWidth: 1,
    borderColor: '#CD7F32',
  },
  positionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  positionTextTop: {
    color: COLORS.onSurface,
  },
  rankingBodyCol: {
    flex: 1,
    gap: 6,
  },
  rankingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankingProductName: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  rankingCategory: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  rankingProgressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  rankingProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rankingMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  metricVal: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '700',
  },
});
