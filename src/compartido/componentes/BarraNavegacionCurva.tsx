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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  ClipPath,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { COLORES as COLORS } from '@/compartido/tema';
import { gatillarSeleccion } from '@/compartido/utilidades/hapticos';

const RUTAS_VISIBLES = ['index', 'deudas', 'agenda', 'presupuestos', 'productos'];

const BAR_HEIGHT = 64;
const TOP_CORNER_RADIUS = 14;
const BOTTOM_CORNER_RADIUS = 22;
const INNER_PADDING_H = 14;
const CIRCLE_SIZE = 44;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const NOTCH_DEPTH = 28;
const NOTCH_HALF_WIDTH = 34;
const HORIZONTAL_MARGIN = 8;

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
  const tr = TOP_CORNER_RADIUS;
  const br = BOTTOM_CORNER_RADIUS;
  const w = Math.max(width, br * 2 + 2);
  const h = height;

  if (!mostrarMuesca) {
    return [
      `M 0,${tr}`,
      `Q 0,0 ${tr},0`,
      `L ${w - tr},0`,
      `Q ${w},0 ${w},${tr}`,
      `L ${w},${h - br}`,
      `Q ${w},${h} ${w - br},${h}`,
      `L ${br},${h}`,
      `Q 0,${h} 0,${h - br}`,
      'Z',
    ].join(' ');
  }

  const leftX = Math.max(tr, cx - NOTCH_HALF_WIDTH);
  const rightX = Math.min(w - tr, cx + NOTCH_HALF_WIDTH);
  const leftSpan = Math.max(1, cx - leftX);
  const rightSpan = Math.max(1, rightX - cx);

  const lcp1x = leftX + leftSpan * 0.32;
  const lcp2x = cx - leftSpan * 0.74;
  const rcp1x = cx + rightSpan * 0.74;
  const rcp2x = rightX - rightSpan * 0.32;

  return [
    `M 0,${tr}`,
    `Q 0,0 ${tr},0`,
    `L ${leftX.toFixed(2)},0`,
    `C ${lcp1x.toFixed(2)},0 ${lcp2x.toFixed(2)},${NOTCH_DEPTH} ${cx.toFixed(2)},${NOTCH_DEPTH}`,
    `C ${rcp1x.toFixed(2)},${NOTCH_DEPTH} ${rcp2x.toFixed(2)},0 ${rightX.toFixed(2)},0`,
    `L ${w - tr},0`,
    `Q ${w},0 ${w},${tr}`,
    `L ${w},${h - br}`,
    `Q ${w},${h} ${w - br},${h}`,
    `L ${br},${h}`,
    `Q 0,${h} 0,${h - br}`,
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
  const innerWidth = Math.max(barWidth - INNER_PADDING_H * 2, 1);
  const tabWidth = innerWidth / tabCount;

  const [animatedIndex] = useState(
    () => new Animated.Value(activeVisibleIndex >= 0 ? activeVisibleIndex : 0)
  );
  const pathRef = useRef<any>(null);
  const glossPathRef = useRef<any>(null);

  // Actualizar la curva SVG y su reflejo glossy en tiempo real durante la animación
  useEffect(() => {
    const listenerId = animatedIndex.addListener(({ value }) => {
      if (!mostrarMuesca) return;
      const cx = INNER_PADDING_H + value * tabWidth + tabWidth / 2;
      const d = construirRutaCurva(barWidth, BAR_HEIGHT, cx, true);
      pathRef.current?.setNativeProps({ d });
      glossPathRef.current?.setNativeProps({ d });
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

  const initialCx = INNER_PADDING_H + Math.max(activeVisibleIndex, 0) * tabWidth + tabWidth / 2;
  const initialPath = construirRutaCurva(barWidth, BAR_HEIGHT, initialCx, mostrarMuesca);

  const circleTranslateX = animatedIndex.interpolate({
    inputRange: visibleRoutes.map((_, idx) => idx),
    outputRange: visibleRoutes.map(
      (_, idx) => INNER_PADDING_H + idx * tabWidth + tabWidth / 2 - CIRCLE_RADIUS
    ),
    extrapolate: 'clamp',
  });

  const activeRoute = activeVisibleIndex >= 0 ? visibleRoutes[activeVisibleIndex] : null;
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : null;

  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.outerContainer, { paddingBottom }]}>
      <View style={styles.barWrapper} onLayout={handleLayout}>
        {/* Fondo SVG cápsula glossy 3D con muesca curva cóncava */}
        <Svg
          width={barWidth}
          height={BAR_HEIGHT}
          style={styles.svgBackground}
        >
          <Defs>
            {/* Degradado obsidiana 3D del cuerpo */}
            <SvgLinearGradient id="navBarBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#202B30" />
              <Stop offset="46%" stopColor="#11181B" />
              <Stop offset="55%" stopColor="#090D0F" />
              <Stop offset="100%" stopColor="#141D20" />
            </SvgLinearGradient>

            {/* Borde exterior metálico/cristal */}
            <SvgLinearGradient id="navBarRimGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#A5E7FF" stopOpacity="0.5" />
              <Stop offset="50%" stopColor="#4A545C" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#D1BCFF" stopOpacity="0.26" />
            </SvgLinearGradient>

            {/* Reflejo especular superior tipo cristal 3D */}
            <SvgLinearGradient id="navBarGlossGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.24" />
              <Stop offset="65%" stopColor="#A5E7FF" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </SvgLinearGradient>

            <ClipPath id="navTopGlossClip">
              <Rect x="1" y="1" width={Math.max(barWidth - 2, 1)} height={BAR_HEIGHT * 0.48} />
            </ClipPath>
          </Defs>

          <Path
            ref={pathRef}
            d={initialPath}
            fill="url(#navBarBodyGrad)"
            stroke="url(#navBarRimGrad)"
            strokeWidth={1.5}
          />
          <Path
            ref={glossPathRef}
            d={initialPath}
            fill="url(#navBarGlossGrad)"
            clipPath="url(#navTopGlossClip)"
          />
        </Svg>

        {/* Orbe circular flotante 3D glossy para la pestaña activa */}
        {mostrarMuesca && activeDescriptor && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatingOrbBezel,
              {
                transform: [{ translateX: circleTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={['#6CE5FF', COLORS.secundarioContenedor, COLORS.enSecundarioContenedor]}
              locations={[0, 0.52, 1]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.floatingOrbSphere}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
                style={styles.floatingOrbGloss}
              />
              {activeDescriptor.options.tabBarIcon?.({
                focused: true,
                color: '#FFFFFF',
                size: 30,
              })}
            </LinearGradient>
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
                        color: '#95A3AD',
                        size: 30,
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
    paddingTop: 20,
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
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingOrbBezel: {
    position: 'absolute',
    top: -CIRCLE_RADIUS,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    padding: 2.5,
    backgroundColor: 'rgba(5, 8, 10, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(165, 231, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.secundarioContenedor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  floatingOrbSphere: {
    width: '100%',
    height: '100%',
    borderRadius: CIRCLE_RADIUS - 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  floatingOrbGloss: {
    position: 'absolute',
    top: 1.5,
    left: 5,
    right: 5,
    height: '48%',
    borderRadius: 999,
  },
  tabsRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    paddingHorizontal: INNER_PADDING_H,
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
    paddingBottom: 10,
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
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#95A3AD',
    letterSpacing: 0.15,
  },
});
