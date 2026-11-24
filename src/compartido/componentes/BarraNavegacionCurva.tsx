import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS } from '@/compartido/tema';
import { gatillarSeleccion } from '@/compartido/utilidades/hapticos';

const RUTAS_VISIBLES = ['index', 'deudas', 'agenda', 'presupuestos', 'productos'];

const BAR_HEIGHT = 64;
const CORNER_RADIUS = 20;
const CIRCLE_SIZE = 44;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const NOTCH_DEPTH = 28;
const NOTCH_HALF_WIDTH = 38;
const HORIZONTAL_MARGIN = 10;

interface RutaTab {
  key: string;
  name: string;
  params?: object;
}

interface OpcionesDescriptor {
  title?: string;
  tabBarLabel?: string | ((props: any) => React.ReactNode);
  tabBarAccessibilityLabel?: string;
  tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
}

export interface PropiedadesBarraNavegacionCurva {
  state: {
    index: number;
    routes: RutaTab[];
  };
  descriptors: Record<string, { options: OpcionesDescriptor }>;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string, params?: any) => void;
  };
}

/**
 * Construye el trazado SVG de la barra redondeada con muesca curva cóncava
 * centrada en `cx`. Maneja de forma segura los extremos (primer y último tab).
 */
function construirRutaCurva(
  width: number,
  height: number,
  cx: number,
  mostrarMuesca: boolean
): string {
  const r = CORNER_RADIUS;
  const w = Math.max(width, r * 2 + 2);
  const h = height;

  if (!mostrarMuesca) {
    return [
      `M 0,${r}`,
      `Q 0,0 ${r},0`,
      `L ${w - r},0`,
      `Q ${w},0 ${w},${r}`,
      `L ${w},${h - r}`,
      `Q ${w},${h} ${w - r},${h}`,
      `L ${r},${h}`,
      `Q 0,${h} 0,${h - r}`,
      'Z',
    ].join(' ');
  }

  const leftX = Math.max(r, cx - NOTCH_HALF_WIDTH);
  const rightX = Math.min(w - r, cx + NOTCH_HALF_WIDTH);
  const leftSpan = Math.max(1, cx - leftX);
  const rightSpan = Math.max(1, rightX - cx);

  const lcp1x = leftX + leftSpan * 0.37;
  const lcp2x = cx - leftSpan * 0.68;
  const rcp1x = cx + rightSpan * 0.68;
  const rcp2x = rightX - rightSpan * 0.37;

  return [
    `M 0,${r}`,
    `Q 0,0 ${r},0`,
    `L ${leftX.toFixed(2)},0`,
    `C ${lcp1x.toFixed(2)},0 ${lcp2x.toFixed(2)},${NOTCH_DEPTH} ${cx.toFixed(2)},${NOTCH_DEPTH}`,
    `C ${rcp1x.toFixed(2)},${NOTCH_DEPTH} ${rcp2x.toFixed(2)},0 ${rightX.toFixed(2)},0`,
    `L ${w - r},0`,
    `Q ${w},0 ${w},${r}`,
    `L ${w},${h - r}`,
    `Q ${w},${h} ${w - r},${h}`,
    `L ${r},${h}`,
    `Q 0,${h} 0,${h - r}`,
    'Z',
  ].join(' ');
}

