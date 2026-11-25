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
  SelectorSegmentado,
  ChipFiltro,
  OpcionSegmento,
} from '@/compartido/componentes';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
} from '@/compartido/utilidades/hapticos';
import { Producto } from '@/datos/tipos';
import { registrarAjusteInventario } from '@/datos/consultas/inventario';
import { estilosOperaciones as styles } from './estilosOperaciones';

const MOTIVOS_AJUSTE_SUGERIDOS = [
  'Rotura',
  'Pérdida',
  'Diferencia de conteo',
  'Vencimiento',
  'Uso interno',
  'Avería en transporte',
  'Otro',
];

const OPCIONES_MODO_AJUSTE: OpcionSegmento<'DELTA' | 'COUNT'>[] = [
  { valor: 'DELTA', etiqueta: 'Variación (+ / -)', icono: 'exposure', tonoActivo: 'cian' },
  { valor: 'COUNT', etiqueta: 'Recuento Físico', icono: 'pin', tonoActivo: 'violeta' },
];

export interface PropiedadesSubModalAjuste {
  visible: boolean;
  onClose: () => void;
  producto: Producto;
  onSuccess?: () => void;
}

export const SubModalAjuste: React.FC<PropiedadesSubModalAjuste> = ({
  visible,
  onClose,
  producto,
  onSuccess,
}) => {
  const [ajusteModo, setAjusteModo] = useState<'DELTA' | 'COUNT'>('DELTA');
  const [deltaTexto, setDeltaTexto] = useState('-1');
  const [conteoTexto, setConteoTexto] = useState(() => String(producto.currentStock ?? 0));
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(MOTIVOS_AJUSTE_SUGERIDOS[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);

  const currentStock = producto.currentStock ?? 0;

  const handleGuardarAjuste = () => {
    let motivoFinal = motivoSeleccionado;
    if (motivoSeleccionado === 'Otro' && motivoPersonalizado.trim()) {
      motivoFinal = motivoPersonalizado.trim();
    }

    setProcesando(true);
    try {
      if (ajusteModo === 'DELTA') {
        const delta = parseFloat(deltaTexto.replace(',', '.'));
        if (isNaN(delta) || delta === 0) {
          triggerError();
          Alert.alert('Diferencia inválida', 'Ingresa una variación distinta de cero (ej: -2 para pérdida o +3 para sobrante).');
          setProcesando(false);
          return;
        }

        registrarAjusteInventario({
          productId: producto.id,
          adjustmentMode: 'DELTA',
          quantity: delta,
          reason: motivoFinal,
          notes: notas.trim() || undefined,
        });

        triggerSuccess();
        Alert.alert(
          'Ajuste registrado',
          `Se aplicó una diferencia de ${delta > 0 ? `+${delta}` : delta} ${producto.saleUnit}s.\nNuevo stock: ${currentStock + delta} ${producto.saleUnit}s.\nMotivo: ${motivoFinal}`
        );
      } else {
        const recuento = parseFloat(conteoTexto.replace(',', '.'));
        if (isNaN(recuento) || recuento < 0) {
          triggerError();
          Alert.alert('Conteo inválido', 'El recuento físico no puede ser negativo.');
          setProcesando(false);
          return;
        }

        registrarAjusteInventario({
          productId: producto.id,
          adjustmentMode: 'COUNT',
          newStockTarget: recuento,
          reason: motivoFinal,
          notes: notas.trim() || undefined,
        });

        triggerSuccess();
        Alert.alert(
          'Recuento fijado',
          `El stock se fijó en ${recuento} ${producto.saleUnit}s (anterior: ${currentStock}).\nMotivo: ${motivoFinal}`
        );
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error al ajustar stock', err?.message || 'No se pudo registrar el ajuste.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ModalObsidiana
      visible={visible}
      onCerrar={onClose}
      titulo="Ajustar Stock"
      subtitulo={producto.name}
      icono="tune"
      tono="violeta"
      usaModalNativo={false}
      maxHeight="92%"
      footer={
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={procesando}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <View style={styles.submitBtnWrapper}>
            <BotonBrillante
              title={procesando ? 'Guardando...' : '✓ Confirmar Ajuste'}
              onPress={handleGuardarAjuste}
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

              {/* Modo de Ajuste */}
              <SelectorSegmentado
                opciones={OPCIONES_MODO_AJUSTE}
                valorSeleccionado={ajusteModo}
                onSeleccionar={setAjusteModo}
                compacto
              />

              {/* Cantidad según modo */}
              {ajusteModo === 'DELTA' ? (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Variación de Unidades (ej: -2 rotura, +5 encontrado)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={deltaTexto}
                      onChangeText={val => setDeltaTexto(val.replace(/[^0-9.,+-]/g, ''))}
                      placeholder="-1"
                      placeholderTextColor={COLORS.bordeContorno}
                      keyboardType="decimal-pad"
                      style={styles.textInput}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Resultado final proyectado: {currentStock + (parseFloat(deltaTexto.replace(',', '.')) || 0)} {producto.saleUnit}s
                  </Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Stock Físico Concluido</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={conteoTexto}
                      onChangeText={val => setConteoTexto(val.replace(/[^0-9.,]/g, ''))}
                      placeholder="0"
                      placeholderTextColor={COLORS.bordeContorno}
                      keyboardType="decimal-pad"
                      style={styles.textInput}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Diferencia con el sistema: {(parseFloat(conteoTexto.replace(',', '.')) || 0) - currentStock} {producto.saleUnit}s
                  </Text>
                </View>
              )}

              {/* Motivo del Ajuste */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Motivo del Ajuste</Text>
                <View style={styles.chipsContainer}>
                  {MOTIVOS_AJUSTE_SUGERIDOS.map(motivo => (
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
                      placeholder="Describe la causa del ajuste..."
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
                    placeholder="Detalles adicionales del conteo o rotura..."
                    placeholderTextColor={COLORS.bordeContorno}
                    multiline
                    style={[styles.textInput, styles.textAreaInput]}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
    </ModalObsidiana>
  );
};
