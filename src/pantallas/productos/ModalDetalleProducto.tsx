import React, { useState, useMemo } from 'react';
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
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
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

export const ModalDetalleProducto: React.FC<PropiedadesModalDetalleProducto> = ({
  visible,
  onClose,
  producto,
  onEditProduct,
  accionInicial,
}) => {
  const { products } = useProductosBoveda();
  const productoActual = producto ? products.find(p => p.id === producto.id) || producto : null;

  return (
    <Modal
      visible={visible && !!productoActual}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {productoActual ? (
        <ContenidoModalDetalleProducto
          key={`${productoActual.id}_${accionInicial || 'NONE'}`}
          productoActual={productoActual}
          onClose={onClose}
          onEditProduct={onEditProduct}
          accionInicial={accionInicial}
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
}

const ContenidoModalDetalleProducto: React.FC<PropiedadesContenidoModalDetalleProducto> = ({
  productoActual,
  onClose,
  onEditProduct,
  accionInicial,
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

  const renderBadgeTipoOperacion = (tipo: OperacionInventario['type']) => {
    switch (tipo) {
      case 'SALE':
        return (
          <View style={[styles.opBadge, styles.opBadgeSale]}>
            <MaterialIcons name="shopping-bag" size={12} color="#57F5AB" />
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
            <MaterialIcons name="add-circle-outline" size={12} color="#00E676" />
            <Text style={[styles.opBadgeText, { color: '#00E676' }]}>COMPRA</Text>
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleCol}>
            <View style={styles.headerBadgesRow}>
              {productoActual.sku ? (
                <View style={styles.skuBadge}>
                  <MaterialIcons name="qr-code" size={11} color={COLORS.secondary} />
                  <Text style={styles.skuBadgeText}>{productoActual.sku}</Text>
                </View>
              ) : null}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{productoActual.category}</Text>
              </View>
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
                <Text style={styles.statusPillText}>
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
              >
                <MaterialIcons name="edit" size={20} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                triggerSelection();
                onClose();
              }}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tarjeta Destacada de Stock */}
          <GlassCard variant="surface" style={styles.stockHeroCard}>
            <View style={styles.stockHeroHeader}>
              <View style={styles.stockHeroLabelGroup}>
                <MaterialIcons name="inventory-2" size={18} color={COLORS.secondary} />
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
                  color={isOutOfStock ? '#FF5252' : isLowStock ? '#FFB300' : '#00E676'}
                />
                <Text
                  style={[
                    styles.stockAlertText,
                    {
                      color: isOutOfStock ? '#FF5252' : isLowStock ? '#FFB300' : '#00E676',
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
          </GlassCard>

          {/* BOTONES PRINCIPALES DE OPERACIÓN: VENTA Y COMPRA */}
          <View style={styles.primaryActionRow}>
            {/* Botón Destacado: Registrar Venta */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.btnSalePrimary]}
              onPress={handleAbrirVenta}
              activeOpacity={0.8}
            >
              <View style={[styles.primaryActionIconBadge, { backgroundColor: 'rgba(87, 245, 171, 0.2)' }]}>
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
              <View style={[styles.primaryActionIconBadge, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                <MaterialIcons name="add-shopping-cart" size={20} color="#00E676" />
              </View>
              <View style={styles.primaryActionTextCol}>
                <Text style={[styles.primaryActionTitle, { color: '#00E676' }]}>Registrar Compra</Text>
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
              <MaterialIcons name="trending-up" size={16} color={COLORS.secondary} />
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
                    <MaterialIcons name="local-shipping" size={15} color={COLORS.onSurfaceVariant} />
                    <Text style={styles.metaKey}>Proveedor:</Text>
                    <Text style={styles.metaVal}>{productoActual.supplier}</Text>
                  </View>
                ) : null}

                {productoActual.sizeFormat ? (
                  <View style={styles.metaRow}>
                    <MaterialIcons name="crop" size={15} color={COLORS.onSurfaceVariant} />
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
                <MaterialIcons name="receipt-long" size={18} color={COLORS.secondary} />
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
                <MaterialIcons name="history-toggle-off" size={32} color={COLORS.onSurfaceVariant + '60'} />
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
                            <MaterialIcons name="person" size={13} color={COLORS.onSurfaceVariant} />
                            <Text style={styles.opDetailLabel}>Cliente:</Text>
                            <Text style={styles.opDetailVal}>{op.customer}</Text>
                          </View>
                        )}

                        {op.reason && (
                          <View style={styles.opDetailRow}>
                            <MaterialIcons name="info-outline" size={13} color={COLORS.onSurfaceVariant} />
                            <Text style={styles.opDetailLabel}>Motivo:</Text>
                            <Text style={styles.opDetailVal}>{op.reason}</Text>
                          </View>
                        )}

                        {op.supplier && (
                          <View style={styles.opDetailRow}>
                            <MaterialIcons name="local-shipping" size={13} color={COLORS.onSurfaceVariant} />
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
      <SubModalVenta
        visible={subModal === 'VENTA'}
        onClose={() => setSubModal('NINGUNA')}
        producto={productoActual}
        cuentas={accounts}
      />

      <SubModalCompra
        visible={subModal === 'COMPRA'}
        onClose={() => setSubModal('NINGUNA')}
        producto={productoActual}
      />

      <SubModalAjuste
        visible={subModal === 'AJUSTE'}
        onClose={() => setSubModal('NINGUNA')}
        producto={productoActual}
      />

      <SubModalDevolucionProveedor
        visible={subModal === 'DEVOLUCION_PROVEEDOR'}
        onClose={() => setSubModal('NINGUNA')}
        producto={productoActual}
      />

      <SubModalDevolucionCliente
        visible={subModal === 'DEVOLUCION_CLIENTE'}
        onClose={() => {
          setSubModal('NINGUNA');
          setOperacionVentaSeleccionada(null);
        }}
        producto={productoActual}
        cuentas={accounts}
        operacionesVenta={operacionesVenta}
        operacionVentaInicial={operacionVentaSeleccionada}
      />
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
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '92%',
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleCol: {
    flex: 1,
    gap: 6,
    paddingRight: 10,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  skuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(87, 245, 171, 0.25)',
  },
  skuBadgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: COLORS.secondary,
  },
  statusDotInactive: {
    backgroundColor: COLORS.onSurfaceVariant,
  },
  statusPillText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  productNameTitle: {
    color: COLORS.onSurface,
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
    backgroundColor: COLORS.surfaceContainerLowest,
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
    padding: 16,
    borderRadius: 20,
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
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  stockAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockAlertNormal: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  stockAlertLowStock: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
  },
  stockAlertOutOfStock: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
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
    color: COLORS.onSurface,
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
  },
  stockUnitText: {
    color: COLORS.onSurfaceVariant,
  },
  stockMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  stockMetaItem: {
    flex: 1,
    gap: 2,
  },
  stockMetaLabel: {
    color: COLORS.onSurfaceVariant + '90',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  stockMetaValue: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  stockMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
  },
  btnSalePrimary: {
    borderColor: 'rgba(87, 245, 171, 0.4)',
    backgroundColor: 'rgba(87, 245, 171, 0.06)',
  },
  btnPurchasePrimary: {
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  primaryActionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    color: COLORS.onSurfaceVariant,
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceTitle: {
    color: COLORS.secondary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  perfLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  perfValue: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  perfSub: {
    color: COLORS.onSurfaceVariant + '90',
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  finBoxLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  finBoxValue: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  extraMetadataCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  metaVal: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionRow: {
    gap: 2,
    paddingTop: 4,
  },
  descriptionVal: {
    color: COLORS.onSurface,
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
    color: COLORS.onSurface,
  },
  historyCountBadge: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyCountText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHistoryBox: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyHistoryTitle: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHistoryText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  operationsList: {
    gap: 10,
  },
  operationCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  opBadgeReturn: {
    backgroundColor: 'rgba(255, 145, 0, 0.12)',
  },
  opBadgeAdjustment: {
    backgroundColor: 'rgba(209, 188, 255, 0.12)',
  },
  opBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  opDateText: {
    color: COLORS.onSurfaceVariant,
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
    color: '#00E676',
  },
  deltaNegative: {
    color: '#FF6E6E',
  },
  opStockTransition: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  opCostCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  opCostLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  opCostVal: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '800',
  },
  opProfitVal: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  opUnitCostVal: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  opDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  saleFinancialAuditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditKey: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  auditVal: {
    color: COLORS.onSurface,
    fontSize: 10,
    fontWeight: '600',
  },
  auditBadgePaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  auditPaidText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '600',
  },
  auditBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  auditPendingText: {
    color: '#FFB300',
    fontSize: 10,
    fontWeight: '600',
  },
  opDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  opDetailLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  opDetailVal: {
    color: COLORS.onSurface,
    fontSize: 11,
  },
  opNotesVal: {
    color: COLORS.onSurfaceVariant,
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
  },
  cardCustomerReturnBtnText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '600',
  },
});
