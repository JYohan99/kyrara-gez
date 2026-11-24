import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '../tema';
import { EmblemaKyrara as KyraraEmblem } from './EmblemaKyrara';
import { ModalGuiaPantalla } from './ModalGuiaPantalla';
import { gatillarSeleccion as triggerSelection } from '../utilidades/hapticos';

export interface PropiedadesEncabezadoSuperior {
  seccion: string;
  etiquetaPeriodo?: string;
  mostrarPeriodo?: boolean;
  mostrarAyuda?: boolean;
  tamanoLogo?: number;
  onPressAjustes?: () => void;
  onPressAvatar?: () => void;
  modoVolver?: boolean;
  onPressVolver?: () => void;
  paddingInferior?: number;
  paddingSuperior?: number;
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
  mostrarAyuda = true,
  tamanoLogo = 44,
  onPressAjustes,
  onPressAvatar,
  modoVolver,
  onPressVolver,
  paddingInferior,
  paddingSuperior,
}) => {
  const [modalGuiaVisible, setModalGuiaVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const topInset = insets.top > 0 ? insets.top : (RNStatusBar.currentHeight || 0);
  const paddingTopCalculado = paddingSuperior ?? Math.max(topInset + 6, 12);

  const textoPeriodo = useMemo(() => {
    if (etiquetaPeriodo) return etiquetaPeriodo;
    const ahora = new Date();
    return `${MESES_CORTOS[ahora.getMonth()]} ${ahora.getFullYear()}`;
  }, [etiquetaPeriodo]);

  const esModoVolver = modoVolver ?? (seccion.toUpperCase() === 'AJUSTES');
  const logoSizeCalculado = Math.min(tamanoLogo, 44);

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
      router.push('/(tabs)/ajustes');
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: paddingTopCalculado },
        paddingInferior !== undefined && { paddingBottom: paddingInferior },
      ]}
    >
      {/* Borde exterior metálico/cristal de la cápsula */}
      <LinearGradient
        colors={[
          'rgba(165, 231, 255, 0.48)',
          'rgba(74, 84, 92, 0.45)',
          'rgba(209, 188, 255, 0.25)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.capsuleRim}
      >
        {/* Cuerpo oscuro glossy de la cápsula */}
        <LinearGradient
          colors={['#202B30', '#11181B', '#090D0F', '#141D20']}
          locations={[0, 0.46, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.capsuleBody}
        >
          {/* Reflejo especular superior (efecto cristal 3D) */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.24)',
              'rgba(165, 231, 255, 0.08)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
            style={styles.capsuleGloss}
          />

          {/* Izquierda: Logo y nombre de sección */}
          <View style={styles.brandRow}>
            <KyraraEmblem size={logoSizeCalculado} />
            <View style={styles.brandTextCol}>
              <Text style={[styles.brandTitle, TYPOGRAPHY.headlineSm]} numberOfLines={1}>
                Kyrara Gez
              </Text>
              <Text style={[styles.brandBadge, TYPOGRAPHY.labelCaps]} numberOfLines={1}>
                {seccion.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Derecha: Periodo y orbes 3D glossy */}
          <View style={styles.headerRight}>
            {mostrarPeriodo && (
              <View style={styles.periodPillBadge}>
                <Text style={[styles.periodPillText, TYPOGRAPHY.labelCaps]} numberOfLines={1}>
                  {textoPeriodo}
                </Text>
              </View>
            )}

            {mostrarAyuda && (
              <TouchableOpacity
                style={styles.orbBezel}
                onPress={() => {
                  triggerSelection();
                  setModalGuiaVisible(true);
                }}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel="Guía y tutorial"
              >
                <LinearGradient
                  colors={['#B894FF', COLORS.primarioContenedor, COLORS.enPrimario]}
                  locations={[0, 0.52, 1]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                  style={styles.orbSphere}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.58)', 'rgba(255, 255, 255, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    pointerEvents="none"
                    style={styles.orbGloss}
                  />
                  <MaterialIcons
                    name="help-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.orbBezel}
              onPress={esModoVolver ? handlePressVolver : handlePressAjustes}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityLabel={esModoVolver ? 'Volver' : 'Ajustes'}
            >
              <LinearGradient
                colors={['#6CE5FF', COLORS.secundarioContenedor, COLORS.enSecundarioContenedor]}
                locations={[0, 0.52, 1]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.orbSphere}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.62)', 'rgba(255, 255, 255, 0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  pointerEvents="none"
                  style={styles.orbGloss}
                />
                <MaterialIcons
                  name={esModoVolver ? 'arrow-back' : 'settings'}
                  size={19}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </LinearGradient>

      <ModalGuiaPantalla
        visible={modalGuiaVisible}
        seccion={seccion}
        onClose={() => setModalGuiaVisible(false)}
      />
    </View>
  );
};

export const TopHeader = EncabezadoSuperior;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.superficieBase,
  },
  capsuleRim: {
    borderRadius: 999,
    padding: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  capsuleBody: {
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minHeight: 56,
  },
  capsuleGloss: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: '48%',
    borderRadius: 999,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandTextCol: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  brandTitle: {
    color: '#FFFFFF',
    lineHeight: 20,
    fontSize: 16,
  },
  brandBadge: {
    color: COLORS.secundario,
    letterSpacing: 1.3,
    fontSize: 9.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  periodPillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.2)',
  },
  periodPillText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
  orbBezel: {
    width: 39,
    height: 39,
    borderRadius: 20,
    padding: 2,
    backgroundColor: 'rgba(5, 8, 10, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbSphere: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbGloss: {
    position: 'absolute',
    top: 1.5,
    left: 4,
    right: 4,
    height: '48%',
    borderRadius: 999,
  },
});
