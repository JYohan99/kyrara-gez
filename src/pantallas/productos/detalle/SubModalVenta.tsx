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
import { Producto, Cuenta } from '@/datos/tipos';
import { registrarVentaInventario } from '@/datos/consultas/inventario';
import { estilosOperaciones as styles } from './estilosOperaciones';

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
                <MaterialIcons name="point-of-sale" size={18} color={COLORS.ingreso} />
              </View>
              <Text style={styles.headerTitle}>Registrar Venta</Text>
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
                  Stock: {currentStock} {producto.saleUnit}s
                </Text>
              </View>

              {/* Cantidad y Precio de Venta */}
              <View style={styles.inputsRowDouble}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Cantidad a Vender</Text>
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
                  <Text style={styles.label}>Precio Unitario</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      value={precioTexto}
                      onChangeText={val => setPrecioTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.bordeContorno}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Resumen Comercial: Venta, Costo y Ganancia */}
              <View style={styles.productBanner}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 11, color: COLORS.enSuperficieVariante }}>
                    Total Venta: <Text style={{ color: COLORS.enSuperficie, fontWeight: '700' }}>{formatCurrency(totalVentaCentavos)}</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.bordeContorno }}>
                    Costo lo vendido: {formatCurrency(totalCostoCentavos)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: gananciaEstimada >= 0 ? COLORS.ingreso : COLORS.gasto, fontWeight: '700' }}>
                    {gananciaEstimada >= 0 ? `+${formatCurrency(gananciaEstimada)}` : formatCurrency(gananciaEstimada)}
                  </Text>
                  {margenEstimado !== null && (
                    <Text style={{ fontSize: 10, color: COLORS.secundario, fontWeight: '600' }}>
                      {margenEstimado.toFixed(0)}% margen
                    </Text>
                  )}
                </View>
              </View>

              {/* Modo de Cobro */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Forma de Cobro</Text>
                <View style={styles.modeTrack}>
                  <TouchableOpacity
                    style={[styles.modeBtn, modoCobro === 'IMMEDIATE_ACCOUNT' && styles.modeBtnActive]}
                    onPress={() => {
                      triggerSelection();
                      setModoCobro('IMMEDIATE_ACCOUNT');
                    }}
                  >
                    <MaterialIcons
                      name="account-balance"
                      size={15}
                      color={modoCobro === 'IMMEDIATE_ACCOUNT' ? COLORS.ingreso : COLORS.enSuperficieVariante}
                    />
                    <Text style={[styles.modeBtnText, modoCobro === 'IMMEDIATE_ACCOUNT' && styles.modeBtnTextActive]}>
                      Cobro Inmediato
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeBtn, modoCobro === 'CREDIT_PENDING' && styles.modeBtnActive]}
                    onPress={() => {
                      triggerSelection();
                      setModoCobro('CREDIT_PENDING');
                    }}
                  >
                    <MaterialIcons
                      name="pending-actions"
                      size={15}
                      color={modoCobro === 'CREDIT_PENDING' ? COLORS.secundario : COLORS.enSuperficieVariante}
                    />
                    <Text style={[styles.modeBtnText, modoCobro === 'CREDIT_PENDING' && styles.modeBtnTextActive]}>
                      A Crédito / Pendiente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selector de cuenta si es inmediato */}
              {modoCobro === 'IMMEDIATE_ACCOUNT' ? (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Cuenta de Ingreso</Text>
                  <View style={styles.chipsContainer}>
                    {cuentas.map(acc => {
                      const isSel = cuentaId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.chipItem, isSel && styles.chipItemActive]}
                          onPress={() => {
                            triggerSelection();
                            setCuentaId(acc.id);
                          }}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Cliente / Persona</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={cliente}
                        onChangeText={setCliente}
                        placeholder="Nombre del cliente o comprador..."
                        placeholderTextColor={COLORS.bordeContorno}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Fecha de Vencimiento (opcional)</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={vencimiento}
                        onChangeText={setVencimiento}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={COLORS.bordeContorno}
                        style={styles.textInput}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Notas */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notas u Observaciones (opcional)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="Detalles de entrega, factura o cliente..."
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
                title={procesando ? 'Guardando...' : '✓ Confirmar Venta'}
                onPress={handleGuardarVenta}
                disabled={procesando}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
