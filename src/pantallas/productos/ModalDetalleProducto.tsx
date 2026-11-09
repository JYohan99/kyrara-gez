import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import {
  gatillarSeleccion as triggerSelection,
  gatillarError as triggerError,
} from '@/compartido/utilidades/hapticos';
import { Producto, OperacionInventario } from '@/datos/tipos';
import {
  useOperacionesInventarioBoveda,
  useProductosBoveda,
  useCuentasBoveda,
} from '@/datos/hooks';
import { BadgeRentabilidad } from './BadgeRentabilidad';
import { SubModalVenta } from './detalle/SubModalVenta';
import { SubModalCompra } from './detalle/SubModalCompra';
import { SubModalAjuste } from './detalle/SubModalAjuste';
import { SubModalDevolucionProveedor } from './detalle/SubModalDevolucionProveedor';
import { SubModalDevolucionCliente } from './detalle/SubModalDevolucionCliente';

export interface PropiedadesModalDetalleProducto {
  visible: boolean;
  onClose: () => void;
  producto: Producto | null;
  onEditProduct?: (product: Producto) => void;
  accionInicial?: SubModalAccion;
}

export type TipoAccionDetalleProducto = SubModalAccion;

type SubModalAccion =
  | 'NINGUNA'
  | 'VENTA'
  | 'COMPRA'
  | 'DEVOLUCION_PROVEEDOR'
  | 'DEVOLUCION_CLIENTE'
  | 'AJUSTE';

const getProductIcon = (nombre?: string) => {
  const nom = (nombre || '').toLowerCase();
  if (nom.includes('caf')) return 'local-cafe';
  if (nom.includes('foto') || nom.includes('cuadro') || nom.includes('lienzo')) return 'image';
  if (nom.includes('taza') || nom.includes('vaso')) return 'emoji-food-beverage';
  if (nom.includes('remera') || nom.includes('ropa')) return 'checkroom';
  return 'inventory-2';
};

export const ModalDetalleProducto: React.FC<PropiedadesModalDetalleProducto> = ({
  visible,
  onClose,
  producto,
  onEditProduct,
  accionInicial,
}) => {
  const { products } = useProductosBoveda();
  const productoActual = producto ? products.find(p => p.id === producto.id) || producto : null;
  const cerrarSubModalRef = useRef<(() => void) | null>(null);

  const handleRequestClose = () => {
    if (cerrarSubModalRef.current) {
      cerrarSubModalRef.current();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible && !!productoActual}
      animationType="slide"
      transparent
      onRequestClose={handleRequestClose}
    >
      {productoActual ? (
        <ContenidoModalDetalleProducto
          key={`${productoActual.id}_${accionInicial || 'NONE'}`}
          productoActual={productoActual}
          onClose={onClose}
          onEditProduct={onEditProduct}
          accionInicial={accionInicial}
          onSubModalChange={cerrarFn => {
            cerrarSubModalRef.current = cerrarFn;
          }}
        />
      ) : null}
    </Modal>
  );
};

interface PropiedadesContenidoModalDetalleProducto {
  productoActual: Producto;
  onClose: () => void;
  onEditProduct?: (product: Producto) => void;
  accionInicial?: SubModalAccion;
  onSubModalChange?: (cerrarFn: (() => void) | null) => void;
}

