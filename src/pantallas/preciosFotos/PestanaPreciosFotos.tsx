import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { useProductosBoveda } from '@/datos/hooks';
import {
  alternarEstadoProductoFoto,
  eliminarProductoFoto,
} from '@/datos/consultas/productosFotos';
import { ProductoFoto as Producto, FiltroEstadoProductoFoto as FiltroEstadoProducto } from '@/datos/tipos';
import {
  gatillarSeleccion as triggerSelection,
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
} from '@/compartido/utilidades/hapticos';
import { ModalProductoFoto } from './ModalProductoFoto';
import { ModalGestionPrecios } from './ModalGestionPrecios';
import { CalculadoraPreciosFotos } from './CalculadoraPreciosFotos';
import { HistorialPreciosFotos } from './HistorialPreciosFotos';
import { EstadisticasPreciosFotos } from './EstadisticasPreciosFotos';
import { TarjetaProducto } from './TarjetaProducto';

export type SeccionModuloProductos = 'CATALOGO' | 'CALCULADORA' | 'HISTORIAL' | 'ESTADISTICAS';
export type SeccionModuloFotos = SeccionModuloProductos;

export interface PropiedadesPestanaProductos {
  onNewProduct?: () => void;
}

export type PropiedadesPestanaPreciosFotos = PropiedadesPestanaProductos;

