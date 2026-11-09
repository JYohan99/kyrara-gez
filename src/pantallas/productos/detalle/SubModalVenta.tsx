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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Producto, Cuenta } from '@/datos/tipos';
import { registrarVentaInventario } from '@/datos/consultas/inventario';

export interface PropiedadesSubModalVenta {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  cuentas: Cuenta[];
  onSuccess?: () => void;
}

export const SubModalVenta: React.FC<PropiedadesSubModalVenta> = ({
  visible,
  onClose,
  producto,
  cuentas,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [cantidad, setCantidad] = useState('1');
  const [precioTexto, setPrecioTexto] = useState(() => {
    if (!producto.basePrice) return '';
    return formatearEntradaDinero((producto.basePrice / 100).toFixed(2).replace('.', ','));
  });
  const [modoCobro, setModoCobro] = useState<'IMMEDIATE_ACCOUNT' | 'CREDIT_PENDING'>('IMMEDIATE_ACCOUNT');
  const [cuentaId, setCuentaId] = useState(() => cuentas[0]?.id || '');
  const [cliente, setCliente] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cantNum = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
  const precioUnitarioCentavos = precioTexto ? convertirMontoACentavos(precioTexto) : (producto.basePrice || 0);
  const costoUnitarioCentavos = producto.costPrice || 0;
  const totalVentaCentavos = Math.round(cantNum * precioUnitarioCentavos);
  const totalCostoCentavos = Math.round(cantNum * costoUnitarioCentavos);
  const gananciaEstimada = totalVentaCentavos - totalCostoCentavos;
  const margenEstimado = totalVentaCentavos > 0 ? (gananciaEstimada / totalVentaCentavos) * 100 : null;

  const currentStock = producto.currentStock ?? 0;

  const handleStepCantidad = (delta: number) => {
    triggerSelection();
    const actual = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
    const nueva = Math.max(1, actual + delta);
    setCantidad(String(nueva));
  };

  const getProductIcon = () => {
    const nom = (producto.name || '').toLowerCase();
    if (nom.includes('caf')) return 'local-cafe';
    if (nom.includes('foto') || nom.includes('cuadro') || nom.includes('lienzo')) return 'image';
    if (nom.includes('taza') || nom.includes('vaso')) return 'emoji-food-beverage';
    if (nom.includes('remera') || nom.includes('ropa')) return 'checkroom';
    return 'inventory-2';
  };

  const handleGuardarVenta = () => {
    if (cantNum <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Por favor, ingresa una cantidad mayor a cero.');
      return;
    }

    if (cantNum > currentStock) {
      triggerError();
      Alert.alert(
        'Stock insuficiente',
        `No puedes registrar una venta de ${cantNum} unidades porque el stock actual es de ${currentStock} ${producto.saleUnit}s.`
      );
      return;
    }

    if (modoCobro === 'IMMEDIATE_ACCOUNT' && !cuentaId) {
      triggerError();
      Alert.alert('Cuenta requerida', 'Selecciona la cuenta donde ingresó el dinero cobrado.');
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

    setProcesando(true);
    try {
      registrarVentaInventario({
        productId: producto.id,
        quantity: cantNum,
        unitPrice: precioUnitarioCentavos,
        paymentMode: modoCobro,
        accountId: modoCobro === 'IMMEDIATE_ACCOUNT' ? cuentaId : undefined,
        customer: cliente.trim() || undefined,
        dueDate: modoCobro === 'CREDIT_PENDING' && vencimiento.trim() ? vencimiento.trim() : undefined,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      Alert.alert(
        'Venta registrada',
        `Se registró la salida de ${cantNum} ${producto.saleUnit}s.\nImporte: ${formatCurrency(totalVentaCentavos)}\nGanancia bruta: ${formatCurrency(gananciaEstimada)}${
          modoCobro === 'CREDIT_PENDING'
            ? '\n\nSe creó la cuenta por cobrar correspondiente en el módulo de Deudas.'
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
          style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle de arrastre superior */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Encabezado con Ícono Glowing y Punto Cyan pulsante */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LinearGradient
                colors={['rgba(138, 79, 255, 0.3)', '#182226', 'rgba(0, 210, 255, 0.18)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIconBox}
              >
                <MaterialIcons name="point-of-sale" size={22} color="#00D2FF" />
              </LinearGradient>
              <View style={styles.titleWithDot}>
                <Text style={styles.headerTitle}>Registrar Venta</Text>
                <View style={styles.cyanPulseDot} />
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Cerrar modal"
            >
              <MaterialIcons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Tarjeta de Producto con Stock Pill Badge estilo Stitch */}
              <View style={styles.productCard}>
                <View style={styles.productLeft}>
                  <View style={styles.productIconBox}>
                    <MaterialIcons name={getProductIcon()} size={22} color="#FBBF24" />
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>
                    {producto.name}
                  </Text>
                </View>
                <View style={styles.stockBadge}>
                  <View style={styles.stockDot} />
                  <Text style={styles.stockText}>
                    {currentStock} {producto.saleUnit}s
                  </Text>
                </View>
              </View>

              {/* Grid 2 Columnas: Controles (Cantidad y Precio) + Total de la Venta */}
              <View style={styles.gridRow}>
                {/* Columna Izquierda: Stepper de cantidad y Precio Unitario */}
                <View style={styles.leftCol}>
                  {/* Stepper de Cantidad */}
                  <View style={styles.stepperBox}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => handleStepCantidad(-1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={cantidad}
                      onChangeText={setCantidad}
                      keyboardType="numeric"
                      style={styles.stepperInput}
                      placeholder="1"
                      placeholderTextColor="#64748B"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => handleStepCantidad(1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Input de Precio Unitario con sufijo de moneda */}
                  <View style={styles.priceBox}>
                    <Text style={styles.priceCurrencyPrefix}>$</Text>
                    <TextInput
                      value={precioTexto}
                      onChangeText={val => setPrecioTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      style={styles.priceInput}
                      selectTextOnFocus
                    />
                    <Text style={styles.priceCurrencySuffix}>{producto.currency || 'USD'}</Text>
                  </View>
                </View>

                {/* Columna Derecha: Tarjeta Resumen "TOTAL DE LA VENTA" */}
                <View style={styles.totalCard}>
                  <View>
                    <Text style={styles.totalCardLabel}>TOTAL DE LA VENTA</Text>
                    <Text style={styles.totalCardAmount} numberOfLines={1}>
                      {formatCurrency(totalVentaCentavos)}
                    </Text>
                  </View>
                  <View style={styles.totalCardFooter}>
                    <Text style={styles.totalCardCostText}>
                      Costo estimado: <Text style={styles.totalCardCostValue}>{formatCurrency(totalCostoCentavos)}</Text>
                    </Text>
                    {gananciaEstimada !== 0 && (
                      <Text
                        style={[
                          styles.totalCardProfit,
                          gananciaEstimada >= 0 ? styles.profitPos : styles.profitNeg,
                        ]}
                        numberOfLines={1}
                      >
                        {gananciaEstimada >= 0 ? `+${formatCurrency(gananciaEstimada)}` : formatCurrency(gananciaEstimada)}
                        {margenEstimado !== null ? ` (${margenEstimado.toFixed(0)}%)` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Selector Segmentado de Forma de Cobro */}
              <View style={styles.paymentModeTrack}>
                <TouchableOpacity
                  style={[
                    styles.paymentModeBtn,
                    modoCobro === 'IMMEDIATE_ACCOUNT' && styles.paymentModeBtnActive,
                  ]}
                  onPress={() => {
                    triggerSelection();
                    setModoCobro('IMMEDIATE_ACCOUNT');
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="account-balance"
                    size={16}
                    color={modoCobro === 'IMMEDIATE_ACCOUNT' ? '#00D2FF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.paymentModeText,
                      modoCobro === 'IMMEDIATE_ACCOUNT' && styles.paymentModeTextActive,
                    ]}
                  >
                    Cobro Inmediato
                  </Text>
                  {modoCobro === 'IMMEDIATE_ACCOUNT' && <View style={styles.activeModeDot} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentModeBtn,
                    modoCobro === 'CREDIT_PENDING' && styles.paymentModeBtnActive,
                  ]}
                  onPress={() => {
                    triggerSelection();
                    setModoCobro('CREDIT_PENDING');
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="receipt-long"
                    size={16}
                    color={modoCobro === 'CREDIT_PENDING' ? '#00D2FF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.paymentModeText,
                      modoCobro === 'CREDIT_PENDING' && styles.paymentModeTextActive,
                    ]}
                  >
                    A Crédito / Pendiente
                  </Text>
                  {modoCobro === 'CREDIT_PENDING' && <View style={styles.activeModeDot} />}
                </TouchableOpacity>
              </View>

              {/* Selector de Cuentas (Cobro Inmediato) o Formulario de Crédito */}
              {modoCobro === 'IMMEDIATE_ACCOUNT' ? (
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>CUENTA DE INGRESO</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {cuentas.map(acc => {
                      const isSel = cuentaId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.accountChip, isSel && styles.accountChipActive]}
                          onPress={() => {
                            triggerSelection();
                            setCuentaId(acc.id);
                          }}
                          activeOpacity={0.8}
                        >
                          {isSel && <View style={styles.accountActiveDot} />}
                          <Text style={[styles.accountChipText, isSel && styles.accountChipTextActive]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.sectionLabel}>CLIENTE / COMPRADOR</Text>
                    <View style={styles.textInputBox}>
                      <TextInput
                        value={cliente}
                        onChangeText={setCliente}
                        placeholder="Nombre del cliente o comprador..."
                        placeholderTextColor="#64748B"
                        style={styles.fieldInput}
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, { marginTop: 10 }]}>
                    <Text style={styles.sectionLabel}>FECHA DE VENCIMIENTO (OPCIONAL)</Text>
                    <View style={styles.textInputBox}>
                      <TextInput
                        value={vencimiento}
                        onChangeText={setVencimiento}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor="#64748B"
                        style={styles.fieldInput}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Campo de Notas */}
              <View style={styles.formSection}>
                <View style={styles.notesBox}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="Detalles de entrega, factura, identificación de cliente..."
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={2}
                    style={styles.notesInput}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer de Acción con Botón Primario Gradiente Stitch */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleGuardarVenta}
              disabled={procesando}
              activeOpacity={0.85}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={['#8A4FFF', '#9D68FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                <Text style={styles.submitBtnText}>
                  {procesando ? 'Guardando...' : 'Confirmar Venta'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(11, 15, 16, 0.85)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 30,
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#131A1D',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#223037',
    minHeight: 540,
    maxHeight: '94%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 48, 55, 0.7)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cyanPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D2FF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: '#223037',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  form: {
    paddingVertical: 16,
    gap: 14,
  },
  productCard: {
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  productIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 14,
    padding: 4,
    height: 46,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#CBD5E1',
    lineHeight: 22,
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    padding: 0,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  priceCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    padding: 0,
  },
  priceCurrencySuffix: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  totalCard: {
    flex: 1,
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 102,
  },
  totalCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalCardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  totalCardFooter: {
    marginTop: 8,
  },
  totalCardCostText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  totalCardCostValue: {
    fontWeight: '700',
    color: '#CBD5E1',
  },
  totalCardProfit: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  profitPos: {
    color: '#57F5AB',
  },
  profitNeg: {
    color: '#FF6E6E',
  },
  paymentModeTrack: {
    flexDirection: 'row',
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 16,
    padding: 4,
    gap: 6,
  },
  paymentModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    position: 'relative',
  },
  paymentModeBtnActive: {
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: '#8A4FFF',
  },
  paymentModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  paymentModeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeModeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D2FF',
  },
  formSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
  },
  accountChipActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    borderColor: '#8A4FFF',
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  accountChipTextActive: {
    color: '#00D2FF',
    fontWeight: '700',
  },
  accountActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00D2FF',
  },
  fieldGroup: {
    gap: 4,
  },
  textInputBox: {
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 12,
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
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 64,
  },
  notesInput: {
    fontSize: 12,
    color: '#E2E8F0',
    textAlignVertical: 'top',
    padding: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 48, 55, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnWrapper: {
    width: '85%',
    maxWidth: 340,
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnGradient: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
