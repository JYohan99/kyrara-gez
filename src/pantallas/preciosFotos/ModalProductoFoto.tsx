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
  Switch,
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
import { ProductoFoto as Producto } from '@/datos/tipos';
import {
  crearProductoFoto,
  actualizarProductoFoto,
  CATEGORIAS_PRODUCTOS_SUGERIDAS,
  FORMATOS_PRODUCTOS_SUGERIDOS,
  UNIDADES_VENTA_SUGERIDAS,
} from '@/datos/consultas/productosFotos';
import { SelectorChips } from './SelectorChips';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesModalProducto {
  visible: boolean;
  onClose: () => void;
  productoParaEditar?: Producto | null;
  categoriaInicial?: string;
}

export type PropiedadesModalProductoFoto = PropiedadesModalProducto;

interface PropiedadesContenidoModalProducto {
  productoParaEditar?: Producto | null;
  categoriaInicial?: string;
  onClose: () => void;
}

const ContenidoModalProducto: React.FC<PropiedadesContenidoModalProducto> = ({
  productoParaEditar,
  categoriaInicial,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const [nombre, setNombre] = useState(() => productoParaEditar?.name || '');
  const [categoria, setCategoria] = useState(() => productoParaEditar?.category || categoriaInicial || 'General');
  const [otraCategoria, setOtraCategoria] = useState(() => {
    if (productoParaEditar && !CATEGORIAS_PRODUCTOS_SUGERIDAS.includes(productoParaEditar.category)) {
      return productoParaEditar.category;
    }
    return '';
  });
  const [mostrarOtraCategoria, setMostrarOtraCategoria] = useState(() => {
    return Boolean(productoParaEditar && !CATEGORIAS_PRODUCTOS_SUGERIDAS.includes(productoParaEditar.category));
  });

  const [formato, setFormato] = useState(() => productoParaEditar?.sizeFormat || 'Estándar');
  const [otroFormato, setOtroFormato] = useState(() => {
    if (productoParaEditar?.sizeFormat && !FORMATOS_PRODUCTOS_SUGERIDOS.includes(productoParaEditar.sizeFormat)) {
      return productoParaEditar.sizeFormat;
    }
    return '';
  });
  const [mostrarOtroFormato, setMostrarOtroFormato] = useState(() => {
    return Boolean(productoParaEditar?.sizeFormat && !FORMATOS_PRODUCTOS_SUGERIDOS.includes(productoParaEditar.sizeFormat));
  });

  const [unidadVenta, setUnidadVenta] = useState(() => productoParaEditar?.saleUnit || 'Unidad');
  const [otraUnidad, setOtraUnidad] = useState(() => {
    if (productoParaEditar && !UNIDADES_VENTA_SUGERIDAS.includes(productoParaEditar.saleUnit)) {
      return productoParaEditar.saleUnit;
    }
    return '';
  });
  const [mostrarOtraUnidad, setMostrarOtraUnidad] = useState(() => {
    return Boolean(productoParaEditar && !UNIDADES_VENTA_SUGERIDAS.includes(productoParaEditar.saleUnit));
  });

  const [descripcion, setDescripcion] = useState(() => productoParaEditar?.description || '');
  const [activo, setActivo] = useState(() => (productoParaEditar ? productoParaEditar.isActive : true));

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

    const categoriaFinal = mostrarOtraCategoria && otraCategoria.trim() ? otraCategoria.trim() : categoria;
    const formatoFinal = mostrarOtroFormato && otroFormato.trim() ? otroFormato.trim() : formato;
    const unidadFinal = mostrarOtraUnidad && otraUnidad.trim() ? otraUnidad.trim() : unidadVenta.trim();

    if (!unidadFinal) {
      triggerError();
      Alert.alert('Unidad de venta requerida', 'Por favor, indica la unidad de venta (ej: Unidad, Paquete, Servicio).');
      return;
    }

    const precioCentavos = precioTexto ? convertirMontoACentavos(precioTexto) : 0;
    const costoCentavos = costoTexto ? convertirMontoACentavos(costoTexto) : 0;

    setGuardando(true);
    try {
      if (productoParaEditar) {
        actualizarProductoFoto(productoParaEditar.id, {
          name: nombreFinal,
          category: categoriaFinal,
          sizeFormat: formatoFinal || undefined,
          saleUnit: unidadFinal,
          description: descripcion.trim() || undefined,
          isActive: activo,
          basePrice: precioCentavos,
          costPrice: costoCentavos,
        });
      } else {
        crearProductoFoto({
          name: nombreFinal,
          category: categoriaFinal,
          sizeFormat: formatoFinal || undefined,
          saleUnit: unidadFinal,
          description: descripcion.trim() || undefined,
          isActive: activo,
          basePrice: precioCentavos,
          costPrice: costoCentavos,
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
            {/* Campo: Nombre del producto (Obligatorio) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, TYPOGRAPHY.etiquetaMayusculas]}>
                  Nombre del producto
                </Text>
                <Text style={styles.requiredBadge}>* Obligatorio</Text>
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="label"
                  size={18}
                  color={COLORS.onSurfaceVariant}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="ej. Taza personalizada, Cuadro decorativo, Pack remeras..."
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  style={[styles.textInput, TYPOGRAPHY.cuerpoGrande]}
                  autoFocus={!productoParaEditar}
                />
              </View>
            </View>

            {/* Selector: Categoría o tipo */}
            <SelectorChips
              titulo="Categoría o Tipo"
              opciones={CATEGORIAS_PRODUCTOS_SUGERIDAS}
              seleccionada={categoria}
              onSeleccionar={setCategoria}
              etiquetaPersonalizado="+ Otra"
              valorPersonalizado={otraCategoria}
              onChangeValorPersonalizado={setOtraCategoria}
              mostrarPersonalizado={mostrarOtraCategoria}
              onToggleMostrarPersonalizado={setMostrarOtraCategoria}
              placeholderPersonalizado="Escribe la categoría personalizada..."
            />

            {/* Selector: Formato, medida o variante */}
            <SelectorChips
              titulo="Formato / Medida / Variante"
              opciones={FORMATOS_PRODUCTOS_SUGERIDOS}
              seleccionada={formato}
              onSeleccionar={setFormato}
              etiquetaPersonalizado="Personalizado"
              valorPersonalizado={otroFormato}
              onChangeValorPersonalizado={setOtroFormato}
              mostrarPersonalizado={mostrarOtroFormato}
              onToggleMostrarPersonalizado={setMostrarOtroFormato}
              placeholderPersonalizado="ej. 60x90 cm, Talle M, Pack x10..."
            />

            {/* Selector: Unidad de venta */}
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

            {/* Precios opcionales */}
            <View style={styles.pricingOptionalBox}>
              <View style={styles.pricingHeader}>
                <MaterialIcons name="sell" size={16} color={COLORS.secondary} />
                <Text style={[styles.pricingSectionTitle, TYPOGRAPHY.etiquetaMayusculas]}>
                  Precios referenciales (Opcional)
                </Text>
              </View>
              <Text style={styles.pricingHint}>
                Puedes dejar estos campos en $ 0 y asignar precios detallados luego.
              </Text>

              <View style={styles.pricingInputsRow}>
                <View style={styles.pricingInputCol}>
                  <Text style={styles.subLabel}>Precio venta base</Text>
                  <View style={styles.inputContainerCompact}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      value={precioTexto}
                      onChangeText={val => setPrecioTexto(formatearEntradaDinero(val))}
                      placeholder="0,00"
                      placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                      keyboardType="numeric"
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
                      keyboardType="numeric"
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

            {/* Campo: Descripción o notas */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, TYPOGRAPHY.etiquetaMayusculas]}>
                Descripción o notas
              </Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Detalles sobre materiales, proveedor, acabado o notas de venta..."
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  style={[styles.textInput, styles.textAreaInput, TYPOGRAPHY.cuerpoMedio]}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Interruptor: Producto activo */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelCol}>
                <Text style={[styles.switchTitle, TYPOGRAPHY.cuerpoGrande]}>
                  Producto activo
                </Text>
                <Text style={[styles.switchSubtitle, TYPOGRAPHY.cuerpoPequeno]}>
                  Los productos activos aparecen disponibles para ventas y calculadora
                </Text>
              </View>
              <Switch
                value={activo}
                onValueChange={val => {
                  triggerSelection();
                  setActivo(val);
                }}
                trackColor={{ false: COLORS.surfaceContainerLowest, true: 'rgba(87, 245, 171, 0.4)' }}
                thumbColor={activo ? COLORS.secondary : COLORS.onSurfaceVariant}
              />
            </View>
          </ScrollView>

          {/* Footer de Acciones */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                triggerSelection();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, TYPOGRAPHY.cuerpoMedio]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <View style={styles.saveBtnWrapper}>
              <BotonBrillante
                title={guardando ? 'Guardando...' : productoParaEditar ? 'Guardar cambios' : 'Crear producto'}
                onPress={handleGuardar}
                disabled={guardando}
                icon={<MaterialIcons name="check" size={18} color="#06120D" />}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
};

export const ModalProducto: React.FC<PropiedadesModalProducto> = ({
  visible,
  onClose,
  productoParaEditar,
  categoriaInicial,
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
          categoriaInicial={categoriaInicial}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
};

export const ModalProductoFoto = ModalProducto;

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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 14,
    borderRadius: 16,
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  switchTitle: {
    color: COLORS.onSurface,
  },
  switchSubtitle: {
    color: COLORS.onSurfaceVariant,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
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
  },
  saveBtnWrapper: {
    flex: 1,
  },
});
