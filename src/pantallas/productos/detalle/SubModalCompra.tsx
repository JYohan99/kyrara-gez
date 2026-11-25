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
  ChipFiltro,
  BotonBrillante,
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
import { Producto, Cuenta } from '@/datos/tipos';
import { registrarCompraInventario } from '@/datos/consultas/inventario';
import { IconoProducto } from '@/compartido/iconosProductos';

export interface PropiedadesSubModalCompra {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  cuentas?: Cuenta[];
  onSuccess?: () => void;
}

export const SubModalCompra: React.FC<PropiedadesSubModalCompra> = ({
  visible,
  onClose,
  producto,
  cuentas = [],
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [cantidad, setCantidad] = useState('1');
  const [costoTexto, setCostoTexto] = useState(() => {
    if (!producto.costPrice) return '';
    return formatearEntradaDinero((producto.costPrice / 100).toFixed(2).replace('.', ','));
  });
  const [cuentaId, setCuentaId] = useState<string>(() => cuentas[0]?.id || '');
  const [proveedor, setProveedor] = useState(() => producto.supplier || '');
  const [actualizarCosto, setActualizarCosto] = useState(true);
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cantNum = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
  const costoUnitarioCentavos = costoTexto
    ? convertirMontoACentavos(costoTexto)
    : (producto.costPrice || 0);
  const totalCostoCentavos = Math.round(cantNum * costoUnitarioCentavos);
  const currentStock = producto.currentStock ?? 0;

  const handleStepCantidad = (delta: number) => {
    triggerSelection();
    const actual = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
    const nueva = Math.max(1, actual + delta);
    setCantidad(String(nueva));
  };

  const handleGuardarCompra = () => {
    if (cantNum <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Por favor, ingresa una cantidad comprada mayor a cero.');
      return;
    }

    setProcesando(true);
    try {
      registrarCompraInventario({
        productId: producto.id,
        quantity: cantNum,
        unitCost: costoUnitarioCentavos > 0 ? costoUnitarioCentavos : undefined,
        accountId: cuentaId || undefined,
        supplier: proveedor.trim() || undefined,
        actualizarCostoProducto: actualizarCosto,
        notes: notas.trim() || undefined,
      });

      const cuentaElegida = cuentas.find(c => c.id === cuentaId);
      triggerSuccess();
      Alert.alert(
        'Compra registrada',
        `Se añadieron ${cantNum} ${producto.saleUnit}s al inventario.\nNuevo stock: ${
          currentStock + cantNum
        } ${producto.saleUnit}s.\nInversión total: ${formatCurrency(totalCostoCentavos)}${
          cuentaElegida && totalCostoCentavos > 0
            ? `\n\nSe descontó el importe de "${cuentaElegida.name}" y se registró el gasto en Movimientos.`
            : '\n\nRegistrado solo en inventario (sin afectar cuentas ni movimientos).'
        }`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error al registrar compra', err?.message || 'No se pudo registrar la compra.');
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
            titulo="Registrar Compra"
            subtitulo="Reposición e ingreso de inventario"
            icono="add-shopping-cart"
            tono="ingreso"
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
                <View style={styles.stockBadge}>
                  <View style={styles.stockDot} />
                  <Text style={styles.stockText}>
                    {currentStock} {producto.saleUnit}s
                  </Text>
                </View>
              </TarjetaVidrio>

              {/* Grid 2 Columnas: Controles + Inversión Total */}
              <View style={styles.gridRow}>
                <View style={styles.leftCol}>
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
                      tono="ingreso"
                      onPress={() => handleStepCantidad(1)}
                      accessibilityLabel="Aumentar cantidad"
                    >
                      <MaterialIcons name="add" size={16} color="#FFFFFF" />
                    </OrbeGlossy>
                  </View>

                  <View style={styles.costBox}>
                    <Text style={styles.costCurrencyPrefix}>$</Text>
                    <TextInput
                      value={costoTexto}
                      onChangeText={val => setCostoTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.outline}
                      keyboardType="decimal-pad"
                      style={styles.costInput}
                      selectTextOnFocus
                    />
                    <Text style={styles.costCurrencySuffix}>{producto.currency || 'UYU'}</Text>
                  </View>
                </View>

                <TarjetaVidrio variant="high" style={styles.totalCard}>
                  <View>
                    <Text style={styles.totalCardLabel}>INVERSIÓN TOTAL</Text>
                    <Text style={styles.totalCardAmount} numberOfLines={1}>
                      {formatCurrency(totalCostoCentavos)}
                    </Text>
                  </View>
                  <Text style={styles.totalCardStockNote}>
                    Nuevo stock: {currentStock + cantNum} {producto.saleUnit}s
                  </Text>
                </TarjetaVidrio>
              </View>

              {/* Cuenta de pago (todas visibles) */}
              <TarjetaVidrio variant="low" style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>CUENTA DE PAGO</Text>
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
                    ? 'Descuenta el total de esta cuenta y registra el gasto en Movimientos.'
                    : 'Solo suma al stock. No descuenta de ninguna cuenta ni crea un gasto.'}
                </Text>
              </TarjetaVidrio>

              {/* Actualizar costo de referencia */}
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  setActualizarCosto(prev => !prev);
                }}
                activeOpacity={0.8}
              >
                <TarjetaVidrio variant="low" style={styles.checkboxContainer}>
                  <MaterialIcons
                    name={actualizarCosto ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={actualizarCosto ? COLORS.secondary : COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.checkboxLabel}>
                    Actualizar el costo unitario de referencia del producto con esta compra
                  </Text>
                </TarjetaVidrio>
              </TouchableOpacity>

              {/* Proveedor y Notas */}
              <TarjetaVidrio variant="low" style={styles.sectionCard}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.sectionLabel}>PROVEEDOR (OPCIONAL)</Text>
                  <View style={styles.textInputBox}>
                    <TextInput
                      value={proveedor}
                      onChangeText={setProveedor}
                      placeholder="Distribuidora Central, Mayorista..."
                      placeholderTextColor={COLORS.outline}
                      style={styles.fieldInput}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.sectionLabel}>NOTAS U OBSERVACIONES (OPCIONAL)</Text>
                  <View style={styles.notesBox}>
                    <TextInput
                      value={notas}
                      onChangeText={setNotas}
                      placeholder="N° de factura, remito o lote..."
                      placeholderTextColor={COLORS.outline}
                      multiline
                      numberOfLines={2}
                      style={styles.notesInput}
                    />
                  </View>
                </View>
              </TarjetaVidrio>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BotonBrillante
              title={procesando ? 'Guardando...' : 'Confirmar Compra'}
              onPress={handleGuardarCompra}
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
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  costCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginRight: 4,
  },
  costInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    padding: 0,
  },
  costCurrencySuffix: {
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
    color: '#57F5AB',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  totalCardAmount: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  totalCardStockNote: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57F5AB',
    marginTop: 6,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.onSurface,
    lineHeight: 18,
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
