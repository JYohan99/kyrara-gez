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
} from '@/compartido/componentes';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import {
  useResumenInventarioBoveda,
  useAlertasStockBoveda,
} from '@/datos/hooks';
import { TipoFiltroPeriodoInventario, Producto } from '@/datos/tipos';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesPantallaResumenInventario {
  onVerCatalogo: () => void;
  onVerCatalogoAlertas: () => void;
  onVerAnalisis: () => void;
  onAbrirDetalleProducto?: (producto: Producto) => void;
  onNuevoProducto?: () => void;
}

const OPCIONES_PERIODO: { key: TipoFiltroPeriodoInventario; label: string }[] = [
  { key: 'ESTE_MES', label: 'Este mes' },
  { key: 'MES_ANTERIOR', label: 'Mes anterior' },
  { key: 'ULTIMOS_30_DIAS', label: '30 días' },
  { key: 'ESTE_ANO', label: 'Este año' },
  { key: 'TODO', label: 'Histórico' },
];

export const PantallaResumenInventario: React.FC<PropiedadesPantallaResumenInventario> = ({
  onVerCatalogo,
  onVerCatalogoAlertas,
  onVerAnalisis,
  onAbrirDetalleProducto,
  onNuevoProducto,
}) => {
  const [periodo, setPeriodo] = useState<TipoFiltroPeriodoInventario>('ESTE_MES');

  const { summary } = useResumenInventarioBoveda(periodo);
  const { alertProducts } = useAlertasStockBoveda();

  const marginPeriodo =
    summary.totalSalesValue > 0
      ? (summary.totalGrossProfit / summary.totalSalesValue) * 100
      : null;

  const totalAlertas = summary.lowStockCount + summary.outOfStockCount;

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

      {/* 2. Tarjeta Hero: Valor del Inventario */}
      <GlassCard variant="high" style={styles.heroValuationCard}>
        <View style={styles.heroCardHeader}>
          <OrbeGlossy tamano={44} tono="cian" sombra>
            <MaterialIcons name="inventory-2" size={21} color="#FFFFFF" />
          </OrbeGlossy>
          <View style={styles.heroHeaderTextCol}>
            <Text style={[styles.heroCardLabel, TYPOGRAPHY.etiquetaMayusculas]}>
              Valor del Inventario (Costo)
            </Text>
            <Text style={styles.heroCardSub}>
              {summary.totalStockUnits} uds en {summary.totalProducts} productos
            </Text>
          </View>
        </View>

        <Text style={[styles.heroBigAmount, TYPOGRAPHY.titularHero]}>
          {formatCurrency(summary.inventoryCostValue)}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCol}>
            <Text style={styles.heroMetaKey}>Valuación Venta</Text>
            <Text style={styles.heroMetaVal}>
              {formatCurrency(summary.inventorySaleValue)}
            </Text>
          </View>
          <View style={styles.heroMetaDivider} />
          <View style={styles.heroMetaCol}>
            <Text style={styles.heroMetaKey}>Ganancia Potencial</Text>
            <Text style={[styles.heroMetaVal, { color: COLORS.ingreso }]}>
              {formatCurrency(summary.potentialProfit)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* 3. Accesos Rápidos (3 columnas compactas con OrbeGlossy) */}
      <GlassCard variant="low" style={styles.quickActionsCard}>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNuevoProducto?.()}
            activeOpacity={0.78}
          >
            <OrbeGlossy tamano={40} tono="ingreso" sombra>
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </OrbeGlossy>
            <Text style={styles.quickActionTitle} numberOfLines={1}>
              Nuevo
            </Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>
              Agregar ítem
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={onVerCatalogo}
            activeOpacity={0.78}
          >
            <OrbeGlossy tamano={40} tono="cian" sombra>
              <MaterialIcons name="list-alt" size={20} color="#FFFFFF" />
            </OrbeGlossy>
            <Text style={styles.quickActionTitle} numberOfLines={1}>
              Catálogo
            </Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>
              {summary.totalProducts} ítems
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={onVerAnalisis}
            activeOpacity={0.78}
          >
            <OrbeGlossy tamano={40} tono="violeta" sombra>
              <MaterialIcons name="insights" size={20} color="#FFFFFF" />
            </OrbeGlossy>
            <Text style={styles.quickActionTitle} numberOfLines={1}>
              Análisis
            </Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>
              Rankings
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* 4. Rendimiento del Período (2 filas simétricas 50/50) */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
            Rendimiento ({summary.labelPeriodo || 'Este mes'})
          </Text>
          <TouchableOpacity onPress={onVerAnalisis} activeOpacity={0.7} style={styles.sectionActionBtn}>
            <Text style={styles.sectionActionText}>Detalle</Text>
            <MaterialIcons name="chevron-right" size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.kpiRowsContainer}>
          {/* Fila 1: Total Ventas y Ganancia Bruta */}
          <View style={styles.kpiRow}>
            <GlassCard variant="surface" style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <OrbeGlossy tamano={28} tono="ingreso">
                  <MaterialIcons name="point-of-sale" size={14} color="#FFFFFF" />
                </OrbeGlossy>
                <Text style={styles.kpiLabel} numberOfLines={1}>Ventas</Text>
              </View>
              <Text style={[styles.kpiValue, { color: COLORS.ingreso }]} numberOfLines={1}>
                {formatCurrency(summary.totalSalesValue)}
              </Text>
              <Text style={styles.kpiSub} numberOfLines={1}>
                {summary.totalUnitsSold} uds vendidas
              </Text>
            </GlassCard>

            <GlassCard variant="surface" style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <OrbeGlossy tamano={28} tono="cian">
                  <MaterialIcons name="account-balance-wallet" size={14} color="#FFFFFF" />
                </OrbeGlossy>
                <Text style={styles.kpiLabel} numberOfLines={1}>Ganancia</Text>
              </View>
              <Text
                style={[
                  styles.kpiValue,
                  summary.totalGrossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                ]}
                numberOfLines={1}
              >
                {formatCurrency(summary.totalGrossProfit)}
              </Text>
              <View style={styles.badgeWrapper}>
                {marginPeriodo !== null ? (
                  <BadgeRentabilidad margen={marginPeriodo} tamano="pequeno" />
                ) : (
                  <Text style={styles.kpiSub}>Sin margen aún</Text>
                )}
              </View>
            </GlassCard>
          </View>

          {/* Fila 2: Cobrado Efectivo y Pendiente de Cobro */}
          <View style={styles.kpiRow}>
            <GlassCard variant="surface" style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <OrbeGlossy tamano={28} tono="obsidiana">
                  <MaterialIcons name="check-circle" size={14} color="#00E676" />
                </OrbeGlossy>
                <Text style={styles.kpiLabel} numberOfLines={1}>Cobrado</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#00E676' }]} numberOfLines={1}>
                {formatCurrency(summary.totalCollectedValue)}
              </Text>
              <Text style={styles.kpiSub} numberOfLines={1}>
                En cuentas
              </Text>
            </GlassCard>

            <GlassCard variant="surface" style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <OrbeGlossy tamano={28} tono={summary.totalPendingCollectValue > 0 ? 'gasto' : 'obsidiana'}>
                  <MaterialIcons
                    name="pending-actions"
                    size={14}
                    color={summary.totalPendingCollectValue > 0 ? '#FFFFFF' : '#FFB300'}
                  />
                </OrbeGlossy>
                <Text style={styles.kpiLabel} numberOfLines={1}>Por cobrar</Text>
              </View>
              <Text
                style={[
                  styles.kpiValue,
                  { color: summary.totalPendingCollectValue > 0 ? '#FFB300' : COLORS.onSurface },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(summary.totalPendingCollectValue)}
              </Text>
              <Text style={styles.kpiSub} numberOfLines={1}>
                Ventas a crédito
              </Text>
            </GlassCard>
          </View>
        </View>
      </View>

      {/* 5. Alertas de Stock */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
              Alertas de Stock
            </Text>
            <View
              style={[
                styles.alertCounterBadge,
                summary.outOfStockCount > 0
                  ? styles.alertCounterOutOfStock
                  : summary.lowStockCount > 0
                    ? styles.alertCounterLowStock
                    : styles.alertCounterNormal,
              ]}
            >
              <Text style={styles.alertCounterText}>{totalAlertas}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onVerCatalogoAlertas} activeOpacity={0.7} style={styles.sectionActionBtn}>
            <Text style={styles.sectionActionText}>Ver catálogo</Text>
            <MaterialIcons name="chevron-right" size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        {alertProducts.length === 0 ? (
          <GlassCard variant="low" style={styles.emptyAlertsCard}>
            <OrbeGlossy tamano={38} tono="ingreso">
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            </OrbeGlossy>
            <View style={styles.emptyAlertsTextCol}>
              <Text style={styles.emptyAlertsTitle}>Stock en niveles óptimos</Text>
              <Text style={styles.emptyAlertsSub}>
                Todos tus productos superan su stock mínimo configurado.
              </Text>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.alertsList}>
            {alertProducts.slice(0, 4).map(prod => {
              const isOut = prod.isOutOfStock;
              return (
                <TouchableOpacity
                  key={prod.id}
                  onPress={() => onAbrirDetalleProducto?.(prod)}
                  activeOpacity={0.8}
                >
                  <GlassCard
                    variant="low"
                    style={[
                      styles.alertProductCard,
                      isOut ? styles.cardOutOfStock : styles.cardLowStock,
                    ]}
                  >
                    <View style={styles.alertCardLeft}>
                      <OrbeGlossy tamano={34} tono={isOut ? 'gasto' : 'obsidiana'}>
                        <MaterialIcons
                          name={isOut ? 'error-outline' : 'warning-amber'}
                          size={16}
                          color={isOut ? '#FFFFFF' : '#FFB300'}
                        />
                      </OrbeGlossy>
                      <View style={styles.alertProductInfo}>
                        <Text style={styles.alertProductName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={styles.alertProductSub} numberOfLines={1}>
                          {prod.sizeFormat ? `${prod.sizeFormat} • ` : ''}Mín: {prod.minStock} {prod.saleUnit}s
                        </Text>
                      </View>
                    </View>

                    <View style={styles.alertCardRight}>
                      <View
                        style={[
                          styles.alertStockPill,
                          isOut ? styles.stockPillOut : styles.stockPillLow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.alertStockPillText,
                            { color: isOut ? '#FF6E6E' : '#FFB300' },
                          ]}
                        >
                          {isOut ? 'Agotado' : `${prod.currentStock} ${prod.saleUnit}s`}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={COLORS.onSurfaceVariant} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}

            {alertProducts.length > 4 && (
              <TouchableOpacity
                style={styles.moreAlertsBtn}
                onPress={onVerCatalogoAlertas}
                activeOpacity={0.7}
              >
                <Text style={styles.moreAlertsBtnText}>
                  Ver {alertProducts.length - 4} alertas más en el Catálogo
                </Text>
              </TouchableOpacity>
            )}
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
  heroValuationCard: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  heroCardHeader: {
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
  heroBigAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: 'center',
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
    alignItems: 'center',
    gap: 3,
  },
  heroMetaKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  heroMetaVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroMetaDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(165, 231, 255, 0.14)',
    marginHorizontal: 14,
  },
  quickActionsCard: {
    padding: 12,
    borderRadius: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(9, 13, 15, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    gap: 5,
  },
  quickActionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  quickActionSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
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
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionText: {
    color: COLORS.secondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  kpiRowsContainer: {
    gap: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 18,
    padding: 13,
    gap: 6,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  kpiSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10.5,
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
  },
  alertCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  alertCounterNormal: {
    backgroundColor: 'rgba(0, 230, 118, 0.16)',
  },
  alertCounterLowStock: {
    backgroundColor: 'rgba(255, 179, 0, 0.18)',
  },
  alertCounterOutOfStock: {
    backgroundColor: 'rgba(255, 82, 82, 0.18)',
  },
  alertCounterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyAlertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  emptyAlertsTextCol: {
    flex: 1,
    gap: 2,
  },
  emptyAlertsTitle: {
    color: '#57F5AB',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyAlertsSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  alertsList: {
    gap: 8,
  },
  alertProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 12,
  },
  cardOutOfStock: {
    borderColor: 'rgba(255, 82, 82, 0.32)',
  },
  cardLowStock: {
    borderColor: 'rgba(255, 179, 0, 0.32)',
  },
  alertCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertProductInfo: {
    flex: 1,
    gap: 2,
  },
  alertProductName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  alertProductSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10.5,
  },
  alertCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertStockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockPillOut: {
    backgroundColor: 'rgba(255, 82, 82, 0.14)',
  },
  stockPillLow: {
    backgroundColor: 'rgba(255, 179, 0, 0.14)',
  },
  alertStockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  moreAlertsBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreAlertsBtnText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
