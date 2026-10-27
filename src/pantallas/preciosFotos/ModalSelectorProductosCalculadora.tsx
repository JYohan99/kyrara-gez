import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import {
  gatillarSeleccion as triggerSelection,
  gatillarExito as triggerSuccess,
} from '@/compartido/utilidades/hapticos';
import { ProductoFoto } from '@/datos/tipos';
import { verificarRegistroPrecioYCosto } from '@/datos/consultas/productosFotos';

export interface PropiedadesModalSelectorProductosCalculadora {
  visible: boolean;
  onClose: () => void;
  productos: ProductoFoto[];
  cantidadesSeleccionadas: Record<string, number>;
  onSeleccionarProducto: (producto: ProductoFoto, cantidad: number) => void;
}

export const ModalSelectorProductosCalculadora: React.FC<
  PropiedadesModalSelectorProductosCalculadora
> = ({
  visible,
  onClose,
  productos,
  cantidadesSeleccionadas,
  onSeleccionarProducto,
}) => {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState('');
  // Mapa local de cantidades a agregar antes de pulsar confirmar
  const [cantidadesLocales, setCantidadesLocales] = useState<Record<string, number>>({});

  // Filtrado de productos activos e inactivos
  const { productosActivosFiltrados, productosInactivosFiltrados } = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = productos.filter(p => {
      if (!q) return true;
      const nombre = (p.name || '').toLowerCase();
      const formato = (p.sizeFormat || '').toLowerCase();
      const categoria = (p.category || '').toLowerCase();
      return (
        nombre.includes(q) ||
        formato.includes(q) ||
        categoria.includes(q)
      );
    });

    const activos = filtrados.filter(p => p.isActive);
    const inactivos = filtrados.filter(p => !p.isActive);

    return {
      productosActivosFiltrados: activos,
      productosInactivosFiltrados: inactivos,
    };
  }, [productos, busqueda]);

  const obtenerCantidadLocal = (productoId: string): number => {
    if (cantidadesLocales[productoId] !== undefined) {
      return cantidadesLocales[productoId];
    }
    if (cantidadesSeleccionadas[productoId] !== undefined) {
      return cantidadesSeleccionadas[productoId];
    }
    return 1;
  };

  const modificarCantidadLocal = (productoId: string, delta: number) => {
    triggerSelection();
    setCantidadesLocales(prev => {
      const actual = obtenerCantidadLocal(productoId);
      const nueva = Math.max(1, actual + delta);
      return { ...prev, [productoId]: nueva };
    });
  };

  const establecerCantidadDirecta = (productoId: string, texto: string) => {
    const lim = texto.replace(/[^0-9]/g, '');
    const num = parseInt(lim, 10);
    setCantidadesLocales(prev => ({
      ...prev,
      [productoId]: isNaN(num) || num < 1 ? 1 : num,
    }));
  };

  const handleAgregar = (producto: ProductoFoto) => {
    const cant = obtenerCantidadLocal(producto.id);
    triggerSuccess();
    onSeleccionarProducto(producto, cant);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
            {/* Tirador visual */}
            <View style={styles.handleBar} />

            {/* Encabezado */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleCol}>
                <Text style={[styles.headerTitle, TYPOGRAPHY.titularPequeno]}>
                  Seleccionar Productos
                </Text>
                <Text style={[styles.headerSubtitle, TYPOGRAPHY.cuerpoPequeno]}>
                  Elige productos activos e indica la cantidad deseada
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  triggerSelection();
                  onClose();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialIcons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={20}
                color={COLORS.onSurfaceVariant}
                style={styles.searchIcon}
              />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar por nombre, formato o categoría..."
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                style={[styles.searchInput, TYPOGRAPHY.cuerpoMedio]}
                clearButtonMode="while-editing"
              />
              {busqueda.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    triggerSelection();
                    setBusqueda('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={COLORS.onSurfaceVariant}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de productos disponibles */}
            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={styles.scrollListContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {productosActivosFiltrados.length === 0 &&
              productosInactivosFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="search-off"
                    size={40}
                    color={COLORS.onSurfaceVariant}
                  />
                  <Text style={[styles.emptyText, TYPOGRAPHY.cuerpoMedio]}>
                    No se encontraron productos coincidentes.
                  </Text>
                </View>
              ) : (
                <>
                  {productosActivosFiltrados.map(producto => {
                    const cant = obtenerCantidadLocal(producto.id);
                    const yaAgregado =
                      cantidadesSeleccionadas[producto.id] !== undefined;
                    const { tienePrecio, tieneCosto } =
                      verificarRegistroPrecioYCosto(producto);
                    const moneda = producto.currency || 'UYU';

                    return (
                      <GlassCard
                        key={producto.id}
                        variant="surface"
                        style={[
                          styles.productCard,
                          yaAgregado && styles.productCardSelected,
                        ]}
                      >
                        {/* Cabecera del ítem */}
                        <View style={styles.cardHeader}>
                          <View style={styles.cardTitleBox}>
                            <Text
                              style={[styles.productName, TYPOGRAPHY.titularPequeno]}
                              numberOfLines={1}
                            >
                              {producto.name}
                            </Text>
                            <View style={styles.metaRow}>
                              {producto.sizeFormat && (
                                <View style={styles.formatChip}>
                                  <Text style={styles.formatChipText}>
                                    {producto.sizeFormat}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.unitChip}>
                                <Text style={styles.unitChipText}>
                                  {producto.saleUnit}
                                </Text>
                              </View>
                              <View style={styles.categoryChip}>
                                <Text style={styles.categoryChipText}>
                                  {producto.category}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {yaAgregado && (
                            <View style={styles.badgeAdded}>
                              <MaterialIcons
                                name="check-circle"
                                size={14}
                                color={COLORS.secondary}
                              />
                              <Text style={styles.badgeAddedText}>
                                En cálculo (x{cantidadesSeleccionadas[producto.id]})
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Precios y Costos Vigentes */}
                        <View style={styles.pricesRow}>
                          <View style={styles.priceColumn}>
                            <Text style={styles.priceLabel}>Precio de venta:</Text>
                            {tienePrecio ? (
                              <Text
                                style={[styles.priceValue, TYPOGRAPHY.cuerpoMedio]}
                              >
                                {formatCurrency(producto.basePrice!, {
                                  moneda,
                                })}
                              </Text>
                            ) : (
                              <View style={styles.warningTag}>
                                <Text style={styles.warningTagText}>
                                  ⚠️ Sin precio
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.costColumn}>
                            <Text style={styles.priceLabel}>Costo unitario:</Text>
                            {tieneCosto ? (
                              <Text
                                style={[styles.costValue, TYPOGRAPHY.cuerpoMedio]}
                              >
                                {formatCurrency(producto.costPrice!, {
                                  moneda,
                                })}
                              </Text>
                            ) : (
                              <View style={styles.warningTag}>
                                <Text style={styles.warningTagText}>
                                  ⚠️ Sin costo
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Advertencia si faltan datos */}
                        {(!tienePrecio || !tieneCosto) && (
                          <View style={styles.noticeBox}>
                            <MaterialIcons
                              name="info-outline"
                              size={14}
                              color="#E5C07B"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.noticeText}>
                              {!tienePrecio && !tieneCosto
                                ? 'Producto sin precio ni costo registrado en catálogo.'
                                : !tienePrecio
                                ? 'Producto sin precio registrado en catálogo.'
                                : 'Producto sin costo registrado en catálogo.'}
                            </Text>
                          </View>
                        )}

                        {/* Controles de cantidad y botón agregar */}
                        <View style={styles.actionRow}>
                          <View style={styles.stepperContainer}>
                            <TouchableOpacity
                              style={[
                                styles.stepperBtn,
                                cant <= 1 && styles.stepperBtnDisabled,
                              ]}
                              onPress={() => modificarCantidadLocal(producto.id, -1)}
                              disabled={cant <= 1}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialIcons
                                name="remove"
                                size={18}
                                color={cant <= 1 ? COLORS.onSurfaceVariant : COLORS.onSurface}
                              />
                            </TouchableOpacity>

                            <TextInput
                              value={String(cant)}
                              onChangeText={val =>
                                establecerCantidadDirecta(producto.id, val)
                              }
                              keyboardType="number-pad"
                              style={[styles.stepperInput, TYPOGRAPHY.cuerpoMedio]}
                              selectTextOnFocus
                            />

                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => modificarCantidadLocal(producto.id, 1)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialIcons
                                name="add"
                                size={18}
                                color={COLORS.onSurface}
                              />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.addBtn,
                              yaAgregado && styles.addBtnUpdate,
                            ]}
                            onPress={() => handleAgregar(producto)}
                            activeOpacity={0.8}
                          >
                            <MaterialIcons
                              name={yaAgregado ? 'check' : 'add-shopping-cart'}
                              size={18}
                              color={yaAgregado ? '#FFFFFF' : '#06120D'}
                            />
                            <Text
                              style={[
                                styles.addBtnText,
                                yaAgregado && styles.addBtnUpdateText,
                              ]}
                            >
                              {yaAgregado ? 'Actualizar' : 'Añadir'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </GlassCard>
                    );
                  })}

                  {/* Sección de productos inactivos (deshabilitados para cálculo) */}
                  {productosInactivosFiltrados.length > 0 && (
                    <View style={styles.inactiveSection}>
                      <View style={styles.inactiveSectionHeader}>
                        <MaterialIcons
                          name="visibility-off"
                          size={16}
                          color={COLORS.onSurfaceVariant}
                        />
                        <Text style={styles.inactiveSectionTitle}>
                          Productos inactivos ({productosInactivosFiltrados.length})
                        </Text>
                      </View>
                      <Text style={styles.inactiveSectionSubtitle}>
                        Los productos inactivos no están disponibles para añadir a cálculos.
                      </Text>

                      {productosInactivosFiltrados.map(prod => (
                        <View
                          key={prod.id}
                          style={styles.inactiveProductCard}
                        >
                          <View style={styles.inactiveProductInfo}>
                            <Text style={styles.inactiveProductName}>
                              {prod.name}
                            </Text>
                            <Text style={styles.inactiveProductFormat}>
                              {prod.sizeFormat || prod.category} • {prod.saleUnit}
                            </Text>
                          </View>
                          <View style={styles.inactiveBadge}>
                            <Text style={styles.inactiveBadgeText}>
                              Inactivo
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Botón inferior Listo / Cerrar */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  triggerSelection();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.doneBtnText, TYPOGRAPHY.etiquetaMayusculas]}>
                  Listo
                </Text>
              </TouchableOpacity>
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
  modalSheet: {
    backgroundColor: '#101415',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '90%',
    flexShrink: 1,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.onSurface,
    paddingVertical: 0,
  },
  scrollList: {
    maxHeight: 460,
  },
  scrollListContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  },
  productCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  productCardSelected: {
    borderColor: 'rgba(87, 245, 171, 0.4)',
    backgroundColor: 'rgba(87, 245, 171, 0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleBox: {
    flex: 1,
  },
  productName: {
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formatChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  formatChipText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '600',
  },
  unitChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  unitChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  categoryChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  badgeAdded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.3)',
    marginLeft: 8,
  },
  badgeAddedText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  priceColumn: {
    flex: 1,
  },
  costColumn: {
    flex: 1,
    paddingLeft: 10,
  },
  priceLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 2,
  },
  priceValue: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  costValue: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  warningTag: {
    backgroundColor: 'rgba(229, 192, 123, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  warningTagText: {
    color: '#E5C07B',
    fontSize: 11,
    fontWeight: '600',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 192, 123, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  noticeText: {
    color: '#E5C07B',
    fontSize: 11,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperInput: {
    color: COLORS.onSurface,
    textAlign: 'center',
    width: 44,
    height: 36,
    paddingVertical: 0,
    fontWeight: '700',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    height: 38,
    gap: 6,
  },
  addBtnText: {
    color: '#06120D',
    fontSize: 13,
    fontWeight: '700',
  },
  addBtnUpdate: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addBtnUpdateText: {
    color: '#FFFFFF',
  },
  inactiveSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  inactiveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inactiveSectionTitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inactiveSectionSubtitle: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  inactiveProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    opacity: 0.6,
  },
  inactiveProductInfo: {
    flex: 1,
  },
  inactiveProductName: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  inactiveProductFormat: {
    color: COLORS.onSurfaceVariant + '80',
    fontSize: 11,
    marginTop: 2,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  footerRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGlass,
  },
  doneBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
});

export const ModalSelectorProductos = ModalSelectorProductosCalculadora;
export type PropiedadesModalSelectorProductos = PropiedadesModalSelectorProductosCalculadora;

