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
  useHistorialPreciosBoveda,
  useProductosFotosBoveda,
} from '@/datos/hooks';
import { CambioPrecioHistorial } from '@/datos/tipos';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesHistorialPreciosFotos {
  productoIdInicial?: string;
  onIrAlCatalogo?: () => void;
}

type FiltroPeriodo = 'TODOS' | '30_DIAS' | '90_DIAS' | 'ESTE_ANO';

export const HistorialPreciosFotos: React.FC<PropiedadesHistorialPreciosFotos> = ({
  productoIdInicial,
  onIrAlCatalogo,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    productoIdInicial || 'TODOS'
  );
  const [periodFilter, setPeriodFilter] = useState<FiltroPeriodo>('TODOS');
  const [currencyFilter, setCurrencyFilter] = useState<string>('TODAS');
  const [search, setSearch] = useState('');

  // Calcular fecha de inicio según período
  const startDate = useMemo(() => {
    if (periodFilter === 'TODOS') return undefined;
    const now = new Date();
    if (periodFilter === '30_DIAS') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }
    if (periodFilter === '90_DIAS') {
      const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }
    if (periodFilter === 'ESTE_ANO') {
      return `${now.getFullYear()}-01-01`;
    }
    return undefined;
  }, [periodFilter]);

  // Hook reactivo al historial
  const { history } = useHistorialPreciosBoveda({
    productId: selectedProductId === 'TODOS' ? undefined : selectedProductId,
    startDate,
    currency: currencyFilter === 'TODAS' ? undefined : currencyFilter,
    search: search.trim() ? search.trim() : undefined,
  });

  // Lista de productos para el filtro
  const { products: allProducts } = useProductosFotosBoveda();

  // Monedas detectadas en el catálogo
  const monedasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const p of allProducts) {
      if (p.currency) set.add(p.currency);
    }
    return Array.from(set);
  }, [allProducts]);

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.mainTitle, TYPOGRAPHY.titularGrande]}>
            Historial de Tarifas
          </Text>
          <Text style={[styles.mainSubtitle, TYPOGRAPHY.cuerpoPequeno]}>
            Seguimiento de cambios en precios de venta y costos
          </Text>
        </View>

        <View style={styles.countBadge}>
          <MaterialIcons name="history" size={16} color={COLORS.secondary} />
          <Text style={styles.countBadgeText}>
            {history.length} {history.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchBar}>
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cambios por producto o formato..."
          placeholderTextColor={COLORS.onSurfaceVariant + '80'}
          style={[styles.searchInput, TYPOGRAPHY.cuerpoMedio]}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              triggerSelection();
              setSearch('');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={18} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtro de Período */}
      <View style={styles.periodFilterTrack}>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            periodFilter === 'TODOS' && styles.periodBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setPeriodFilter('TODOS');
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.periodBtnText,
              periodFilter === 'TODOS' && styles.periodBtnTextActive,
            ]}
          >
            Todo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodBtn,
            periodFilter === '30_DIAS' && styles.periodBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setPeriodFilter('30_DIAS');
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.periodBtnText,
              periodFilter === '30_DIAS' && styles.periodBtnTextActive,
            ]}
          >
            30 días
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodBtn,
            periodFilter === '90_DIAS' && styles.periodBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setPeriodFilter('90_DIAS');
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.periodBtnText,
              periodFilter === '90_DIAS' && styles.periodBtnTextActive,
            ]}
          >
            90 días
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodBtn,
            periodFilter === 'ESTE_ANO' && styles.periodBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setPeriodFilter('ESTE_ANO');
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.periodBtnText,
              periodFilter === 'ESTE_ANO' && styles.periodBtnTextActive,
            ]}
          >
            Este año
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtro por Producto (Horizontal Chips) */}
      {allProducts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsFilterRow}
        >
          <TouchableOpacity
            style={[
              styles.productChip,
              selectedProductId === 'TODOS' && styles.productChipActive,
            ]}
            onPress={() => {
              triggerSelection();
              setSelectedProductId('TODOS');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.productChipText,
                selectedProductId === 'TODOS' && styles.productChipTextActive,
              ]}
            >
              Todos los productos
            </Text>
          </TouchableOpacity>

          {allProducts.map(p => {
            const isSelected = selectedProductId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.productChip,
                  isSelected && styles.productChipActive,
                ]}
                onPress={() => {
                  triggerSelection();
                  setSelectedProductId(p.id);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.productChipText,
                    isSelected && styles.productChipTextActive,
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

      {/* Filtro por Moneda si hay más de una */}
      {monedasDisponibles.length > 1 && (
        <View style={styles.currencyFilterRow}>
          <Text style={styles.currencyFilterLabel}>Moneda:</Text>
          <TouchableOpacity
            style={[
              styles.currencyChip,
              currencyFilter === 'TODAS' && styles.currencyChipActive,
            ]}
            onPress={() => {
              triggerSelection();
              setCurrencyFilter('TODAS');
            }}
          >
            <Text
              style={[
                styles.currencyChipText,
                currencyFilter === 'TODAS' && styles.currencyChipTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {monedasDisponibles.map(m => (
            <TouchableOpacity
              key={m}
              style={[
                styles.currencyChip,
                currencyFilter === m && styles.currencyChipActive,
              ]}
              onPress={() => {
                triggerSelection();
                setCurrencyFilter(m);
              }}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  currencyFilter === m && styles.currencyChipTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Lista de Cambios Históricos (ordenados del más reciente al más antiguo) */}
      {history.length === 0 ? (
        <GlassCard variant="surface" style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <MaterialIcons
              name="history-toggle-off"
              size={36}
              color={COLORS.onSurfaceVariant}
            />
          </View>
          <Text style={[styles.emptyTitle, TYPOGRAPHY.titularPequeno]}>
            Sin cambios de tarifas registrados
          </Text>
          <Text style={[styles.emptySubtitle, TYPOGRAPHY.cuerpoMedio]}>
            {selectedProductId !== 'TODOS' || periodFilter !== 'TODOS' || search
              ? 'No se encontraron cambios históricos con los filtros seleccionados.'
              : 'El seguimiento histórico comienza a registrarse automáticamente a partir de la implementación de tarifas.'}
          </Text>

          {onIrAlCatalogo && (
            <TouchableOpacity
              style={styles.catalogLinkBtn}
              onPress={onIrAlCatalogo}
              activeOpacity={0.8}
            >
              <Text style={styles.catalogLinkText}>Ver productos en el Catálogo</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      ) : (
        <View style={styles.historyList}>
          {history.map((change: CambioPrecioHistorial) => {
            const mon = change.currency;
            const tieneCambioPrecio = change.previousSalePrice !== null;
            const tieneCambioCosto = change.previousCostPrice !== null;

            return (
              <GlassCard
                key={change.id}
                variant="surface"
                style={[
                  styles.changeCard,
                  change.isCurrent && styles.changeCardCurrent,
                ]}
              >
                {/* Cabecera del Cambio */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleCol}>
                    <Text
                      style={[styles.productName, TYPOGRAPHY.titularPequeno]}
                      numberOfLines={1}
                    >
                      {change.productName}
                    </Text>
                    <View style={styles.tagsRow}>
                      {change.sizeFormat && (
                        <View style={styles.formatTag}>
                          <Text style={styles.formatTagText}>
                            {change.sizeFormat}
                          </Text>
                        </View>
                      )}
                      <View style={styles.unitTag}>
                        <Text style={styles.unitTagText}>
                          {change.saleUnit}
                        </Text>
                      </View>
                      <View style={styles.currencyTag}>
                        <Text style={styles.currencyTagText}>{mon}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statusBadgesCol}>
                    {change.isCurrent ? (
                      <View style={styles.currentBadge}>
                        <View style={styles.greenDot} />
                        <Text style={styles.currentBadgeText}>Vigente</Text>
                      </View>
                    ) : (
                      <View style={styles.historicalBadge}>
                        <Text style={styles.historicalBadgeText}>Histórica</Text>
                      </View>
                    )}
                    <Text style={styles.dateText}>
                      📅 {change.validFrom}
                    </Text>
                  </View>
                </View>

                {/* Grid comparativo: Precio y Costo */}
                <View style={styles.comparisonGrid}>
                  {/* Fila de Precio de Venta */}
                  <View style={styles.comparisonRow}>
                    <View style={styles.metricNameBox}>
                      <Text style={styles.metricTitle}>Precio de Venta</Text>
                      <Text style={styles.metricSubtitle}>Unitario</Text>
                    </View>

                    <View style={styles.valuesBox}>
                      {tieneCambioPrecio ? (
                        <View style={styles.transitionBox}>
                          <Text style={styles.oldPriceText}>
                            {formatCurrency(change.previousSalePrice!, {
                              moneda: mon,
                            })}
                          </Text>
                          <MaterialIcons
                            name="arrow-forward"
                            size={14}
                            color={COLORS.onSurfaceVariant}
                          />
                          <Text style={styles.newPriceText}>
                            {formatCurrency(change.newSalePrice, { moneda: mon })}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.initialPriceBox}>
                          <Text style={styles.initialTag}>Inicial:</Text>
                          <Text style={styles.newPriceText}>
                            {formatCurrency(change.newSalePrice, { moneda: mon })}
                          </Text>
                        </View>
                      )}

                      {/* Variación */}
                      {change.salePriceDiff !== null && (
                        <View
                          style={[
                            styles.diffBadge,
                            change.salePriceDiff >= 0
                              ? styles.diffPositive
                              : styles.diffNegative,
                          ]}
                        >
                          <Text
                            style={[
                              styles.diffText,
                              change.salePriceDiff >= 0
                                ? styles.diffTextPositive
                                : styles.diffTextNegative,
                            ]}
                          >
                            {change.salePriceDiff >= 0 ? '+' : ''}
                            {formatCurrency(change.salePriceDiff, { moneda: mon })}
                            {change.salePriceDiffPercent !== null
                              ? ` (${change.salePriceDiffPercent >= 0 ? '+' : ''}${change.salePriceDiffPercent.toFixed(1)}%)`
                              : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Fila de Costo Unitario */}
                  <View style={styles.comparisonRow}>
                    <View style={styles.metricNameBox}>
                      <Text style={styles.metricTitle}>Costo</Text>
                      <Text style={styles.metricSubtitle}>Unitario</Text>
                    </View>

                    <View style={styles.valuesBox}>
                      {tieneCambioCosto ? (
                        <View style={styles.transitionBox}>
                          <Text style={styles.oldCostText}>
                            {formatCurrency(change.previousCostPrice!, {
                              moneda: mon,
                            })}
                          </Text>
                          <MaterialIcons
                            name="arrow-forward"
                            size={14}
                            color={COLORS.onSurfaceVariant}
                          />
                          <Text style={styles.newCostText}>
                            {formatCurrency(change.newCostPrice, { moneda: mon })}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.initialPriceBox}>
                          <Text style={styles.initialTag}>Inicial:</Text>
                          <Text style={styles.newCostText}>
                            {formatCurrency(change.newCostPrice, { moneda: mon })}
                          </Text>
                        </View>
                      )}

                      {/* Variación de Costo */}
                      {change.costPriceDiff !== null && (
                        <View style={styles.diffBadgeNeutral}>
                          <Text style={styles.diffTextNeutral}>
                            {change.costPriceDiff >= 0 ? '+' : ''}
                            {formatCurrency(change.costPriceDiff, { moneda: mon })}
                            {change.costPriceDiffPercent !== null
                              ? ` (${change.costPriceDiffPercent >= 0 ? '+' : ''}${change.costPriceDiffPercent.toFixed(1)}%)`
                              : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Pie de Ganancia y Margen Estimado */}
                <View style={styles.profitFooter}>
                  <View style={styles.profitCol}>
                    <Text style={styles.profitLabel}>Ganancia Bruta Est.:</Text>
                    <Text style={styles.profitValue}>
                      {formatCurrency(change.newGrossProfit, { moneda: mon })}
                    </Text>
                  </View>

                  <View style={styles.marginCol}>
                    <Text style={styles.profitLabel}>Margen Estimado:</Text>
                    {change.newGrossMarginPercent !== null ? (
                      <BadgeRentabilidad margen={change.newGrossMarginPercent} />
                    ) : (
                      <Text style={styles.marginValue}>No calculable</Text>
                    )}
                  </View>
                </View>

                {/* Notas registradas del cambio */}
                {change.notes && (
                  <View style={styles.notesRow}>
                    <MaterialIcons
                      name="note"
                      size={13}
                      color={COLORS.onSurfaceVariant}
                    />
                    <Text style={styles.notesText}>{change.notes}</Text>
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>
      )}
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
    marginBottom: 14,
  },
  titleCol: {
    flex: 1,
    paddingRight: 10,
  },
  mainTitle: {
    color: COLORS.onSurface,
  },
  mainSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.25)',
  },
  countBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.onSurface,
    paddingVertical: 0,
  },
  periodFilterTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  periodBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  periodBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  periodBtnTextActive: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  productsFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  productChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 160,
  },
  productChipActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderColor: 'rgba(87, 245, 171, 0.35)',
  },
  productChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  productChipTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  currencyFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currencyFilterLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  currencyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  currencyChipActive: {
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  currencyChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  currencyChipTextActive: {
    color: '#00D2FF',
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
    marginBottom: 14,
  },
  catalogLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  catalogLinkText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  historyList: {
    gap: 12,
    marginBottom: 20,
  },
  changeCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  changeCardCurrent: {
    borderColor: 'rgba(87, 245, 171, 0.35)',
    backgroundColor: 'rgba(87, 245, 171, 0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formatTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  formatTagText: {
    color: '#00D2FF',
    fontSize: 10,
    fontWeight: '600',
  },
  unitTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  unitTagText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  currencyTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(87, 245, 171, 0.08)',
  },
  currencyTagText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgesCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#57F5AB',
  },
  currentBadgeText: {
    color: '#57F5AB',
    fontSize: 10,
    fontWeight: '700',
  },
  historicalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historicalBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  dateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  comparisonGrid: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricNameBox: {
    width: 90,
  },
  metricTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  metricSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  valuesBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  transitionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  initialPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  initialTag: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  oldPriceText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  newPriceText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  oldCostText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  newCostText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffPositive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  diffNegative: {
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700',
  },
  diffTextPositive: {
    color: '#57F5AB',
  },
  diffTextNegative: {
    color: COLORS.gasto,
  },
  diffBadgeNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffTextNeutral: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  profitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
  },
  profitCol: {
    flex: 1,
  },
  marginCol: {
    alignItems: 'flex-end',
  },
  profitLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 2,
  },
  profitValue: {
    color: '#57F5AB',
    fontSize: 12,
    fontWeight: '700',
  },
  marginValue: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  notesText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
});

export const HistorialPrecios = HistorialPreciosFotos;
export const ProductPriceHistory = HistorialPreciosFotos;
