import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { EstadoVacio, BotonBrillante } from '@/compartido/componentes';
import { useProductosBoveda, useResumenInventarioBoveda } from '@/datos/hooks';
import {
  alternarEstadoProducto,
  eliminarProducto,
} from '@/datos/consultas/productos';
import { Producto, FiltroEstadoProducto } from '@/datos/tipos';
import {
  gatillarSeleccion as triggerSelection,
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
} from '@/compartido/utilidades/hapticos';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { ModalProducto } from './ModalProducto';
import { ModalGestionPrecios } from './ModalGestionPrecios';
import { ModalDetalleProducto, TipoAccionDetalleProducto } from './ModalDetalleProducto';
import { CalculadoraPrecios } from './CalculadoraPrecios';
import { HistorialPrecios } from './HistorialPrecios';
import { EstadisticasPrecios } from './EstadisticasPrecios';
import { TarjetaProducto } from './TarjetaProducto';
import { PantallaResumenInventario } from './PantallaResumenInventario';
import { PantallaAnalisisInventario } from './PantallaAnalisisInventario';
import { ModalImportarProductosExcel } from './ModalImportarProductosExcel';

export type SeccionModuloProductos = 'RESUMEN' | 'CATALOGO' | 'ANALISIS' | 'CALCULADORA' | 'HISTORIAL' | 'ESTADISTICAS';

export interface PropiedadesPestanaProductos {
  onNewProduct?: () => void;
  onNewProductRef?: React.MutableRefObject<(() => void) | null>;
}


