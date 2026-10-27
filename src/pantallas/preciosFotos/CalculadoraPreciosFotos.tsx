import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import {
  gatillarSeleccion as triggerSelection,
  gatillarExito as triggerSuccess,
} from '@/compartido/utilidades/hapticos';
import { ProductoFoto, LineaCalculoFoto } from '@/datos/tipos';
import {
  calcularLineaFoto,
  calcularTotalesFotos,
  validarCantidadCalculo,
} from '@/datos/consultas/productosFotos';
import { ModalSelectorProductosCalculadora } from './ModalSelectorProductosCalculadora';

export interface PropiedadesCalculadoraPreciosFotos {
  productosCatalogo: ProductoFoto[];
  itemsSeleccionados: Record<string, number>;
  onActualizarItems: (nuevosItems: Record<string, number>) => void;
  onIrAlCatalogo?: () => void;
}

export const CalculadoraPreciosFotos: React.FC<PropiedadesCalculadoraPreciosFotos> = ({
  productosCatalogo,
  itemsSeleccionados,
  onActualizarItems,
  onIrAlCatalogo,
}) => {
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Mapa de productos por ID para acceso rápido
  const productosMap = useMemo(() => {
    const mapa = new Map<string, ProductoFoto>();
    for (const p of productosCatalogo) {
      mapa.set(p.id, p);
    }
    return mapa;
  }, [productosCatalogo]);

  // Líneas calculadas en memoria a partir de los ítems y datos vigentes
  const lineasCalculadas = useMemo<LineaCalculoFoto[]>(() => {
    const resultado: LineaCalculoFoto[] = [];
    for (const [id, cant] of Object.entries(itemsSeleccionados)) {
      if (cant <= 0) continue;
      const prod = productosMap.get(id);
      if (prod) {
        try {
          resultado.push(calcularLineaFoto(prod, cant));
        } catch {
          // Si la cantidad era inválida, forzar 1
          resultado.push(calcularLineaFoto(prod, 1));
        }
      }
    }
    return resultado;
  }, [itemsSeleccionados, productosMap]);

  // Totales y desgloses por moneda
  const resultados = useMemo(() => {
    return calcularTotalesFotos(lineasCalculadas);
  }, [lineasCalculadas]);

  // Manejadores de interacción
  const handleAbrirSelector = () => {
    triggerSelection();
    setSelectorVisible(true);
  };

  const handleSeleccionarProducto = (producto: ProductoFoto, cantidad: number) => {
    try {
      const cantValidada = validarCantidadCalculo(cantidad);
      onActualizarItems({
        ...itemsSeleccionados,
        [producto.id]: cantValidada,
      });
    } catch (err: any) {
      Alert.alert('Cantidad inválida', err?.message || 'Indica un entero mayor a cero.');
    }
  };

  const handleModificarCantidad = (productoId: string, delta: number) => {
    triggerSelection();
    const actual = itemsSeleccionados[productoId] || 1;
    const nueva = actual + delta;
    if (nueva < 1) {
      return; // El botón debe estar deshabilitado
    }
    onActualizarItems({
      ...itemsSeleccionados,
      [productoId]: nueva,
    });
  };

  const handleCambiarCantidadDirecta = (productoId: string, texto: string) => {
    const lim = texto.replace(/[^0-9]/g, '');
    const num = parseInt(lim, 10);
    const cantidad = isNaN(num) || num < 1 ? 1 : num;
    onActualizarItems({
      ...itemsSeleccionados,
      [productoId]: cantidad,
    });
  };

  const handleEliminarItem = (productoId: string, nombreProducto: string) => {
    triggerSelection();
    Alert.alert(
      'Retirar producto',
      `¿Deseas retirar "${nombreProducto}" de esta estimación?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: () => {
            const copia = { ...itemsSeleccionados };
            delete copia[productoId];
            onActualizarItems(copia);
            triggerSuccess();
          },
        },
      ]
    );
  };

  const handleLimpiarCalculadora = () => {
    triggerSelection();
    if (Object.keys(itemsSeleccionados).length === 0) return;

    Alert.alert(
      'Nuevo cálculo',
      '¿Deseas reiniciar la calculadora y retirar todos los productos seleccionados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            onActualizarItems({});
            triggerSuccess();
          },
        },
      ]
    );
  };

  const cantidadTotalLineas = lineasCalculadas.length;

  return (
    <View style={styles.container}>
      {/* Barra superior de acciones de la Calculadora */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.mainTitle, TYPOGRAPHY.titularGrande]}>
            Calculadora de Precios
          </Text>
          <Text style={[styles.mainSubtitle, TYPOGRAPHY.cuerpoPequeno]}>
            {cantidadTotalLineas === 0
              ? 'Estimación de importes, costos y ganancias'
              : `${cantidadTotalLineas} ${
                  cantidadTotalLineas === 1 ? 'producto añadido' : 'productos añadidos'
                }`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {cantidadTotalLineas > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleLimpiarCalculadora}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Limpiar calculadora"
            >
              <MaterialIcons name="restart-alt" size={20} color={COLORS.onSurfaceVariant} />
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addMainBtnWrapper}
            onPress={handleAbrirSelector}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Agregar producto al cálculo"
          >
            <LinearGradient
              colors={['#57F5AB', '#00D2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addMainBtnGradient}
            >
              <MaterialIcons name="add" size={20} color="#06120D" />
              <Text style={styles.addMainBtnText}>Agregar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estado Vacío */}
      {cantidadTotalLineas === 0 ? (
        <GlassCard variant="surface" style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="calculate" size={36} color={COLORS.secondary} />
          </View>
          <Text style={[styles.emptyTitle, TYPOGRAPHY.titularPequeno]}>
            Calculadora lista
          </Text>
          <Text style={[styles.emptySubtitle, TYPOGRAPHY.cuerpoMedio]}>
            Añade productos de tu catálogo para indicar cantidades y calcular al instante
            el importe total, los costos estimados y el beneficio bruto.
          </Text>

          <View style={styles.emptyActions}>
            <BotonBrillante
              title="Seleccionar productos"
              onPress={handleAbrirSelector}
              icon={<MaterialIcons name="add-shopping-cart" size={18} color="#06120D" />}
            />

            {onIrAlCatalogo && (
              <TouchableOpacity
                style={styles.secondaryCatalogBtn}
                onPress={onIrAlCatalogo}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryCatalogBtnText}>
                  Ver Catálogo de Productos
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      ) : (
        <View style={styles.calculationContent}>
          {/* Lista de productos seleccionados */}
          <View style={styles.linesList}>
            {lineasCalculadas.map(linea => {
              const { producto, cantidad } = linea;
              const moneda = linea.moneda;

              return (
                <GlassCard
                  key={producto.id}
                  variant="surface"
                  style={styles.itemCard}
                >
                  {/* Encabezado del ítem */}
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleCol}>
                      <Text
                        style={[styles.itemName, TYPOGRAPHY.titularPequeno]}
                        numberOfLines={1}
                      >
                        {producto.name}
                      </Text>
                      <View style={styles.itemMetaRow}>
                        {producto.sizeFormat && (
                          <View style={styles.formatTag}>
                            <Text style={styles.formatTagText}>
                              {producto.sizeFormat}
                            </Text>
                          </View>
                        )}
                        <View style={styles.unitTag}>
                          <Text style={styles.unitTagText}>
                            {producto.saleUnit}
                          </Text>
                        </View>
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>
                            {producto.category}
                          </Text>
                        </View>
                        <View style={styles.currencyTag}>
                          <Text style={styles.currencyTagText}>
                            {moneda}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Botón de retirar ítem */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleEliminarItem(producto.id, producto.name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Retirar ${producto.name}`}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={COLORS.gasto} />
                    </TouchableOpacity>
                  </View>

                  {/* Precios Unitarios Vigentes */}
                  <View style={styles.unitPricesRow}>
                    <View style={styles.unitPriceCol}>
                      <Text style={styles.unitPriceLabel}>Precio unitario:</Text>
                      {linea.tienePrecio ? (
                        <Text style={[styles.unitPriceValue, TYPOGRAPHY.cuerpoMedio]}>
                          {formatCurrency(linea.precioUnitario, { moneda })}
                        </Text>
                      ) : (
                        <View style={styles.missingBadge}>
                          <Text style={styles.missingBadgeText}>⚠️ Sin precio</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.unitPriceCol}>
                      <Text style={styles.unitPriceLabel}>Costo unitario:</Text>
                      {linea.tieneCosto ? (
                        <Text style={[styles.unitCostValue, TYPOGRAPHY.cuerpoMedio]}>
                          {formatCurrency(linea.costoUnitario, { moneda })}
                        </Text>
                      ) : (
                        <View style={styles.missingBadge}>
                          <Text style={styles.missingBadgeText}>⚠️ Sin costo</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Fila de Edición de Cantidad */}
                  <View style={styles.quantityRow}>
                    <Text style={styles.quantityLabel}>
                      Cantidad ({producto.saleUnit}):
                    </Text>

                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={[
                          styles.stepperBtn,
                          cantidad <= 1 && styles.stepperBtnDisabled,
                        ]}
                        onPress={() => handleModificarCantidad(producto.id, -1)}
                        disabled={cantidad <= 1}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons
                          name="remove"
                          size={18}
                          color={cantidad <= 1 ? COLORS.onSurfaceVariant : COLORS.onSurface}
                        />
                      </TouchableOpacity>

                      <TextInput
                        value={String(cantidad)}
                        onChangeText={val =>
                          handleCambiarCantidadDirecta(producto.id, val)
                        }
                        keyboardType="number-pad"
                        style={[styles.stepperInput, TYPOGRAPHY.cuerpoMedio]}
                        selectTextOnFocus
                      />

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleModificarCantidad(producto.id, 1)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons
                          name="add"
                          size={18}
                          color={COLORS.onSurface}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Desglose de Resultados de la Línea */}
                  <View style={styles.lineResultsBox}>
                    <View style={styles.resultCol}>
                      <Text style={styles.resultLabel}>Importe</Text>
                      <Text
                        style={[
                          styles.resultValue,
                          linea.subtotalImporte !== null
                            ? styles.resultValueHighlight
                            : styles.resultValueMissing,
                        ]}
                      >
                        {linea.subtotalImporte !== null
                          ? formatCurrency(linea.subtotalImporte, { moneda })
                          : 'Sin precio'}
                      </Text>
                    </View>

                    <View style={styles.resultCol}>
                      <Text style={styles.resultLabel}>Costo Est.</Text>
                      <Text
                        style={[
                          styles.resultValue,
                          linea.subtotalCosto !== null
                            ? styles.resultValueCost
                            : styles.resultValueMissing,
                        ]}
                      >
                        {linea.subtotalCosto !== null
                          ? formatCurrency(linea.subtotalCosto, { moneda })
                          : 'Sin costo'}
                      </Text>
                    </View>

                    <View style={styles.resultCol}>
                      <Text style={styles.resultLabel}>Ganancia Est.</Text>
                      <Text
                        style={[
                          styles.resultValue,
                          linea.subtotalGanancia !== null
                            ? (linea.subtotalGanancia >= 0
                                ? styles.resultValueProfitPositive
                                : styles.resultValueProfitNegative)
                            : styles.resultValueMissing,
                        ]}
                      >
                        {linea.subtotalGanancia !== null
                          ? formatCurrency(linea.subtotalGanancia, { moneda })
                          : 'No calculable'}
                      </Text>
                      {linea.margenPorcentual !== null && (
                        <Text style={styles.marginText}>
                          {linea.margenPorcentual >= 0 ? '+' : ''}
                          {linea.margenPorcentual.toFixed(1)}%
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Avisos si falta precio o costo */}
                  {(!linea.tienePrecio || !linea.tieneCosto) && (
                    <View style={styles.itemWarningBox}>
                      <MaterialIcons name="warning" size={14} color="#E5C07B" />
                      <Text style={styles.itemWarningText}>
                        {!linea.tienePrecio && !linea.tieneCosto
                          ? 'Sin precio ni costo registrado: no se asume cero de forma silenciosa.'
                          : !linea.tienePrecio
                          ? 'Sin precio registrado: importe y ganancia no calculados.'
                          : 'Sin costo registrado: ganancia bruta no calculada.'}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>

          {/* Aviso si existen múltiples monedas */}
          {resultados.esMultimoneda && (
            <View style={styles.multiCurrencyNotice}>
              <MaterialIcons name="currency-exchange" size={18} color="#00D2FF" />
              <Text style={styles.multiCurrencyNoticeText}>
                Se detectaron productos con distintas monedas. Para garantizar exactitud,
                los totales se presentan separados por cada moneda.
              </Text>
            </View>
          )}

          {/* Tarjetas de Totales agrupadas por Moneda */}
          {resultados.monedas.map(moneda => {
            const t = resultados.totalesPorMoneda[moneda];
            return (
              <GlassCard
                key={moneda}
                variant="surface"
                style={styles.totalsCard}
              >
                <View style={styles.totalsCardHeader}>
                  <View style={styles.totalsBadge}>
                    <Text style={styles.totalsBadgeText}>
                      Totales ({moneda})
                    </Text>
                  </View>
                  <Text style={styles.totalsUnitsText}>
                    {t.cantidadLineas} {t.cantidadLineas === 1 ? 'producto' : 'productos'} •{' '}
                    {t.totalUnidades} {t.totalUnidades === 1 ? 'unidad' : 'unidades'}
                  </Text>
                </View>

                {/* Importe Total */}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, TYPOGRAPHY.cuerpoMedio]}>
                    Importe Total
                  </Text>
                  <Text style={[styles.totalImporteValue, TYPOGRAPHY.titularPequeno]}>
                    {formatCurrency(t.totalImporte, { moneda })}
                  </Text>
                </View>

                {/* Costo Total Estimado */}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, TYPOGRAPHY.cuerpoMedio]}>
                    Costo Total Estimado
                  </Text>
                  <Text style={[styles.totalCostoValue, TYPOGRAPHY.cuerpoMedio]}>
                    {formatCurrency(t.totalCosto, { moneda })}
                    {t.itemsSinCosto > 0 && (
                      <Text style={styles.partialNotice}> (parcial)</Text>
                    )}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Ganancia Bruta Estimada */}
                <View style={styles.totalRowHighlight}>
                  <View>
                    <Text style={[styles.totalGananciaLabel, TYPOGRAPHY.cuerpoMedio]}>
                      Ganancia Bruta Estimada
                    </Text>
                    {t.margenPorcentual !== null ? (
                      <Text style={styles.overallMarginText}>
                        Margen bruto: {t.margenPorcentual >= 0 ? '+' : ''}
                        {t.margenPorcentual.toFixed(1)}%
                      </Text>
                    ) : (
                      <Text style={styles.overallMarginTextIncomplete}>
                        Margen no calculable
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.totalGananciaValue,
                      TYPOGRAPHY.titularGrande,
                      t.totalGanancia >= 0
                        ? styles.profitPositive
                        : styles.profitNegative,
                    ]}
                  >
                    {formatCurrency(t.totalGanancia, { moneda })}
                  </Text>
                </View>

                {/* Aviso de datos incompletos en el total */}
                {!t.esCalculoCompleto && (
                  <View style={styles.totalsIncompleteWarning}>
                    <MaterialIcons name="info-outline" size={14} color="#E5C07B" />
                    <Text style={styles.totalsIncompleteWarningText}>
                      Cálculo parcial: hay productos sin precio o costo registrado en {moneda}.
                    </Text>
                  </View>
                )}
              </GlassCard>
            );
          })}

          {/* Botones al pie de la calculadora */}
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={handleAbrirSelector}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color={COLORS.secondary} />
              <Text style={styles.addMoreBtnText}>Agregar otro producto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newCalcBtn}
              onPress={handleLimpiarCalculadora}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color={COLORS.onSurfaceVariant} />
              <Text style={styles.newCalcBtnText}>Nuevo cálculo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal Selector de Productos */}
      <ModalSelectorProductosCalculadora
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        productos={productosCatalogo}
        cantidadesSeleccionadas={itemsSeleccionados}
        onSeleccionarProducto={handleSeleccionarProducto}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleBox: {
    flex: 1,
  },
  mainTitle: {
    color: COLORS.onSurface,
  },
  mainSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  addMainBtnWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  addMainBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    gap: 4,
  },
  addMainBtnText: {
    color: '#06120D',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.25)',
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  emptyActions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  secondaryCatalogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryCatalogBtnText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  calculationContent: {
    width: '100%',
  },
  linesList: {
    gap: 12,
    marginBottom: 16,
  },
  itemCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemTitleCol: {
    flex: 1,
  },
  itemName: {
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formatTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  formatTagText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '600',
  },
  unitTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  unitTagText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  categoryTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryTagText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  currencyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(87, 245, 171, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.2)',
  },
  currencyTagText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unitPricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  unitPriceCol: {
    flex: 1,
  },
  unitPriceLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 2,
  },
  unitPriceValue: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  unitCostValue: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  missingBadge: {
    backgroundColor: 'rgba(229, 192, 123, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  missingBadgeText: {
    color: '#E5C07B',
    fontSize: 11,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperInput: {
    color: COLORS.onSurface,
    textAlign: 'center',
    width: 48,
    height: 36,
    paddingVertical: 0,
    fontWeight: '700',
    fontSize: 14,
  },
  lineResultsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resultCol: {
    flex: 1,
  },
  resultLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultValueHighlight: {
    color: COLORS.secondary,
  },
  resultValueCost: {
    color: COLORS.onSurface,
  },
  resultValueProfitPositive: {
    color: '#57F5AB',
  },
  resultValueProfitNegative: {
    color: COLORS.gasto,
  },
  resultValueMissing: {
    color: '#E5C07B',
    fontSize: 11,
  },
  marginText: {
    color: '#57F5AB',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  itemWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 192, 123, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  itemWarningText: {
    color: '#E5C07B',
    fontSize: 11,
    flex: 1,
  },
  multiCurrencyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
    gap: 8,
  },
  multiCurrencyNoticeText: {
    color: '#00D2FF',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  totalsCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(87, 245, 171, 0.35)',
    backgroundColor: 'rgba(87, 245, 171, 0.03)',
    marginBottom: 16,
  },
  totalsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalsBadge: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.3)',
  },
  totalsBadgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalsUnitsText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    color: COLORS.onSurfaceVariant,
  },
  totalImporteValue: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  totalCostoValue: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  partialNotice: {
    color: '#E5C07B',
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  totalGananciaLabel: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  overallMarginText: {
    color: '#57F5AB',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  overallMarginTextIncomplete: {
    color: '#E5C07B',
    fontSize: 11,
    marginTop: 2,
  },
  totalGananciaValue: {
    fontWeight: '800',
  },
  profitPositive: {
    color: '#57F5AB',
  },
  profitNegative: {
    color: COLORS.gasto,
  },
  totalsIncompleteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 192, 123, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    gap: 6,
  },
  totalsIncompleteWarningText: {
    color: '#E5C07B',
    fontSize: 11,
    flex: 1,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  addMoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    borderRadius: 12,
    height: 44,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.3)',
  },
  addMoreBtnText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  newCalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  newCalcBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
});

export const CalculadoraPrecios = CalculadoraPreciosFotos;
export const ProductPricingCalculator = CalculadoraPreciosFotos;
