import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS } from '@/compartido/tema';
import { EstadoVacio, BotonBrillante, BarraBusqueda, SelectorSegmentado, ChipFiltro } from '@/compartido/componentes';
import { useProductosBoveda, useResumenInventarioBoveda } from '@/datos/hooks';
import {
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
import { HistorialPrecios } from './HistorialPrecios';
import { EstadisticasPrecios } from './EstadisticasPrecios';
import { TarjetaProducto } from './TarjetaProducto';
import { PantallaResumenInventario } from './PantallaResumenInventario';
import { PantallaAnalisisInventario } from './PantallaAnalisisInventario';

export type SeccionModuloProductos = 'RESUMEN' | 'CATALOGO' | 'ANALISIS' | 'HISTORIAL' | 'ESTADISTICAS';

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

  // Sub-módulo activo: Resumen | Catálogo | Análisis | Historial | Estadísticas
  const [seccionModulo, setSeccionModulo] = useState<SeccionModuloProductos>('CATALOGO');
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
      p => p.grossMarginPercent !== null && p.grossMarginPercent !== undefined
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

  const handleFabricarProducto = (product: Producto) => {
    triggerSelection();
    setDetailProduct(product);
    setDetailAccionInicial('FABRICAR');
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

  const handleVerHistorial = (productId?: string) => {
    triggerSelection();
    setProductoParaHistorial(productId);
    setSeccionModulo('HISTORIAL');
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
      {/* Selector de sub-módulo estilo cápsula glossy 3D */}
      <SelectorSegmentado<SeccionModuloProductos>
        opciones={[
          { valor: 'RESUMEN', etiqueta: 'Resumen', icono: 'dashboard' },
          { valor: 'CATALOGO', etiqueta: `Productos (${totalCount})`, icono: 'inventory-2' },
          { valor: 'ANALISIS', etiqueta: 'Análisis', icono: 'insights' },
        ]}
        valorSeleccionado={seccionModulo}
        onSeleccionar={setSeccionModulo}
        tonoPorDefecto="cian"
        style={{ marginBottom: 14 }}
      />

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
          onNuevoProducto={onNewProduct}
        />
      ) : seccionModulo === 'ANALISIS' ? (
        <PantallaAnalisisInventario
          onAbrirDetalleProducto={handleOpenDetail}
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

          {/* BARRA DE BÚSQUEDA */}
          <BarraBusqueda
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o SKU..."
            style={{ marginBottom: 12 }}
          />

          {/* CHIPS SEGMENTADOS DE FILTROS HORIZONTALES */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            <ChipFiltro
              etiqueta={`Todos (${totalCount})`}
              activo={statusFilter === 'TODOS' && !soloAlertasStock && !soloAgotados}
              tono="cian"
              onPress={() => {
                setStatusFilter('TODOS');
                setSoloAlertasStock(false);
                setSoloAgotados(false);
              }}
            />

            <ChipFiltro
              etiqueta={`Stock Bajo (${inventorySummary.lowStockCount})`}
              activo={soloAlertasStock && !soloAgotados}
              tono="gasto"
              colorPunto={COLORS.gasto}
              onPress={() => {
                setSoloAgotados(false);
                setSoloAlertasStock(prev => !prev);
              }}
            />

            <ChipFiltro
              etiqueta={`Agotados (${inventorySummary.outOfStockCount})`}
              activo={soloAgotados}
              tono="neutral"
              colorPunto={COLORS.bordeContorno}
              onPress={() => {
                setSoloAlertasStock(false);
                setSoloAgotados(prev => !prev);
              }}
            />
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
                  onFabricate={handleFabricarProducto}
                  onEdit={handleOpenEdit}
                  onOpenPrices={handleOpenPrices}
                  onViewHistory={handleVerHistorial}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}


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


    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    gap: 14,
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
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  productsListContainer: {
    gap: 4,
  },
  emptyBtnWrapper: {
    marginTop: 8,
  },
});
