import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { OrbeGlossy } from '@/compartido/componentes/OrbeGlossy';
import { BarraProgreso3D } from '@/compartido/componentes/BarraProgreso3D';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { Deuda } from '@/datos/tipos';

export interface PropiedadesTarjetaDeuda {
  deuda: Deuda;
  esCobro: boolean;
  onPress: (deuda: Deuda) => void;
}

/**
 * Obtiene el color y texto de estado para una deuda.
 */
export function obtenerEstadoDeuda(deuda: Deuda): { color: string; texto: string } {
  const isPaid = deuda.status === 'PAID';
  const isOverdue = deuda.isOverdue;
  const isDueSoon = deuda.isDueSoon;

  if (isPaid) {
    return { color: COLORS.cashflowIncome, texto: 'PAGADA' };
  }
  if (isOverdue) {
    return { color: COLORS.cashflowExpense, texto: 'VENCIDA' };
  }
  if (isDueSoon) {
    return { color: '#FFB74D', texto: 'PRÓXIMA' };
  }
  if (deuda.status === 'PARTIAL') {
    return { color: COLORS.secondary, texto: 'PARCIAL' };
  }
  return { color: COLORS.primary, texto: 'PENDIENTE' };
}

/**
 * Tarjeta visual para listar deudas (por cobrar o por pagar).
 */
export const TarjetaDeuda: React.FC<PropiedadesTarjetaDeuda> = ({
  deuda,
  esCobro,
  onPress,
}) => {
  const isPaid = deuda.status === 'PAID';
  const { color: badgeColor, texto: badgeText } = obtenerEstadoDeuda(deuda);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(deuda)}
    >
      <GlassCard variant="low" style={styles.debtCard}>
        {/* Fila superior: Avatar orbe 3D, Nombre, Concepto y Badge de estado */}
        <View style={styles.debtCardTopRow}>
          <View style={styles.debtPersonCol}>
            <OrbeGlossy tamano={42} tono={esCobro ? 'ingreso' : 'gasto'}>
              <Text style={[styles.debtAvatarLetter, TYPOGRAPHY.cuerpoPequeno]}>
                {deuda.person ? deuda.person[0].toUpperCase() : '?'}
              </Text>
            </OrbeGlossy>
            <View style={styles.debtInfoTextGroup}>
              <Text style={[styles.debtPersonName, TYPOGRAPHY.cuerpoGrande]} numberOfLines={1}>
                {deuda.person}
              </Text>
              <Text style={[styles.debtConcept, TYPOGRAPHY.cuerpoPequeno]} numberOfLines={1}>
                {deuda.concept}
              </Text>
            </View>
          </View>

          <View style={[styles.cardStatusBadge, { borderColor: badgeColor }]}>
            <Text style={[styles.cardStatusText, { color: badgeColor }, TYPOGRAPHY.etiquetaMayusculas]}>
              {badgeText}
            </Text>
          </View>
        </View>

        {/* Importes y porcentaje de avance */}
        <View style={styles.debtAmountsRow}>
          <View>
            <Text style={[styles.amountLabelSmall, TYPOGRAPHY.etiquetaMayusculas]}>
              {isPaid ? 'Total saldado' : 'Pendiente'}
            </Text>
            <Text
              style={[
                styles.debtRemainingValue,
                { color: esCobro ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                TYPOGRAPHY.titularPequeno,
              ]}
            >
              {formatCurrency(deuda.remainingAmount)}
            </Text>
          </View>

          <View style={styles.debtTotalBox}>
            <Text style={[styles.amountLabelSmall, TYPOGRAPHY.etiquetaMayusculas]}>
              Total: {formatCurrency(deuda.totalAmount)}
            </Text>
            <Text style={[styles.paidRatioText, TYPOGRAPHY.cuerpoPequeno]}>
              Abonado: {formatCurrency(deuda.paidAmount)}
            </Text>
          </View>
        </View>

        {/* Barra de progreso 3D */}
        <BarraProgreso3D
          porcentaje={deuda.progressPercentage ?? 0}
          tono={esCobro ? 'ingreso' : 'violeta'}
          altura={6}
        />

        {/* Fila inferior con fechas */}
        <View style={styles.debtCardFooter}>
          <View style={styles.cardDateItem}>
            <MaterialIcons name="event" size={13} color={COLORS.onSurfaceVariant} />
            <Text style={[styles.cardDateText, TYPOGRAPHY.cuerpoPequeno]}>
              {deuda.issueDate}
            </Text>
          </View>

          {deuda.dueDate ? (
            <View style={styles.cardDateItem}>
              <MaterialIcons
                name="alarm"
                size={13}
                color={
                  deuda.isOverdue
                    ? COLORS.cashflowExpense
                    : deuda.isDueSoon
                    ? '#FFB74D'
                    : COLORS.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.cardDateText,
                  deuda.isOverdue && { color: COLORS.cashflowExpense, fontWeight: '700' },
                  deuda.isDueSoon && { color: '#FFB74D', fontWeight: '700' },
                  TYPOGRAPHY.cuerpoPequeno,
                ]}
              >
                Vence: {deuda.dueDate}
              </Text>
            </View>
          ) : null}

          <MaterialIcons name="chevron-right" size={18} color={COLORS.onSurfaceVariant} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  debtCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  debtCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  debtPersonCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  debtAvatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  debtInfoTextGroup: {
    flex: 1,
  },
  debtPersonName: {
    color: COLORS.onSurface,
  },
  debtConcept: {
    color: COLORS.onSurfaceVariant,
  },
  cardStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  debtAmountsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amountLabelSmall: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  debtRemainingValue: {
    marginTop: 2,
  },
  debtTotalBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  paidRatioText: {
    color: COLORS.onSurfaceVariant,
  },
  debtCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
});
