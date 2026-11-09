import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { Producto } from '@/datos/tipos';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesTarjetaProducto {
  product: Producto;
  onOpenDetail?: (product: Producto) => void;
  onQuickSale?: (product: Producto) => void;
  onQuickPurchase?: (product: Producto) => void;
  onEdit: (product: Producto) => void;
  onOpenPrices: (product: Producto) => void;
  onViewHistory: (productId: string) => void;
  onCalculate: (product: Producto) => void;
  onToggleActive: (product: Producto) => void;
  onDelete: (product: Producto) => void;
}

const getProductIcon = (nombre?: string) => {
  const nom = (nombre || '').toLowerCase();
  if (nom.includes('caf')) return 'local-cafe';
  if (nom.includes('foto') || nom.includes('cuadro') || nom.includes('lienzo')) return 'image';
  if (nom.includes('taza') || nom.includes('vaso')) return 'emoji-food-beverage';
  if (nom.includes('remera') || nom.includes('ropa')) return 'checkroom';
  return 'inventory-2';
};

/**
 * Tarjeta de producto adaptada al diseño visual Stitch de Kyrara Gez (Productos - Catálogo e Inventario).
 * Estilo Midnight Slate (#131A1D, #182226, #0F1619, #223037),
 * icono ámbar de producto, badges de stock esmeralda, precios en tipografía numérica
 * y botón de venta directa con icono point-of-sale.
 */
