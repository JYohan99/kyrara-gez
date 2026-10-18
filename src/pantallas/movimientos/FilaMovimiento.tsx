import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES, TIPOGRAFIA } from '@/compartido/tema';
import { TarjetaVidrio } from '@/compartido/componentes/TarjetaVidrio';
import { MovimientoEnriquecido } from '@/datos/tipos';
import { formatearMoneda } from '@/compartido/utilidades/moneda';

export interface PropiedadesFilaMovimiento {
  transaction: MovimientoEnriquecido;
  onPress: () => void;
  onLongPress?: () => void;
}

export const FilaMovimiento: React.FC<PropiedadesFilaMovimiento> = ({
  transaction: tx,
  onPress,
  onLongPress,
}) => {
  const esGasto = tx.type === 'EXPENSE';
  const esIngreso = tx.type === 'INCOME';
  const esTransferencia = tx.type === 'TRANSFER';

  const colorIcono = esIngreso
    ? COLORES.ingreso
    : esGasto
    ? COLORES.gasto
    : COLORES.transferencia;

  const fondoIcono = esIngreso
    ? 'rgba(87, 245, 171, 0.12)'
    : esGasto
    ? 'rgba(255, 138, 158, 0.12)'
    : 'rgba(138, 79, 255, 0.15)';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <TarjetaVidrio variant="surface" style={estilos.tarjeta}>
        <View style={estilos.ladoIzquierdo}>
          <View style={[estilos.cajaIcono, { backgroundColor: fondoIcono }]}>
            <MaterialIcons
              name={
                esTransferencia
                  ? 'swap-horiz'
                  : esIngreso
                  ? 'arrow-downward'
                  : 'local-mall'
              }
              size={20}
              color={colorIcono}
            />
          </View>

          <View style={estilos.info}>
            <Text style={[estilos.beneficiario, TIPOGRAFIA.cuerpoMedio]}>
              {tx.payee || tx.categoryName}
            </Text>
            <View style={estilos.filaMeta}>
              <Text style={[estilos.meta, TIPOGRAFIA.cuerpoPequeno]}>
                {esTransferencia
                  ? `${tx.sourceAccountName} → ${tx.targetAccountName || 'Cuenta'}`
                  : `${tx.sourceAccountName} • ${tx.categoryName}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={estilos.ladoDerecho}>
          <Text
            style={[
              estilos.monto,
              esIngreso
                ? estilos.montoIngreso
                : esGasto
                ? estilos.montoGasto
                : estilos.montoTransferencia,
              TIPOGRAFIA.tablaNumerica,
            ]}
          >
            {esIngreso ? '+ ' : esGasto ? '- ' : '⇄ '}
            {formatearMoneda(tx.amount)}
          </Text>
          <Text style={[estilos.etiquetaTipo, TIPOGRAFIA.etiquetaMayusculas]}>
            {esGasto ? 'Gasto' : esIngreso ? 'Ingreso' : 'Traspaso'}
          </Text>
        </View>
      </TarjetaVidrio>
    </TouchableOpacity>
  );
};

// Alias compatible
export const TransactionRow = FilaMovimiento;

const estilos = StyleSheet.create({
  tarjeta: {
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ladoIzquierdo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cajaIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  beneficiario: {
    color: COLORES.enSuperficie,
  },
  filaMeta: {
    marginTop: 2,
  },
  meta: {
    color: COLORES.enSuperficieVariante,
  },
  ladoDerecho: {
    alignItems: 'flex-end',
  },
  monto: {
    letterSpacing: -0.2,
  },
  montoIngreso: {
    color: COLORES.ingreso,
  },
  montoGasto: {
    color: COLORES.gasto,
  },
  montoTransferencia: {
    color: COLORES.transferencia,
  },
  etiquetaTipo: {
    color: COLORES.enSuperficieVariante,
    fontSize: 9,
    marginTop: 2,
  },
});
