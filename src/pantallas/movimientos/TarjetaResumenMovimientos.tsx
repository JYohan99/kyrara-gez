import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES, TIPOGRAFIA } from '@/compartido/tema';
import { TarjetaVidrio } from '@/compartido/componentes/TarjetaVidrio';
import { formatearMoneda } from '@/compartido/utilidades/moneda';

export interface PropiedadesTarjetaResumenMovimientos {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  count?: number;
}

export const TarjetaResumenMovimientos: React.FC<PropiedadesTarjetaResumenMovimientos> = ({
  totalIncome,
  totalExpense,
  netSavings,
  count,
}) => {
  return (
    <TarjetaVidrio variant="low" style={estilos.tarjetaResumen}>
      <View style={estilos.parteSuperior}>
        <View style={estilos.filaTitulo}>
          <View style={estilos.puntoActivo} />
          <Text style={[estilos.etiquetaMayus, TIPOGRAFIA.etiquetaMayusculas]}>Balance neto del período</Text>
        </View>
        {typeof count === 'number' && (
          <View style={estilos.badgeRegistros}>
            <Text style={[estilos.textoBadgeRegistros, TIPOGRAFIA.etiquetaMayusculas]}>
              {count} {count === 1 ? 'Registro' : 'Registros'}
            </Text>
          </View>
        )}
      </View>

      <View style={estilos.filaSaldo}>
        <Text
          style={[
            estilos.saldo,
            netSavings >= 0 ? estilos.colorPositivo : estilos.colorNegativo,
            TIPOGRAFIA.titularHeroMovil,
          ]}
        >
          {netSavings >= 0 ? '+ ' : ''}
          {formatearMoneda(netSavings)}
        </Text>
      </View>

      {/* Métricas secundarias */}
      <View style={estilos.cuadriculaSubmetricas}>
        <View style={estilos.columnaSubmetrica}>
          <View style={estilos.encabezadoSubmetrica}>
            <MaterialIcons name="arrow-downward" size={14} color={COLORES.ingreso} />
            <Text style={[estilos.etiquetaSubmetrica, TIPOGRAFIA.etiquetaMayusculas]}>Ingresos</Text>
          </View>
          <Text style={[estilos.valorSubmetrica, TIPOGRAFIA.tablaNumerica]}>
            +{formatearMoneda(totalIncome)}
          </Text>
        </View>

        <View style={estilos.columnaSubmetrica}>
          <View style={estilos.encabezadoSubmetrica}>
            <MaterialIcons name="arrow-upward" size={14} color={COLORES.gasto} />
            <Text style={[estilos.etiquetaSubmetrica, TIPOGRAFIA.etiquetaMayusculas]}>Gastos</Text>
          </View>
          <Text style={[estilos.valorSubmetrica, TIPOGRAFIA.tablaNumerica]}>
            -{formatearMoneda(totalExpense)}
          </Text>
        </View>
      </View>
    </TarjetaVidrio>
  );
};

// Alias compatible
export const TransactionsSummaryCard = TarjetaResumenMovimientos;

const estilos = StyleSheet.create({
  tarjetaResumen: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  parteSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  puntoActivo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORES.secundario,
  },
  etiquetaMayus: {
    color: COLORES.secundario,
    letterSpacing: 1,
  },
  badgeRegistros: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: COLORES.superficieContenedorMasAlto,
  },
  textoBadgeRegistros: {
    color: COLORES.enSuperficieVariante,
    fontSize: 9,
  },
  filaSaldo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  saldo: {
    fontWeight: '700',
    textAlign: 'center',
  },
  colorPositivo: {
    color: COLORES.ingreso,
  },
  colorNegativo: {
    color: COLORES.gasto,
  },
  cuadriculaSubmetricas: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  columnaSubmetrica: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  encabezadoSubmetrica: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  etiquetaSubmetrica: {
    color: COLORES.enSuperficieVariante,
    fontSize: 9,
  },
  valorSubmetrica: {
    color: COLORES.enSuperficie,
  },
});
