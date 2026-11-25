import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS } from '@/compartido/tema';
import {
  EncabezadoModal,
  TarjetaVidrio,
  OrbeGlossy,
  SelectorSegmentado,
  ChipFiltro,
  BotonBrillante,
  OpcionSegmento,
} from '@/compartido/componentes';
import {
  formatearEntradaDinero,
  convertirMontoACentavos,
  formatearMoneda as formatCurrency,
} from '@/compartido/utilidades/moneda';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { Producto, Cuenta, FormatoProducto } from '@/datos/tipos';
import {
  registrarVentaInventario,
  obtenerUltimaCuentaVentaProducto,
} from '@/datos/consultas/inventario';
import { IconoProducto } from '@/compartido/iconosProductos';

export interface PropiedadesSubModalVenta {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  cuentas: Cuenta[];
  onSuccess?: () => void;
}

type ModoCobroUI = 'IMMEDIATE_ACCOUNT' | 'CREDIT_PENDING';

const OPCIONES_MODO_COBRO: OpcionSegmento<ModoCobroUI>[] = [
  {
    valor: 'IMMEDIATE_ACCOUNT',
    etiqueta: 'Cobro Inmediato',
    icono: 'account-balance',
    tonoActivo: 'cian',
  },
  {
    valor: 'CREDIT_PENDING',
    etiqueta: 'A Crédito',
    icono: 'receipt-long',
    tonoActivo: 'violeta',
  },
];