export const BarraNavegacionCurva: React.FC<PropiedadesBarraNavegacionCurva> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(
    () => Dimensions.get('window').width - HORIZONTAL_MARGIN * 2
  );

  const visibleRoutes = state.routes.filter(r => RUTAS_VISIBLES.includes(r.name));
  const currentRoute = state.routes[state.index];
  const activeVisibleIndex = visibleRoutes.findIndex(r => r.key === currentRoute?.key);
  const mostrarMuesca = activeVisibleIndex >= 0;

  const tabCount = Math.max(visibleRoutes.length, 1);
  const tabWidth = barWidth / tabCount;

  const [animatedIndex] = useState(
    () => new Animated.Value(activeVisibleIndex >= 0 ? activeVisibleIndex : 0)
  );
  const pathRef = useRef<any>(null);

  // Actualizar la curva SVG en tiempo real durante la animación sin re-renders de React
  useEffect(() => {
    const listenerId = animatedIndex.addListener(({ value }) => {
      if (!mostrarMuesca || !pathRef.current) return;
      const cx = value * tabWidth + tabWidth / 2;
      const d = construirRutaCurva(barWidth, BAR_HEIGHT, cx, true);
      pathRef.current.setNativeProps({ d });
    });

    return () => {
      animatedIndex.removeListener(listenerId);
    };
  }, [animatedIndex, barWidth, tabWidth, mostrarMuesca]);

  // Animar la transición al cambiar de pestaña
  useEffect(() => {
    if (activeVisibleIndex >= 0) {
      Animated.spring(animatedIndex, {
        toValue: activeVisibleIndex,
        useNativeDriver: false,
        friction: 8,
        tension: 65,
      }).start();
    }
  }, [activeVisibleIndex, animatedIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && Math.abs(measuredWidth - barWidth) > 0.5) {
      setBarWidth(measuredWidth);
    }
  };

  const initialCx = Math.max(activeVisibleIndex, 0) * tabWidth + tabWidth / 2;
  const initialPath = construirRutaCurva(barWidth, BAR_HEIGHT, initialCx, mostrarMuesca);

  const circleTranslateX = animatedIndex.interpolate({
    inputRange: visibleRoutes.map((_, idx) => idx),
    outputRange: visibleRoutes.map((_, idx) => idx * tabWidth + tabWidth / 2 - CIRCLE_RADIUS),
    extrapolate: 'clamp',
  });

  const activeRoute = activeVisibleIndex >= 0 ? visibleRoutes[activeVisibleIndex] : null;
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : null;

  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.outerContainer, { paddingBottom }]}>
      <View style={styles.barWrapper} onLayout={handleLayout}>
        {/* Fondo SVG con muesca curva cóncava */}
        <Svg
          width={barWidth}
          height={BAR_HEIGHT}
          style={styles.svgBackground}
        >
          <Path
            ref={pathRef}
            d={initialPath}
            fill="#161D20"
            stroke="rgba(165, 231, 255, 0.16)"
            strokeWidth={1}
          />
        </Svg>

        {/* Burbuja circular flotante para la pestaña activa */}
        {mostrarMuesca && activeDescriptor && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatingCircle,
              {
                transform: [{ translateX: circleTranslateX }],
              },
            ]}
          >
            {activeDescriptor.options.tabBarIcon?.({
              focused: true,
              color: COLORS.secundarioContenedor,
              size: 24,
            })}
          </Animated.View>
        )}

        {/* Botones de las pestañas */}
        <View style={styles.tabsRow}>
          {visibleRoutes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;
            const isFocused = index === activeVisibleIndex;

            const handlePress = () => {
              gatillarSeleccion();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                onPress={handlePress}
                onLongPress={handleLongPress}
                activeOpacity={0.75}
                style={styles.tabButton}
              >
                {isFocused ? (
                  <View style={styles.activeLabelSlot}>
                    <Text style={styles.activeLabel} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inactiveContent}>
                    <View style={styles.inactiveIconWrap}>
                      {options.tabBarIcon?.({
                        focused: false,
                        color: '#8E9BA4',
                        size: 21,
                      })}
                    </View>
                    <Text style={styles.inactiveLabel} numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.superficieBase,
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingTop: 18,
  },
  barWrapper: {
    height: BAR_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingCircle: {
    position: 'absolute',
    top: -CIRCLE_RADIUS,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: '#1B2529',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.secundarioContenedor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    alignItems: 'center',
    zIndex: 5,
  },
  tabButton: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabelSlot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 11,
    paddingHorizontal: 2,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secundario,
    letterSpacing: 0.2,
  },
  inactiveContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  inactiveIconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#8E9BA4',
    letterSpacing: 0.15,
  },
});
