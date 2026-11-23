import React, { useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="precision-manufacturing" size={20} color="#00D2FF" />
              </View>
              <View>
                <Text style={[styles.title, TYPOGRAPHY.titularPequeno]}>
                  Fabricar Artesanía
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {artesania.name} (Stock actual: {artesania.currentStock} {artesania.saleUnit || 'un.'})
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Input Cantidad a Fabricar */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>¿Cuántas unidades deseas fabricar?</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  value={cantidadTexto}
                  onChangeText={setCantidadTexto}
                  placeholder="1"
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  keyboardType="numeric"
                  style={styles.quantityInput}
                />
                <Text style={styles.unitText}>{artesania.saleUnit || 'un.'}s</Text>
              </View>
            </View>

            {/* Inversión estimada banner */}
            <View style={styles.costBanner}>
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
            </View>

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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1613',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  bodyScroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
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
    backgroundColor: '#16221E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
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
    backgroundColor: '#16221E',
    borderRadius: 10,
    padding: 8,
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
    backgroundColor: '#16221E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
});
