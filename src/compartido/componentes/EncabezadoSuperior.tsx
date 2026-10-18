import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '../tema';
import { EmblemaKyrara as KyraraEmblem } from './EmblemaKyrara';
import { gatillarSeleccion as triggerSelection } from '../utilidades/hapticos';

export interface PropiedadesEncabezadoSuperior {
  seccion: string;
  etiquetaPeriodo?: string;
  mostrarPeriodo?: boolean;
  tamanoLogo?: number;
  onPressAjustes?: () => void;
  onPressAvatar?: () => void;
  modoVolver?: boolean;
  onPressVolver?: () => void;
  paddingInferior?: number;
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
  tamanoLogo = 65,
  onPressAjustes,
  onPressAvatar,
  modoVolver,
  onPressVolver,
  paddingInferior,
}) => {
  const textoPeriodo = useMemo(() => {
    if (etiquetaPeriodo) return etiquetaPeriodo;
    const ahora = new Date();
    return `${MESES_CORTOS[ahora.getMonth()]} ${ahora.getFullYear()}`;
  }, [etiquetaPeriodo]);

  const esModoVolver = modoVolver ?? (seccion.toUpperCase() === 'AJUSTES');

  const handlePressVolver = () => {
    triggerSelection();
    if (onPressVolver) {
      onPressVolver();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handlePressAjustes = () => {
    triggerSelection();
    if (onPressAjustes) {
      onPressAjustes();
    } else if (onPressAvatar) {
      onPressAvatar();
    } else {
      router.push('/ajustes');
    }
  };

  return (
    <View
      style={[
        styles.topHeader,
        paddingInferior !== undefined && { paddingBottom: paddingInferior },
      ]}
    >
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
          style={styles.botonAccion}
          onPress={esModoVolver ? handlePressVolver : handlePressAjustes}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={esModoVolver ? 'Volver' : 'Ajustes'}
        >
          <MaterialIcons
            name={esModoVolver ? 'arrow-back' : 'settings'}
            size={20}
            color={COLORS.onSurface}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const TopHeader = EncabezadoSuperior;

const styles = StyleSheet.create({
  topHeader: {
    paddingTop: 5,
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
  botonAccion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAjustes: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
