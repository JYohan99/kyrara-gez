import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORES as COLORS } from '@/compartido/tema';
import {
  ModalObsidiana,
  BotonBrillante,
  ChipFiltro,
} from '@/compartido/componentes';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
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

  return (
    <ModalObsidiana
      visible={visible}
      onCerrar={onClose}
      titulo="Devolución al Proveedor"
      subtitulo={producto.name}
      icono="undo"
      tono="gasto"
      usaModalNativo={false}
      maxHeight="92%"
      footer={
        <View style={styles.footerRow}>
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
      }
    >
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
                  {MOTIVOS_DEV_PROVEEDOR_SUGERIDOS.map(motivo => (
                    <ChipFiltro
                      key={motivo}
                      etiqueta={motivo}
                      activo={motivoSeleccionado === motivo}
                      tono="violeta"
                      onPress={() => setMotivoSeleccionado(motivo)}
                    />
                  ))}
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
    </ModalObsidiana>
  );
};