export const TarjetaProducto: React.FC<PropiedadesTarjetaProducto> = ({
  product,
  onOpenDetail,
  onQuickSale,
  onQuickPurchase,
  onEdit,
  onOpenPrices,
  onViewHistory,
  onCalculate,
  onToggleActive,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const hasPrice = product.basePrice !== undefined && product.basePrice > 0;
  const hasCost = product.costPrice !== undefined && product.costPrice > 0;
  const currentStock = product.currentStock ?? 0;
  const minStock = product.minStock ?? 0;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= minStock;

  // Cálculo de margen y ganancia
  const marginPercent = product.grossMarginPercent;
  const hasMargin = marginPercent !== null && marginPercent !== undefined;

  const handleCardPress = () => {
    triggerSelection();
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      onOpenPrices(product);
    }
  };

  const handleOpenMenu = () => {
    triggerSelection();
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
  };

  return (
    <View style={[styles.cardContainer, !product.isActive && styles.cardContainerInactive]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={handleCardPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`Producto ${product.name}, precio ${formatCurrency(product.basePrice || 0)}, stock ${currentStock}`}
      >
        {/* FILA 1: Icono del Producto, Nombre, SKU, Subtítulo y Botón Más Opciones */}
        <View style={styles.headerRow}>
          <View style={styles.productIconBox}>
            <MaterialIcons name={getProductIcon(product.name)} size={20} color="#FBBF24" />
          </View>

          <View style={styles.headerInfoCol}>
            <View style={styles.titleWrap}>
              <Text
                style={[
                  styles.productTitle,
                  TYPOGRAPHY.titularPequeno,
                  !product.isActive && styles.productTitleInactive,
                ]}
                numberOfLines={2}
              >
                {product.name}
              </Text>

              {product.sku ? (
                <View style={styles.skuBadge}>
                  <Text style={styles.skuBadgeText}>{product.sku}</Text>
                </View>
              ) : null}
            </View>


          </View>

          <TouchableOpacity
            style={styles.btnMore}
            onPress={handleOpenMenu}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Opciones de producto"
          >
            <MaterialIcons name="more-vert" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* FILA 2: Sección Financiera (Precio de venta, Costo y Badge de Margen) */}
        <View style={styles.financialRow}>
          <View style={styles.priceCol}>
            <Text style={[styles.salePriceText, TYPOGRAPHY.numericTable]}>
              {hasPrice ? formatCurrency(product.basePrice || 0) : 'Sin precio'}
            </Text>
            {hasCost ? (
              <Text style={styles.costPriceText}>
                Costo: {formatCurrency(product.costPrice || 0)}
              </Text>
            ) : (
              <Text style={styles.costPriceText}>Costo: --</Text>
            )}
          </View>

          {hasMargin ? (
            <View
              style={[
                styles.marginBadge,
                marginPercent >= 0 ? styles.marginBadgePositive : styles.marginBadgeNegative,
              ]}
            >
              <Text
                style={[
                  styles.marginBadgeText,
                  marginPercent >= 0 ? styles.marginTextPositive : styles.marginTextNegative,
                ]}
              >
                {marginPercent >= 0 ? `+${marginPercent.toFixed(0)}% Margen` : `${marginPercent.toFixed(0)}% Margen`}
              </Text>
            </View>
          ) : (
            <View style={styles.marginBadgeNeutral}>
              <Text style={styles.marginTextNeutral}>Margen --</Text>
            </View>
          )}
        </View>

        {/* FILA 3: Estado de Stock (Izquierda) y Acciones Rápidas (Derecha) */}
        <View style={styles.footerRow}>
          {/* Indicador de Stock con Punto Resplandor */}
          <View
            style={[
              styles.stockPill,
              isOutOfStock
                ? styles.stockPillOut
                : isLowStock
                  ? styles.stockPillLow
                  : styles.stockPillOptimal,
            ]}
          >
            <View
              style={[
                styles.stockDot,
                isOutOfStock
                  ? styles.stockDotOut
                  : isLowStock
                    ? styles.stockDotLow
                    : styles.stockDotOptimal,
              ]}
            />
            <Text
              style={[
                styles.stockPillText,
                isOutOfStock
                  ? styles.stockTextOut
                  : isLowStock
                    ? styles.stockTextLow
                    : styles.stockTextOptimal,
              ]}
              numberOfLines={1}
            >
              {isOutOfStock
                ? `0 ${product.saleUnit}s • Agotado`
                : isLowStock
                  ? `${currentStock} ${product.saleUnit}s • Mín. ${minStock}`
                  : `${currentStock} ${product.saleUnit}s • Óptimo`}
            </Text>
          </View>

          {/* Acciones Rápidas Directas en la Ficha */}
          <View style={styles.quickActionsRow}>
            {/* Botón Vender (rápido con icono point-of-sale asociado a Venta) */}
            {product.isActive && currentStock > 0 && (
              <TouchableOpacity
                style={styles.btnQuickSale}
                onPress={() => {
                  triggerSelection();
                  if (onQuickSale) {
                    onQuickSale(product);
                  } else if (onOpenDetail) {
                    onOpenDetail(product);
                  }
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <MaterialIcons name="point-of-sale" size={14} color="#57F5AB" />
                <Text style={styles.btnQuickSaleText}>Vender</Text>
              </TouchableOpacity>
            )}

            {/* Botón Añadir Stock / Reponer */}
            <TouchableOpacity
              style={isOutOfStock || isLowStock ? styles.btnQuickRestock : styles.btnQuickAdd}
              onPress={() => {
                triggerSelection();
                if (onQuickPurchase) {
                  onQuickPurchase(product);
                } else if (onOpenDetail) {
                  onOpenDetail(product);
                }
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <MaterialIcons
                name={isOutOfStock ? 'add-shopping-cart' : 'add'}
                size={isOutOfStock ? 14 : 16}
                color={isOutOfStock ? '#34D399' : '#FFFFFF'}
              />
              {isOutOfStock && <Text style={styles.btnQuickRestockText}>Reponer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* MODAL CONTEXTUAL DE ACCIONES RÁPIDAS (Stitch Menu Style) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableWithoutFeedback onPress={handleCloseMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContainer}>
                {/* Cabecera del Menú */}
                <View style={styles.menuHeader}>
                  <View style={styles.menuHeaderTitleWrap}>
                    <Text style={styles.menuHeaderTitle} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.menuHeaderSubtitle}>
                      {product.isActive ? 'Producto Activo' : 'Producto Inactivo'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCloseMenu}
                    style={styles.menuCloseBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialIcons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Ítems de acción */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleCloseMenu();
                    if (onOpenDetail) onOpenDetail(product);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="visibility" size={18} color="#00D2FF" />
                  <Text style={styles.menuItemText}>Ver detalles y kardex</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleCloseMenu();
                    onEdit(product);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="edit" size={18} color="#A78BFA" />
                  <Text style={styles.menuItemText}>Editar producto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleCloseMenu();
                    onOpenPrices(product);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="trending-up" size={18} color="#57F5AB" />
                  <Text style={styles.menuItemText}>Gestionar tarifas y precios</Text>
                </TouchableOpacity>

                {product.isActive && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      handleCloseMenu();
                      onCalculate(product);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="calculate" size={18} color="#00D2FF" />
                    <Text style={styles.menuItemText}>Calcular en calculadora</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleCloseMenu();
                    onViewHistory(product.id);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="history" size={18} color="#94A3B8" />
                  <Text style={styles.menuItemText}>Historial de precios</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleCloseMenu();
                    onToggleActive(product);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={product.isActive ? 'toggle-on' : 'toggle-off'}
                    size={20}
                    color={product.isActive ? '#57F5AB' : '#64748B'}
                  />
                  <Text style={styles.menuItemText}>
                    {product.isActive ? 'Desactivar producto' : 'Activar producto'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDelete]}
                  onPress={() => {
                    handleCloseMenu();
                    onDelete(product);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#FF6E6E" />
                  <Text style={[styles.menuItemText, { color: '#FF6E6E' }]}>
                    Eliminar producto
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#182226',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#223037',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardContainerInactive: {
    opacity: 0.6,
  },
  cardTouchable: {
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfoCol: {
    flex: 1,
    gap: 3,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  productTitleInactive: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  skuBadge: {
    backgroundColor: '#0F1619',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#223037',
  },
  skuBadgeText: {
    color: '#00D2FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  btnMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(34, 48, 55, 0.7)',
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  salePriceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  costPriceText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  marginBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  marginBadgePositive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.25)',
  },
  marginBadgeNegative: {
    backgroundColor: 'rgba(255, 110, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 110, 110, 0.25)',
  },
  marginBadgeNeutral: {
    backgroundColor: '#0F1619',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#223037',
  },
  marginBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  marginTextPositive: {
    color: '#57F5AB',
  },
  marginTextNegative: {
    color: '#FF6E6E',
  },
  marginTextNeutral: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    gap: 8,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 9999,
    flexShrink: 1,
  },
  stockPillOptimal: {
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  stockPillLow: {
    backgroundColor: 'rgba(120, 53, 15, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  stockPillOut: {
    backgroundColor: 'rgba(127, 29, 29, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockDotOptimal: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  stockDotLow: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  stockDotOut: {
    backgroundColor: '#EF4444',
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stockTextOptimal: {
    color: '#34D399',
  },
  stockTextLow: {
    color: '#FCD34D',
  },
  stockTextOut: {
    color: '#FCA5A5',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnQuickSale: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnQuickSaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57F5AB',
  },
  btnQuickAdd: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#8A4FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  btnQuickRestock: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnQuickRestockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#182226',
    borderRadius: 20,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#223037',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#223037',
    marginBottom: 4,
  },
  menuHeaderTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  menuHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  menuCloseBtn: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#223037',
    marginVertical: 4,
  },
  menuItemDelete: {
    backgroundColor: 'rgba(255, 110, 110, 0.08)',
  },
});
