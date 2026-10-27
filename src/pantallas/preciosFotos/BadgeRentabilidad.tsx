import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';

export interface PropiedadesBadgeRentabilidad {
  margen?: number | null;
  ganancia?: number | null;
  mostrarGanancia?: boolean;
  tamano?: 'pequeno' | 'mediano';
}

/**
 * Componente reutilizable para visualizar margen porcentual y ganancia bruta
 * con codificación de colores según rentabilidad positiva o negativa.
 */
export const BadgeRentabilidad: React.FC<PropiedadesBadgeRentabilidad> = ({
  margen,
  ganancia,
  mostrarGanancia = false,
  tamano = 'pequeno',
}) => {
  if (margen === null || margen === undefined) {
    if (ganancia === null || ganancia === undefined) return null;
  }

  const esPositivo = (margen ?? (ganancia ?? 0)) >= 0;
  const estiloColor = esPositivo ? styles.colorPositivo : styles.colorNegativo;
  const estiloFondo = esPositivo ? styles.badgePositivo : styles.badgeNegativo;

  return (
    <View style={[styles.contenedor, tamano === 'mediano' && styles.contenedorMediano]}>
      {mostrarGanancia && ganancia !== null && ganancia !== undefined && (
        <Text style={[styles.textoGanancia, estiloColor, TYPOGRAPHY.cuerpoPequeno]}>
          {formatCurrency(ganancia)}
        </Text>
      )}

      {margen !== null && margen !== undefined && (
        <View style={[styles.badge, estiloFondo, tamano === 'mediano' && styles.badgeMediano]}>
          <Text style={[styles.textoMargen, estiloColor, TYPOGRAPHY.etiquetaMayusculas]}>
            {esPositivo ? '+' : ''}
            {margen.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contenedorMediano: {
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeMediano: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePositivo: {
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  badgeNegativo: {
    backgroundColor: 'rgba(255, 110, 110, 0.12)',
  },
  textoMargen: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textoGanancia: {
    fontWeight: '600',
  },
  colorPositivo: {
    color: COLORS.secondary,
  },
  colorNegativo: {
    color: '#FF6E6E',
  },
});