export const PestanaProductos: React.FC<PropiedadesPestanaProductos> = ({ onNewProduct, onNewProductRef }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FiltroEstadoProducto>('TODOS');
  const [soloAlertasStock, setSoloAlertasStock] = useState(false);
  const [soloAgotados, setSoloAgotados] = useState(false);

  // Modal de detalle del producto y operaciones
  const [detailProduct, setDetailProduct] = useState<Producto | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailAccionInicial, setDetailAccionInicial] = useState<TipoAccionDetalleProducto | undefined>(undefined);

  // Modal de creación / edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  // Modal de gestión de precios y tarifas
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [productForPrices, setProductForPrices] = useState<Producto | null>(null);

  // Modal de importación de Excel (hoja INVERSIONES)
  const [importModalVisible, setImportModalVisible] = useState(false);

  // Sub-módulo activo: Resumen | Catálogo | Análisis | Calculadora
  const [seccionModulo, setSeccionModulo] = useState<SeccionModuloProductos>('CATALOGO');
  const [itemsCalculadora, setItemsCalculadora] = useState<Record<string, number>>({});
  const [productoParaHistorial, setProductoParaHistorial] = useState<string | undefined>(undefined);

  // Hooks reactivos a la bóveda SQLite
  const { products: allProducts } = useProductosBoveda({
    search,
    statusFilter,
  });
  const { summary: inventorySummary } = useResumenInventarioBoveda();

  // Margen promedio calculado dinámicamente del catálogo
  const promedioMargen = useMemo(() => {
    const prodsConMargen = allProducts.filter(
      p => p.isActive && p.grossMarginPercent !== null && p.grossMarginPercent !== undefined
    );
    if (prodsConMargen.length === 0) return 42;
    const suma = prodsConMargen.reduce((acc, p) => acc + (p.grossMarginPercent || 0), 0);
    return Math.round(suma / prodsConMargen.length);
  }, [allProducts]);

  // Filtrar productos para la visualización del catálogo
  const displayProducts = useMemo(() => {
    let result = allProducts;
    if (soloAgotados) {
      result = result.filter(p => p.isOutOfStock);
    } else if (soloAlertasStock) {
      result = result.filter(p => p.isLowStock || p.isOutOfStock);
    }
    return result;
  }, [allProducts, soloAlertasStock, soloAgotados]);

  // Estadísticas rápidas para los chips
  const totalCount = allProducts.length;

  const handleOpenDetail = (product: Producto) => {
    triggerSelection();
    setDetailProduct(product);
    setDetailAccionInicial(undefined);
    setDetailModalVisible(true);
  };

  const handleQuickSale = (product: Producto) => {
    triggerSelection();
    setDetailProduct(product);
    setDetailAccionInicial('VENTA');
    setDetailModalVisible(true);
  };

  const handleQuickPurchase = (product: Producto) => {
    triggerSelection();
    setDetailProduct(product);
    setDetailAccionInicial('COMPRA');
    setDetailModalVisible(true);
  };

  const handleOpenNew = () => {
    triggerSelection();
    if (onNewProduct) {
      onNewProduct();
      return;
    }
    setEditingProduct(null);
    setModalVisible(true);
  };

  useEffect(() => {
    if (onNewProductRef) {
      onNewProductRef.current = handleOpenNew;
    }
  });

  const handleOpenEdit = (product: Producto) => {
    triggerSelection();
    setEditingProduct(product);
    setModalVisible(true);
  };

  const handleOpenPrices = (product: Producto) => {
    triggerSelection();
    setProductForPrices(product);
    setPriceModalVisible(true);
  };

  const handleCalcularProducto = (product: Producto) => {
    triggerSuccess();
    setItemsCalculadora(prev => ({
      ...prev,
      [product.id]: prev[product.id] ? prev[product.id] + 1 : 1,
    }));
    setSeccionModulo('CALCULADORA');
  };

  const handleVerHistorial = (productId?: string) => {
    triggerSelection();
    setProductoParaHistorial(productId);
    setSeccionModulo('HISTORIAL');
  };

  const handleToggleActive = (product: Producto) => {
    triggerSelection();
    try {
      alternarEstadoProducto(product.id);
      triggerSuccess();
    } catch (err: any) {
      triggerError();
      Alert.alert('Error', err?.message || 'No se pudo cambiar el estado del producto.');
    }
  };

  const handleDelete = (product: Producto) => {
    triggerSelection();
    Alert.alert(
      'Eliminar producto',
      `¿Deseas eliminar "${product.name}" del catálogo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              eliminarProducto(product.id);
              triggerSuccess();
            } catch (err: any) {
              triggerError();
              Alert.alert('Error', err?.message || 'No se pudo eliminar el producto.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Selector de sub-módulo con estilo Stitch Glass Pill */}
      <View style={styles.moduleSwitcherTrack}>
        <TouchableOpacity
          style={[
            styles.moduleSwitcherBtn,
            seccionModulo === 'RESUMEN' && styles.moduleSwitcherBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setSeccionModulo('RESUMEN');
          }}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Ver Resumen de Inventario"
        >
          <MaterialIcons
            name="dashboard"
            size={15}
            color={seccionModulo === 'RESUMEN' ? COLORS.primario : COLORS.enSuperficieVariante}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'RESUMEN' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Resumen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.moduleSwitcherBtn,
            seccionModulo === 'CATALOGO' && styles.moduleSwitcherBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setSeccionModulo('CATALOGO');
          }}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Ver Catálogo de Productos"
        >
          <MaterialIcons
            name="inventory-2"
            size={15}
            color={seccionModulo === 'CATALOGO' ? COLORS.primario : COLORS.enSuperficieVariante}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'CATALOGO' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Productos ({totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.moduleSwitcherBtn,
            seccionModulo === 'ANALISIS' && styles.moduleSwitcherBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setSeccionModulo('ANALISIS');
          }}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Ver Análisis de Ventas"
        >
          <MaterialIcons
            name="insights"
            size={15}
            color={seccionModulo === 'ANALISIS' ? COLORS.primario : COLORS.enSuperficieVariante}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'ANALISIS' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Análisis
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.moduleSwitcherBtn,
            seccionModulo === 'CALCULADORA' && styles.moduleSwitcherBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setSeccionModulo('CALCULADORA');
          }}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Ver Calculadora de precios"
        >
          <MaterialIcons
            name="calculate"
            size={15}
            color={seccionModulo === 'CALCULADORA' ? COLORS.primario : COLORS.enSuperficieVariante}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'CALCULADORA' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Calc.{Object.keys(itemsCalculadora).length > 0 ? ` (${Object.keys(itemsCalculadora).length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según el sub-módulo activo */}
      {seccionModulo === 'RESUMEN' ? (
        <PantallaResumenInventario
          onVerCatalogo={() => {
            triggerSelection();
            setSoloAlertasStock(false);
            setSoloAgotados(false);
            setSeccionModulo('CATALOGO');
          }}
          onVerCatalogoAlertas={() => {
            triggerSelection();
            setSoloAlertasStock(true);
            setSoloAgotados(false);
            setSeccionModulo('CATALOGO');
          }}
          onVerAnalisis={() => {
            triggerSelection();
            setSeccionModulo('ANALISIS');
          }}
          onAbrirDetalleProducto={handleOpenDetail}
          onNuevoProducto={handleOpenNew}
          onImportarExcel={() => {
            triggerSelection();
            setImportModalVisible(true);
          }}
        />
      ) : seccionModulo === 'ANALISIS' ? (
        <PantallaAnalisisInventario
          onAbrirDetalleProducto={handleOpenDetail}
        />
      ) : seccionModulo === 'CALCULADORA' ? (
        <CalculadoraPrecios
          productosCatalogo={allProducts}
          itemsSeleccionados={itemsCalculadora}
          onActualizarItems={setItemsCalculadora}
          onIrAlCatalogo={() => setSeccionModulo('CATALOGO')}
        />
      ) : seccionModulo === 'HISTORIAL' ? (
        <HistorialPrecios
          key={productoParaHistorial || 'historial-general'}
          productoIdInicial={productoParaHistorial}
          onIrAlCatalogo={() => setSeccionModulo('CATALOGO')}
        />
      ) : seccionModulo === 'ESTADISTICAS' ? (
        <EstadisticasPrecios
          productoIdInicial={productoParaHistorial}
          onVerHistorialProducto={handleVerHistorial}
        />
      ) : (
        <>
          {/* BARRA DE TÍTULO DE LA PANTALLA Y BOTÓN DE ACCIÓN (Diseño Stitch) */}
          <View style={styles.titleBarRow}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.screenTitleText}>Productos</Text>
              <View style={styles.itemsBadgePill}>
                <Text style={styles.itemsBadgeText}>{totalCount} ítems</Text>
              </View>
            </View>

            <View style={styles.titleActionsRow}>
              {/* Botón Excel */}
              <TouchableOpacity
                style={styles.btnExcelHeader}
                onPress={() => {
                  triggerSelection();
                  setImportModalVisible(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Importar desde Excel"
              >
                <MaterialIcons name="table-view" size={15} color={COLORS.secundarioContenedor} />
                <Text style={styles.btnExcelHeaderText}>Excel</Text>
              </TouchableOpacity>

              {/* Botón Nuevo con resplandor neón violeta */}
              <TouchableOpacity
                style={styles.btnNuevoHeader}
                onPress={handleOpenNew}
                activeOpacity={0.85}
                accessibilityLabel="Crear nuevo producto"
              >
                <MaterialIcons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.btnNuevoHeaderText}>NUEVO</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DECK DE MICRO-INDICADORES (3 COLUMNAS - STITCH) */}
          <View style={styles.metricsDeckRow}>
            {/* Métrica 1: Valor Total */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeaderRow}>
                <MaterialIcons name="inventory-2" size={15} color={COLORS.secundario} />
                <Text style={styles.metricLabel} numberOfLines={1}>
                  Valor Total
                </Text>
              </View>
              <Text style={styles.metricValueText} numberOfLines={1}>
                {formatCurrency(inventorySummary.inventoryCostValue)}
              </Text>
              <Text style={styles.metricSubIncome} numberOfLines={1}>
                {inventorySummary.totalStockUnits} uds en stock
              </Text>
            </View>

            {/* Métrica 2: Alertas de Stock (Interactivo para filtrar) */}
            <TouchableOpacity
              style={[
                styles.metricCard,
                (inventorySummary.lowStockCount > 0 || inventorySummary.outOfStockCount > 0) && styles.metricCardAlert,
                soloAlertasStock && styles.metricCardAlertActive,
              ]}
              onPress={() => {
                triggerSelection();
                setSoloAgotados(false);
                setSoloAlertasStock(prev => !prev);
              }}
              activeOpacity={0.8}
              accessibilityLabel="Filtrar productos con stock bajo o agotado"
            >
              <View style={styles.metricHeaderRow}>
                <MaterialIcons name="warning" size={15} color={COLORS.gasto} />
                <Text style={[styles.metricLabel, { color: COLORS.gasto }]} numberOfLines={1}>
                  Stock Bajo
                </Text>
              </View>
              <Text style={[styles.metricValueText, { color: COLORS.gasto }]} numberOfLines={1}>
                {inventorySummary.lowStockCount + inventorySummary.outOfStockCount} alertas
              </Text>
              <Text style={styles.metricSubNeutral} numberOfLines={1}>
                {soloAlertasStock ? 'Filtrando alertas' : `${inventorySummary.outOfStockCount} agotados`}
              </Text>
            </TouchableOpacity>

            {/* Métrica 3: Margen Promedio */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeaderRow}>
                <MaterialIcons name="percent" size={15} color={COLORS.primario} />
                <Text style={[styles.metricLabel, { color: COLORS.primario }]} numberOfLines={1}>
                  Margen Med.
                </Text>
              </View>
              <Text style={[styles.metricValueText, { color: COLORS.primario }]} numberOfLines={1}>
                {promedioMargen}%
              </Text>
              <Text style={styles.metricSubSecondary} numberOfLines={1}>
                Saludable
              </Text>
            </View>
          </View>

          {/* BARRA DE BÚSQUEDA (Stitch Style) */}
          <View style={styles.searchBarWrapper}>
            <MaterialIcons
              name="search"
              size={20}
              color={COLORS.bordeContorno}
              style={styles.searchIconLeft}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre o SKU..."
              placeholderTextColor={COLORS.bordeContorno}
              style={styles.searchTextInput}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {search.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  setSearch('');
                }}
                style={styles.searchActionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={16} color={COLORS.enSuperficieVariante} />
              </TouchableOpacity>
            ) : (
              <View style={styles.searchActionBtn}>
                <MaterialIcons name="tune" size={16} color={COLORS.enSuperficieVariante} />
              </View>
            )}
          </View>

          {/* CHIPS SEGMENTADOS DE FILTROS HORIZONTALES (Stitch Style) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {/* Chip: Todos */}
            <TouchableOpacity
              style={[
                styles.chipItem,
                statusFilter === 'TODOS' && !soloAlertasStock && !soloAgotados && styles.chipItemActive,
              ]}
              onPress={() => {
                triggerSelection();
                setStatusFilter('TODOS');
                setSoloAlertasStock(false);
                setSoloAgotados(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === 'TODOS' && !soloAlertasStock && !soloAgotados && styles.chipTextActive,
                ]}
              >
                Todos ({totalCount})
              </Text>
            </TouchableOpacity>



            {/* Chip: Stock Bajo */}
            <TouchableOpacity
              style={[
                styles.chipItem,
                soloAlertasStock && !soloAgotados && styles.chipItemAlertActive,
              ]}
              onPress={() => {
                triggerSelection();
                setSoloAgotados(false);
                setSoloAlertasStock(prev => !prev);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.chipDot, { backgroundColor: COLORS.gasto }]} />
              <Text
                style={[
                  styles.chipText,
                  { color: COLORS.gasto },
                  soloAlertasStock && !soloAgotados && styles.chipTextAlertActive,
                ]}
              >
                Stock Bajo ({inventorySummary.lowStockCount})
              </Text>
            </TouchableOpacity>

            {/* Chip: Agotados */}
            <TouchableOpacity
              style={[
                styles.chipItem,
                soloAgotados && styles.chipItemAgotadoActive,
              ]}
              onPress={() => {
                triggerSelection();
                setSoloAlertasStock(false);
                setSoloAgotados(prev => !prev);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.chipDot, { backgroundColor: COLORS.bordeContorno }]} />
              <Text
                style={[
                  styles.chipText,
                  { color: COLORS.bordeContorno },
                  soloAgotados && styles.chipTextAgotadoActive,
                ]}
              >
                Agotados ({inventorySummary.outOfStockCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* LISTA DEL CATÁLOGO DE PRODUCTOS */}
          {displayProducts.length === 0 ? (
            <EstadoVacio
              icono="inventory-2"
              colorIcono={COLORS.secundario}
              titulo={
                soloAgotados
                  ? 'Sin productos agotados'
                  : soloAlertasStock
                    ? 'Sin alertas de stock'
                    : search
                      ? 'Sin coincidencias'
                      : 'Sin productos en el catálogo'
              }
              descripcion={
                soloAgotados
                  ? 'No hay productos con stock en cero en este momento.'
                  : soloAlertasStock
                    ? 'Ningún producto presenta stock bajo o agotado en este momento.'
                    : search
                      ? 'No se encontraron productos que coincidan con los filtros seleccionados.'
                      : 'Agrega los primeros productos, servicios o artículos de tu negocio.'
              }
            >
              {soloAlertasStock || soloAgotados ? (
                <View style={styles.emptyBtnWrapper}>
                  <BotonBrillante
                    title="Ver todos los productos"
                    onPress={() => {
                      setSoloAlertasStock(false);
                      setSoloAgotados(false);
                    }}
                    icon={<MaterialIcons name="list" size={18} color="#06120D" />}
                  />
                </View>
              ) : !search ? (
                <View style={styles.emptyBtnWrapper}>
                  <BotonBrillante
                    title="Agregar primer producto"
                    onPress={handleOpenNew}
                    icon={<MaterialIcons name="add" size={18} color="#06120D" />}
                  />
                </View>
              ) : null}
            </EstadoVacio>
          ) : (
            <View style={styles.productsListContainer}>
              {displayProducts.map(product => (
                <TarjetaProducto
                  key={product.id}
                  product={product}
                  onOpenDetail={handleOpenDetail}
                  onQuickSale={handleQuickSale}
                  onQuickPurchase={handleQuickPurchase}
                  onEdit={handleOpenEdit}
                  onOpenPrices={handleOpenPrices}
                  onViewHistory={handleVerHistorial}
                  onCalculate={handleCalcularProducto}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}

          {/* BARRA DE ACCIÓN INFERIOR / DOCK (Diseño Stitch) */}
          <View style={styles.bottomDockContainer}>
            <TouchableOpacity
              style={styles.bottomDockBtn}
              onPress={() => {
                triggerSelection();
                setImportModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="table-view" size={18} color={COLORS.secundarioContenedor} />
              <Text style={styles.bottomDockBtnText}>
                Importar productos desde Excel (INVERSIONES)
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal de Detalle de Producto y Operaciones de Inventario */}
      <ModalDetalleProducto
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setDetailAccionInicial(undefined);
        }}
        producto={detailProduct}
        onEditProduct={handleOpenEdit}
        accionInicial={detailAccionInicial}
      />

      {/* Modal para Crear o Editar Producto General */}
      <ModalProducto
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        productoParaEditar={editingProduct}
      />

      {/* Modal para Gestión de Precios y Costos */}
      <ModalGestionPrecios
        visible={priceModalVisible}
        onClose={() => setPriceModalVisible(false)}
        producto={productForPrices}
      />

      {/* Modal de Importación de Excel (hoja INVERSIONES) */}
      <ModalImportarProductosExcel
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  moduleSwitcherTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.superficieContenedorBajo, // #181c1d
    borderRadius: 9999,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
  },
  moduleSwitcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  moduleSwitcherBtnActive: {
    backgroundColor: COLORS.superficieContenedorAlto, // #272b2c
    borderWidth: 1,
    borderColor: 'rgba(209, 188, 255, 0.25)',
    shadowColor: COLORS.primarioContenedor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  moduleSwitcherText: {
    color: COLORS.enSuperficieVariante,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  moduleSwitcherTextActive: {
    color: COLORS.primario,
    fontWeight: '700',
  },
  titleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingBottom: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.enSuperficie, // #e0e3e4
    letterSpacing: -0.3,
  },
  itemsBadgePill: {
    backgroundColor: COLORS.superficieContenedorAlto, // #272b2c
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  itemsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primario, // #d1bcff
    letterSpacing: 0.3,
  },
  titleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnExcelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: COLORS.superficieContenedorAlto,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  btnExcelHeaderText: {
    color: COLORS.secundarioContenedor, // #00D2FF
    fontSize: 11,
    fontWeight: '700',
  },
  btnNuevoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: COLORS.primarioContenedor, // #8a4fff
    shadowColor: COLORS.primarioContenedor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  btnNuevoHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricsDeckRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.superficieContenedorBajo, // #181c1d
    borderRadius: 14,
    padding: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  metricCardAlert: {
    borderColor: 'rgba(255, 138, 158, 0.3)',
  },
  metricCardAlertActive: {
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
    borderColor: COLORS.gasto,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.enSuperficieVariante,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  metricValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.enSuperficie,
    letterSpacing: -0.2,
  },
  metricSubIncome: {
    fontSize: 9.5,
    color: COLORS.ingreso,
    fontWeight: '600',
  },
  metricSubNeutral: {
    fontSize: 9.5,
    color: COLORS.enSuperficieVariante,
    fontWeight: '500',
  },
  metricSubSecondary: {
    fontSize: 9.5,
    color: COLORS.secundario,
    fontWeight: '600',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.superficieContenedorBajo, // #181c1d
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.enSuperficie,
    paddingVertical: 8,
  },
  searchActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.superficieContenedorAlto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.superficieContenedor, // #1c2021
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
  },
  chipItemActive: {
    backgroundColor: COLORS.primario, // #d1bcff
    borderColor: COLORS.primario,
  },
  chipItemAlertActive: {
    backgroundColor: 'rgba(255, 138, 158, 0.18)',
    borderColor: COLORS.gasto,
  },
  chipItemAgotadoActive: {
    backgroundColor: COLORS.superficieContenedorMasAlto,
    borderColor: COLORS.bordeContorno,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.enSuperficieVariante,
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: COLORS.enPrimario, // #3d008f
    fontWeight: '700',
  },
  chipTextAlertActive: {
    color: COLORS.gasto,
    fontWeight: '700',
  },
  chipTextAgotadoActive: {
    color: COLORS.enSuperficie,
    fontWeight: '700',
  },
  productsListContainer: {
    gap: 4,
  },
  emptyBtnWrapper: {
    marginTop: 8,
  },
  bottomDockContainer: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  bottomDockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.superficieContenedorBajo,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
  },
  bottomDockBtnText: {
    color: COLORS.secundario,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