export const PestanaProductos: React.FC<PropiedadesPestanaProductos> = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FiltroEstadoProducto>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  // Modal de creación / edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  // Modal de gestión de precios y tarifas
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [productForPrices, setProductForPrices] = useState<Producto | null>(null);

  // Sub-módulo activo: Catálogo, Calculadora, Historial o Estadísticas
  const [seccionModulo, setSeccionModulo] = useState<SeccionModuloProductos>('CATALOGO');
  const [itemsCalculadora, setItemsCalculadora] = useState<Record<string, number>>({});
  const [productoParaHistorial, setProductoParaHistorial] = useState<string | undefined>(undefined);

  // Hook reactivo a la bóveda SQLite
  const { products: allProducts, categories } = useProductosBoveda({
    search,
    category: selectedCategory,
    statusFilter,
  });

  // Estadísticas rápidas para los chips de estado
  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    const total = allProducts.length;
    const active = allProducts.filter(p => p.isActive).length;
    const inactive = allProducts.filter(p => !p.isActive).length;
    return { totalCount: total, activeCount: active, inactiveCount: inactive };
  }, [allProducts]);

  const handleOpenNew = () => {
    triggerSelection();
    setEditingProduct(null);
    setModalVisible(true);
  };

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
      alternarEstadoProductoFoto(product.id);
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
              eliminarProductoFoto(product.id);
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
      {/* Selector de sub-módulo: Catálogo | Calculadora | Historial | Estadísticas */}
      <View style={styles.moduleSwitcherTrack}>
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
          accessibilityLabel="Ver Catálogo"
        >
          <MaterialIcons
            name="inventory-2"
            size={15}
            color={seccionModulo === 'CATALOGO' ? COLORS.secondary : COLORS.onSurfaceVariant}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'CATALOGO' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Catálogo ({totalCount})
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
            color={seccionModulo === 'CALCULADORA' ? COLORS.secondary : COLORS.onSurfaceVariant}
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

        <TouchableOpacity
          style={[
            styles.moduleSwitcherBtn,
            seccionModulo === 'HISTORIAL' && styles.moduleSwitcherBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setProductoParaHistorial(undefined);
            setSeccionModulo('HISTORIAL');
          }}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Ver Historial de cambios de precio"
        >
          <MaterialIcons
            name="history"
            size={15}
            color={seccionModulo === 'HISTORIAL' ? COLORS.secondary : COLORS.onSurfaceVariant}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'HISTORIAL' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Historial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.moduleSwitcherBtn,
            seccionModulo === 'ESTADISTICAS' && styles.moduleSwitcherBtnActive,
          ]}
          onPress={() => {
            triggerSelection();
            setSeccionModulo('ESTADISTICAS');
          }}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Ver Estadísticas del catálogo"
        >
          <MaterialIcons
            name="insights"
            size={15}
            color={seccionModulo === 'ESTADISTICAS' ? COLORS.secondary : COLORS.onSurfaceVariant}
          />
          <Text
            style={[
              styles.moduleSwitcherText,
              TYPOGRAPHY.etiquetaMayusculas,
              seccionModulo === 'ESTADISTICAS' && styles.moduleSwitcherTextActive,
            ]}
            numberOfLines={1}
          >
            Estadísticas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según el sub-módulo activo */}
      {seccionModulo === 'CALCULADORA' ? (
        <CalculadoraPreciosFotos
          productosCatalogo={allProducts}
          itemsSeleccionados={itemsCalculadora}
          onActualizarItems={setItemsCalculadora}
          onIrAlCatalogo={() => setSeccionModulo('CATALOGO')}
        />
      ) : seccionModulo === 'HISTORIAL' ? (
        <HistorialPreciosFotos
          key={productoParaHistorial || 'historial-general'}
          productoIdInicial={productoParaHistorial}
          onIrAlCatalogo={() => setSeccionModulo('CATALOGO')}
        />
      ) : seccionModulo === 'ESTADISTICAS' ? (
        <EstadisticasPreciosFotos
          productoIdInicial={productoParaHistorial}
          onVerHistorialProducto={handleVerHistorial}
          onIrAlCatalogo={() => setSeccionModulo('CATALOGO')}
        />
      ) : (
        <>
          {/* Encabezado de Sección y Botón Agregar */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleCol}>
              <Text style={[styles.mainSectionTitle, TYPOGRAPHY.titularGrande]}>
                Catálogo de Productos
              </Text>
              <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.cuerpoPequeno]}>
                Precios, costos, formatos y rentabilidad estimada
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtnWrapper}
              onPress={handleOpenNew}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Nuevo producto"
            >
              <LinearGradient
                colors={['#57F5AB', '#00D2FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtnGradient}
              >
                <MaterialIcons name="add" size={24} color="#06120D" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Buscador de productos */}
          <View style={styles.searchBarContainer}>
            <MaterialIcons
              name="search"
              size={20}
              color={COLORS.onSurfaceVariant}
              style={styles.searchIcon}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre, formato o categoría..."
              placeholderTextColor={COLORS.onSurfaceVariant + '80'}
              style={[styles.searchInput, TYPOGRAPHY.cuerpoMedio]}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  setSearch('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={18} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros de Estado: TODOS | ACTIVOS | INACTIVOS */}
          <View style={styles.statusFilterTrack}>
            <TouchableOpacity
              style={[styles.statusFilterBtn, statusFilter === 'TODOS' && styles.statusFilterBtnActive]}
              onPress={() => {
                triggerSelection();
                setStatusFilter('TODOS');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  TYPOGRAPHY.etiquetaMayusculas,
                  statusFilter === 'TODOS' && styles.statusFilterTextActive,
                ]}
              >
                Todos ({totalCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusFilterBtn, statusFilter === 'ACTIVOS' && styles.statusFilterBtnActive]}
              onPress={() => {
                triggerSelection();
                setStatusFilter('ACTIVOS');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.activeDot} />
              <Text
                style={[
                  styles.statusFilterText,
                  TYPOGRAPHY.etiquetaMayusculas,
                  statusFilter === 'ACTIVOS' && styles.statusFilterTextActive,
                ]}
              >
                Activos ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusFilterBtn, statusFilter === 'INACTIVOS' && styles.statusFilterBtnActive]}
              onPress={() => {
                triggerSelection();
                setStatusFilter('INACTIVOS');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.inactiveDot} />
              <Text
                style={[
                  styles.statusFilterText,
                  TYPOGRAPHY.etiquetaMayusculas,
                  statusFilter === 'INACTIVOS' && styles.statusFilterTextActive,
                ]}
              >
                Inactivos ({inactiveCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filtros de Categorías Horizontales */}
          {categories.length > 0 && (
            <View style={styles.categoriesRow}>
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'TODAS' && styles.categoryChipActive]}
                onPress={() => {
                  triggerSelection();
                  setSelectedCategory('TODAS');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === 'TODAS' && styles.categoryChipTextActive,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>

              {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    onPress={() => {
                      triggerSelection();
                      setSelectedCategory(cat);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Lista de Productos */}
          {allProducts.length === 0 ? (
            <GlassCard variant="surface" style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="inventory-2" size={32} color={COLORS.secondary} />
              </View>
              <Text style={[styles.emptyTitle, TYPOGRAPHY.titularPequeno]}>
                {search ? 'Sin coincidencias' : 'Sin productos en el catálogo'}
              </Text>
              <Text style={[styles.emptySubtitle, TYPOGRAPHY.cuerpoMedio]}>
                {search
                  ? 'No se encontraron productos que coincidan con los filtros seleccionados.'
                  : 'Agrega los primeros productos, servicios o artículos de tu negocio.'}
              </Text>
              {!search && (
                <View style={styles.emptyBtnWrapper}>
                  <BotonBrillante
                    title="Agregar primer producto"
                    onPress={handleOpenNew}
                    icon={<MaterialIcons name="add" size={18} color="#06120D" />}
                  />
                </View>
              )}
            </GlassCard>
          ) : (
            <View style={styles.productsList}>
              {allProducts.map(product => (
                <TarjetaProducto
                  key={product.id}
                  product={product}
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
        </>
      )}

      {/* Modal para Crear o Editar Producto General */}
      <ModalProductoFoto
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

export const PestanaPreciosFotos = PestanaProductos;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  moduleSwitcherTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moduleSwitcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 16,
  },
  moduleSwitcherBtnActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.3)',
  },
  moduleSwitcherText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  moduleSwitcherTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  mainSectionTitle: {
    color: COLORS.onSurface,
  },
  mainSectionSubtitle: {
    color: COLORS.onSurfaceVariant,
  },
  actionBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.onSurface,
    paddingVertical: 12,
  },
  statusFilterTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusFilterBtnActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderColor: COLORS.secondary,
  },
  statusFilterText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusFilterTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.onSurfaceVariant,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderColor: COLORS.secondary,
  },
  categoryChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.onSurface,
  },
  emptySubtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyBtnWrapper: {
    marginTop: 8,
  },
  productsList: {
    gap: 12,
  },
});
