import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { ProductoFoto as Producto } from '@/datos/tipos';
import { BadgeRentabilidad } from './BadgeRentabilidad';

export interface PropiedadesTarjetaProducto {
  product: Producto;
  onEdit: (product: Producto) => void;
  onOpenPrices: (product: Producto) => void;
  onViewHistory: (productId: string) => void;
  onCalculate: (product: Producto) => void;
  onToggleActive: (product: Producto) => void;
  onDelete: (product: Producto) => void;
}

/**
 * Componente modular de tarjeta de producto comercial para el catálogo.
 * Muestra resumen de precios, costo, ganancia bruta, márgenes y acciones directas.
 */
export const TarjetaProducto: React.FC<PropiedadesTarjetaProducto> = ({
  product,
  onEdit,
  onOpenPrices,
  onViewHistory,
  onCalculate,
  onToggleActive,
  onDelete,
}) => {
  const hasPrice = product.basePrice !== undefined && product.basePrice > 0;
  const hasCost = product.costPrice !== undefined && product.costPrice > 0;
  const calculatedProfit =
    product.grossProfit ?? ((product.basePrice || 0) - (product.costPrice || 0));

  return (
    <GlassCard
      variant="surface"
      style={[styles.productCard, !product.isActive && styles.productCardInactive]}
    >
      {/* Cabecera del Producto: Nombre, Categoría y Badge de Estado */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTitleCol}>
          <View style={styles.nameBadgesRow}>
            <Text
              style={[
                styles.productName,
                TYPOGRAPHY.titularPequeno,
                !product.isActive && styles.productNameInactive,
              ]}
              numberOfLines={2}
            >
              {product.name}
            </Text>
          </View>
          <View style={styles.categoryPill}>
            <Text style={[styles.categoryPillText, TYPOGRAPHY.cuerpoPequeno]}>
              {product.category}
            </Text>
          </View>
        </View>

        {/* Estado Activo / Inactivo */}
        <TouchableOpacity
          style={[
            styles.statusBadge,
            product.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
          ]}
          onPress={() => onToggleActive(product)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.statusDot,
              product.isActive ? styles.statusDotActive : styles.statusDotInactive,
            ]}
          />
          <Text
            style={[
              styles.statusBadgeText,
              product.isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
            ]}
          >
            {product.isActive ? 'Activo' : 'Inactivo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fila de Formato y Unidad */}
      <View style={styles.specsRow}>
        {product.sizeFormat ? (
          <View style={styles.specItem}>
            <MaterialIcons name="crop" size={15} color={COLORS.secondary} />
            <Text style={[styles.specText, TYPOGRAPHY.cuerpoPequeno]}>
              {product.sizeFormat}
            </Text>
          </View>
        ) : null}

        <View style={styles.specItem}>
          <MaterialIcons name="inventory-2" size={15} color={COLORS.primary} />
          <Text style={[styles.specText, TYPOGRAPHY.cuerpoPequeno]}>
            Por {product.saleUnit}
          </Text>
        </View>
      </View>

      {/* Descripción si existe */}
      {product.description ? (
        <Text style={[styles.productDescription, TYPOGRAPHY.cuerpoPequeno]} numberOfLines={2}>
          {product.description}
        </Text>
      ) : null}

      {/* Sección de Precio, Costo y Ganancia Bruta */}
      <View style={styles.financialSection}>
        {hasPrice || hasCost ? (
          <View style={styles.financialGrid}>
            <View style={styles.financialCol}>
              <Text style={[styles.finColLabel, TYPOGRAPHY.etiquetaMayusculas]}>
                Venta {product.currency || 'UYU'}
              </Text>
              <Text style={[styles.finColValue, TYPOGRAPHY.titularPequeno]}>
                {formatCurrency(product.basePrice || 0)}
              </Text>
            </View>

            <View style={styles.financialDivider} />

            <View style={styles.financialCol}>
              <Text style={[styles.finColLabel, TYPOGRAPHY.etiquetaMayusculas]}>
                Costo {product.currency || 'UYU'}
              </Text>
              <Text style={[styles.finColValue, TYPOGRAPHY.titularPequeno]}>
                {formatCurrency(product.costPrice || 0)}
              </Text>
            </View>

            <View style={styles.financialDivider} />

            <View style={styles.financialCol}>
              <Text style={[styles.finColLabel, TYPOGRAPHY.etiquetaMayusculas]}>
                Ganancia Bruta
              </Text>
              <Text
                style={[
                  styles.finProfitValue,
                  TYPOGRAPHY.titularPequeno,
                  calculatedProfit < 0 ? styles.profitNegative : styles.profitPositive,
                ]}
              >
                {formatCurrency(calculatedProfit)}
              </Text>

              {product.grossMarginPercent !== null && product.grossMarginPercent !== undefined && (
                <View style={styles.marginBadgeWrapper}>
                  <BadgeRentabilidad margen={product.grossMarginPercent} />
                </View>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noPriceBanner}
            onPress={() => onOpenPrices(product)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="monetization-on" size={16} color={COLORS.secondary} />
            <Text style={[styles.noPriceBannerText, TYPOGRAPHY.cuerpoPequeno]}>
              Sin precios registrados. Toca aquí para asignar precio y costo.
            </Text>
          </TouchableOpacity>
        )}

        {/* Referencia USD si está registrada */}
        {product.costUsd !== undefined && (
          <View style={styles.usdRefRow}>
            <MaterialIcons name="info-outline" size={12} color={COLORS.onSurfaceVariant} />
            <Text style={[styles.usdRefText, TYPOGRAPHY.cuerpoPequeno]}>
              Ref: US$ {product.costUsd.toFixed(2)}
              {product.exchangeRate ? ` (T/C: $ ${product.exchangeRate.toFixed(2)})` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.cardActionsRow}>
        <TouchableOpacity
          style={[styles.cardActionBtn, styles.cardActionBtnPrimary]}
          onPress={() => onOpenPrices(product)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons name="trending-up" size={15} color={COLORS.secondary} />
          <Text style={[styles.cardActionText, { color: COLORS.secondary }]}>
            Precios {product.tariffsCount && product.tariffsCount > 1 ? `(${product.tariffsCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => onViewHistory(product.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons name="history" size={15} color={COLORS.onSurfaceVariant} />
          <Text style={styles.cardActionText}>Historial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => onEdit(product)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons name="edit" size={15} color={COLORS.onSurfaceVariant} />
          <Text style={styles.cardActionText}>Editar</Text>
        </TouchableOpacity>

        {product.isActive && (
          <TouchableOpacity
            style={[styles.cardActionBtn, styles.cardActionBtnCalc]}
            onPress={() => onCalculate(product)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons name="calculate" size={15} color="#00D2FF" />
            <Text style={[styles.cardActionText, { color: '#00D2FF' }]}>Calcular</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => onToggleActive(product)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons
            name={product.isActive ? 'visibility-off' : 'visibility'}
            size={15}
            color={COLORS.onSurfaceVariant}
          />
          <Text style={styles.cardActionText}>
            {product.isActive ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardDeleteBtn}
          onPress={() => onDelete(product)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialIcons name="delete-outline" size={16} color="#FF6E6E" />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  productCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  productCardInactive: {
    opacity: 0.6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleCol: {
    flex: 1,
    gap: 4,
  },
  nameBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  productName: {
    color: COLORS.onSurface,
  },
  productNameInactive: {
    color: COLORS.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryPillText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: COLORS.secondary,
  },
  statusBadgeTextInactive: {
    color: COLORS.onSurfaceVariant,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    color: COLORS.onSurfaceVariant,
  },
  productDescription: {
    color: COLORS.onSurfaceVariant + 'B0',
    fontStyle: 'italic',
  },
  financialSection: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  financialGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  financialDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  finColLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  finColValue: {
    color: COLORS.onSurface,
  },
  finProfitValue: {
    fontWeight: '700',
  },
  profitPositive: {
    color: COLORS.secondary,
  },
  profitNegative: {
    color: '#FF6E6E',
  },
  marginBadgeWrapper: {
    marginTop: 2,
  },
  noPriceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  noPriceBannerText: {
    color: COLORS.secondary,
    flex: 1,
  },
  usdRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  usdRefText: {
    color: COLORS.onSurfaceVariant + '90',
    fontSize: 11,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardActionBtnPrimary: {
    backgroundColor: 'rgba(87, 245, 171, 0.08)',
    borderColor: 'rgba(87, 245, 171, 0.25)',
  },
  cardActionBtnCalc: {
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  cardDeleteBtn: {
    backgroundColor: 'rgba(255, 110, 110, 0.08)',
    padding: 6,
    borderRadius: 10,
    marginLeft: 'auto',
  },
});
