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
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
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

/**
 * Tarjeta de producto adaptada al diseño visual Stitch de Kyrara Gez (Productos - Catálogo e Inventario).
 * Estilo Luminous Glassmorphism con Deep Midnight (#101415 y #181c1d),
 * badges de stock inteligentes, precios en tipografía numérica y acciones rápidas integradas.
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
        {/* FILA 1: Nombre, SKU, Subtítulo y Botón Más Opciones */}
        <View style={styles.headerRow}>
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

            <Text style={[styles.productSubtitle, TYPOGRAPHY.cuerpoPequeno]} numberOfLines={1}>
              {product.category}
              {product.saleUnit ? ` • ${product.saleUnit}` : ''}
              {product.supplier ? ` • ${product.supplier}` : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnMore}
            onPress={handleOpenMenu}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Opciones de producto"
          >
            <MaterialIcons name="more-vert" size={20} color={COLORS.bordeContorno} />
          </TouchableOpacity>
        </View>

        {/* FILA 2: Sección Financiera (Precio de venta, Costo y Badge de Margen con divisor limpio) */}
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
          {/* Indicador de Stock con Punto Lente / Resplandor */}
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

          {/* Acciones Rápidas Directas en la Tarjeta */}
          <View style={styles.quickActionsRow}>
            {/* Botón Vender (rápido) */}
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
                <MaterialIcons name="remove" size={15} color={COLORS.gasto} />
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
                size={isOutOfStock ? 15 : 17}
                color={isOutOfStock ? COLORS.primario : COLORS.enPrimarioContenedor}
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
                      {product.isActive ? 'Producto Activo' : 'Producto Inactivo'} • {product.category}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCloseMenu}
                    style={styles.menuCloseBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialIcons name="close" size={18} color={COLORS.enSuperficieVariante} />
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
                  <MaterialIcons name="visibility" size={18} color={COLORS.secundario} />
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
                  <MaterialIcons name="edit" size={18} color={COLORS.primario} />
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
                  <MaterialIcons name="trending-up" size={18} color={COLORS.ingreso} />
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
                    <MaterialIcons name="calculate" size={18} color={COLORS.secundarioContenedor} />
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
                  <MaterialIcons name="history" size={18} color={COLORS.enSuperficieVariante} />
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
                    color={product.isActive ? COLORS.ingreso : COLORS.bordeContorno}
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
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.gasto} />
                  <Text style={[styles.menuItemText, { color: COLORS.gasto }]}>
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
    backgroundColor: COLORS.superficieContenedorBajo, // #181c1d
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal, // rgba(209, 188, 255, 0.12)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardContainerInactive: {
    opacity: 0.65,
  },
  cardTouchable: {
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
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
    fontWeight: '600',
    color: COLORS.enSuperficie, // #e0e3e4
    lineHeight: 21,
  },
  productTitleInactive: {
    color: COLORS.enSuperficieVariante,
    textDecorationLine: 'line-through',
  },
  skuBadge: {
    backgroundColor: COLORS.superficieContenedorMasAlto, // #313536
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
  },
  skuBadgeText: {
    color: COLORS.secundario, // #a5e7ff
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productSubtitle: {
    color: COLORS.enSuperficieVariante, // #ccc3d8
    fontSize: 12,
    lineHeight: 16,
  },
  btnMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: -4,
    marginTop: -2,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  salePriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.enSuperficie,
    letterSpacing: -0.2,
  },
  costPriceText: {
    fontSize: 12,
    color: COLORS.bordeContorno, // #958da1
    fontWeight: '500',
  },
  marginBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  marginBadgePositive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  marginBadgeNegative: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  marginBadgeNeutral: {
    backgroundColor: COLORS.superficieContenedorMasAlto,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  marginBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  marginTextPositive: {
    color: COLORS.ingreso, // #57F5AB
  },
  marginTextNegative: {
    color: COLORS.gasto, // #FF8A9E
  },
  marginTextNeutral: {
    color: COLORS.enSuperficieVariante,
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
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
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  stockPillLow: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  stockPillOut: {
    backgroundColor: COLORS.superficieContenedorMasAlto,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockDotOptimal: {
    backgroundColor: COLORS.ingreso,
    shadowColor: COLORS.ingreso,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  stockDotLow: {
    backgroundColor: COLORS.gasto,
    shadowColor: COLORS.gasto,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  stockDotOut: {
    backgroundColor: COLORS.bordeContorno,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stockTextOptimal: {
    color: COLORS.ingreso,
  },
  stockTextLow: {
    color: COLORS.gasto,
  },
  stockTextOut: {
    color: COLORS.bordeContorno,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnQuickSale: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.superficieContenedorAlto, // #272b2c
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  btnQuickSaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.enSuperficie,
  },
  btnQuickAdd: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primarioContenedor, // #8a4fff
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primarioContenedor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  btnQuickRestock: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(209, 188, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(209, 188, 255, 0.3)',
  },
  btnQuickRestockText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primario,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 16, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.superficieContenedorAlto,
    borderRadius: 18,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.bordeCristal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  menuHeaderTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  menuHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.enSuperficie,
  },
  menuHeaderSubtitle: {
    fontSize: 11,
    color: COLORS.enSuperficieVariante,
    marginTop: 2,
  },
  menuCloseBtn: {
    padding: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.enSuperficie,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  menuItemDelete: {
    backgroundColor: 'rgba(255, 138, 158, 0.08)',
  },
});
