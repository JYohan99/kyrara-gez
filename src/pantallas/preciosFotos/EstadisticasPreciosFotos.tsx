import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';
import {
  useEstadisticasCatalogoFotosBoveda,
  useProductosFotosBoveda,
  useEvolucionTarifasProductoBoveda,
} from '@/datos/hooks';
import { ProductoFoto, EvolucionTarifaItem } from '@/datos/tipos';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesEstadisticasPreciosFotos {
  productoIdInicial?: string;
  onVerHistorialProducto?: (productoId: string) => void;
  onIrAlCatalogo?: () => void;
}

export const EstadisticasPreciosFotos: React.FC<PropiedadesEstadisticasPreciosFotos> = ({
  productoIdInicial,
  onVerHistorialProducto,
  onIrAlCatalogo,
}) => {
  const { stats } = useEstadisticasCatalogoFotosBoveda();
  const { products: allProducts } = useProductosFotosBoveda();

  // Producto seleccionado para consultar evolución individual
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    if (productoIdInicial) return productoIdInicial;
    return allProducts.length > 0 ? allProducts[0].id : '';
  });

  const [busquedaRentabilidad, setBusquedaRentabilidad] = useState('');
  const [filtroEstadoRentabilidad, setFiltroEstadoRentabilidad] = useState<
    'TODOS' | 'ACTIVOS' | 'INACTIVOS'
  >('ACTIVOS');

  // Producto actualmente seleccionado para evolución
  const selectedProduct = useMemo(() => {
    return allProducts.find(p => p.id === selectedProductId) || allProducts[0] || null;
  }, [allProducts, selectedProductId]);

  // Evolución de tarifas del producto seleccionado
  const { evolution } = useEvolucionTarifasProductoBoveda(selectedProduct?.id);

  // Filtrado de la tabla de rentabilidad actual
  const productosRentabilidad = useMemo(() => {
    const q = busquedaRentabilidad.trim().toLowerCase();
    return allProducts.filter(p => {
      if (filtroEstadoRentabilidad === 'ACTIVOS' && !p.isActive) return false;
      if (filtroEstadoRentabilidad === 'INACTIVOS' && p.isActive) return false;

      if (!q) return true;
      const nom = (p.name || '').toLowerCase();
      const fmt = (p.sizeFormat || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return nom.includes(q) || fmt.includes(q) || cat.includes(q);
    });
  }, [allProducts, busquedaRentabilidad, filtroEstadoRentabilidad]);

  const handleSelectProduct = (id: string) => {
    triggerSelection();
    setSelectedProductId(id);
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.mainTitle, TYPOGRAPHY.titularGrande]}>
            Estadísticas del Catálogo
          </Text>
          <Text style={[styles.mainSubtitle, TYPOGRAPHY.cuerpoPequeno]}>
            Rentabilidad unitaria y evolución temporal de tarifas
          </Text>
        </View>
      </View>

      {/* Cartel de Aclaración sobre Estimaciones */}
      <View style={styles.disclaimerBanner}>
        <MaterialIcons name="info-outline" size={18} color="#00D2FF" />
        <Text style={styles.disclaimerText}>
          Los valores representan estimaciones teóricas de rentabilidad según precios
          y costos vigentes del catálogo. No representan ingresos ni ventas reales realizadas.
        </Text>
      </View>

      {/* Tarjetas KPI de Resumen Global */}
      <View style={styles.kpiGrid}>
        <GlassCard variant="surface" style={styles.kpiCard}>
          <View style={styles.kpiIconCircle}>
            <MaterialIcons name="check-circle" size={18} color="#57F5AB" />
          </View>
          <Text style={[styles.kpiValue, TYPOGRAPHY.titularPequeno]}>
            {stats.totalActivosGlobal}
          </Text>
          <Text style={styles.kpiLabel}>Productos Activos</Text>
        </GlassCard>

        <GlassCard variant="surface" style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconCircle,
              { backgroundColor: 'rgba(229, 192, 123, 0.12)' },
            ]}
          >
            <MaterialIcons name="money-off" size={18} color="#E5C07B" />
          </View>
          <Text
            style={[
              styles.kpiValue,
              TYPOGRAPHY.titularPequeno,
              stats.totalSinPrecioGlobal > 0 && { color: '#E5C07B' },
            ]}
          >
            {stats.totalSinPrecioGlobal}
          </Text>
          <Text style={styles.kpiLabel}>Sin Precio</Text>
        </GlassCard>

        <GlassCard variant="surface" style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconCircle,
              { backgroundColor: 'rgba(229, 192, 123, 0.12)' },
            ]}
          >
            <MaterialIcons name="help-outline" size={18} color="#E5C07B" />
          </View>
          <Text
            style={[
              styles.kpiValue,
              TYPOGRAPHY.titularPequeno,
              stats.totalSinCostoGlobal > 0 && { color: '#E5C07B' },
            ]}
          >
            {stats.totalSinCostoGlobal}
          </Text>
          <Text style={styles.kpiLabel}>Sin Costo</Text>
        </GlassCard>

        <GlassCard variant="surface" style={styles.kpiCard}>
          <View
            style={[
              styles.kpiIconCircle,
              { backgroundColor: 'rgba(0, 210, 255, 0.12)' },
            ]}
          >
            <MaterialIcons name="photo-library" size={18} color="#00D2FF" />
          </View>
          <Text style={[styles.kpiValue, TYPOGRAPHY.titularPequeno]}>
            {stats.totalProductosGlobal}
          </Text>
          <Text style={styles.kpiLabel}>Total Catálogo</Text>
        </GlassCard>
      </View>

      {/* Métricas por Moneda (Separadas estrictamente) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
          Promedios por Moneda
        </Text>
        <Text style={styles.sectionSubtitle}>
          Cálculos independientes para evitar mezclar divisas
        </Text>
      </View>

      {stats.monedas.map(moneda => {
        const mStat = stats.porMoneda[moneda];
        return (
          <GlassCard key={moneda} variant="surface" style={styles.currencyCard}>
            <View style={styles.currencyCardHeader}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>{moneda}</Text>
              </View>
              <Text style={styles.currencyProductsCount}>
                {mStat.totalProductos}{' '}
                {mStat.totalProductos === 1 ? 'producto' : 'productos'} (
                {mStat.totalTarifasRegistradas} tarifas históricas)
              </Text>
            </View>

            <View style={styles.averagesGrid}>
              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Precio Promedio</Text>
                <Text style={styles.averageValue}>
                  {mStat.precioPromedio !== null
                    ? formatCurrency(mStat.precioPromedio, { moneda })
                    : 'Sin datos'}
                </Text>
              </View>

              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Costo Promedio</Text>
                <Text style={styles.averageValueCost}>
                  {mStat.costoPromedio !== null
                    ? formatCurrency(mStat.costoPromedio, { moneda })
                    : 'Sin datos'}
                </Text>
              </View>

              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Ganancia Prom.</Text>
                <Text style={styles.averageValueProfit}>
                  {mStat.gananciaPromedio !== null
                    ? formatCurrency(mStat.gananciaPromedio, { moneda })
                    : 'Sin datos'}
                </Text>
              </View>

              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Margen Prom.</Text>
                <Text style={styles.averageValueMargin}>
                  {mStat.margenPromedio !== null
                    ? `${mStat.margenPromedio.toFixed(1)}%`
                    : '-'}
                </Text>
              </View>
            </View>
          </GlassCard>
        );
      })}

      {/* Sección: Evolución y Comparativa de Producto Individual */}
      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
          Evolución de Producto Individual
        </Text>
        <Text style={styles.sectionSubtitle}>
          Selecciona un producto para consultar y comparar sus tarifas en el tiempo
        </Text>
      </View>

      {/* Selector Horizontal de Productos */}
      {allProducts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.evolutionPickerRow}
        >
          {allProducts.map(p => {
            const isSelected = selectedProduct?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.evolutionPickerChip,
                  isSelected && styles.evolutionPickerChipActive,
                ]}
                onPress={() => handleSelectProduct(p.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.evolutionPickerText,
                    isSelected && styles.evolutionPickerTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selectedProduct ? (
        <GlassCard variant="surface" style={styles.evolutionCard}>
          {/* Ficha del Producto Seleccionado */}
          <View style={styles.productProfileHeader}>
            <View style={styles.profileTitleCol}>
              <Text
                style={[styles.profileProductName, TYPOGRAPHY.titularPequeno]}
              >
                {selectedProduct.name}
              </Text>
              <View style={styles.profileTagsRow}>
                {selectedProduct.sizeFormat && (
                  <View style={styles.profileTag}>
                    <Text style={styles.profileTagText}>
                      {selectedProduct.sizeFormat}
                    </Text>
                  </View>
                )}
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>
                    {selectedProduct.saleUnit}
                  </Text>
                </View>
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>
                    {selectedProduct.category}
                  </Text>
                </View>
                <View style={styles.profileCurrencyTag}>
                  <Text style={styles.profileCurrencyText}>
                    {selectedProduct.currency || 'UYU'}
                  </Text>
                </View>
              </View>
            </View>

            {onVerHistorialProducto && (
              <TouchableOpacity
                style={styles.seeHistoryBtn}
                onPress={() => onVerHistorialProducto(selectedProduct.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="history" size={16} color={COLORS.secondary} />
                <Text style={styles.seeHistoryBtnText}>Ver en Historial</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Línea de Tiempo de Evolución */}
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>
              Tarifas registradas a lo largo del tiempo ({evolution.length})
            </Text>

            {evolution.length === 0 ? (
              <Text style={styles.noTariffsText}>
                Este producto no tiene tarifas registradas en el historial todavía.
                El seguimiento comienza a partir de la implementación de tarifas.
              </Text>
            ) : (
              evolution.map((item: EvolucionTarifaItem, index: number) => {
                const mon = selectedProduct.currency || 'UYU';
                const tieneVariacion = item.salePriceDiff !== null;

                return (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeftTrack}>
                      <View
                        style={[
                          styles.timelineDot,
                          item.isCurrent && styles.timelineDotCurrent,
                        ]}
                      />
                      {index < evolution.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>

                    <View style={styles.timelineContent}>
                      <View style={styles.timelineDateRow}>
                        <Text style={styles.timelineDate}>
                          📅 {item.validFrom}
                          {item.validTo ? ` hasta ${item.validTo}` : ' (Vigente actualmente)'}
                        </Text>
                        {item.isCurrent && (
                          <View style={styles.currentMiniBadge}>
                            <Text style={styles.currentMiniBadgeText}>
                              Tarifa actual
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Comparativa de Valores */}
                      <View style={styles.timelineValuesRow}>
                        <View style={styles.timelineValueBox}>
                          <Text style={styles.timelineValueLabel}>Venta:</Text>
                          <Text style={styles.timelinePriceText}>
                            {formatCurrency(item.salePrice, { moneda: mon })}
                          </Text>
                          {tieneVariacion && (
                            <Text
                              style={[
                                styles.timelineDiffText,
                                item.salePriceDiff! >= 0
                                  ? styles.diffPositive
                                  : styles.diffNegative,
                              ]}
                            >
                              {item.salePriceDiff! >= 0 ? '+' : ''}
                              {formatCurrency(item.salePriceDiff!, { moneda: mon })}
                              {item.salePriceDiffPercent !== null
                                ? ` (${item.salePriceDiffPercent >= 0 ? '+' : ''}${item.salePriceDiffPercent.toFixed(1)}%)`
                                : ''}
                            </Text>
                          )}
                        </View>

                        <View style={styles.timelineValueBox}>
                          <Text style={styles.timelineValueLabel}>Costo:</Text>
                          <Text style={styles.timelineCostText}>
                            {formatCurrency(item.costPrice, { moneda: mon })}
                          </Text>
                        </View>

                        <View style={styles.timelineValueBox}>
                          <Text style={styles.timelineValueLabel}>Margen:</Text>
                          <Text style={styles.timelineMarginText}>
                            {item.grossMarginPercent !== null
                              ? `${item.grossMarginPercent.toFixed(1)}%`
                              : '-'}
                          </Text>
                        </View>
                      </View>

                      {item.notes && (
                        <Text style={styles.timelineNotes}>
                          Nota: {item.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </GlassCard>
      ) : null}

      {/* Sección: Tabla de Rentabilidad Actual por Producto */}
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
          Rentabilidad Actual del Catálogo
        </Text>
        <Text style={styles.sectionSubtitle}>
          Comparativa de precios, costos y márgenes por producto
        </Text>
      </View>

      {/* Buscador de la tabla */}
      <View style={styles.searchBar}>
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          value={busquedaRentabilidad}
          onChangeText={setBusquedaRentabilidad}
          placeholder="Filtrar productos..."
          placeholderTextColor={COLORS.onSurfaceVariant + '80'}
          style={[styles.searchInput, TYPOGRAPHY.cuerpoMedio]}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtro estado tabla */}
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            filtroEstadoRentabilidad === 'ACTIVOS' && styles.statusBtnActive,
          ]}
          onPress={() => setFiltroEstadoRentabilidad('ACTIVOS')}
        >
          <Text
            style={[
              styles.statusBtnText,
              filtroEstadoRentabilidad === 'ACTIVOS' && styles.statusBtnTextActive,
            ]}
          >
            Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusBtn,
            filtroEstadoRentabilidad === 'TODOS' && styles.statusBtnActive,
          ]}
          onPress={() => setFiltroEstadoRentabilidad('TODOS')}
        >
          <Text
            style={[
              styles.statusBtnText,
              filtroEstadoRentabilidad === 'TODOS' && styles.statusBtnTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusBtn,
            filtroEstadoRentabilidad === 'INACTIVOS' && styles.statusBtnActive,
          ]}
          onPress={() => setFiltroEstadoRentabilidad('INACTIVOS')}
        >
          <Text
            style={[
              styles.statusBtnText,
              filtroEstadoRentabilidad === 'INACTIVOS' && styles.statusBtnTextActive,
            ]}
          >
            Inactivos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Rentabilidad de Productos */}
      <View style={styles.profitabilityList}>
        {productosRentabilidad.map((p: ProductoFoto) => {
          const mon = p.currency || 'UYU';
          const tienePrecio = p.basePrice !== undefined && p.basePrice > 0;
          const tieneCosto = p.costPrice !== undefined && p.costPrice > 0;
          const isSelected = selectedProduct?.id === p.id;

          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => handleSelectProduct(p.id)}
              activeOpacity={0.8}
            >
              <GlassCard
                variant="surface"
                style={[
                  styles.productRentCard,
                  isSelected && styles.productRentCardSelected,
                ]}
              >
                <View style={styles.rentHeader}>
                  <View style={styles.rentNameBox}>
                    <Text
                      style={[styles.rentProductName, TYPOGRAPHY.titularPequeno]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Text style={styles.rentProductFormat}>
                      {p.sizeFormat || p.category} • {p.saleUnit} ({mon})
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.activeTag,
                      !p.isActive && styles.inactiveTag,
                    ]}
                  >
                    <Text
                      style={[
                        styles.activeTagText,
                        !p.isActive && styles.inactiveTagText,
                      ]}
                    >
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                {/* Métricas del producto */}
                <View style={styles.rentMetricsRow}>
                  <View style={styles.rentMetricCol}>
                    <Text style={styles.rentMetricLabel}>Precio Venta:</Text>
                    {tienePrecio ? (
                      <Text style={styles.rentMetricPrice}>
                        {formatCurrency(p.basePrice!, { moneda: mon })}
                      </Text>
                    ) : (
                      <Text style={styles.missingWarning}>⚠️ Sin precio</Text>
                    )}
                  </View>

                  <View style={styles.rentMetricCol}>
                    <Text style={styles.rentMetricLabel}>Costo Unit.:</Text>
                    {tieneCosto ? (
                      <Text style={styles.rentMetricCost}>
                        {formatCurrency(p.costPrice!, { moneda: mon })}
                      </Text>
                    ) : (
                      <Text style={styles.missingWarning}>⚠️ Sin costo</Text>
                    )}
                  </View>

                  <View style={styles.rentMetricCol}>
                    <Text style={styles.rentMetricLabel}>Ganancia Est.:</Text>
                    {tienePrecio && tieneCosto && p.grossProfit !== undefined ? (
                      <Text
                        style={[
                          styles.rentMetricProfit,
                          p.grossProfit >= 0 ? styles.profitPos : styles.profitNeg,
                        ]}
                      >
                        {formatCurrency(p.grossProfit, { moneda: mon })}
                      </Text>
                    ) : (
                      <Text style={styles.missingWarning}>No calculable</Text>
                    )}
                  </View>

                  <View style={styles.rentMetricCol}>
                    <Text style={styles.rentMetricLabel}>Margen:</Text>
                    {p.grossMarginPercent !== null && p.grossMarginPercent !== undefined ? (
                      <BadgeRentabilidad margen={p.grossMarginPercent} />
                    ) : (
                      <Text style={styles.missingWarning}>-</Text>
                    )}
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
  },
  mainTitle: {
    color: COLORS.onSurface,
  },
  mainSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
    gap: 8,
  },
  disclaimerText: {
    color: '#00D2FF',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  kpiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    color: COLORS.onSurface,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  sectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  currencyCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    marginBottom: 12,
  },
  currencyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencyBadge: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.3)',
  },
  currencyBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  currencyProductsCount: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  averagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 10,
  },
  averageItem: {
    flex: 1,
    alignItems: 'center',
  },
  averageLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 4,
  },
  averageValue: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  averageValueCost: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  averageValueProfit: {
    color: '#57F5AB',
    fontSize: 12,
    fontWeight: '700',
  },
  averageValueMargin: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  evolutionPickerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  evolutionPickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 160,
  },
  evolutionPickerChipActive: {
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    borderColor: 'rgba(0, 210, 255, 0.35)',
  },
  evolutionPickerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  evolutionPickerTextActive: {
    color: '#00D2FF',
    fontWeight: '700',
  },
  evolutionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    marginBottom: 16,
  },
  productProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
  },
  profileTitleCol: {
    flex: 1,
  },
  profileProductName: {
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  profileTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  profileTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  profileTagText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  profileCurrencyTag: {
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  profileCurrencyText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  seeHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  seeHistoryBtnText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineContainer: {
    gap: 10,
  },
  timelineTitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  noTariffsText: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineLeftTrack: {
    alignItems: 'center',
    width: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.onSurfaceVariant,
    marginTop: 3,
  },
  timelineDotCurrent: {
    backgroundColor: '#57F5AB',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  timelineDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineDate: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  currentMiniBadge: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentMiniBadgeText: {
    color: '#57F5AB',
    fontSize: 9,
    fontWeight: '700',
  },
  timelineValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineValueBox: {
    flex: 1,
  },
  timelineValueLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  timelinePriceText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineCostText: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  timelineMarginText: {
    color: '#57F5AB',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineDiffText: {
    fontSize: 9,
    fontWeight: '600',
  },
  diffPositive: {
    color: '#57F5AB',
  },
  diffNegative: {
    color: COLORS.gasto,
  },
  timelineNotes: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.onSurface,
    paddingVertical: 0,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  statusBtnTextActive: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  profitabilityList: {
    gap: 10,
    marginBottom: 20,
  },
  productRentCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  productRentCardSelected: {
    borderColor: 'rgba(0, 210, 255, 0.4)',
    backgroundColor: 'rgba(0, 210, 255, 0.03)',
  },
  rentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rentNameBox: {
    flex: 1,
  },
  rentProductName: {
    color: COLORS.onSurface,
  },
  rentProductFormat: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 1,
  },
  activeTag: {
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#57F5AB',
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  inactiveTagText: {
    color: COLORS.onSurfaceVariant,
  },
  rentMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  rentMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  rentMetricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    marginBottom: 2,
  },
  rentMetricPrice: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  rentMetricCost: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '600',
  },
  rentMetricProfit: {
    fontSize: 11,
    fontWeight: '700',
  },
  profitPos: {
    color: '#57F5AB',
  },
  profitNeg: {
    color: COLORS.gasto,
  },
  rentMetricMargin: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  missingWarning: {
    color: '#E5C07B',
    fontSize: 9,
    fontWeight: '600',
  },
});

export const EstadisticasProductos = EstadisticasPreciosFotos;
export const ProductCatalogStatistics = EstadisticasPreciosFotos;
