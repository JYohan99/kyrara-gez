import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { BotonBrillante, EncabezadoModal, TarjetaVidrio } from '@/compartido/componentes';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { Producto } from '@/datos/tipos';
import { fabricarArtesania } from '@/datos/consultas/productos';
import { useProductosBoveda } from '@/datos/hooks';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';

export interface PropiedadesSubModalFabricacion {
  visible: boolean;
  onClose: () => void;
  artesania: Producto;
  onSuccess?: () => void;
}

export const SubModalFabricacion: React.FC<PropiedadesSubModalFabricacion> = ({
  visible,
  onClose,
  artesania,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [cantidadTexto, setCantidadTexto] = useState('1');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);
  const cantidadInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        cantidadInputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const { products: todosProductos } = useProductosBoveda();

  const cantidadAFabricar = useMemo(() => {
    const n = parseFloat(cantidadTexto.replace(',', '.')) || 0;
    return Math.max(0, n);
  }, [cantidadTexto]);

  const materiales = useMemo(() => artesania.materials || [], [artesania.materials]);

  // Calcular disponibilidad de insumos en tiempo real
  const analisisInsumos = useMemo(() => {
    return materiales.map(m => {
      const totalConsumo = (m.quantity || 1) * cantidadAFabricar;
      let stockActualInsumo: number | null = null;
      let insumoProducto: Producto | undefined = undefined;

      if (m.productId) {
        insumoProducto = todosProductos.find(p => p.id === m.productId);
        stockActualInsumo = insumoProducto ? insumoProducto.currentStock : 0;
      }

      const tieneSuficiente =
        stockActualInsumo === null || stockActualInsumo >= totalConsumo;

      return {
        material: m,
        totalConsumo,
        stockActual: stockActualInsumo,
        stockRestante: stockActualInsumo !== null ? stockActualInsumo - totalConsumo : null,
        tieneSuficiente,
      };
    });
  }, [materiales, cantidadAFabricar, todosProductos]);

  const algunInsumoInsuficiente = useMemo(() => {
    return analisisInsumos.some(a => !a.tieneSuficiente);
  }, [analisisInsumos]);

  const costoUnitarioEstimado = artesania.costPrice || 0;
  const inversionTotalProduccion = costoUnitarioEstimado * cantidadAFabricar;

  const handleConfirmarFabricacion = () => {
    if (cantidadAFabricar <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Por favor ingresa una cantidad válida de unidades a fabricar.');
      return;
    }

    if (algunInsumoInsuficiente) {
      triggerSelection();
      Alert.alert(
        'Stock insuficiente de insumos',
        'Uno o más materiales vinculados no cuentan con stock suficiente en el catálogo. ¿Deseas continuar y registrar el stock en negativo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar de todos modos',
            style: 'destructive',
            onPress: ejecutarFabricacion,
          },
        ]
      );
      return;
    }

    ejecutarFabricacion();
  };

  const ejecutarFabricacion = () => {
    setProcesando(true);
    try {
      fabricarArtesania({
        artesaniaId: artesania.id,
        cantidad: cantidadAFabricar,
        notas: notas.trim() || undefined,
      });

      triggerSuccess();
      Alert.alert(
        '¡Producción registrada!',
        `Se fabricaron con éxito ${cantidadAFabricar} ${artesania.saleUnit || 'un.'} de "${artesania.name}" y se descontaron los insumos consumidos.`,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      triggerError();
      Alert.alert('Error', err?.message || 'No se pudo registrar la fabricación.');
    } finally {
      setProcesando(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <EncabezadoModal
            titulo="Fabricar Artesanía"
            subtitulo={`${artesania.name} (Stock: ${artesania.currentStock} ${artesania.saleUnit || 'un.'})`}
            icono="precision-manufacturing"
            tono="cian"
            onCerrar={onClose}
            style={styles.modalHeader}
          />

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Input Cantidad a Fabricar */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>¿Cuántas unidades deseas fabricar?</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  ref={cantidadInputRef}
                  value={cantidadTexto}
                  onChangeText={val => setCantidadTexto(val.replace(/[^0-9.,]/g, ''))}
                  placeholder="1"
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  keyboardType="decimal-pad"
                  style={styles.quantityInput}
                />
                <Text style={styles.unitText}>{artesania.saleUnit || 'un.'}s</Text>
              </View>
            </View>

            {/* Inversión estimada banner */}
            <TarjetaVidrio variant="high" style={styles.costBanner}>
              <View style={styles.costInfo}>
                <Text style={styles.costLabel}>INVERSIÓN TOTAL DE LA PRODUCCIÓN</Text>
                <Text style={styles.costValue}>
                  {formatCurrency(inversionTotalProduccion)}
                </Text>
              </View>
              <View style={styles.costDetail}>
                <Text style={styles.costDetailText}>
                  Costo: {formatCurrency(costoUnitarioEstimado)} / un.
                </Text>
              </View>
            </TarjetaVidrio>

            {/* Desglose de Insumos Consumidos */}
            <View style={styles.materialsSection}>
              <View style={styles.materialsHeader}>
                <MaterialIcons name="list-alt" size={16} color="#00D2FF" />
                <Text style={[styles.materialsTitle, TYPOGRAPHY.etiquetaMayusculas]}>
                  Insumos a descontar del inventario ({materiales.length})
                </Text>
              </View>

              {materiales.length === 0 ? (
                <View style={styles.noMaterialsWarning}>
                  <MaterialIcons name="info-outline" size={18} color="#FFB74D" />
                  <Text style={styles.noMaterialsText}>
                    Esta artesanía no tiene materiales vinculados. Solo se sumará el stock final.
                  </Text>
                </View>
              ) : (
                <View style={styles.materialsTable}>
                  {analisisInsumos.map((item, idx) => (
                    <View key={item.material.id || idx} style={styles.materialRow}>
                      <View style={styles.materialColInfo}>
                        <Text style={styles.materialItemName}>
                          {item.material.name}
                        </Text>
                        <Text style={styles.materialItemCalc}>
                          {item.material.quantity} {item.material.unit || 'un.'} × {cantidadAFabricar} ={' '}
                          <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>
                            {item.totalConsumo} {item.material.unit || 'un.'}
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.materialColStock}>
                        {item.stockActual !== null ? (
                          item.tieneSuficiente ? (
                            <View style={styles.stockBadgeOk}>
                              <MaterialIcons name="check-circle" size={12} color="#00E676" />
                              <Text style={styles.stockBadgeOkText}>
                                Quedan {item.stockRestante}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.stockBadgeError}>
                              <MaterialIcons name="warning" size={12} color="#FF5252" />
                              <Text style={styles.stockBadgeErrorText}>
                                Stock: {item.stockActual} (Faltan {Math.abs(item.stockRestante || 0)})
                              </Text>
                            </View>
                          )
                        ) : (
                          <View style={styles.stockBadgeManual}>
                            <Text style={styles.stockBadgeManualText}>Manual</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Notas opcionales */}
            <View style={styles.notesSection}>
              <Text style={styles.inputLabel}>Notas de la producción (Opcional)</Text>
              <TextInput
                value={notas}
                onChangeText={setNotas}
                placeholder="ej. Lote #12, pedido especial cliente..."
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                style={styles.notesInput}
              />
            </View>
          </ScrollView>

          {/* Footer botón */}
          <View style={styles.footer}>
            <BotonBrillante
              title={procesando ? 'Procesando...' : `Confirmar Fabricación (+${cantidadAFabricar} un.)`}
              onPress={handleConfirmarFabricacion}
              disabled={procesando}
              icon={<MaterialIcons name="precision-manufacturing" size={18} color="#06120D" />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 11, 0.84)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#101518',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.18)',
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
  bodyScroll: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  inputSection: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.16)',
    paddingHorizontal: 14,
  },
  quantityInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#00D2FF',
    paddingVertical: 10,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  costBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
    marginBottom: 16,
  },
  costInfo: {
    flex: 1,
  },
  costLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D2FF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  costDetail: {},
  costDetailText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  materialsSection: {
    marginBottom: 16,
  },
  materialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  materialsTitle: {
    fontSize: 11,
    color: '#00D2FF',
    letterSpacing: 0.5,
  },
  noMaterialsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 183, 77, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  noMaterialsText: {
    fontSize: 12,
    color: '#FFB74D',
    flex: 1,
  },
  materialsTable: {
    backgroundColor: 'rgba(9, 13, 15, 0.62)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.1)',
    padding: 10,
    gap: 8,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  materialColInfo: {
    flex: 1,
    marginRight: 10,
  },
  materialItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  materialItemCalc: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  materialColStock: {},
  stockBadgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeOkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00E676',
  },
  stockBadgeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeErrorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF5252',
  },
  stockBadgeManual: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeManualText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.12)',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(165, 231, 255, 0.1)',
  },
});
