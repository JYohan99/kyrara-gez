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
  onAbrirDetalleProducto: (producto: Producto) => void;
  onNuevoProducto: () => void;
  onImportarExcel: () => void;
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
  onImportarExcel,
}) => {
  const [periodo, setPeriodo] = useState<TipoFiltroPeriodoInventario>('ESTE_MES');

  // Hooks reactivos con datos reales de la bóveda SQLite
  const { summary } = useResumenInventarioBoveda(periodo);
  const { alertProducts } = useAlertasStockBoveda();

  const marginPeriodo =
    summary.totalSalesValue > 0
      ? (summary.totalGrossProfit / summary.totalSalesValue) * 100
      : null;

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

      {/* KPI Hero 1: Valor actual del inventario calculado al costo */}
      <GlassCard variant="surface" style={styles.heroValuationCard}>
        <View style={styles.heroCardHeader}>
          <View style={styles.heroIconBadge}>
            <MaterialIcons name="inventory-2" size={20} color={COLORS.secondary} />
          </View>
          <View style={styles.heroHeaderTextCol}>
            <Text style={[styles.heroCardLabel, TYPOGRAPHY.etiquetaMayusculas]}>
              Valor Actual del Inventario (al Costo)
            </Text>
            <Text style={styles.heroCardSub}>
              {summary.totalStockUnits} unidades en {summary.activeProducts} productos activos
            </Text>
          </View>
        </View>

        <Text style={[styles.heroBigAmount, TYPOGRAPHY.titularHero]}>
          {formatCurrency(summary.inventoryCostValue)}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCol}>
            <Text style={styles.heroMetaKey}>Valuación de Venta</Text>
            <Text style={styles.heroMetaVal}>{formatCurrency(summary.inventorySaleValue)}</Text>
          </View>
          <View style={styles.heroMetaDivider} />
          <View style={styles.heroMetaCol}>
            <Text style={styles.heroMetaKey}>Ganancia Potencial</Text>
            <Text style={[styles.heroMetaVal, { color: COLORS.secondary }]}>
              {formatCurrency(summary.potentialProfit)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Rendimiento Comercial del Período: Ventas, Cobros, Costo y Ganancia Bruta */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="trending-up" size={18} color={COLORS.secondary} />
          <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
            Rendimiento del Período ({summary.labelPeriodo || 'Este mes'})
          </Text>
        </View>
        <TouchableOpacity onPress={onVerAnalisis} activeOpacity={0.7} style={styles.sectionActionBtn}>
          <Text style={styles.sectionActionText}>Ver Análisis</Text>
          <MaterialIcons name="chevron-right" size={16} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        {/* Total Vendido (Venta) */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialIcons name="point-of-sale" size={16} color="#57F5AB" />
            <Text style={styles.kpiLabel}>Total Ventas</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#57F5AB' }]}>
            {formatCurrency(summary.totalSalesValue)}
          </Text>
          <Text style={styles.kpiSub}>
            {summary.totalUnitsSold} unidades vendidas
          </Text>
        </View>

        {/* Ganancia Bruta */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialIcons name="account-balance-wallet" size={16} color={COLORS.secondary} />
            <Text style={styles.kpiLabel}>Ganancia Bruta</Text>
          </View>
          <Text
            style={[
              styles.kpiValue,
              summary.totalGrossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
            ]}
          >
            {formatCurrency(summary.totalGrossProfit)}
          </Text>
          <View style={styles.badgeWrapper}>
            {marginPeriodo !== null && <BadgeRentabilidad margen={marginPeriodo} tamano="pequeno" />}
          </View>
        </View>

        {/* Dinero Cobrado Efectivo */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialIcons name="check-circle" size={16} color="#00E676" />
            <Text style={styles.kpiLabel}>Cobrado Efectivo</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#00E676' }]}>
            {formatCurrency(summary.totalCollectedValue)}
          </Text>
          <Text style={styles.kpiSub}>Ingreso real en cuentas</Text>
        </View>

        {/* Pendiente de Cobro */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <MaterialIcons name="pending-actions" size={16} color="#FFB300" />
            <Text style={styles.kpiLabel}>Pendiente Cobro</Text>
          </View>
          <Text style={[styles.kpiValue, { color: summary.totalPendingCollectValue > 0 ? '#FFB300' : COLORS.onSurface }]}>
            {formatCurrency(summary.totalPendingCollectValue)}
          </Text>
          <Text style={styles.kpiSub}>En cuentas por cobrar</Text>
        </View>
      </View>

      {/* SECCIÓN ALERTAS DE STOCK */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons
            name="warning-amber"
            size={18}
            color={summary.lowStockCount + summary.outOfStockCount > 0 ? '#FFB300' : COLORS.onSurfaceVariant}
          />
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
            <Text style={styles.alertCounterText}>
              {summary.lowStockCount + summary.outOfStockCount}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onVerCatalogoAlertas} activeOpacity={0.7} style={styles.sectionActionBtn}>
          <Text style={styles.sectionActionText}>Ver en catálogo</Text>
          <MaterialIcons name="chevron-right" size={16} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {alertProducts.length === 0 ? (
        <View style={styles.emptyAlertsCard}>
          <MaterialIcons name="check-circle-outline" size={28} color="#00E676" />
          <View style={styles.emptyAlertsTextCol}>
            <Text style={styles.emptyAlertsTitle}>Stock en niveles óptimos</Text>
            <Text style={styles.emptyAlertsSub}>
              Todos los productos activos cuentan con existencias superiores a su stock mínimo.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.alertsList}>
          {alertProducts.slice(0, 4).map(prod => {
            const isOut = prod.isOutOfStock;
            return (
              <TouchableOpacity
                key={prod.id}
                style={[styles.alertProductCard, isOut ? styles.cardOutOfStock : styles.cardLowStock]}
                onPress={() => onAbrirDetalleProducto(prod)}
                activeOpacity={0.8}
              >
                <View style={styles.alertCardLeft}>
                  <View
                    style={[
                      styles.alertStatusDot,
                      { backgroundColor: isOut ? '#FF5252' : '#FFB300' },
                    ]}
                  />
                  <View style={styles.alertProductInfo}>
                    <Text style={styles.alertProductName} numberOfLines={1}>
                      {prod.name}
                    </Text>
                    <Text style={styles.alertProductCategory}>
                      {prod.category} • Min: {prod.minStock} {prod.saleUnit}s
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
                        { color: isOut ? '#FF5252' : '#FFB300' },
                      ]}
                    >
                      {isOut ? 'Agotado (0)' : `${prod.currentStock} ${prod.saleUnit}s`}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={COLORS.onSurfaceVariant} />
                </View>
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

      {/* ACCIONES RÁPIDAS DEL MÓDULO */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.quickActionsTitle, TYPOGRAPHY.etiquetaMayusculas]}>
          Accesos Rápidos
        </Text>

        <View style={styles.quickActionsGrid}>
          {/* Botón: Nuevo Producto */}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={onNuevoProducto}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(87, 245, 171, 0.12)' }]}>
              <MaterialIcons name="add-circle-outline" size={22} color={COLORS.secondary} />
            </View>
            <View style={styles.quickActionTextCol}>
              <Text style={styles.quickActionBtnTitle}>Nuevo Producto</Text>
              <Text style={styles.quickActionBtnSub}>Crear en el catálogo</Text>
            </View>
          </TouchableOpacity>

          {/* Botón: Importar desde Excel */}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={onImportarExcel}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 210, 255, 0.12)' }]}>
              <MaterialIcons name="table-view" size={22} color="#00D2FF" />
            </View>
            <View style={styles.quickActionTextCol}>
              <Text style={styles.quickActionBtnTitle}>Importar Excel</Text>
              <Text style={styles.quickActionBtnSub}>Hoja INVERSIONES</Text>
            </View>
          </TouchableOpacity>

          {/* Botón: Ver Catálogo */}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={onVerCatalogo}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(209, 188, 255, 0.12)' }]}>
              <MaterialIcons name="list-alt" size={22} color="#D1BCFF" />
            </View>
            <View style={styles.quickActionTextCol}>
              <Text style={styles.quickActionBtnTitle}>Ver Catálogo</Text>
              <Text style={styles.quickActionBtnSub}>{summary.totalProducts} productos</Text>
            </View>
          </TouchableOpacity>

          {/* Botón: Análisis y Reportes */}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={onVerAnalisis}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 179, 0, 0.12)' }]}>
              <MaterialIcons name="analytics" size={22} color="#FFB300" />
            </View>
            <View style={styles.quickActionTextCol}>
              <Text style={styles.quickActionBtnTitle}>Análisis de Ventas</Text>
              <Text style={styles.quickActionBtnSub}>Rankings y evolución</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
  heroValuationCard: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeaderTextCol: {
    flex: 1,
  },
  heroCardLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  heroCardSub: {
    color: COLORS.onSurfaceVariant + '90',
    fontSize: 11,
  },
  heroBigAmount: {
    color: COLORS.onSurface,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroMetaCol: {
    flex: 1,
    gap: 2,
  },
  heroMetaKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  heroMetaVal: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  heroMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
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
    fontSize: 11,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  kpiSub: {
    color: COLORS.onSurfaceVariant + '90',
    fontSize: 10,
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  alertCounterBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
  },
  alertCounterNormal: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  alertCounterLowStock: {
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
  },
  alertCounterOutOfStock: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },
  alertCounterText: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyAlertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.15)',
  },
  emptyAlertsTextCol: {
    flex: 1,
    gap: 2,
  },
  emptyAlertsTitle: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyAlertsSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 14,
  },
  alertsList: {
    gap: 8,
  },
  alertProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  cardOutOfStock: {
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  cardLowStock: {
    borderColor: 'rgba(255, 179, 0, 0.25)',
  },
  alertCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertProductInfo: {
    flex: 1,
    gap: 2,
  },
  alertProductName: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  alertProductCategory: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  alertCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertStockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockPillOut: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  stockPillLow: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
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
    fontSize: 11,
    fontWeight: '600',
  },
  quickActionsSection: {
    gap: 10,
    paddingTop: 8,
  },
  quickActionsTitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTextCol: {
    flex: 1,
  },
  quickActionBtnTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionBtnSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
});
