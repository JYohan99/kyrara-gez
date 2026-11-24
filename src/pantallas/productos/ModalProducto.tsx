import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  formatearEntradaDinero,
  convertirMontoACentavos,
  formatearMoneda as formatCurrency,
} from '@/compartido/utilidades/moneda';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { Producto, FormatoProducto, TipoProducto, MaterialArtesania } from '@/datos/tipos';
import {
  crearProducto,
  actualizarProducto,
  UNIDADES_VENTA_SUGERIDAS,
  esServicio,
  calcularInversionMateriales,
} from '@/datos/consultas/productos';
import { useProductosBoveda } from '@/datos/hooks';
import { SelectorChips } from './SelectorChips';
import { BadgeRentabilidad } from './BadgeRentabilidad';
import { IconoProducto } from '@/compartido/iconosProductos';
import { ModalSelectorIconoProducto } from './ModalSelectorIconoProducto';
import { EditorFormatosProducto } from './EditorFormatosProducto';
import { EditorMaterialesArtesania } from './EditorMaterialesArtesania';

export interface PropiedadesModalProducto {
  visible: boolean;
  onClose: () => void;
  productoParaEditar?: Producto | null;
}


interface PropiedadesContenidoModalProducto {
  productoParaEditar?: Producto | null;
  onClose: () => void;
}