const ContenidoModalDetalleProducto: React.FC<PropiedadesContenidoModalDetalleProducto> = ({
  productoActual,
  onClose,
  onEditProduct,
  accionInicial,
  onSubModalChange,
}) => {
  const insets = useSafeAreaInsets();

  // Bóveda reactiva: operaciones y cuentas financieras
  const { accounts } = useCuentasBoveda();
  const { operations } = useOperacionesInventarioBoveda(productoActual.id);

  // Sub-modal activo inicializado según la acción recibida
  const [subModal, setSubModal] = useState<SubModalAccion>(accionInicial || 'NINGUNA');
  const [operacionVentaSeleccionada, setOperacionVentaSeleccionada] = useState<OperacionInventario | null>(null);

  const currentStock = productoActual.currentStock ?? 0;
  const minStock = productoActual.minStock ?? 0;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= minStock;
  const calculatedProfit = productoActual.grossProfit ?? ((productoActual.basePrice || 0) - (productoActual.costPrice || 0));
  const totalStockCost = Math.round(currentStock * (productoActual.costPrice || 0));
  const totalStockSale = Math.round(currentStock * (productoActual.basePrice || 0));

  // Ventas para devoluciones de clientes
  const operacionesVenta = useMemo(
    () => operations.filter(op => op.type === 'SALE'),
    [operations]
  );

  // Métricas históricas de rendimiento del producto
  const { totalUnitsSold, totalSalesAmount, totalCollectedAmount, totalGrossProfitProduct } = useMemo(() => {
    let units = 0;
    let sales = 0;
    let collected = 0;
    let profit = 0;
    for (const op of operations) {
      if (op.type === 'SALE') {
        units += op.quantity;
        sales += op.totalPrice || 0;
        if (op.paymentStatus === 'PAID') {
          collected += op.totalPrice || 0;
        }
        profit += op.grossProfit || 0;
      } else if (op.type === 'CUSTOMER_RETURN') {
        units -= op.quantity;
        sales += op.totalPrice || 0;
        if (op.paymentMethod === 'REFUND_FROM_ACCOUNT') {
          collected += op.totalPrice || 0;
        }
        profit += op.grossProfit || 0;
      }
    }
    return {
      totalUnitsSold: Math.max(0, units),
      totalSalesAmount: Math.max(0, sales),
      totalCollectedAmount: Math.max(0, collected),
      totalGrossProfitProduct: profit,
    };
  }, [operations]);

  // Handlers
  const handleAbrirVenta = () => {
    triggerSelection();
    if (currentStock <= 0) {
      triggerError();
      Alert.alert('Sin existencias', 'Este producto no tiene stock disponible para registrar una venta.');
      return;
    }
    setSubModal('VENTA');
  };

  const handleAbrirCompra = () => {
    triggerSelection();
    setSubModal('COMPRA');
  };

  const handleAbrirDevolucionProveedor = () => {
    triggerSelection();
    if (currentStock <= 0) {
      triggerError();
      Alert.alert('Sin stock disponible', 'No hay unidades en stock para devolver al proveedor.');
      return;
    }
    setSubModal('DEVOLUCION_PROVEEDOR');
  };

  const handleAbrirDevolucionCliente = (op?: OperacionInventario) => {
    triggerSelection();
    setOperacionVentaSeleccionada(op || null);
    setSubModal('DEVOLUCION_CLIENTE');
  };

  const handleAbrirAjuste = () => {
    triggerSelection();
    setSubModal('AJUSTE');
  };

  const handleCerrarSubModal = useCallback(() => {
    setSubModal('NINGUNA');
    setOperacionVentaSeleccionada(null);
    if (accionInicial) {
      onClose();
    }
  }, [accionInicial, onClose]);

  useEffect(() => {
    if (onSubModalChange) {
      if (subModal !== 'NINGUNA') {
        onSubModalChange(handleCerrarSubModal);
      } else {
        onSubModalChange(null);
      }
    }
  }, [subModal, onSubModalChange, handleCerrarSubModal]);

  const renderBadgeTipoOperacion = (tipo: OperacionInventario['type']) => {
    switch (tipo) {
      case 'SALE':
        return (
          <View style={[styles.opBadge, styles.opBadgeSale]}>
            <MaterialIcons name="point-of-sale" size={12} color="#57F5AB" />
            <Text style={[styles.opBadgeText, { color: '#57F5AB' }]}>VENTA</Text>
          </View>
        );
      case 'CUSTOMER_RETURN':
        return (
          <View style={[styles.opBadge, styles.opBadgeCustomerReturn]}>
            <MaterialIcons name="replay" size={12} color="#00D2FF" />
            <Text style={[styles.opBadgeText, { color: '#00D2FF' }]}>DEV. CLIENTE</Text>
          </View>
        );
      case 'PURCHASE':
        return (
          <View style={[styles.opBadge, styles.opBadgePurchase]}>
            <MaterialIcons name="add-shopping-cart" size={12} color="#10B981" />
            <Text style={[styles.opBadgeText, { color: '#10B981' }]}>COMPRA</Text>
          </View>
        );
      case 'SUPPLIER_RETURN':
        return (
          <View style={[styles.opBadge, styles.opBadgeReturn]}>
            <MaterialIcons name="undo" size={12} color="#FF9100" />
            <Text style={[styles.opBadgeText, { color: '#FF9100' }]}>DEV. PROVEEDOR</Text>
          </View>
        );
      case 'ADJUSTMENT':
        return (
          <View style={[styles.opBadge, styles.opBadgeAdjustment]}>
            <MaterialIcons name="tune" size={12} color="#D1BCFF" />
            <Text style={[styles.opBadgeText, { color: '#D1BCFF' }]}>AJUSTE</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Indicador de arrastre superior */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Header con icono ámbar Stitch, Nombre, Badges y Acciones */}
        <View style={styles.headerRow}>
          <View style={styles.productIconBox}>
            <MaterialIcons name={getProductIcon(productoActual.name)} size={22} color="#FBBF24" />
          </View>

          <View style={styles.headerTitleCol}>
            <View style={styles.headerBadgesRow}>
              {productoActual.sku ? (
                <View style={styles.skuBadge}>
                  <MaterialIcons name="qr-code" size={11} color="#00D2FF" />
                  <Text style={styles.skuBadgeText}>{productoActual.sku}</Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.statusPill,
                  productoActual.isActive ? styles.statusPillActive : styles.statusPillInactive,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    productoActual.isActive ? styles.statusDotActive : styles.statusDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    { color: productoActual.isActive ? '#34D399' : '#94A3B8' },
                  ]}
                >
                  {productoActual.isActive ? 'Activo' : 'Archivado'}
                </Text>
              </View>
            </View>

            <Text style={[styles.productNameTitle, TYPOGRAPHY.titularGrande]} numberOfLines={2}>
              {productoActual.name}
            </Text>
          </View>

          <View style={styles.headerActionBtns}>
            {onEditProduct && (
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  onClose();
                  onEditProduct(productoActual);
                }}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Editar producto"
              >
                <MaterialIcons name="edit" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                onClose();
              }}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cerrar modal"
            >
              <MaterialIcons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tarjeta Destacada de Stock (Stitch Card) */}
          <View style={styles.stockHeroCard}>
            <View style={styles.stockHeroHeader}>
              <View style={styles.stockHeroLabelGroup}>
                <MaterialIcons name="inventory-2" size={18} color="#00D2FF" />
                <Text style={[styles.stockHeroLabel, TYPOGRAPHY.etiquetaMayusculas]}>
                  Stock Actual Disponible
                </Text>
              </View>

              {/* Badge Alerta de Stock */}
              <View
                style={[
                  styles.stockAlertBadge,
                  isOutOfStock
                    ? styles.stockAlertOutOfStock
                    : isLowStock
                    ? styles.stockAlertLowStock
                    : styles.stockAlertNormal,
                ]}
              >
                <MaterialIcons
                  name={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'check-circle'}
                  size={14}
                  color={isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981'}
                />
                <Text
                  style={[
                    styles.stockAlertText,
                    {
                      color: isOutOfStock ? '#FCA5A5' : isLowStock ? '#FCD34D' : '#34D399',
                    },
                  ]}
                >
                  {isOutOfStock ? 'Sin stock' : isLowStock ? 'Stock bajo' : 'Stock óptimo'}
                </Text>
              </View>
            </View>

            <View style={styles.stockNumbersRow}>
              <Text style={[styles.stockBigNumber, TYPOGRAPHY.titularHero]}>
                {currentStock}
              </Text>
              <Text style={[styles.stockUnitText, TYPOGRAPHY.titularPequeno]}>
                {productoActual.saleUnit}s
              </Text>
            </View>

            <View style={styles.stockMetaRow}>
              <View style={styles.stockMetaItem}>
                <Text style={styles.stockMetaLabel}>Stock Mínimo</Text>
                <Text style={styles.stockMetaValue}>{minStock} {productoActual.saleUnit}s</Text>
              </View>
              <View style={styles.stockMetaDivider} />
              <View style={styles.stockMetaItem}>
                <Text style={styles.stockMetaLabel}>Valuación Costo</Text>
                <Text style={styles.stockMetaValue}>{formatCurrency(totalStockCost)}</Text>
              </View>
              <View style={styles.stockMetaDivider} />
              <View style={styles.stockMetaItem}>
                <Text style={styles.stockMetaLabel}>Valuación Venta</Text>
                <Text style={styles.stockMetaValue}>{formatCurrency(totalStockSale)}</Text>
              </View>
            </View>
          </View>

          {/* BOTONES PRINCIPALES DE OPERACIÓN: VENTA Y COMPRA */}
          <View style={styles.primaryActionRow}>
            {/* Botón Destacado: Registrar Venta con icono point-of-sale */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnSalePrimary]}
              onPress={handleAbrirVenta}
              activeOpacity={0.8}
            >
              <View style={[styles.primaryActionIconBadge, { backgroundColor: 'rgba(87, 245, 171, 0.15)' }]}>
                <MaterialIcons name="point-of-sale" size={20} color="#57F5AB" />
              </View>
              <View style={styles.primaryActionTextCol}>
                <Text style={[styles.primaryActionTitle, { color: '#57F5AB' }]}>Registrar Venta</Text>
                <Text style={styles.primaryActionSubtitle}>Cobro y salida de stock</Text>
              </View>
            </TouchableOpacity>

            {/* Botón: Registrar Compra */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnPurchasePrimary]}
              onPress={handleAbrirCompra}
              activeOpacity={0.8}
            >
              <View style={[styles.primaryActionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <MaterialIcons name="add-shopping-cart" size={20} color="#10B981" />
              </View>
              <View style={styles.primaryActionTextCol}>
                <Text style={[styles.primaryActionTitle, { color: '#10B981' }]}>Registrar Compra</Text>
                <Text style={styles.primaryActionSubtitle}>Ingreso de mercadería</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* BOTONES SECUNDARIOS: DEVOLUCIÓN DE CLIENTE, DEV. A PROVEEDOR Y AJUSTE */}
          <View style={styles.secondaryActionRow}>
            {/* Devolución de Cliente */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, styles.btnSecondaryCustomerReturn]}
              onPress={() => handleAbrirDevolucionCliente()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="replay" size={16} color="#00D2FF" />
              <Text style={[styles.secondaryActionText, { color: '#00D2FF' }]}>Dev. Cliente</Text>
            </TouchableOpacity>

            {/* Devolución a Proveedor */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, styles.btnSecondarySupplierReturn]}
              onPress={handleAbrirDevolucionProveedor}
              activeOpacity={0.8}
            >
              <MaterialIcons name="undo" size={16} color="#FF9100" />
              <Text style={[styles.secondaryActionText, { color: '#FF9100' }]}>Dev. Proveedor</Text>
            </TouchableOpacity>

            {/* Ajuste de Inventario */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, styles.btnSecondaryAdjustment]}
              onPress={handleAbrirAjuste}
              activeOpacity={0.8}
            >
              <MaterialIcons name="tune" size={16} color="#D1BCFF" />
              <Text style={[styles.secondaryActionText, { color: '#D1BCFF' }]}>Ajustar Stock</Text>
            </TouchableOpacity>
          </View>

          {/* Métricas de Rendimiento Comercial del Producto */}
          <View style={styles.productPerformanceCard}>
            <View style={styles.performanceHeader}>
              <MaterialIcons name="trending-up" size={16} color="#00D2FF" />
              <Text style={[styles.performanceTitle, TYPOGRAPHY.etiquetaMayusculas]}>
                Rendimiento de Ventas de este Producto
              </Text>
            </View>

            <View style={styles.performanceGrid}>
              <View style={styles.perfCol}>
                <Text style={styles.perfLabel}>Total Vendido</Text>
                <Text style={styles.perfValue}>{formatCurrency(totalSalesAmount)}</Text>
                <Text style={styles.perfSub}>{totalUnitsSold} {productoActual.saleUnit}s</Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfCol}>
                <Text style={styles.perfLabel}>Cobrado Efectivo</Text>
                <Text style={styles.perfValue}>{formatCurrency(totalCollectedAmount)}</Text>
                <Text style={styles.perfSub}>
                  Pend: {formatCurrency(Math.max(0, totalSalesAmount - totalCollectedAmount))}
                </Text>
              </View>
              <View style={styles.perfDivider} />
              <View style={styles.perfCol}>
                <Text style={styles.perfLabel}>Ganancia Bruta</Text>
                <Text
                  style={[
                    styles.perfValue,
                    totalGrossProfitProduct >= 0 ? styles.profitPositive : styles.profitNegative,
                  ]}
                >
                  {formatCurrency(totalGrossProfitProduct)}
                </Text>
                <Text style={styles.perfSub}>Histórica acumulada</Text>
              </View>
            </View>
          </View>

          {/* Datos Comerciales: Precios, Costos y Proveedor */}
          <View style={styles.specsSection}>
            <View style={styles.financialRow}>
              <View style={styles.finBox}>
                <Text style={styles.finBoxLabel}>Precio Venta Unit.</Text>
                <Text style={styles.finBoxValue}>{formatCurrency(productoActual.basePrice || 0)}</Text>
              </View>
              <View style={styles.finBox}>
                <Text style={styles.finBoxLabel}>Costo Unitario</Text>
                <Text style={styles.finBoxValue}>{formatCurrency(productoActual.costPrice || 0)}</Text>
              </View>
              <View style={styles.finBox}>
                <Text style={styles.finBoxLabel}>Margen Unitario</Text>
                <Text
                  style={[
                    styles.finBoxValue,
                    calculatedProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                  ]}
                >
                  {formatCurrency(calculatedProfit)}
                </Text>
                {productoActual.grossMarginPercent !== null && productoActual.grossMarginPercent !== undefined && (
                  <BadgeRentabilidad margen={productoActual.grossMarginPercent} />
                )}
              </View>
            </View>

            {/* Metadatos adicionales: Proveedor, Formato, Descripción */}
            {(productoActual.supplier || productoActual.sizeFormat || productoActual.description) && (
              <View style={styles.extraMetadataCard}>
                {productoActual.supplier ? (
                  <View style={styles.metaRow}>
                    <MaterialIcons name="local-shipping" size={15} color="#94A3B8" />
                    <Text style={styles.metaKey}>Proveedor:</Text>
                    <Text style={styles.metaVal}>{productoActual.supplier}</Text>
                  </View>
                ) : null}

                {productoActual.sizeFormat ? (
                  <View style={styles.metaRow}>
                    <MaterialIcons name="crop" size={15} color="#94A3B8" />
                    <Text style={styles.metaKey}>Formato / Medida:</Text>
                    <Text style={styles.metaVal}>{productoActual.sizeFormat}</Text>
                  </View>
                ) : null}

                {productoActual.description ? (
                  <View style={styles.descriptionRow}>
                    <Text style={styles.metaKey}>Notas:</Text>
                    <Text style={styles.descriptionVal}>{productoActual.description}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* SECCIÓN HISTORIAL DE OPERACIONES DEL PRODUCTO */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <MaterialIcons name="receipt-long" size={18} color="#00D2FF" />
                <Text style={[styles.historyTitle, TYPOGRAPHY.titularPequeno]}>
                  Historial de Operaciones
                </Text>
              </View>
              <View style={styles.historyCountBadge}>
                <Text style={styles.historyCountText}>{operations.length}</Text>
              </View>
            </View>

            {operations.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <MaterialIcons name="history-toggle-off" size={32} color="rgba(148, 163, 184, 0.4)" />
                <Text style={styles.emptyHistoryTitle}>Sin operaciones registradas</Text>
                <Text style={styles.emptyHistoryText}>
                  Las ventas, compras, devoluciones y ajustes de inventario quedarán registrados aquí.
                </Text>
              </View>
            ) : (
              <View style={styles.operationsList}>
                {operations.map(op => {
                  const isSale = op.type === 'SALE';
                  const isCustomerReturn = op.type === 'CUSTOMER_RETURN';
                  const isPositive = op.type === 'PURCHASE' || isCustomerReturn || (op.type === 'ADJUSTMENT' && op.newStock > op.previousStock);
                  const delta = op.newStock - op.previousStock;
                  const dateFormatted = new Date(op.date).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={op.id} style={styles.operationCard}>
                      <View style={styles.opCardHeader}>
                        {renderBadgeTipoOperacion(op.type)}
                        <Text style={styles.opDateText}>{dateFormatted}</Text>
                      </View>

                      <View style={styles.opCardBody}>
                        <View style={styles.opQtyCol}>
                          <Text
                            style={[
                              styles.opDeltaText,
                              isPositive ? styles.deltaPositive : styles.deltaNegative,
                            ]}
                          >
                            {delta > 0 ? `+${delta}` : delta} {productoActual.saleUnit}s
                          </Text>
                          <Text style={styles.opStockTransition}>
                            {op.previousStock} → {op.newStock} en stock
                          </Text>
                        </View>

                        {/* Sección Financiera de la Operación */}
                        <View style={styles.opCostCol}>
                          {isSale && op.totalPrice !== undefined ? (
                            <>
                              <Text style={styles.opCostLabel}>Venta Total</Text>
                              <Text style={[styles.opCostVal, { color: '#57F5AB' }]}>
                                {formatCurrency(op.totalPrice)}
                              </Text>
                              {op.grossProfit !== undefined && (
                                <Text style={styles.opProfitVal}>
                                  Ganancia: {formatCurrency(op.grossProfit)}
                                </Text>
                              )}
                            </>
                          ) : isCustomerReturn && op.totalPrice !== undefined ? (
                            <>
                              <Text style={styles.opCostLabel}>Reembolsado</Text>
                              <Text style={[styles.opCostVal, { color: '#FF6E6E' }]}>
                                -{formatCurrency(op.totalPrice)}
                              </Text>
                            </>
                          ) : op.totalCost !== undefined && op.totalCost > 0 ? (
                            <>
                              <Text style={styles.opCostLabel}>Importe</Text>
                              <Text style={styles.opCostVal}>{formatCurrency(op.totalCost)}</Text>
                              {op.unitCost !== undefined && (
                                <Text style={styles.opUnitCostVal}>
                                  @{formatCurrency(op.unitCost)}/u
                                </Text>
                              )}
                            </>
                          ) : null}
                        </View>
                      </View>

                      {/* Detalles Financieros y Estado de Pago */}
                      <View style={styles.opDetailsBox}>
                        {isSale && (
                          <View style={styles.saleFinancialAuditRow}>
                            <View style={styles.auditItem}>
                              <Text style={styles.auditKey}>Cobro:</Text>
                              {op.paymentStatus === 'PAID' ? (
                                <View style={styles.auditBadgePaid}>
                                  <MaterialIcons name="check-circle" size={11} color="#00E676" />
                                  <Text style={styles.auditPaidText}>
                                    Cobrado en {op.accountName || 'Cuenta'}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.auditBadgePending}>
                                  <MaterialIcons name="pending" size={11} color="#FFB300" />
                                  <Text style={styles.auditPendingText}>
                                    Pendiente de cobro
                                  </Text>
                                </View>
                              )}
                            </View>

                            {op.totalCost !== undefined && (
                              <View style={styles.auditItem}>
                                <Text style={styles.auditKey}>Costo de lo vendido:</Text>
                                <Text style={styles.auditVal}>{formatCurrency(op.totalCost)}</Text>
                              </View>
                            )}
                          </View>
                        )}

                        {op.customer && (
                          <View style={styles.opDetailRow}>
                            <MaterialIcons name="person" size={13} color="#94A3B8" />
                            <Text style={styles.opDetailLabel}>Cliente:</Text>
                            <Text style={styles.opDetailVal}>{op.customer}</Text>
                          </View>
                        )}

                        {op.reason && (
                          <View style={styles.opDetailRow}>
                            <MaterialIcons name="info-outline" size={13} color="#94A3B8" />
                            <Text style={styles.opDetailLabel}>Motivo:</Text>
                            <Text style={styles.opDetailVal}>{op.reason}</Text>
                          </View>
                        )}

                        {op.supplier && (
                          <View style={styles.opDetailRow}>
                            <MaterialIcons name="local-shipping" size={13} color="#94A3B8" />
                            <Text style={styles.opDetailLabel}>Proveedor:</Text>
                            <Text style={styles.opDetailVal}>{op.supplier}</Text>
                          </View>
                        )}

                        {op.notes && (
                          <Text style={styles.opNotesVal} numberOfLines={2}>
                            {op.notes}
                          </Text>
                        )}

                        {/* Botón de acción contextual: Devolución de Cliente */}
                        {isSale && (
                          <TouchableOpacity
                            style={styles.cardCustomerReturnBtn}
                            onPress={() => handleAbrirDevolucionCliente(op)}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="replay" size={13} color="#00D2FF" />
                            <Text style={styles.cardCustomerReturnBtnText}>
                              Registrar devolución de esta venta
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* =========================================================================
          SUB-MODALES MODULARIZADOS
      ========================================================================= */}
      {subModal === 'VENTA' && (
        <SubModalVenta
          visible={true}
          onClose={handleCerrarSubModal}
          onSuccess={handleCerrarSubModal}
          producto={productoActual}
          cuentas={accounts}
        />
      )}

      {subModal === 'COMPRA' && (
        <SubModalCompra
          visible={true}
          onClose={handleCerrarSubModal}
          onSuccess={handleCerrarSubModal}
          producto={productoActual}
        />
      )}

      {subModal === 'AJUSTE' && (
        <SubModalAjuste
          visible={true}
          onClose={handleCerrarSubModal}
          onSuccess={handleCerrarSubModal}
          producto={productoActual}
        />
      )}

      {subModal === 'DEVOLUCION_PROVEEDOR' && (
        <SubModalDevolucionProveedor
          visible={true}
          onClose={handleCerrarSubModal}
          onSuccess={handleCerrarSubModal}
          producto={productoActual}
        />
      )}

      {subModal === 'DEVOLUCION_CLIENTE' && (
        <SubModalDevolucionCliente
          visible={true}
          onClose={handleCerrarSubModal}
          onSuccess={handleCerrarSubModal}
          producto={productoActual}
          cuentas={accounts}
          operacionesVenta={operacionesVenta}
          operacionVentaInicial={operacionVentaSeleccionada}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#131A1D',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#223037',
    maxHeight: '92%',
    flexShrink: 1,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#223037',
    gap: 12,
  },
  productIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    gap: 5,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  skuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F1619',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#223037',
  },
  skuBadgeText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  statusPillActive: {
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusPillInactive: {
    backgroundColor: '#0F1619',
    borderWidth: 1,
    borderColor: '#223037',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#64748B',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  productNameTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#182226',
    borderWidth: 1,
    borderColor: '#223037',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },

  // Stock Hero Card
  stockHeroCard: {
    backgroundColor: '#182226',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#223037',
    padding: 16,
    gap: 12,
  },
  stockHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockHeroLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockHeroLabel: {
    color: '#94A3B8',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  stockAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  stockAlertNormal: {
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  stockAlertLowStock: {
    backgroundColor: 'rgba(120, 53, 15, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  stockAlertOutOfStock: {
    backgroundColor: 'rgba(127, 29, 29, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  stockAlertText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  stockBigNumber: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
  },
  stockUnitText: {
    color: '#94A3B8',
  },
  stockMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#223037',
  },
  stockMetaItem: {
    flex: 1,
    gap: 2,
  },
  stockMetaLabel: {
    color: '#64748B',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  stockMetaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stockMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#223037',
    marginHorizontal: 8,
  },

  // Primary Actions: Venta & Compra
  primaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#182226',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  btnSalePrimary: {
    borderColor: 'rgba(87, 245, 171, 0.35)',
    backgroundColor: 'rgba(87, 245, 171, 0.08)',
  },
  btnPurchasePrimary: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  primaryActionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionTextCol: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryActionSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
  },

  // Secondary Actions: Dev. Cliente, Dev. Proveedor, Ajustar
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#182226',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#223037',
  },
  btnSecondaryCustomerReturn: {
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  btnSecondarySupplierReturn: {
    borderColor: 'rgba(255, 145, 0, 0.25)',
  },
  btnSecondaryAdjustment: {
    borderColor: 'rgba(209, 188, 255, 0.25)',
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Performance Card
  productPerformanceCard: {
    backgroundColor: '#182226',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#223037',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceTitle: {
    color: '#00D2FF',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  performanceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perfCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  perfDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#223037',
  },
  perfLabel: {
    color: '#64748B',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  perfValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  perfSub: {
    color: '#94A3B8',
    fontSize: 10,
  },

  // Specs and metadata
  specsSection: {
    gap: 12,
  },
  financialRow: {
    flexDirection: 'row',
    gap: 8,
  },
  finBox: {
    flex: 1,
    backgroundColor: '#182226',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#223037',
  },
  finBoxLabel: {
    color: '#64748B',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  finBoxValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  profitPositive: {
    color: '#57F5AB',
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  extraMetadataCard: {
    backgroundColor: '#182226',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#223037',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaKey: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metaVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionRow: {
    gap: 2,
    paddingTop: 4,
  },
  descriptionVal: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },

  // Historial Section
  historySection: {
    gap: 12,
    paddingTop: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    color: '#FFFFFF',
  },
  historyCountBadge: {
    backgroundColor: '#0F1619',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#223037',
  },
  historyCountText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHistoryBox: {
    backgroundColor: '#182226',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#223037',
  },
  emptyHistoryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHistoryText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  operationsList: {
    gap: 10,
  },
  operationCard: {
    backgroundColor: '#182226',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#223037',
  },
  opCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opBadgeSale: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
  },
  opBadgeCustomerReturn: {
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
  },
  opBadgePurchase: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  opBadgeReturn: {
    backgroundColor: 'rgba(255, 145, 0, 0.15)',
  },
  opBadgeAdjustment: {
    backgroundColor: 'rgba(209, 188, 255, 0.15)',
  },
  opBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  opDateText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  opCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opQtyCol: {
    gap: 2,
  },
  opDeltaText: {
    fontSize: 16,
    fontWeight: '800',
  },
  deltaPositive: {
    color: '#10B981',
  },
  deltaNegative: {
    color: '#FF6E6E',
  },
  opStockTransition: {
    color: '#94A3B8',
    fontSize: 11,
  },
  opCostCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  opCostLabel: {
    color: '#64748B',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  opCostVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  opProfitVal: {
    color: '#57F5AB',
    fontSize: 10,
    fontWeight: '700',
  },
  opUnitCostVal: {
    color: '#94A3B8',
    fontSize: 10,
  },
  opDetailsBox: {
    backgroundColor: '#0F1619',
    borderRadius: 10,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 48, 55, 0.6)',
  },
  saleFinancialAuditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#223037',
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditKey: {
    color: '#64748B',
    fontSize: 10,
  },
  auditVal: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  auditBadgePaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  auditPaidText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
  },
  auditBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  auditPendingText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '600',
  },
  opDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  opDetailLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  opDetailVal: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  opNotesVal: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  cardCustomerReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  cardCustomerReturnBtnText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '600',
  },
});
