import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import {
  PRODUCTOS_EXCEL_INVERSIONES_SUGERIDOS,
  importarProductosDesdeExcel,
} from '@/datos/consultas/inventario';
import { ProductoImportadoExcel } from '@/datos/tipos';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesModalImportarProductosExcel {
  visible: boolean;
  onClose: () => void;
  onImportComplete?: (resultado: { importados: number; actualizados: number }) => void;
}

export const ModalImportarProductosExcel: React.FC<PropiedadesModalImportarProductosExcel> = ({
  visible,
  onClose,
  onImportComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [productos, setProductos] = useState<ProductoImportadoExcel[]>(() =>
    PRODUCTOS_EXCEL_INVERSIONES_SUGERIDOS.map(p => ({ ...p, isSelected: true }))
  );
  const [procesando, setProcesando] = useState(false);

  const seleccionadosCount = productos.filter(p => p.isSelected).length;

  const toggleProducto = (index: number) => {
    triggerSelection();
    setProductos(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleToggleTodos = () => {
    triggerSelection();
    const todosSeleccionados = productos.every(p => p.isSelected);
    setProductos(prev => prev.map(p => ({ ...p, isSelected: !todosSeleccionados })));
  };

  const handleConfirmarImportacion = () => {
    const paraImportar = productos.filter(p => p.isSelected);
    if (paraImportar.length === 0) {
      triggerError();
      Alert.alert('Selección requerida', 'Selecciona al menos un producto para importar.');
      return;
    }

    setProcesando(true);
    try {
      const resultado = importarProductosDesdeExcel(paraImportar);
      triggerSuccess();
      Alert.alert(
        'Importación completada',
        `Se procesaron correctamente los productos de la hoja INVERSIONES:\n• ${resultado.importados} nuevo(s) producto(s) agregado(s)\n• ${resultado.actualizados} producto(s) actualizado(s)`,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              onClose();
              if (onImportComplete) {
                onImportComplete(resultado);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      triggerError();
      Alert.alert('Error al importar', err?.message || 'No se pudieron importar los productos.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <MaterialIcons name="table-view" size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={[styles.headerTitle, TYPOGRAPHY.titularPequeno]}>
                  Importar Productos de Excel
                </Text>
                <Text style={styles.headerSubtitle}>
                  Compromisos de inversiones.xlsx • Hoja INVERSIONES
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Banner de Auditoría e Integridad de Datos */}
            <View style={styles.auditBanner}>
              <MaterialIcons name="verified" size={18} color="#00D2FF" style={styles.auditIcon} />
              <View style={styles.auditTextCol}>
                <Text style={styles.auditTitle}>Análisis de la hoja INVERSIONES</Text>
                <Text style={styles.auditBody}>
                  Las celdas de cantidades compradas y vendidas no contienen valores confirmados
                  (están en blanco o evalúan a 0), y las fórmulas presentes representan plantillas de proyección.
                </Text>
                <Text style={styles.auditBodyHighlight}>
                  Siguiendo las reglas de auditoría, NO se importan operaciones ficticias ni inventadas.
                  Se importan los 6 productos comerciales con sus precios y costos unitarios confirmados, iniciando con stock 0.
                </Text>
              </View>
            </View>

            {/* Fila de controles de selección */}
            <View style={styles.selectionControlsRow}>
              <Text style={styles.selectionCountText}>
                {seleccionadosCount} de {productos.length} productos seleccionados
              </Text>
              <TouchableOpacity onPress={handleToggleTodos} style={styles.toggleAllBtn} activeOpacity={0.7}>
                <Text style={styles.toggleAllBtnText}>
                  {productos.every(p => p.isSelected) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Listado de Productos Previsualizados */}
            <View style={styles.productsList}>
              {productos.map((prod, idx) => {
                const marginPercent =
                  prod.basePrice > 0 ? ((prod.basePrice - prod.costPrice) / prod.basePrice) * 100 : null;

                return (
                  <TouchableOpacity
                    key={`${prod.name}-${idx}`}
                    style={[styles.productCard, prod.isSelected && styles.productCardSelected]}
                    onPress={() => toggleProducto(idx)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.checkboxCol}>
                      <MaterialIcons
                        name={prod.isSelected ? 'check-box' : 'check-box-outline-blank'}
                        size={22}
                        color={prod.isSelected ? COLORS.secondary : COLORS.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.productCardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        {prod.sizeFormat ? (
                          <View style={styles.badgeFormat}>
                            <Text style={styles.badgeFormatText}>{prod.sizeFormat}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.cardPricingRow}>
                        <View style={styles.priceCol}>
                          <Text style={styles.priceLabel}>Precio Venta</Text>
                          <Text style={styles.priceValue}>{formatCurrency(prod.basePrice)}</Text>
                        </View>

                        <View style={styles.priceDivider} />

                        <View style={styles.priceCol}>
                          <Text style={styles.priceLabel}>Costo Unitario</Text>
                          <Text style={styles.priceValue}>
                            {prod.costPrice > 0 ? formatCurrency(prod.costPrice) : 'Sin costo (0)'}
                          </Text>
                        </View>

                        <View style={styles.priceDivider} />

                        <View style={styles.priceCol}>
                          <Text style={styles.priceLabel}>Margen Est.</Text>
                          {marginPercent !== null ? (
                            <BadgeRentabilidad margen={marginPercent} tamano="pequeno" />
                          ) : (
                            <Text style={styles.noMarginText}>-</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                          Stock inicial: 0 {prod.saleUnit}s • Mínimo sugerido: {prod.minStock}
                        </Text>
                        <Text style={styles.metaRowDetail}>Fila {prod.sourceRow} Excel</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer de Acciones */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={procesando}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <View style={styles.saveBtnWrapper}>
              <BotonBrillante
                title={procesando ? 'Importando...' : `Importar ${seleccionadosCount} Producto(s)`}
                onPress={handleConfirmarImportacion}
                disabled={procesando || seleccionadosCount === 0}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '90%',
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  auditBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  auditIcon: {
    marginTop: 2,
  },
  auditTextCol: {
    flex: 1,
    gap: 4,
  },
  auditTitle: {
    color: '#00D2FF',
    fontSize: 12,
    fontWeight: '700',
  },
  auditBody: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  auditBodyHighlight: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 2,
  },
  selectionControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  selectionCountText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '600',
  },
  toggleAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleAllBtnText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  productsList: {
    gap: 10,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  productCardSelected: {
    borderColor: 'rgba(87, 245, 171, 0.35)',
    backgroundColor: 'rgba(87, 245, 171, 0.04)',
  },
  checkboxCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardInfo: {
    flex: 1,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badgeFormat: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeFormatText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  cardPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  priceCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  priceDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  priceLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  priceValue: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '700',
  },
  noMarginText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  metaRowDetail: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 10,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
  },
  saveBtnWrapper: {
    flex: 1,
  },
});
