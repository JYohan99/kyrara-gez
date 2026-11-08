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
import { Producto, Cuenta, OperacionInventario } from '@/datos/tipos';
import { registrarDevolucionCliente } from '@/datos/consultas/inventario';
import { estilosOperaciones as styles } from './estilosOperaciones';

const MOTIVOS_DEV_CLIENTE_SUGERIDOS = [
  'Disconformidad / Cambio',
  'Producto defectuoso',
  'Error en el pedido',
  'Garantía',
  'Cancelación de compra',
  'Otro',
];

export interface PropiedadesSubModalDevolucionCliente {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  cuentas: Cuenta[];
  operacionesVenta: OperacionInventario[];
  operacionVentaInicial?: OperacionInventario | null;
  onSuccess?: () => void;
}

export const SubModalDevolucionCliente: React.FC<PropiedadesSubModalDevolucionCliente> = ({
  visible,
  onClose,
  producto,
  cuentas,
  operacionesVenta,
  operacionVentaInicial,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [opVentaSeleccionada, setOpVentaSeleccionada] = useState<OperacionInventario | null>(
    () => operacionVentaInicial || (operacionesVenta.length > 0 ? operacionesVenta[0] : null)
  );

  const [cantidad, setCantidad] = useState(() =>
    opVentaSeleccionada ? String(opVentaSeleccionada.quantity) : '1'
  );

  const [montoReembolsoTexto, setMontoReembolsoTexto] = useState(() => {
    if (opVentaSeleccionada && opVentaSeleccionada.totalPrice) {
      return formatearEntradaDinero((opVentaSeleccionada.totalPrice / 100).toFixed(2).replace('.', ','));
    }
    if (producto.basePrice) {
      return formatearEntradaDinero((producto.basePrice / 100).toFixed(2).replace('.', ','));
    }
    return '';
  });

  const [modoReembolso, setModoReembolso] = useState<'ACCOUNT' | 'DEBT_CREDIT' | 'NONE'>(() => {
    if (opVentaSeleccionada?.debtId) return 'DEBT_CREDIT';
    return 'ACCOUNT';
  });

  const [cuentaId, setCuentaId] = useState(() => opVentaSeleccionada?.accountId || cuentas[0]?.id || '');
  const [cliente, setCliente] = useState(() => opVentaSeleccionada?.customer || '');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(MOTIVOS_DEV_CLIENTE_SUGERIDOS[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cantNum = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
  const montoReembolsoCentavos = montoReembolsoTexto ? convertirMontoACentavos(montoReembolsoTexto) : 0;
  const currentStock = producto.currentStock ?? 0;

  const handleSeleccionarOperacion = (op: OperacionInventario | null) => {
    triggerSelection();
    setOpVentaSeleccionada(op);
    if (op) {
      setCantidad(String(op.quantity));
      if (op.totalPrice) {
        setMontoReembolsoTexto(formatearEntradaDinero((op.totalPrice / 100).toFixed(2).replace('.', ',')));
      }
      if (op.customer) setCliente(op.customer);
      if (op.debtId) {
        setModoReembolso('DEBT_CREDIT');
      } else if (op.accountId) {
        setModoReembolso('ACCOUNT');
        setCuentaId(op.accountId);
      }
    }
  };

  const handleGuardarDevolucion = () => {
    if (cantNum <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Por favor, ingresa una cantidad a devolver mayor a cero.');
      return;
    }

    if (modoReembolso === 'ACCOUNT' && montoReembolsoCentavos > 0 && !cuentaId) {
      triggerError();
      Alert.alert('Cuenta requerida', 'Selecciona la cuenta desde donde se reembolsa el dinero al cliente.');
      return;
    }

    let motivoFinal = motivoSeleccionado;
    if (motivoSeleccionado === 'Otro' && motivoPersonalizado.trim()) {
      motivoFinal = motivoPersonalizado.trim();
    }

    const refundModeMapped: 'REFUND_FROM_ACCOUNT' | 'REDUCE_DEBT' | 'NO_REFUND' =
      modoReembolso === 'ACCOUNT'
        ? 'REFUND_FROM_ACCOUNT'
        : modoReembolso === 'DEBT_CREDIT'
        ? 'REDUCE_DEBT'
        : 'NO_REFUND';

    const unitPriceRefund = cantNum > 0 && montoReembolsoCentavos > 0
      ? Math.round(montoReembolsoCentavos / cantNum)
      : opVentaSeleccionada?.unitPrice;

    setProcesando(true);
    try {
      registrarDevolucionCliente({
        productId: producto.id,
        quantity: cantNum,
        unitPrice: unitPriceRefund,
        unitCost: opVentaSeleccionada?.unitCost ?? producto.costPrice,
        originalSaleId: opVentaSeleccionada ? opVentaSeleccionada.id : undefined,
        reason: motivoFinal,
        refundMode: refundModeMapped,
        accountId: refundModeMapped === 'REFUND_FROM_ACCOUNT' ? cuentaId : undefined,
        debtId: refundModeMapped === 'REDUCE_DEBT' ? opVentaSeleccionada?.debtId : undefined,
        customer: cliente.trim() || undefined,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      Alert.alert(
        'Devolución registrada',
        `Se reingresaron ${cantNum} ${producto.saleUnit}s al stock.\nNuevo stock: ${currentStock + cantNum} ${producto.saleUnit}s.${
          modoReembolso === 'ACCOUNT' && montoReembolsoCentavos > 0
            ? `\nSe registró el egreso de ${formatCurrency(montoReembolsoCentavos)} de la cuenta.`
            : modoReembolso === 'DEBT_CREDIT'
            ? '\nSe ajustó y redujo la deuda pendiente de cobro del cliente.'
            : ''
        }`
      );
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error al registrar devolución', err?.message || 'No se pudo completar la operación.');
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
              <View style={[styles.headerIconWrap, { backgroundColor: 'rgba(0, 210, 255, 0.15)' }]}>
                <MaterialIcons name="replay" size={18} color="#00D2FF" />
              </View>
              <Text style={styles.headerTitle}>Devolución de Cliente</Text>
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

              {/* Selector de Venta Previa Asociada */}
              {operacionesVenta.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Venta Original Asociada (opcional)</Text>
                  <View style={styles.chipsContainer}>
                    <TouchableOpacity
                      style={[styles.chipItem, !opVentaSeleccionada && styles.chipItemActive]}
                      onPress={() => handleSeleccionarOperacion(null)}
                    >
                      <Text style={[styles.chipText, !opVentaSeleccionada && styles.chipTextActive]}>
                        Devolución Libre (Sin venta específica)
                      </Text>
                    </TouchableOpacity>

                    {operacionesVenta.slice(0, 4).map(op => {
                      const isSel = opVentaSeleccionada?.id === op.id;
                      const fechaStr = new Date(op.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' });
                      return (
                        <TouchableOpacity
                          key={op.id}
                          style={[styles.chipItem, isSel && styles.chipItemActive]}
                          onPress={() => handleSeleccionarOperacion(op)}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                            {fechaStr} • {op.quantity} uds • {formatCurrency(op.totalPrice || 0)}{op.customer ? ` (${op.customer})` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Cantidad y Monto Reembolsado */}
              <View style={styles.inputsRowDouble}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Cantidad Devuelta</Text>
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
                  <Text style={styles.label}>Monto a Reembolsar</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      value={montoReembolsoTexto}
                      onChangeText={val => setMontoReembolsoTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.bordeContorno}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Modo de Reembolso */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Modo de Reembolso Financiero</Text>
                <View style={styles.modeTrack}>
                  <TouchableOpacity
                    style={[styles.modeBtn, modoReembolso === 'ACCOUNT' && styles.modeBtnActive]}
                    onPress={() => {
                      triggerSelection();
                      setModoReembolso('ACCOUNT');
                    }}
                  >
                    <MaterialIcons
                      name="account-balance"
                      size={15}
                      color={modoReembolso === 'ACCOUNT' ? COLORS.gasto : COLORS.enSuperficieVariante}
                    />
                    <Text style={[styles.modeBtnText, modoReembolso === 'ACCOUNT' && styles.modeBtnTextActive]}>
                      Devolver Dinero
                    </Text>
                  </TouchableOpacity>

                  {opVentaSeleccionada?.debtId && (
                    <TouchableOpacity
                      style={[styles.modeBtn, modoReembolso === 'DEBT_CREDIT' && styles.modeBtnActive]}
                      onPress={() => {
                        triggerSelection();
                        setModoReembolso('DEBT_CREDIT');
                      }}
                    >
                      <MaterialIcons
                        name="credit-card-off"
                        size={15}
                        color={modoReembolso === 'DEBT_CREDIT' ? COLORS.secundario : COLORS.enSuperficieVariante}
                      />
                      <Text style={[styles.modeBtnText, modoReembolso === 'DEBT_CREDIT' && styles.modeBtnTextActive]}>
                        Restar Deuda
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.modeBtn, modoReembolso === 'NONE' && styles.modeBtnActive]}
                    onPress={() => {
                      triggerSelection();
                      setModoReembolso('NONE');
                    }}
                  >
                    <MaterialIcons
                      name="do-not-disturb"
                      size={15}
                      color={modoReembolso === 'NONE' ? COLORS.primario : COLORS.enSuperficieVariante}
                    />
                    <Text style={[styles.modeBtnText, modoReembolso === 'NONE' && styles.modeBtnTextActive]}>
                      Solo Stock
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cuenta de egreso del dinero */}
              {modoReembolso === 'ACCOUNT' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Cuenta desde donde se devuelve el dinero</Text>
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
              )}

              {/* Cliente */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cliente (opcional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={cliente}
                    onChangeText={setCliente}
                    placeholder="Nombre del cliente..."
                    placeholderTextColor={COLORS.bordeContorno}
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Motivo */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Motivo de la Devolución</Text>
                <View style={styles.chipsContainer}>
                  {MOTIVOS_DEV_CLIENTE_SUGERIDOS.map(motivo => {
                    const isSel = motivoSeleccionado === motivo;
                    return (
                      <TouchableOpacity
                        key={motivo}
                        style={[styles.chipItem, isSel && styles.chipItemActive]}
                        onPress={() => {
                          triggerSelection();
                          setMotivoSeleccionado(motivo);
                        }}
                      >
                        <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                          {motivo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {motivoSeleccionado === 'Otro' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Especifica el Motivo</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={motivoPersonalizado}
                      onChangeText={setMotivoPersonalizado}
                      placeholder="Describe el motivo del cliente..."
                      placeholderTextColor={COLORS.bordeContorno}
                      style={styles.textInput}
                    />
                  </View>
                </View>
              )}

              {/* Notas */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notas u Observaciones (opcional)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="Detalles sobre cambio de mercadería o estado..."
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
                title={procesando ? 'Guardando...' : '✓ Confirmar Devolución'}
                onPress={handleGuardarDevolucion}
                disabled={procesando}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
