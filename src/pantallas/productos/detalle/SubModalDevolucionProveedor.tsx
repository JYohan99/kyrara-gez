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
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { Producto } from '@/datos/tipos';
import { registrarDevolucionProveedor } from '@/datos/consultas/inventario';
import { estilosOperaciones as styles } from './estilosOperaciones';

const MOTIVOS_DEV_PROVEEDOR_SUGERIDOS = [
  'Producto defectuoso',
  'Error de pedido',
  'Vencimiento próximo',
  'Exceso de mercadería',
  'Calidad no conforme',
  'Otro',
];

export interface PropiedadesSubModalDevolucionProveedor {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  onSuccess?: () => void;
}

export const SubModalDevolucionProveedor: React.FC<PropiedadesSubModalDevolucionProveedor> = ({
  visible,
  onClose,
  producto,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [cantidad, setCantidad] = useState('1');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(MOTIVOS_DEV_PROVEEDOR_SUGERIDOS[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [proveedor, setProveedor] = useState(() => producto.supplier || '');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cantNum = Math.max(0, parseFloat(cantidad.replace(',', '.')) || 0);
  const currentStock = producto.currentStock ?? 0;

  const handleGuardarDevolucion = () => {
    if (cantNum <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Por favor, ingresa una cantidad a devolver mayor a cero.');
      return;
    }

    if (cantNum > currentStock) {
      triggerError();
      Alert.alert(
        'Stock insuficiente',
        `No puedes devolver ${cantNum} unidades porque el stock actual disponible es de ${currentStock} ${producto.saleUnit}s.`
      );
      return;
    }

    let motivoFinal = motivoSeleccionado;
    if (motivoSeleccionado === 'Otro' && motivoPersonalizado.trim()) {
      motivoFinal = motivoPersonalizado.trim();
    }

    setProcesando(true);
    try {
      registrarDevolucionProveedor({
        productId: producto.id,
        quantity: cantNum,
        reason: motivoFinal,
        supplier: proveedor.trim() || undefined,
        notes: notas.trim() || undefined,
      });

      triggerSuccess();
      Alert.alert(
        'Devolución registrada',
        `Se descontaron ${cantNum} ${producto.saleUnit}s del inventario por devolución al proveedor.\nNuevo stock: ${currentStock - cantNum} ${producto.saleUnit}s.`
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconWrap, { backgroundColor: 'rgba(255, 145, 0, 0.15)' }]}>
                <MaterialIcons name="undo" size={18} color="#FF9100" />
              </View>
              <Text style={styles.headerTitle}>Devolución al Proveedor</Text>
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

              {/* Cantidad */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cantidad a Devolver al Proveedor</Text>
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

              {/* Motivo de la Devolución */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Motivo de la Devolución</Text>
                <View style={styles.chipsContainer}>
                  {MOTIVOS_DEV_PROVEEDOR_SUGERIDOS.map(motivo => {
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
                      placeholder="Describe la causa de la devolución..."
                      placeholderTextColor={COLORS.bordeContorno}
                      style={styles.textInput}
                    />
                  </View>
                </View>
              )}

              {/* Proveedor */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Proveedor Destino</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={proveedor}
                    onChangeText={setProveedor}
                    placeholder="Nombre del proveedor..."
                    placeholderTextColor={COLORS.bordeContorno}
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Notas opcionales */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notas o Referencia (opcional)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    value={notas}
                    onChangeText={setNotas}
                    placeholder="Nº de remito, estado del producto, etc."
                    placeholderTextColor={COLORS.bordeContorno}
                    multiline
                    numberOfLines={2}
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
                title={procesando ? 'Guardando...' : 'Confirmar devolución'}
                onPress={handleGuardarDevolucion}
                disabled={procesando}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
