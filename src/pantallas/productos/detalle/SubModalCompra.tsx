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
import { Producto } from '@/datos/tipos';
import { registrarCompraInventario } from '@/datos/consultas/inventario';

export interface PropiedadesSubModalCompra {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  onSuccess?: () => void;
}

export const SubModalCompra: React.FC<PropiedadesSubModalCompra> = ({
  visible,
  onClose,
  producto,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [cantidad, setCantidad] = useState('1');
  const [costoTexto, setCostoTexto] = useState(() => {
    if (!producto.costPrice) return '';
    return formatearEntradaDinero((producto.costPrice / 100).toFixed(2).replace('.', ','));
  });
  const [proveedor, setProveedor] = useState(() => producto.supplier || '');
  const [actualizarCosto, setActualizarCosto] = useState(true);
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cantNum = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
  const costoUnitarioCentavos = costoTexto ? convertirMontoACentavos(costoTexto) : (producto.costPrice || 0);
  const totalCostoCentavos = Math.round(cantNum * costoUnitarioCentavos);
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
        supplier: proveedor.trim() || undefined,
        actualizarCostoProducto: actualizarCosto,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      Alert.alert(
        'Compra registrada',
        `Se añadieron ${cantNum} ${producto.saleUnit}s al inventario.\nNuevo stock: ${currentStock + cantNum} ${producto.saleUnit}s.\nInversión total: ${formatCurrency(totalCostoCentavos)}`
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
          style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle de arrastre superior */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Encabezado con Ícono Emerald y Punto Emerald pulsante estilo Stitch */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.3)', '#182226', 'rgba(16, 185, 129, 0.18)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIconBox}
              >
                <MaterialIcons name="add" size={24} color="#10B981" />
              </LinearGradient>
              <View style={styles.titleWithDot}>
                <Text style={styles.headerTitle}>Registrar Compra / Ingreso</Text>
                <View style={styles.emeraldPulseDot} />
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
              {/* Tarjeta de Producto con Stock Pill Badge */}
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

              {/* Grid 2 Columnas: Controles (Cantidad y Costo Unitario) + Inversión Total */}
              <View style={styles.gridRow}>
                {/* Columna Izquierda: Stepper de cantidad y Costo Unitario */}
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

                  {/* Input de Costo Unitario con prefijo $ */}
                  <View style={styles.costBox}>
                    <Text style={styles.costCurrencyPrefix}>$</Text>
                    <TextInput
                      value={costoTexto}
                      onChangeText={val => setCostoTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      style={styles.costInput}
                      selectTextOnFocus
                    />
                    <Text style={styles.costCurrencySuffix}>{producto.currency || 'USD'}</Text>
                  </View>
                </View>

                {/* Columna Derecha: Tarjeta Inversión Total */}
                <View style={styles.totalCard}>
                  <View>
                    <Text style={styles.totalCardLabel}>INVERSIÓN TOTAL</Text>
                    <Text style={styles.totalCardAmount} numberOfLines={1}>
                      {formatCurrency(totalCostoCentavos)}
                    </Text>
                  </View>
                  <View style={styles.totalCardFooter}>
                    <Text style={styles.totalCardStockNote}>
                      Nuevo stock: {currentStock + cantNum} {producto.saleUnit}s
                    </Text>
                  </View>
                </View>
              </View>

              {/* Checkbox: Actualizar costo de referencia del producto con esta compra */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  triggerSelection();
                  setActualizarCosto(prev => !prev);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={actualizarCosto ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={actualizarCosto ? '#8A4FFF' : '#64748B'}
                />
                <Text style={styles.checkboxLabel}>
                  Actualizar el costo unitario de referencia del producto con esta compra
                </Text>
              </TouchableOpacity>

              {/* Proveedor */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>PROVEEDOR (OPCIONAL)</Text>
                <View style={styles.textInputBox}>
                  <TextInput
                    value={proveedor}
                    onChangeText={setProveedor}
                    placeholder="Distribuidora Central, Mayorista..."
                    placeholderTextColor="#64748B"
                    style={styles.fieldInput}
                  />
                </View>
              </View>

              {/* Notas u Observaciones */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>NOTAS U OBSERVACIONES (OPCIONAL)</Text>
                <View style={styles.notesBox}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="N° de factura, remito o lote..."
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={2}
                    style={styles.notesInput}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer de Acción con Botón Primario Gradiente Stitch de tamaño idéntico a Registrar Venta */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleGuardarCompra}
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
                  {procesando ? 'Guardando...' : 'Confirmar Compra'}
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
    borderColor: 'rgba(16, 185, 129, 0.35)',
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
  emeraldPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
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
  costBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  costCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
    marginRight: 4,
  },
  costInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    padding: 0,
  },
  costCurrencySuffix: {
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
  totalCardStockNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: '#223037',
    borderRadius: 14,
    padding: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
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
