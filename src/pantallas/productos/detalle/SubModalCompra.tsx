import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
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
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
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
import { estilosOperaciones as styles } from './estilosOperaciones';

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconWrap, { backgroundColor: 'rgba(87, 245, 171, 0.15)' }]}>
                <MaterialIcons name="add-box" size={18} color={COLORS.ingreso} />
              </View>
              <Text style={styles.headerTitle}>Registrar Compra / Ingreso</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={18} color={COLORS.enSuperficieVariante} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.form}>
              {/* Product Info Banner */}
              <View style={styles.productBanner}>
                <Text style={styles.productBannerText} numberOfLines={1}>
                  {producto.name}
                </Text>
                <Text style={styles.productBannerStock}>
                  Stock actual: {currentStock} {producto.saleUnit}s
                </Text>
              </View>

              {/* Cantidad y Costo Unitario */}
              <View style={styles.inputsRowDouble}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Cantidad a Ingresar</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={cantidad}
                      onChangeText={setCantidad}
                      placeholder="1"
                      placeholderTextColor={COLORS.bordeContorno}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Costo Unitario</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      value={costoTexto}
                      onChangeText={val => setCostoTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.bordeContorno}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Inversión total estimada */}
              <View style={styles.productBanner}>
                <Text style={{ fontSize: 12, color: COLORS.enSuperficieVariante }}>
                  Inversión Total:
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.enSuperficie }}>
                  {formatCurrency(totalCostoCentavos)}
                </Text>
              </View>

              {/* Checkbox: Actualizar costo de referencia del producto */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  triggerSelection();
                  setActualizarCosto(prev => !prev);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={actualizarCosto ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={actualizarCosto ? COLORS.primario : COLORS.bordeContorno}
                />
                <Text style={styles.checkboxLabel}>
                  Actualizar el costo unitario de referencia del producto con esta compra
                </Text>
              </TouchableOpacity>

              {/* Proveedor */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Proveedor (opcional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={proveedor}
                    onChangeText={setProveedor}
                    placeholder="ej. Distribuidora Central, Mayorista..."
                    placeholderTextColor={COLORS.bordeContorno}
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Notas */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notas u Observaciones (opcional)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="N° de factura, remito o lote..."
                    placeholderTextColor={COLORS.bordeContorno}
                    multiline
                    style={[styles.textInput, styles.textAreaInput]}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={procesando}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <View style={styles.submitBtnWrapper}>
              <BotonBrillante
                title={procesando ? 'Guardando...' : '✓ Confirmar Compra'}
                onPress={handleGuardarCompra}
                disabled={procesando}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

