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
import {
  TarjetaVidrio as GlassCard,
  OrbeGlossy,
  ChipFiltro,
  SelectorSegmentado,
  BarraProgreso3D,
  OpcionSegmento,
} from '@/compartido/componentes';
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

type CriterioRanking = 'VENTAS' | 'GANANCIA';

const OPCIONES_RANKING: OpcionSegmento<CriterioRanking>[] = [
  { valor: 'VENTAS', etiqueta: 'Más Vendidos', icono: 'trending-up', tonoActivo: 'ingreso' },
  { valor: 'GANANCIA', etiqueta: 'Mayor Ganancia', icono: 'monetization-on', tonoActivo: 'cian' },
];

export const PantallaAnalisisInventario: React.FC<PropiedadesPantallaAnalisisInventario> = ({
  onAbrirDetalleProducto,
}) => {
  const [periodo, setPeriodo] = useState<TipoFiltroPeriodoInventario>('ESTE_MES');
  const [criterioRanking, setCriterioRanking] = useState<CriterioRanking>('VENTAS');

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

  const listaRanking =
    criterioRanking === 'VENTAS' ? analysis.topSellingProducts : analysis.topProfitableProducts;

  return (
    <View style={styles.container}>
      {/* 1. Selector de Período Horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodSelectorTrack}
      >
        {OPCIONES_PERIODO.map(item => (
          <ChipFiltro
            key={item.key}
            etiqueta={item.label}
            activo={periodo === item.key}
            tono="cian"
            onPress={() => setPeriodo(item.key)}
          />
        ))}
      </ScrollView>

      {/* 2. Tarjeta Hero: Resumen Comercial del Período */}
      <GlassCard variant="high" style={styles.heroAuditCard}>
        <View style={styles.heroHeaderRow}>
          <OrbeGlossy tamano={44} tono="violeta" sombra>
            <MaterialIcons name="insights" size={21} color="#FFFFFF" />
          </OrbeGlossy>
          <View style={styles.heroHeaderTextCol}>
            <Text style={[styles.heroCardLabel, TYPOGRAPHY.etiquetaMayusculas]}>
              Resumen Comercial
            </Text>
            <Text style={styles.heroCardSub} numberOfLines={1}>
              {analysis.labelPeriodo} • Total comercializado
            </Text>
          </View>
          {analysis.marginPercent !== null && (
            <BadgeRentabilidad margen={analysis.marginPercent} tamano="pequeno" />
          )}
        </View>

        <View style={styles.heroAmountBlock}>
          <Text style={styles.heroAmountLabel}>Importe Vendido</Text>
          <Text style={[styles.heroBigAmount, TYPOGRAPHY.titularHero]}>
            {formatCurrency(analysis.totalSales)}
          </Text>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCol}>
            <Text style={styles.heroMetaKey}>Cobro Efectivo</Text>
            <Text style={[styles.heroMetaVal, { color: '#00E676' }]} numberOfLines={1}>
              {formatCurrency(analysis.totalCollected)}
            </Text>
            <Text style={styles.heroMetaSub} numberOfLines={1}>
              Pendiente: {formatCurrency(analysis.totalPending)}
            </Text>
          </View>

          <View style={styles.heroMetaDivider} />

          <View style={styles.heroMetaCol}>
            <Text style={styles.heroMetaKey}>Ganancia Bruta</Text>
            <Text
              style={[
                styles.heroMetaVal,
                analysis.grossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
              ]}
              numberOfLines={1}
            >
              {formatCurrency(analysis.grossProfit)}
            </Text>
            <Text style={styles.heroMetaSub} numberOfLines={1}>
              Costo: {formatCurrency(analysis.totalCostOfGoods)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* 3. Evolución Temporal de Ventas y Ganancias */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
            Evolución de Ventas y Ganancias
          </Text>
        </View>

        {analysis.evolution.length === 0 ? (
          <GlassCard variant="low" style={styles.emptyCard}>
            <OrbeGlossy tamano={38} tono="obsidiana">
              <MaterialIcons name="timeline" size={19} color={COLORS.secondary} />
            </OrbeGlossy>
            <View style={styles.emptyTextCol}>
              <Text style={styles.emptyTitle}>Sin ventas en este período</Text>
              <Text style={styles.emptySub}>
                No se registraron operaciones de venta en {analysis.labelPeriodo.toLowerCase()}.
              </Text>
            </View>
          </GlassCard>
        ) : (
          <GlassCard variant="surface" style={styles.evolutionCard}>
            <View style={styles.evolutionLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#57F5AB' }]} />
                <Text style={styles.legendText}>Venta</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
                <Text style={styles.legendText}>Ganancia</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#00E676' }]} />
                <Text style={styles.legendText}>Cobrado</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.evolutionChartTrack}
            >
              {analysis.evolution.map(point => {
                const salesHeightPercent = Math.max(6, Math.min(100, (point.sales / maxBarValue) * 100));
                const profitHeightPercent = Math.max(
                  6,
                  Math.min(100, (Math.max(0, point.grossProfit) / maxBarValue) * 100)
                );
                const collectedHeightPercent = Math.max(
                  6,
                  Math.min(100, (point.collected / maxBarValue) * 100)
                );

                return (
                  <View key={point.dateKey} style={styles.chartBarCol}>
                    <Text style={styles.chartBarValueTop} numberOfLines={1}>
                      {formatCurrency(point.sales)}
                    </Text>
                    <View style={styles.barsContainer}>
                      <View style={[styles.singleBar, styles.barSales, { height: `${salesHeightPercent}%` }]} />
                      <View style={[styles.singleBar, styles.barProfit, { height: `${profitHeightPercent}%` }]} />
                      <View
                        style={[styles.singleBar, styles.barCollected, { height: `${collectedHeightPercent}%` }]}
                      />
                    </View>
                    <Text style={styles.chartBarLabel} numberOfLines={1}>
                      {point.label}
                    </Text>
                    <Text style={styles.chartBarSub}>{point.unitsSold}u</Text>
                  </View>
                );
              })}
            </ScrollView>
          </GlassCard>
        )}
      </View>

      {/* 4. Ranking de Productos */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
            Ranking de Productos
          </Text>
        </View>

        <SelectorSegmentado
          opciones={OPCIONES_RANKING}
          valorSeleccionado={criterioRanking}
          onSeleccionar={setCriterioRanking}
          compacto
        />

        {listaRanking.length === 0 ? (
          <GlassCard variant="low" style={styles.emptyCard}>
            <OrbeGlossy tamano={38} tono="obsidiana">
              <MaterialIcons name="leaderboard" size={19} color={COLORS.secondary} />
            </OrbeGlossy>
            <View style={styles.emptyTextCol}>
              <Text style={styles.emptyTitle}>Sin registros en el ranking</Text>
              <Text style={styles.emptySub}>
                Las ventas registradas en {analysis.labelPeriodo.toLowerCase()} aparecerán aquí ordenadas.
              </Text>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.rankingsList}>
            {listaRanking.map((item, index) => {
              const barPercent =
                criterioRanking === 'VENTAS'
                  ? (item.unitsSold / maxUnitsSold) * 100
                  : (Math.max(0, item.grossProfit) / maxGrossProfit) * 100;

              return (
                <TouchableOpacity
                  key={item.productId}
                  onPress={() => handleSelectProduct(item.productId)}
                  activeOpacity={0.8}
                >
                  <GlassCard variant="low" style={styles.rankingCard}>
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
                        <View style={styles.rankingNameGroup}>
                          <Text style={styles.rankingProductName} numberOfLines={1}>
                            {item.productName}
                          </Text>
                          {item.sizeFormat ? (
                            <Text style={styles.rankingFormat} numberOfLines={1}>
                              {item.sizeFormat}
                            </Text>
                          ) : null}
                        </View>
                        {item.marginPercent !== null && (
                          <BadgeRentabilidad margen={item.marginPercent} tamano="pequeno" />
                        )}
                      </View>

                      <BarraProgreso3D
                        porcentaje={Math.max(4, barPercent)}
                        tono={criterioRanking === 'VENTAS' ? 'ingreso' : 'cian'}
                        altura={7}
                      />

                      <View style={styles.rankingMetricsRow}>
                        <View style={styles.metricCol}>
                          <Text style={styles.metricKey}>Vendidas</Text>
                          <Text style={styles.metricVal} numberOfLines={1}>
                            {item.unitsSold} {item.saleUnit}s
                          </Text>
                        </View>

                        <View style={styles.metricCol}>
                          <Text style={styles.metricKey}>Venta</Text>
                          <Text style={styles.metricVal} numberOfLines={1}>
                            {formatCurrency(item.totalSales)}
                          </Text>
                        </View>

                        <View style={[styles.metricCol, styles.metricColRight]}>
                          <Text style={styles.metricKey}>Ganancia</Text>
                          <Text
                            style={[
                              styles.metricVal,
                              item.grossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                            ]}
                            numberOfLines={1}
                          >
                            {formatCurrency(item.grossProfit)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  periodSelectorTrack: {
    gap: 8,
    paddingVertical: 2,
  },
  heroAuditCard: {
    borderRadius: 22,
    padding: 18,
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
  heroCardLabel: {
    color: COLORS.secundario,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  heroCardSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11.5,
    marginTop: 2,
  },
  heroAmountBlock: {
    gap: 2,
  },
  heroAmountLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroBigAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 231, 255, 0.12)',
  },
  heroMetaCol: {
    flex: 1,
    gap: 3,
  },
  heroMetaKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMetaVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  heroMetaSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10.5,
  },
  heroMetaDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(165, 231, 255, 0.14)',
    marginHorizontal: 14,
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  emptyTextCol: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptySub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  evolutionCard: {
    borderRadius: 20,
    padding: 14,
    gap: 14,
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
    width: 66,
  },
  chartBarValueTop: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9.5,
    fontWeight: '700',
  },
  barsContainer: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    backgroundColor: 'rgba(9, 13, 15, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.08)',
    paddingHorizontal: 5,
    paddingTop: 6,
    borderRadius: 8,
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
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  chartBarSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9.5,
  },
  rankingsList: {
    gap: 10,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 13,
    gap: 12,
  },
  rankingPositionCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(9, 13, 15, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posFirst: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderColor: '#FFD700',
  },
  posSecond: {
    backgroundColor: 'rgba(192, 192, 192, 0.18)',
    borderColor: '#C0C0C0',
  },
  posThird: {
    backgroundColor: 'rgba(205, 127, 50, 0.18)',
    borderColor: '#CD7F32',
  },
  positionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  positionTextTop: {
    color: '#FFFFFF',
  },
  rankingBodyCol: {
    flex: 1,
    gap: 8,
  },
  rankingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rankingNameGroup: {
    flex: 1,
    gap: 1,
  },
  rankingProductName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  rankingFormat: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10.5,
  },
  rankingMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 2,
  },
  metricCol: {
    flex: 1,
    gap: 2,
  },
  metricColRight: {
    alignItems: 'flex-end',
  },
  metricKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
