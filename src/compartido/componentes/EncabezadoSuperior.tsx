import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '../tema';
import { EmblemaKyrara as KyraraEmblem } from './EmblemaKyrara';

export interface PropiedadesEncabezadoSuperior {
  seccion: string;
  etiquetaPeriodo?: string;
  mostrarPeriodo?: boolean;
  tamanoLogo?: number;
  onPressAvatar?: () => void;
}
export type TopHeaderProps = PropiedadesEncabezadoSuperior;

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const EncabezadoSuperior: React.FC<PropiedadesEncabezadoSuperior> = ({
  seccion,
  etiquetaPeriodo,
  mostrarPeriodo = true,
  tamanoLogo = 46,
  onPressAvatar,
}) => {
  const textoPeriodo = useMemo(() => {
    if (etiquetaPeriodo) return etiquetaPeriodo;
    const ahora = new Date();
    return `${MESES_CORTOS[ahora.getMonth()]} ${ahora.getFullYear()}`;
  }, [etiquetaPeriodo]);

  return (
    <View style={styles.topHeader}>
      <View style={styles.brandRow}>
        <KyraraEmblem size={tamanoLogo} />
        <View style={styles.brandTextCol}>
          <Text style={[styles.brandTitle, TYPOGRAPHY.headlineSm]}>Kyrara Gez</Text>
          <Text style={[styles.brandBadge, TYPOGRAPHY.labelCaps]}>{seccion.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        {mostrarPeriodo && (
          <View style={styles.periodPillBadge}>
            <Text style={[styles.periodPillText, TYPOGRAPHY.labelCaps]}>
              {textoPeriodo}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={onPressAvatar}
          activeOpacity={onPressAvatar ? 0.8 : 1}
          disabled={!onPressAvatar}
        >
          <MaterialIcons name="person" size={18} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const TopHeader = EncabezadoSuperior;

const styles = StyleSheet.create({
  topHeader: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTextCol: {
    flexDirection: 'column',
  },
  brandTitle: {
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  brandBadge: {
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodPillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(49, 53, 54, 0.7)',
  },
  periodPillText: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