export const SubModalVenta: React.FC<PropiedadesSubModalVenta> = ({
  visible,
  onClose,
  producto,
  cuentas,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const isService =
    (producto.saleUnit || '').trim().toLowerCase() === 'servicio' ||
    producto.productType === 'SERVICIO';

  const [formatoSeleccionado, setFormatoSeleccionado] = useState<FormatoProducto | null>(() => {
    if (isService && producto.formats && producto.formats.length > 0) {
      return producto.formats[0];
    }
    return null;
  });

  const [cantidad, setCantidad] = useState('1');
  const [precioTexto, setPrecioTexto] = useState(() => {
    const pBase =
      isService && producto.formats && producto.formats.length > 0
        ? producto.formats[0].salePrice
        : producto.basePrice;
    if (!pBase) return '';
    return formatearEntradaDinero((pBase / 100).toFixed(2).replace('.', ','));
  });
  const [modoCobro, setModoCobro] = useState<ModoCobroUI>('IMMEDIATE_ACCOUNT');
  const [cuentaId, setCuentaId] = useState(() => {
    try {
      const ultima = obtenerUltimaCuentaVentaProducto(producto.id);
      if (ultima) {
        if (ultima.paymentMethod === 'NO_ACCOUNT') return '';
        if (ultima.accountId && cuentas.some(c => c.id === ultima.accountId)) {
          return ultima.accountId;
        }
      }
    } catch {
      // fallback a la primera cuenta disponible
    }
    return cuentas[0]?.id || '';
  });
  const [cliente, setCliente] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cantNum = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
  const precioUnitarioCentavos = precioTexto
    ? convertirMontoACentavos(precioTexto)
    : (formatoSeleccionado?.salePrice ?? (producto.basePrice || 0));
  const costoUnitarioCentavos = formatoSeleccionado?.costPrice ?? (producto.costPrice || 0);
  const totalVentaCentavos = Math.round(cantNum * precioUnitarioCentavos);
  const totalCostoCentavos = Math.round(cantNum * costoUnitarioCentavos);
  const gananciaEstimada = totalVentaCentavos - totalCostoCentavos;
  const margenEstimado =
    totalVentaCentavos > 0 ? (gananciaEstimada / totalVentaCentavos) * 100 : null;

  const currentStock = producto.currentStock ?? 0;

  const handleStepCantidad = (delta: number) => {
    triggerSelection();
    const actual = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
    const nueva = Math.max(1, actual + delta);
    setCantidad(String(nueva));
  };

  const handleGuardarVenta = () => {
    if (cantNum <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Por favor, ingresa una cantidad mayor a cero.');
      return;
    }

    if (!isService && cantNum > currentStock) {
      triggerError();
      Alert.alert(
        'Stock insuficiente',
        `No puedes registrar una venta de ${cantNum} unidades porque el stock actual es de ${currentStock} ${producto.saleUnit}s.`
      );
      return;
    }

    if (modoCobro === 'CREDIT_PENDING' && !cliente.trim()) {
      triggerError();
      Alert.alert(
        'Cliente requerido',
        'Por favor, indica el nombre del cliente para crear la cuenta por cobrar.'
      );
      return;
    }

    const sinCuenta = modoCobro === 'IMMEDIATE_ACCOUNT' && !cuentaId;
    const paymentModeFinal = sinCuenta ? 'NO_ACCOUNT' : modoCobro;

    setProcesando(true);
    try {
      registrarVentaInventario({
        productId: producto.id,
        quantity: cantNum,
        unitPrice: precioUnitarioCentavos,
        unitCost: costoUnitarioCentavos,
        formatName: formatoSeleccionado?.name,
        paymentMode: paymentModeFinal,
        accountId: paymentModeFinal === 'IMMEDIATE_ACCOUNT' ? cuentaId : undefined,
        customer: cliente.trim() || undefined,
        dueDate:
          modoCobro === 'CREDIT_PENDING' && vencimiento.trim()
            ? vencimiento.trim()
            : undefined,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      Alert.alert(
        isService ? 'Trabajo registrado' : 'Venta registrada',
        `Se registró ${cantNum} ${isService ? 'servicio(s)' : producto.saleUnit + 's'}${
          formatoSeleccionado ? ` [${formatoSeleccionado.name}]` : ''
        }.\nImporte: ${formatCurrency(totalVentaCentavos)}${
          paymentModeFinal === 'CREDIT_PENDING'
            ? '\n\nSe creó la cuenta por cobrar correspondiente en el módulo de Deudas.'
            : paymentModeFinal === 'NO_ACCOUNT'
            ? '\n\nRegistrado solo en inventario (sin afectar cuentas ni movimientos).'
            : '\n\nEl importe fue acreditado en la cuenta seleccionada.'
        }`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error al registrar venta', err?.message || 'No se pudo completar la operación.');
    } finally {
      setProcesando(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <View
          style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <EncabezadoModal
            titulo="Registrar Venta"
            subtitulo={isService ? 'Servicio / Mano de obra' : 'Salida de inventario y cobro'}
            icono="point-of-sale"
            tono="cian"
            onCerrar={onClose}
            style={styles.modalHeader}
          />

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              {/* Tarjeta de Producto */}
              <TarjetaVidrio variant="low" style={styles.productCard}>
                <View style={styles.productLeft}>
                  <OrbeGlossy tamano={40} tono="obsidiana">
                    <IconoProducto
                      icono={producto.icon}
                      nombre={producto.name}
                      size={20}
                      color={COLORS.secondary}
                    />
                  </OrbeGlossy>
                  <Text style={styles.productName} numberOfLines={1}>
                    {producto.name}
                  </Text>
                </View>

                {isService ? (
                  <View style={[styles.stockBadge, styles.stockBadgeService]}>
                    <MaterialIcons name="design-services" size={13} color={COLORS.secondary} />
                    <Text style={[styles.stockText, { color: COLORS.secondary }]}>Servicio</Text>
                  </View>
                ) : (
                  <View style={styles.stockBadge}>
                    <View style={styles.stockDot} />
                    <Text style={styles.stockText}>
                      {currentStock} {producto.saleUnit}s
                    </Text>
                  </View>
                )}
              </TarjetaVidrio>

              {/* Selector de Formato / Medida si es un servicio con tarifas */}
              {isService && producto.formats && producto.formats.length > 0 && (
                <TarjetaVidrio variant="low" style={styles.sectionCard}>
                  <Text style={styles.sectionLabel}>FORMATO O MEDIDA DEL TRABAJO</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.formatChipsScroll}
                  >
                    {producto.formats.map(fmt => {
                      const isSelected = formatoSeleccionado?.id === fmt.id;
                      return (
                        <TouchableOpacity
                          key={fmt.id}
                          style={[styles.formatChip, isSelected && styles.formatChipSelected]}
                          onPress={() => {
                            triggerSelection();
                            setFormatoSeleccionado(fmt);
                            const centavosStr = (fmt.salePrice / 100)
                              .toFixed(2)
                              .replace('.', ',');
                            setPrecioTexto(formatearEntradaDinero(centavosStr));
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.formatChipText,
                              isSelected && styles.formatChipTextSelected,
                            ]}
                          >
                            {fmt.name}
                          </Text>
                          <Text style={styles.formatChipPrice}>
                            {formatCurrency(fmt.salePrice)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </TarjetaVidrio>
              )}

              {/* Grid 2 Columnas: Controles (Cantidad y Precio) + Total de la Venta */}
              <View style={styles.gridRow}>
                <View style={styles.leftCol}>
                  {/* Stepper de Cantidad */}
                  <View style={styles.stepperBox}>
                    <OrbeGlossy
                      tamano={32}
                      tono="obsidiana"
                      onPress={() => handleStepCantidad(-1)}
                      accessibilityLabel="Disminuir cantidad"
                    >
                      <MaterialIcons name="remove" size={16} color="#FFFFFF" />
                    </OrbeGlossy>
                    <TextInput
                      value={cantidad}
                      onChangeText={val => setCantidad(val.replace(/[^0-9.,]/g, ''))}
                      keyboardType="decimal-pad"
                      style={styles.stepperInput}
                      placeholder="1"
                      placeholderTextColor={COLORS.outline}
                      selectTextOnFocus
                    />
                    <OrbeGlossy
                      tamano={32}
                      tono="cian"
                      onPress={() => handleStepCantidad(1)}
                      accessibilityLabel="Aumentar cantidad"
                    >
                      <MaterialIcons name="add" size={16} color="#FFFFFF" />
                    </OrbeGlossy>
                  </View>

                  {/* Input de Precio Unitario */}
                  <View style={styles.priceBox}>
                    <Text style={styles.priceCurrencyPrefix}>$</Text>
                    <TextInput
                      value={precioTexto}
                      onChangeText={val => setPrecioTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.outline}
                      keyboardType="decimal-pad"
                      style={styles.priceInput}
                      selectTextOnFocus
                    />
                    <Text style={styles.priceCurrencySuffix}>{producto.currency || 'UYU'}</Text>
                  </View>
                </View>

                {/* Tarjeta Resumen TOTAL DE LA VENTA */}
                <TarjetaVidrio variant="high" style={styles.totalCard}>
                  <View>
                    <Text style={styles.totalCardLabel}>TOTAL DE LA VENTA</Text>
                    <Text style={styles.totalCardAmount} numberOfLines={1}>
                      {formatCurrency(totalVentaCentavos)}
                    </Text>
                  </View>
                  <View style={styles.totalCardFooter}>
                    <Text style={styles.totalCardCostText} numberOfLines={1}>
                      Costo:{' '}
                      <Text style={styles.totalCardCostValue}>
                        {formatCurrency(totalCostoCentavos)}
                      </Text>
                    </Text>
                    {gananciaEstimada !== 0 && (
                      <Text
                        style={[
                          styles.totalCardProfit,
                          gananciaEstimada >= 0 ? styles.profitPos : styles.profitNeg,
                        ]}
                        numberOfLines={1}
                      >
                        {gananciaEstimada >= 0
                          ? `+${formatCurrency(gananciaEstimada)}`
                          : formatCurrency(gananciaEstimada)}
                        {margenEstimado !== null ? ` (${margenEstimado.toFixed(0)}%)` : ''}
                      </Text>
                    )}
                  </View>
                </TarjetaVidrio>
              </View>

              {/* Selector Segmentado 3D de Forma de Cobro */}
              <SelectorSegmentado
                opciones={OPCIONES_MODO_COBRO}
                valorSeleccionado={modoCobro}
                onSeleccionar={setModoCobro}
                compacto
              />

              {/* Cuenta de Ingreso o Formulario de Crédito */}
              {modoCobro === 'IMMEDIATE_ACCOUNT' ? (
                <TarjetaVidrio variant="low" style={styles.sectionCard}>
                  <Text style={styles.sectionLabel}>CUENTA DE INGRESO</Text>
                  <View style={styles.chipsWrap}>
                    <ChipFiltro
                      etiqueta="Sin cuenta"
                      icono="block"
                      activo={cuentaId === ''}
                      tono="violeta"
                      onPress={() => setCuentaId('')}
                    />
                    {cuentas.map(acc => (
                      <ChipFiltro
                        key={acc.id}
                        etiqueta={acc.name}
                        activo={cuentaId === acc.id}
                        tono="cian"
                        onPress={() => setCuentaId(acc.id)}
                      />
                    ))}
                  </View>
                  <Text style={styles.accountHelperText}>
                    {cuentaId
                      ? 'Suma el importe a esta cuenta y registra el ingreso en Movimientos.'
                      : 'Solo descuenta stock y registra la venta en inventario, sin tocar cuentas ni Movimientos.'}
                  </Text>
                </TarjetaVidrio>
              ) : (
                <TarjetaVidrio variant="low" style={styles.sectionCard}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.sectionLabel}>CLIENTE / COMPRADOR *</Text>
                    <View style={styles.textInputBox}>
                      <TextInput
                        value={cliente}
                        onChangeText={setCliente}
                        placeholder="Nombre del cliente o comprador..."
                        placeholderTextColor={COLORS.outline}
                        style={styles.fieldInput}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.sectionLabel}>FECHA DE VENCIMIENTO (OPCIONAL)</Text>
                    <View style={styles.textInputBox}>
                      <TextInput
                        value={vencimiento}
                        onChangeText={setVencimiento}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={COLORS.outline}
                        style={styles.fieldInput}
                      />
                    </View>
                  </View>
                </TarjetaVidrio>
              )}

              {/* Notas */}
              <TarjetaVidrio variant="low" style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>NOTAS (OPCIONAL)</Text>
                <View style={styles.notesBox}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="Detalles de entrega, factura, identificación de cliente..."
                    placeholderTextColor={COLORS.outline}
                    multiline
                    numberOfLines={2}
                    style={styles.notesInput}
                  />
                </View>
              </TarjetaVidrio>
            </View>
          </ScrollView>

          {/* Footer con Botón 3D Brillante */}
          <View style={styles.footer}>
            <BotonBrillante
              title={procesando ? 'Guardando...' : 'Confirmar Venta'}
              onPress={handleGuardarVenta}
              loading={procesando}
              disabled={procesando}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 9, 11, 0.84)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 30,
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#101518',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.18)',
    maxHeight: '92%',
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(165, 231, 255, 0.25)',
  },
  modalHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  form: {
    paddingVertical: 6,
    paddingBottom: 16,
    gap: 12,
  },
  productCard: {
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.3)',
  },
  stockBadgeService: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    borderColor: 'rgba(165, 231, 255, 0.28)',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#57F5AB',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57F5AB',
  },
  sectionCard: {
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  formatChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  formatChip: {
    backgroundColor: 'rgba(9, 13, 15, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  formatChipSelected: {
    backgroundColor: 'rgba(0, 210, 255, 0.14)',
    borderColor: COLORS.secondary,
  },
  formatChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  formatChipTextSelected: {
    color: COLORS.secondary,
  },
  formatChipPrice: {
    color: '#57F5AB',
    fontSize: 11,
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    borderRadius: 16,
    paddingHorizontal: 6,
    height: 48,
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    padding: 0,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  priceCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    padding: 0,
  },
  priceCurrencySuffix: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  totalCard: {
    flex: 1,
    borderRadius: 18,
    padding: 13,
    justifyContent: 'space-between',
    minHeight: 106,
  },
  totalCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  totalCardAmount: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  totalCardFooter: {
    marginTop: 6,
    gap: 2,
  },
  totalCardCostText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  totalCardCostValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  totalCardProfit: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  profitPos: {
    color: '#57F5AB',
  },
  profitNeg: {
    color: '#FF6E6E',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  accountHelperText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    lineHeight: 15,
  },
  fieldGroup: {
    gap: 6,
  },
  textInputBox: {
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  fieldInput: {
    fontSize: 13,
    color: '#FFFFFF',
    padding: 0,
  },
  notesBox: {
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 62,
  },
  notesInput: {
    fontSize: 12.5,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    padding: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 231, 255, 0.1)',
  },
});