const ContenidoModalProducto: React.FC<PropiedadesContenidoModalProducto> = ({
  productoParaEditar,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const { products: todosLosProductos } = useProductosBoveda();

  const [nombre, setNombre] = useState(() => productoParaEditar?.name || '');
  const nombreInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      nombreInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);
  const [tipoProducto, setTipoProducto] = useState<TipoProducto>(() => {
    if (productoParaEditar?.productType) return productoParaEditar.productType;
    if (esServicio(productoParaEditar?.saleUnit)) return 'SERVICIO';
    return 'PRODUCTO';
  });
  const [icono, setIcono] = useState(() => productoParaEditar?.icon || 'inventory-2');
  const [selectorIconoVisible, setSelectorIconoVisible] = useState(false);

  const [unidadVenta, setUnidadVenta] = useState(() => productoParaEditar?.saleUnit || 'Unidad');
  const [otraUnidad, setOtraUnidad] = useState(() => {
    if (
      productoParaEditar &&
      !esServicio(productoParaEditar.saleUnit) &&
      !UNIDADES_VENTA_SUGERIDAS.includes(productoParaEditar.saleUnit)
    ) {
      return productoParaEditar.saleUnit;
    }
    return '';
  });
  const [mostrarOtraUnidad, setMostrarOtraUnidad] = useState(() => {
    return Boolean(
      productoParaEditar &&
      !esServicio(productoParaEditar.saleUnit) &&
      !UNIDADES_VENTA_SUGERIDAS.includes(productoParaEditar.saleUnit)
    );
  });

  const [formatos, setFormatos] = useState<FormatoProducto[]>(() => productoParaEditar?.formats || []);
  const [materiales, setMateriales] = useState<MaterialArtesania[]>(() => productoParaEditar?.materials || []);

  const unidadFinalCalculada = mostrarOtraUnidad && otraUnidad.trim() ? otraUnidad.trim() : unidadVenta.trim();
  const esServ = tipoProducto === 'SERVICIO' || esServicio(unidadFinalCalculada);

  const [descripcion, setDescripcion] = useState(() => productoParaEditar?.description || '');
  const [stockInicialTexto, setStockInicialTexto] = useState('0');
  const [stockMinimoTexto, setStockMinimoTexto] = useState(() => String(productoParaEditar?.minStock ?? 0));

  // Precios referenciales opcionales
  const [precioTexto, setPrecioTexto] = useState(() => {
    if (!productoParaEditar?.basePrice) return '';
    const centavosStr = (productoParaEditar.basePrice / 100).toFixed(2).replace('.', ',');
    return formatearEntradaDinero(centavosStr);
  });

  const [costoTexto, setCostoTexto] = useState(() => {
    if (!productoParaEditar?.costPrice) return '';
    const centavosStr = (productoParaEditar.costPrice / 100).toFixed(2).replace('.', ',');
    return formatearEntradaDinero(centavosStr);
  });

  const livePrecioCentavos = useMemo(() => convertirMontoACentavos(precioTexto), [precioTexto]);
  const liveCostoCentavos = useMemo(() => convertirMontoACentavos(costoTexto), [costoTexto]);
  const liveProfit = livePrecioCentavos - liveCostoCentavos;
  const liveMargin = livePrecioCentavos > 0 ? (liveProfit / livePrecioCentavos) * 100 : null;

  const [guardando, setGuardando] = useState(false);

  const handleGuardar = () => {
    const nombreFinal = nombre.trim();
    if (!nombreFinal) {
      triggerError();
      Alert.alert('Nombre requerido', 'Por favor, ingresa el nombre del producto.');
      return;
    }

    const formatoFinal = productoParaEditar?.sizeFormat || undefined;
    const unidadFinal = unidadFinalCalculada;

    if (!unidadFinal) {
      triggerError();
      Alert.alert('Unidad de venta requerida', 'Por favor, indica la unidad de venta (ej: Unidad, Paquete, Servicio).');
      return;
    }

    const precioCentavos = precioTexto
      ? convertirMontoACentavos(precioTexto)
      : (esServ && formatos.length > 0 ? formatos[0].salePrice : 0);
    const costoCentavos = costoTexto
      ? convertirMontoACentavos(costoTexto)
      : (esServ && formatos.length > 0 ? formatos[0].costPrice : 0);
    const skuFinal = productoParaEditar?.sku || undefined;
    const proveedorFinal = productoParaEditar?.supplier || undefined;
    const minStockNum = esServ ? 0 : Math.max(0, parseFloat(stockMinimoTexto.replace(',', '.')) || 0);

    setGuardando(true);
    try {
      if (productoParaEditar) {
        actualizarProducto(productoParaEditar.id, {
          name: nombreFinal,
          productType: tipoProducto,
          icon: icono,
          sku: skuFinal,
          sizeFormat: formatoFinal,
          saleUnit: unidadFinal,
          formats: esServ ? formatos : undefined,
          materials: tipoProducto === 'ARTESANIA' ? materiales : undefined,
          description: descripcion.trim() || undefined,
          isActive: true,
          basePrice: precioCentavos,
          costPrice: costoCentavos,
          minStock: minStockNum,
          supplier: proveedorFinal,
        });
      } else {
        const initialStockNum = esServ ? 0 : Math.max(0, parseFloat(stockInicialTexto.replace(',', '.')) || 0);
        crearProducto({
          name: nombreFinal,
          productType: tipoProducto,
          icon: icono,
          sku: skuFinal,
          sizeFormat: formatoFinal,
          saleUnit: unidadFinal,
          formats: esServ ? formatos : undefined,
          materials: tipoProducto === 'ARTESANIA' ? materiales : undefined,
          description: descripcion.trim() || undefined,
          isActive: true,
          basePrice: precioCentavos,
          costPrice: costoCentavos,
          initialStock: initialStockNum,
          minStock: minStockNum,
          supplier: proveedorFinal,
        });
      }

      triggerSuccess();
      onClose();
    } catch (err: any) {
      triggerError();
      Alert.alert('No se pudo guardar', err?.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerIconBadge}>
              <MaterialIcons name="inventory-2" size={20} color={COLORS.secondary} />
            </View>
            <Text style={[styles.headerTitle, TYPOGRAPHY.titularPequeno]}>
              {productoParaEditar ? 'Editar producto' : 'Nuevo producto'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerSelection();
              onClose();
            }}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Campo: Icono y Nombre del producto (Obligatorio) */}
          <View style={styles.formGroup}>
            <View style={styles.nameAndIconRow}>
              {/* Botón selector de icono */}
              <TouchableOpacity
                style={styles.iconSelectorButton}
                onPress={() => {
                  triggerSelection();
                  setSelectorIconoVisible(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Seleccionar icono del producto"
              >
                <IconoProducto icono={icono} nombre={nombre} size={26} color="#00D2FF" />
                <View style={styles.editIconBadge}>
                  <MaterialIcons name="edit" size={10} color="#0B0F10" />
                </View>
              </TouchableOpacity>

              {/* Input Nombre */}
              <View style={[styles.inputContainer, styles.nameInputContainer]}>
                <TextInput
                  ref={nombreInputRef}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre del producto"
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  style={[styles.textInput, TYPOGRAPHY.cuerpoGrande]}
                />
              </View>
            </View>
          </View>

          {/* Fila con 3 opciones: Producto | Servicio | Artesanía */}
          <View style={styles.tipoProductoContainer}>
            <Text style={[styles.tipoProductoLabel, TYPOGRAPHY.etiquetaMayusculas]}>
              Tipo de Registro
            </Text>
            <View style={styles.tipoProductoRow}>
              <TouchableOpacity
                style={[
                  styles.tipoProductoBtn,
                  tipoProducto === 'PRODUCTO' && styles.tipoProductoBtnActive,
                ]}
                onPress={() => {
                  triggerSelection();
                  setTipoProducto('PRODUCTO');
                  if (unidadVenta === 'Servicio') {
                    setUnidadVenta('Unidad');
                  }
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="inventory-2"
                  size={15}
                  color={tipoProducto === 'PRODUCTO' ? '#06120D' : COLORS.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tipoProductoBtnText,
                    tipoProducto === 'PRODUCTO' && styles.tipoProductoBtnTextActive,
                  ]}
                >
                  Producto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoProductoBtn,
                  tipoProducto === 'SERVICIO' && styles.tipoProductoBtnActive,
                ]}
                onPress={() => {
                  triggerSelection();
                  setTipoProducto('SERVICIO');
                  setUnidadVenta('Servicio');
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="design-services"
                  size={15}
                  color={tipoProducto === 'SERVICIO' ? '#06120D' : COLORS.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tipoProductoBtnText,
                    tipoProducto === 'SERVICIO' && styles.tipoProductoBtnTextActive,
                  ]}
                >
                  Servicio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoProductoBtn,
                  tipoProducto === 'ARTESANIA' && styles.tipoProductoBtnActive,
                ]}
                onPress={() => {
                  triggerSelection();
                  setTipoProducto('ARTESANIA');
                  if (unidadVenta === 'Servicio') {
                    setUnidadVenta('Unidad');
                  }
                  if (icono === 'inventory-2') {
                    setIcono('palette');
                  }
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="palette"
                  size={15}
                  color={tipoProducto === 'ARTESANIA' ? '#06120D' : COLORS.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tipoProductoBtnText,
                    tipoProducto === 'ARTESANIA' && styles.tipoProductoBtnTextActive,
                  ]}
                >
                  Artesanía
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ficha de Materiales (Exclusiva para Artesanía) */}
          {tipoProducto === 'ARTESANIA' && (
            <EditorMaterialesArtesania
              materiales={materiales}
              onChangeMateriales={nuevos => {
                setMateriales(nuevos);
                const inv = calcularInversionMateriales(nuevos);
                if (inv > 0) {
                  const centavosStr = (inv / 100).toFixed(2).replace('.', ',');
                  setCostoTexto(formatearEntradaDinero(centavosStr));
                }
              }}
              productosCatalogo={todosLosProductos}
              productoIdExcluir={productoParaEditar?.id}
            />
          )}

          {/* Selector: Unidad de venta (Oculto para Servicios) */}
          {!esServ && (
            <SelectorChips
              titulo="Unidad de Venta"
              opciones={UNIDADES_VENTA_SUGERIDAS}
              seleccionada={unidadVenta}
              onSeleccionar={setUnidadVenta}
              etiquetaPersonalizado="+ Otra"
              valorPersonalizado={otraUnidad}
              onChangeValorPersonalizado={setOtraUnidad}
              mostrarPersonalizado={mostrarOtraUnidad}
              onToggleMostrarPersonalizado={setMostrarOtraUnidad}
              placeholderPersonalizado="ej. Rollo, Pliego, etc..."
            />
          )}

          {/* Inventario y Control de Stock (Oculto para Servicios) */}
          {!esServ ? (
            <View style={styles.stockSectionBox}>
              <View style={styles.pricingHeader}>
                <MaterialIcons name="inventory" size={16} color="#00D2FF" />
                <Text style={[styles.pricingSectionTitle, { color: '#00D2FF' }, TYPOGRAPHY.etiquetaMayusculas]}>
                  Inventario y Control de Stock
                </Text>
              </View>

              <View style={styles.pricingInputsRow}>
                {!productoParaEditar ? (
                  <View style={styles.pricingInputCol}>
                    <Text style={styles.subLabel}>Stock inicial ({unidadFinalCalculada}s)</Text>
                    <View style={styles.inputContainerCompact}>
                      <TextInput
                        value={stockInicialTexto}
                        onChangeText={val => setStockInicialTexto(val.replace(/[^0-9.,]/g, ''))}
                        placeholder="0"
                        placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                        keyboardType="decimal-pad"
                        style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.pricingInputCol}>
                    <Text style={styles.subLabel}>Stock actual registrado</Text>
                    <View style={[styles.inputContainerCompact, styles.stockDisplayBox]}>
                      <Text style={[styles.stockDisplayText, TYPOGRAPHY.titularPequeno]}>
                        {productoParaEditar.currentStock} {productoParaEditar.saleUnit}s
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.pricingInputCol}>
                  <Text style={styles.subLabel}>Stock mínimo (Alerta)</Text>
                  <View style={styles.inputContainerCompact}>
                    <TextInput
                      value={stockMinimoTexto}
                      onChangeText={val => setStockMinimoTexto(val.replace(/[^0-9.,]/g, ''))}
                      placeholder="0"
                      placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                      keyboardType="decimal-pad"
                      style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.serviceNoticeBox}>
              <View style={styles.serviceNoticeIcon}>
                <MaterialIcons name="design-services" size={22} color="#00D2FF" />
              </View>
              <View style={styles.serviceNoticeContent}>
                <Text style={[styles.serviceNoticeTitle, TYPOGRAPHY.titularPequeno]}>
                  Servicio / Mano de obra
                </Text>
                <Text style={styles.serviceNoticeDesc}>
                  Los servicios no requieren control de existencias en almacén ni alertas de agotado.
                </Text>
              </View>
            </View>
          )}

          {/* Formatos y Tarifas Específicas (Solo para servicios) */}
          {esServ && (
            <EditorFormatosProducto
              formatos={formatos}
              onChangeFormatos={(nuevos) => {
                setFormatos(nuevos);
                if (nuevos.length > 0) {
                  if (nuevos[0].salePrice > 0) {
                    const centavosStr = (nuevos[0].salePrice / 100).toFixed(2).replace('.', ',');
                    setPrecioTexto(formatearEntradaDinero(centavosStr));
                  }
                  if (nuevos[0].costPrice >= 0) {
                    const centavosStr = (nuevos[0].costPrice / 100).toFixed(2).replace('.', ',');
                    setCostoTexto(formatearEntradaDinero(centavosStr));
                  }
                }
              }}
            />
          )}

          {/* Precios opcionales (Solo para productos físicos y artesanías; en servicios se definen en Formatos y Tarifas) */}
          {!esServ && (
            <View style={styles.pricingOptionalBox}>
              <View style={styles.pricingHeader}>
                <MaterialIcons name="sell" size={16} color={COLORS.secondary} />
                <Text style={[styles.pricingSectionTitle, TYPOGRAPHY.etiquetaMayusculas]}>
                  Precios referenciales
                </Text>
              </View>

              <View style={styles.pricingInputsRow}>
                <View style={styles.pricingInputCol}>
                  <Text style={styles.subLabel}>Precio venta</Text>
                  <View style={styles.inputContainerCompact}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      value={precioTexto}
                      onChangeText={val => setPrecioTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                      keyboardType="decimal-pad"
                      style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                    />
                  </View>
                </View>

                <View style={styles.pricingInputCol}>
                  <Text style={styles.subLabel}>Costo base</Text>
                  <View style={styles.inputContainerCompact}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      value={costoTexto}
                      onChangeText={val => setCostoTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                      keyboardType="decimal-pad"
                      style={[styles.textInput, TYPOGRAPHY.cuerpoMedio]}
                    />
                  </View>
                </View>
              </View>

              {(livePrecioCentavos > 0 || liveCostoCentavos > 0) && (
                <View style={styles.liveCalcPill}>
                  <MaterialIcons name="trending-up" size={14} color={COLORS.secondary} />
                  <Text style={styles.liveCalcText}>
                    Ganancia estimada: {formatCurrency(liveProfit)}
                  </Text>
                  {liveMargin !== null && (
                    <BadgeRentabilidad margen={liveMargin} />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Campo: Descripción o notas */}
          <View style={styles.formGroup}>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción o notas"
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                style={[styles.textInput, styles.textAreaInput, TYPOGRAPHY.cuerpoMedio]}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer de Acciones */}
        <View style={styles.footerRow}>
          <BotonBrillante
            title={guardando ? 'Guardando...' : productoParaEditar ? 'Guardar cambios' : 'Crear producto'}
            onPress={handleGuardar}
            disabled={guardando}
          />
        </View>

        <ModalSelectorIconoProducto
          visible={selectorIconoVisible}
          iconoActual={icono}
          nombreProducto={nombre}
          onSelectIcon={setIcono}
          onClose={() => setSelectorIconoVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export const ModalProducto: React.FC<PropiedadesModalProducto> = ({
  visible,
  onClose,
  productoParaEditar,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {visible ? (
        <ContenidoModalProducto
          productoParaEditar={productoParaEditar}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '90%',
    flexShrink: 1,
  },
  scrollArea: {
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.onSurface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  requiredBadge: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: COLORS.onSurface,
    paddingVertical: 12,
  },
  pricingOptionalBox: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.15)',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingSectionTitle: {
    color: COLORS.secondary,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  pricingHint: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  pricingInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pricingInputCol: {
    flex: 1,
    gap: 4,
  },
  subLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  stockSectionBox: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  stockDisplayBox: {
    paddingVertical: 8,
  },
  stockDisplayText: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  currencyPrefix: {
    color: COLORS.onSurfaceVariant,
    marginRight: 6,
    fontWeight: '700',
  },
  liveCalcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(87, 245, 171, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexWrap: 'wrap',
  },
  liveCalcText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  textAreaInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  footerRow: {
    marginTop: 10,
  },
  nameAndIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconSelectorButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00D2FF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInputContainer: {
    flex: 1,
  },
  serviceNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  serviceNoticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceNoticeContent: {
    flex: 1,
    gap: 2,
  },
  serviceNoticeTitle: {
    color: '#00D2FF',
    fontSize: 13,
    fontWeight: '700',
  },
  serviceNoticeDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  tipoProductoContainer: {
    marginTop: 2,
    marginBottom: 6,
    gap: 6,
  },
  tipoProductoLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.onSurfaceVariant,
  },
  tipoProductoRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0D1512',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tipoProductoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tipoProductoBtnActive: {
    backgroundColor: '#00D2FF',
  },
  tipoProductoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  tipoProductoBtnTextActive: {
    color: '#06120D',
    fontWeight: '900',
  },
});
