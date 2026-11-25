import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MovimientoEnriquecido } from '@/datos/tipos';
import { OrbeGlossy } from '@/compartido/componentes/OrbeGlossy';
import { formatearMoneda } from '@/compartido/utilidades/moneda';

export interface PropiedadesFilaMovimiento {
  transaction: MovimientoEnriquecido;
  onPress: () => void;
  onLongPress?: () => void;
  mostrarDivisor?: boolean;
}

const COLOR_TRANSFERENCIA = '#E5A93C';
const COLOR_GASTO = '#FF5A5A';
const COLOR_INGRESO = '#2ECC71';

const resolverIcono = (tx: MovimientoEnriquecido) => {
  if (tx.type === 'TRANSFER') {
    return { tipo: 'transferencia' as const };
  }

  const icon = tx.categoryIcon?.trim();
  if (icon && /\p{Extended_Pictographic}/u.test(icon)) {
    return { tipo: 'emoji' as const, valor: icon };
  }

  if (icon) {
    return { tipo: 'material' as const, valor: icon };
  }

  return {
    tipo: 'material' as const,
    valor: tx.type === 'INCOME' ? 'arrow-downward' : 'local-mall',
  };
};

const formatearHora = (timestamp: number) => {
  const fecha = new Date(timestamp);
  let horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const periodo = horas >= 12 ? 'p. m.' : 'a. m.';
  horas = horas % 12;
  if (horas === 0) horas = 12;
  const horasStr = horas.toString().padStart(2, '0');
  return `${horasStr}:${minutos} ${periodo}`;
};

export const FilaMovimiento: React.FC<PropiedadesFilaMovimiento> = ({
  transaction: tx,
  onPress,
  onLongPress,
  mostrarDivisor = false,
}) => {
  const esGasto = tx.type === 'EXPENSE';
  const esIngreso = tx.type === 'INCOME';
  const esTransferencia = tx.type === 'TRANSFER';

  const iconoInfo = resolverIcono(tx);

  const coloresOrbe: [string, string, string] = esTransferencia
    ? ['#3E2F4A', '#241830', '#130C1A']
    : esGasto
    ? ['#3D232A', '#241318', '#14090C']
    : ['#1F3D34', '#11251F', '#081410'];

  const titulo = esTransferencia
    ? `${tx.sourceAccountName || 'Cuenta'}  >  ${tx.targetAccountName || 'Cuenta'}`
    : tx.categoryName || tx.payee || (esGasto ? 'Gasto' : 'Ingreso');

  const subtitulo = formatearHora(tx.date);

  const colorMonto = esTransferencia
    ? COLOR_TRANSFERENCIA
    : esGasto
    ? COLOR_GASTO
    : COLOR_INGRESO;

  const textoMonto = formatearMoneda(Math.abs(tx.amount), {
    mostrarDecimales: tx.amount % 100 !== 0,
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        estilos.fila,
        mostrarDivisor && estilos.filaConDivisor,
      ]}
    >
      <View style={estilos.ladoIzquierdo}>
        <OrbeGlossy tamano={44} coloresPersonalizados={coloresOrbe}>
          {iconoInfo.tipo === 'transferencia' ? (
            <MaterialIcons name="swap-horiz" size={20} color="#D1BCFF" />
          ) : iconoInfo.tipo === 'emoji' ? (
            <Text style={estilos.emoji}>{iconoInfo.valor}</Text>
          ) : (
            <MaterialIcons
              name={iconoInfo.valor as any}
              size={20}
              color={esIngreso ? COLOR_INGRESO : COLOR_GASTO}
            />
          )}
        </OrbeGlossy>

        <View style={estilos.info}>
          <Text style={estilos.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          <Text style={estilos.hora}>{subtitulo}</Text>
        </View>
      </View>

      <Text style={[estilos.monto, { color: colorMonto }]}>
        {textoMonto}
      </Text>
    </TouchableOpacity>
  );
};

// Alias compatible
export const TransactionRow = FilaMovimiento;

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  filaConDivisor: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  ladoIzquierdo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  hora: {
    color: '#8E9296',
    fontSize: 13,
    marginTop: 3,
    fontWeight: '400',
  },
  monto: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
