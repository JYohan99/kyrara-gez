import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  formatearMoneda as formatCurrency,
  formatearEntradaDinero,
  convertirMontoACentavos,
} from '@/compartido/utilidades/moneda';
import { ModalSelectorFecha } from '@/compartido/componentes/ModalSelectorFecha';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { ProductoFoto, TarifaProductoFoto } from '@/datos/tipos';
import {
  calcularGananciaYMargen,
  establecerTarifaProducto,
  eliminarTarifaProducto,
} from '@/datos/consultas/productosFotos';
import { useTarifasProductoBoveda } from '@/datos/hooks';

export interface PropiedadesModalGestionPrecios {
  visible: boolean;
  onClose: () => void;
  producto: ProductoFoto | null;
}

function fechaAISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parsearISOAFecha(iso: string): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatearFechaEspanol(iso?: string): string {
  if (!iso) return 'Actualidad';
  const partes = iso.split('-');
  if (partes.length < 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

interface PropiedadesContenidoGestionPrecios {
  producto: ProductoFoto;
  onClose: () => void;
}

const ContenidoGestionPrecios: React.FC<PropiedadesContenidoGestionPrecios> = ({
  producto,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [tabActual, setTabActual] = useState<'NUEVA' | 'HISTORIAL'>('NUEVA');

  // Tarifa vigente e historial de tarifas reactivas
  const { tariffs: historialTarifas, currentTariff: tarifaVigente } = useTarifasProductoBoveda(producto.id);

  // Estados del formulario
  const [precioVentaTexto, setPrecioVentaTexto] = useState(() => {
    const sale = tarifaVigente?.salePrice ?? producto.basePrice ?? 0;
    if (sale <= 0) return '';
    const str = (sale / 100).toFixed(2).replace('.', ',');
    return formatearEntradaDinero(str);
  });

  const [costoTexto, setCostoTexto] = useState(() => {
    const cost = tarifaVigente?.costPrice ?? producto.costPrice ?? 0;
    if (cost <= 0) return '';
    const str = (cost / 100).toFixed(2).replace('.', ',');
    return formatearEntradaDinero(str);
  });

  const [costoUsdTexto, setCostoUsdTexto] = useState(() => {
    const usd = tarifaVigente?.costUsd ?? producto.costUsd;
    if (!usd) return '';
    return usd.toFixed(2).replace('.', ',');
  });

  const [tipoCambioTexto, setTipoCambioTexto] = useState(() => {
    const rate = tarifaVigente?.exchangeRate ?? producto.exchangeRate;
    if (!rate) return '';
    return rate.toFixed(2).replace('.', ',');
  });

  const [fechaVigencia, setFechaVigencia] = useState<Date>(() => {
    if (tarifaVigente?.validFrom) return parsearISOAFecha(tarifaVigente.validFrom);
    if (producto.priceValidFrom) return parsearISOAFecha(producto.priceValidFrom);
    return new Date();
  });

  const [esCorreccion, setEsCorreccion] = useState(false);
  const [notas, setNotas] = useState('');
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cálculos reactivos en tiempo real
  const precioVentaCentavos = useMemo(() => {
    return convertirMontoACentavos(precioVentaTexto);
  }, [precioVentaTexto]);

  const costoCentavos = useMemo(() => {
    return convertirMontoACentavos(costoTexto);
  }, [costoTexto]);

  const { grossProfit, grossMarginPercent } = useMemo(() => {
    return calcularGananciaYMargen(precioVentaCentavos, costoCentavos);
  }, [precioVentaCentavos, costoCentavos]);

  // Conversión referencial USD -> UYU (solo si ambos valores están definidos)
  const conversionUsdCalculada = useMemo(() => {
    const usd = parseFloat(costoUsdTexto.replace(',', '.'));
    const rate = parseFloat(tipoCambioTexto.replace(',', '.'));
    if (!isNaN(usd) && usd > 0 && !isNaN(rate) && rate > 0) {
      const uyu = Math.round(usd * rate * 100);
      return {
        centavos: uyu,
        texto: formatCurrency(uyu),
        usd,
        rate,
      };
    }
    return null;
  }, [costoUsdTexto, tipoCambioTexto]);

  const handleAplicarConversionUsd = () => {
    if (!conversionUsdCalculada) return;
    triggerSelection();
    const str = (conversionUsdCalculada.centavos / 100).toFixed(2).replace('.', ',');
    setCostoTexto(formatearEntradaDinero(str));
  };

  const handleGuardarTarifa = () => {
    if (precioVentaCentavos < 0 || costoCentavos < 0) {
      triggerError();
      Alert.alert('Error', 'Los precios y costos no pueden ser negativos.');
      return;
    }

    const usdVal = costoUsdTexto.trim() ? parseFloat(costoUsdTexto.replace(',', '.')) : undefined;
    if (usdVal !== undefined && (isNaN(usdVal) || usdVal < 0)) {
      triggerError();
      Alert.alert('Error', 'El costo en USD debe ser un número válido mayor o igual a cero.');
      return;
    }

    const rateVal = tipoCambioTexto.trim() ? parseFloat(tipoCambioTexto.replace(',', '.')) : undefined;
    if (rateVal !== undefined && (isNaN(rateVal) || rateVal <= 0)) {
      triggerError();
      Alert.alert('Error', 'El tipo de cambio debe ser un número positivo mayor a cero.');
      return;
    }

    setGuardando(true);
    try {
      establecerTarifaProducto({
        productId: producto.id,
        salePrice: precioVentaCentavos,
        costPrice: costoCentavos,
        costUsd: usdVal,
        exchangeRate: rateVal,
        validFrom: fechaAISO(fechaVigencia),
        isCorrection: esCorreccion,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      onClose();
    } catch (err: any) {
      triggerError();
      Alert.alert('No se pudo guardar la tarifa', err?.message || 'Error desconocido.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarTarifa = (tarifa: TarifaProductoFoto) => {
    triggerSelection();
    Alert.alert(
      'Eliminar tarifa histórica',
      `¿Deseas eliminar la tarifa del ${formatearFechaEspanol(tarifa.validFrom)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              eliminarTarifaProducto(tarifa.id);
              triggerSuccess();
            } catch (err: any) {
              triggerError();
              Alert.alert('Error', err?.message || 'No se pudo eliminar la tarifa.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconBadge}>
                <MaterialIcons name="trending-up" size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.headerTitlesCol}>
                <Text style={[styles.headerTitle, TYPOGRAPHY.titularPequeno]} numberOfLines={1}>
                  Precios y Costos
                </Text>
                <Text style={[styles.headerSubtitle, TYPOGRAPHY.cuerpoPequeno]} numberOfLines={1}>
                  {producto.name} {producto.sizeFormat ? `(${producto.sizeFormat})` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                onClose();
              }}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Selector de Pestañas internas: ESTABLECER TARIFA | HISTORIAL */}
          <View style={styles.tabSwitcherRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tabActual === 'NUEVA' && styles.tabBtnActive]}
              onPress={() => {
                triggerSelection();
                setTabActual('NUEVA');
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="sell"
                size={16}
                color={tabActual === 'NUEVA' ? COLORS.secondary : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  TYPOGRAPHY.etiquetaMayusculas,
                  tabActual === 'NUEVA' && styles.tabBtnTextActive,
                ]}
              >
                Tarifa y Costos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tabActual === 'HISTORIAL' && styles.tabBtnActive]}
              onPress={() => {
                triggerSelection();
                setTabActual('HISTORIAL');
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="history"
                size={16}
                color={tabActual === 'HISTORIAL' ? COLORS.primary : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  TYPOGRAPHY.etiquetaMayusculas,
                  tabActual === 'HISTORIAL' && styles.tabBtnTextActive,
                ]}
              >
                Historial ({historialTarifas.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {tabActual === 'NUEVA' ? (
              <>
                {/* Panel de Resumen de Ganancia y Margen Calculados (Read-only) */}
                <GlassCard variant="surface" style={styles.metricsLiveCard}>
                  <View style={styles.metricsHeaderRow}>
                    <View style={styles.metricsDot} />
                    <Text style={[styles.metricsHeaderText, TYPOGRAPHY.etiquetaMayusculas]}>
                      Rentabilidad Estimada por Unidad ({producto.saleUnit})
                    </Text>
                  </View>

                  <View style={styles.metricsValuesRow}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, TYPOGRAPHY.cuerpoPequeno]}>
                        Ganancia bruta
                      </Text>
                      <Text
                        style={[
                          styles.profitValue,
                          TYPOGRAPHY.titularGrande,
                          grossProfit < 0 ? styles.profitNegative : styles.profitPositive,
                        ]}
                      >
                        {formatCurrency(grossProfit)}
                      </Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, TYPOGRAPHY.cuerpoPequeno]}>
                        Margen bruto
                      </Text>
                      {grossMarginPercent !== null ? (
                        <View style={styles.marginBadgeRow}>
                          <Text
                            style={[
                              styles.marginValue,
                              TYPOGRAPHY.titularGrande,
                              grossMarginPercent < 0 ? styles.marginNegative : styles.marginPositive,
                            ]}
                          >
                            {grossMarginPercent >= 0 ? '+' : ''}
                            {grossMarginPercent.toFixed(1)}%
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.marginNA, TYPOGRAPHY.cuerpoPequeno]}>
                          — Sin precio venta
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text style={[styles.calcDisclaimer, TYPOGRAPHY.cuerpoPequeno]}>
                    * Ganancia = Precio − Costo. Margen = (Ganancia / Precio) × 100.
                  </Text>
                </GlassCard>

                {/* Formulario de Precios en UYU */}
                <View style={styles.formRow}>
                  {/* Precio de venta en UYU */}
                  <View style={styles.formCol}>
                    <Text style={[styles.label, TYPOGRAPHY.etiquetaMayusculas]}>
                      Precio Venta (UYU)
                    </Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>$</Text>
                      <TextInput
                        value={precioVentaTexto}
                        onChangeText={val => setPrecioVentaTexto(formatearEntradaDinero(val))}
                        placeholder="0,00"
                        placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                        keyboardType="numeric"
                        style={[styles.textInput, TYPOGRAPHY.cuerpoGrande]}
                      />
                    </View>
                  </View>

                  {/* Costo en UYU */}
                  <View style={styles.formCol}>
                    <Text style={[styles.label, TYPOGRAPHY.etiquetaMayusculas]}>
                      Costo (UYU)
                    </Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>$</Text>
                      <TextInput
                        value={costoTexto}
                        onChangeText={val => setCostoTexto(formatearEntradaDinero(val))}
                        placeholder="0,00"
                        placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                        keyboardType="numeric"
                        style={[styles.textInput, TYPOGRAPHY.cuerpoGrande]}
                      />
                    </View>
                  </View>
                </View>

                {/* Sección de Costo Referencial en USD y Tipo de Cambio */}
                <View style={styles.usdRefSection}>
                  <View style={styles.usdHeaderRow}>
                    <MaterialIcons name="monetization-on" size={16} color={COLORS.secondary} />
                    <Text style={[styles.usdSectionTitle, TYPOGRAPHY.etiquetaMayusculas]}>
                      Referencia en Dólares (USD) — Opcional
                    </Text>
                  </View>

                  <Text style={[styles.usdHint, TYPOGRAPHY.cuerpoPequeno]}>
                    No se convierte automáticamente a UYU sin un tipo de cambio definido.
                  </Text>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.subLabel}>Costo Ref. (USD)</Text>
                      <View style={styles.inputContainerCompact}>
                        <Text style={styles.currencyPrefixUsd}>US$</Text>
                        <TextInput
                          value={costoUsdTexto}
                          onChangeText={setCostoUsdTexto}
                          placeholder="0,00"
                          placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                          keyboardType="numeric"
                          style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                        />
                      </View>
                    </View>

                    <View style={styles.formCol}>
                      <Text style={styles.subLabel}>Tipo de Cambio</Text>
                      <View style={styles.inputContainerCompact}>
                        <Text style={styles.currencyPrefix}>$</Text>
                        <TextInput
                          value={tipoCambioTexto}
                          onChangeText={setTipoCambioTexto}
                          placeholder="ej. 42,50"
                          placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                          keyboardType="numeric"
                          style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Botón de conversión rápida si ambos valores están provistos */}
                  {conversionUsdCalculada && (
                    <TouchableOpacity
                      style={styles.convertBtn}
                      onPress={handleAplicarConversionUsd}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="currency-exchange" size={16} color={COLORS.secondary} />
                      <Text style={styles.convertBtnText}>
                        US$ {conversionUsdCalculada.usd.toFixed(2)} × $ {conversionUsdCalculada.rate.toFixed(2)} = {conversionUsdCalculada.texto}
                      </Text>
                      <View style={styles.applyPill}>
                        <Text style={styles.applyPillText}>Usar como costo</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Fecha de Aplicación / Vigencia */}
                <View style={styles.dateSection}>
                  <Text style={[styles.label, TYPOGRAPHY.etiquetaMayusculas]}>
                    Fecha de Aplicación de esta Tarifa
                  </Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => {
                      triggerSelection();
                      setMostrarSelectorFecha(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dateBtnLeft}>
                      <MaterialIcons name="event" size={18} color={COLORS.secondary} />
                      <Text style={[styles.dateBtnText, TYPOGRAPHY.cuerpoMedio]}>
                        Vigente desde el {formatearFechaEspanol(fechaAISO(fechaVigencia))}
                      </Text>
                    </View>
                    <MaterialIcons name="calendar-month" size={18} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                {/* Selector de Modo: Nueva Tarifa vs Corrección */}
                {historialTarifas.length > 0 && (
                  <View style={styles.switchRowContainer}>
                    <View style={styles.switchTextCol}>
                      <Text style={[styles.switchLabel, TYPOGRAPHY.titularPequeno]}>
                        {esCorreccion ? 'Corregir tarifa actual' : 'Nueva tarifa (archivar anterior)'}
                      </Text>
                      <Text style={[styles.switchDesc, TYPOGRAPHY.cuerpoPequeno]}>
                        {esCorreccion
                          ? 'Corrige errores de tipeo sin generar un nuevo período histórico.'
                          : 'Cierra la tarifa previa y crea un nuevo registro histórico con su fecha.'}
                      </Text>
                    </View>
                    <Switch
                      value={esCorreccion}
                      onValueChange={val => {
                        triggerSelection();
                        setEsCorreccion(val);
                      }}
                      thumbColor={esCorreccion ? COLORS.primary : COLORS.secondary}
                      trackColor={{
                        false: 'rgba(87, 245, 171, 0.3)',
                        true: 'rgba(138, 79, 255, 0.3)',
                      }}
                    />
                  </View>
                )}

                {/* Notas opcionales */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, TYPOGRAPHY.etiquetaMayusculas]}>
                    Notas o Motivo del Cambio (Opcional)
                  </Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={notas}
                      onChangeText={setNotas}
                      placeholder="ej. Ajuste anual de laboratorio, oferta especial..."
                      placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                      style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                    />
                  </View>
                </View>

                {/* Botón de Guardar */}
                <View style={styles.buttonWrapper}>
                  <BotonBrillante
                    title={guardando ? 'Guardando...' : esCorreccion ? 'Actualizar tarifa' : 'Establecer nueva tarifa'}
                    onPress={handleGuardarTarifa}
                    disabled={guardando}
                    icon={<MaterialIcons name="check" size={20} color="#06120D" />}
                  />
                </View>
              </>
            ) : (
              /* Vista de Historial de Tarifas */
              <View style={styles.historyContainer}>
                {historialTarifas.length === 0 ? (
                  <GlassCard variant="surface" style={styles.emptyHistoryCard}>
                    <MaterialIcons name="history" size={36} color={COLORS.onSurfaceVariant} />
                    <Text style={[styles.emptyHistoryTitle, TYPOGRAPHY.titularPequeno]}>
                      Sin tarifas anteriores
                    </Text>
                    <Text style={[styles.emptyHistorySubtitle, TYPOGRAPHY.cuerpoMedio]}>
                      Cuando establezcas o modifiques los precios, el historial conservará cada tarifa aplicada junto con sus fechas de vigencia.
                    </Text>
                  </GlassCard>
                ) : (
                  <View style={styles.tariffsList}>
                    {historialTarifas.map((t, idx) => {
                      const esVigente = !t.validTo || t.validTo.trim() === '';
                      const metrics = calcularGananciaYMargen(t.salePrice, t.costPrice);

                      return (
                        <GlassCard
                          key={t.id}
                          variant="surface"
                          style={[styles.tariffCard, esVigente && styles.tariffCardActive]}
                        >
                          <View style={styles.tariffCardHeader}>
                            <View style={styles.tariffPeriodBadge}>
                              <MaterialIcons
                                name={esVigente ? 'check-circle' : 'history'}
                                size={15}
                                color={esVigente ? COLORS.secondary : COLORS.onSurfaceVariant}
                              />
                              <Text
                                style={[
                                  styles.tariffPeriodText,
                                  esVigente && styles.tariffPeriodTextActive,
                                ]}
                              >
                                {esVigente
                                  ? `Vigente desde ${formatearFechaEspanol(t.validFrom)}`
                                  : `${formatearFechaEspanol(t.validFrom)} — ${formatearFechaEspanol(t.validTo)}`}
                              </Text>
                            </View>

                            {esVigente ? (
                              <View style={styles.activePill}>
                                <Text style={styles.activePillText}>Tarifa Actual</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => handleEliminarTarifa(t)}
                                style={styles.trashBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <MaterialIcons name="delete-outline" size={16} color="#FF6E6E" />
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Precios y márgenes de la tarifa */}
                          <View style={styles.tariffMetricsRow}>
                            <View style={styles.tariffMetricItem}>
                              <Text style={styles.tariffMetricLabel}>Precio Venta</Text>
                              <Text style={styles.tariffMetricValue}>
                                {formatCurrency(t.salePrice)}
                              </Text>
                            </View>

                            <View style={styles.tariffMetricItem}>
                              <Text style={styles.tariffMetricLabel}>Costo UYU</Text>
                              <Text style={styles.tariffMetricValue}>
                                {formatCurrency(t.costPrice)}
                              </Text>
                            </View>

                            <View style={styles.tariffMetricItem}>
                              <Text style={styles.tariffMetricLabel}>Ganancia</Text>
                              <Text
                                style={[
                                  styles.tariffMetricValue,
                                  metrics.grossProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                                ]}
                              >
                                {formatCurrency(metrics.grossProfit)}
                              </Text>
                            </View>

                            <View style={styles.tariffMetricItem}>
                              <Text style={styles.tariffMetricLabel}>Margen</Text>
                              <Text
                                style={[
                                  styles.tariffMetricValue,
                                  metrics.grossMarginPercent !== null && metrics.grossMarginPercent >= 0
                                    ? styles.marginPositive
                                    : styles.marginNegative,
                                ]}
                              >
                                {metrics.grossMarginPercent !== null
                                  ? `${metrics.grossMarginPercent.toFixed(1)}%`
                                  : '—'}
                              </Text>
                            </View>
                          </View>

                          {/* Referencia USD si fue registrada */}
                          {t.costUsd !== undefined && (
                            <View style={styles.tariffUsdRow}>
                              <MaterialIcons name="monetization-on" size={12} color={COLORS.onSurfaceVariant} />
                              <Text style={styles.tariffUsdText}>
                                Ref: US$ {t.costUsd.toFixed(2)}
                                {t.exchangeRate ? ` @ $ ${t.exchangeRate.toFixed(2)}` : ''}
                              </Text>
                            </View>
                          )}

                          {/* Notas si existen */}
                          {t.notes && (
                            <Text style={styles.tariffNotesText}>
                              {`"${t.notes}"`}
                            </Text>
                          )}
                        </GlassCard>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Selector de Fecha Modal */}
          <ModalSelectorFecha
            visible={mostrarSelectorFecha}
            selectedDate={fechaVigencia}
            onSelectDate={d => {
              setFechaVigencia(d);
              setMostrarSelectorFecha(false);
            }}
            onClose={() => setMostrarSelectorFecha(false)}
          />
        </View>
      </KeyboardAvoidingView>
  );
};

export const ModalGestionPrecios: React.FC<PropiedadesModalGestionPrecios> = ({
  visible,
  onClose,
  producto,
}) => {
  return (
    <Modal
      visible={visible && Boolean(producto)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {visible && producto && (
        <ContenidoGestionPrecios producto={producto} onClose={onClose} />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '92%',
    flexShrink: 1,
    overflow: 'hidden',
  },
  scrollArea: {
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitlesCol: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 13,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  tabBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  tabBtnTextActive: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  metricsLiveCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.15)',
    gap: 12,
  },
  metricsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  metricsHeaderText: {
    color: COLORS.secondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  metricsValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 12,
  },
  metricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  profitValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  marginBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marginValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  marginPositive: {
    color: '#00D2FF',
  },
  marginNegative: {
    color: '#FF6E6E',
  },
  marginNA: {
    color: COLORS.onSurfaceVariant + '80',
    fontStyle: 'italic',
    marginTop: 4,
  },
  calcDisclaimer: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
    gap: 6,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  subLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  currencyPrefix: {
    color: COLORS.secondary,
    fontWeight: '700',
    marginRight: 8,
    fontSize: 16,
  },
  currencyPrefixUsd: {
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 6,
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    color: COLORS.onSurface,
  },
  usdRefSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    gap: 10,
  },
  usdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usdSectionTitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  usdHint: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 10,
  },
  inputContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    height: 42,
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.25)',
  },
  convertBtnText: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginLeft: 6,
  },
  applyPill: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  applyPillText: {
    color: '#06120D',
    fontSize: 9,
    fontWeight: '700',
  },
  dateSection: {
    gap: 6,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 48,
  },
  dateBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBtnText: {
    color: COLORS.onSurface,
  },
  switchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    color: COLORS.onSurface,
    fontSize: 13,
  },
  switchDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  buttonWrapper: {
    marginTop: 4,
  },
  historyContainer: {
    gap: 12,
  },
  emptyHistoryCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    gap: 8,
  },
  emptyHistoryTitle: {
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  emptyHistorySubtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  tariffsList: {
    gap: 10,
  },
  tariffCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  tariffCardActive: {
    borderColor: 'rgba(87, 245, 171, 0.3)',
    backgroundColor: 'rgba(87, 245, 171, 0.03)',
  },
  tariffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tariffPeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tariffPeriodText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  tariffPeriodTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  activePill: {
    backgroundColor: 'rgba(87, 245, 171, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: '700',
  },
  trashBtn: {
    padding: 4,
  },
  tariffMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 8,
  },
  tariffMetricItem: {
    gap: 2,
  },
  tariffMetricLabel: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 9,
  },
  tariffMetricValue: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  tariffUsdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tariffUsdText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  tariffNotesText: {
    color: COLORS.onSurfaceVariant + '90',
    fontStyle: 'italic',
    fontSize: 10,
  },
});

export const ModalGestionPreciosProductos = ModalGestionPrecios;
export type PropiedadesModalGestionPreciosProductos = PropiedadesModalGestionPrecios;

