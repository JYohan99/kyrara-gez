import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AlertButton,
  AlertOptions,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS } from '../tema';
import { TarjetaVidrio } from './TarjetaVidrio';
import { OrbeGlossy, TonoOrbeGlossy as TonoOrbe } from './OrbeGlossy';
import { gatillarSeleccion } from '../utilidades/hapticos';

export interface ConfiguracionAlerta3D {
  id: string;
  titulo: string;
  mensaje?: string;
  botones: AlertButton[];
  opciones?: AlertOptions;
  tono?: TonoOrbe;
  icono?: keyof typeof MaterialIcons.glyphMap;
}

type ListenerAlerta = (alerta: ConfiguracionAlerta3D) => void;

const listeners = new Set<ListenerAlerta>();
let originalAlertFn: typeof Alert.alert | null = null;
let idCounter = 0;

function inferirTonoEIcono(
  titulo: string,
  mensaje: string | undefined,
  botones: AlertButton[]
): { tono: TonoOrbe; icono: keyof typeof MaterialIcons.glyphMap } {
  const texto = `${titulo} ${mensaje ?? ''}`.toLowerCase();
  const tieneDestructivo = botones.some(b => b.style === 'destructive');

  if (
    tieneDestructivo ||
    /eliminar|borrar|quitar|vaciar|restablecer/.test(texto)
  ) {
    return { tono: 'gasto', icono: 'delete-outline' };
  }

  if (
    /error|inválid|invalido|requerid|fall[óo]|no se pudo|insuficiente|bloquead|incorrect/.test(
      texto
    )
  ) {
    return { tono: 'gasto', icono: 'error-outline' };
  }

  if (
    /éxito|exito|guardad|cread|duplicad|copiad|completad|listo|restaurad|exportad|importad|actualizad|registrad/.test(
      texto
    )
  ) {
    return { tono: 'ingreso', icono: 'check' };
  }

  if (/atención|atencion|aviso|advertencia|cuidado|confirmar/.test(texto)) {
    return { tono: 'violeta', icono: 'warning-amber' };
  }

  return { tono: 'cian', icono: 'info-outline' };
}

const GRADIENTES_BOTON: Record<TonoOrbe, [string, string, string]> = {
  cian: ['#5CE0FF', '#00B8E6', '#00566A'],
  violeta: ['#B894FF', COLORS.primarioContenedor, COLORS.enPrimario],
  ingreso: ['#7BFAC0', '#24BF7A', '#0D5E3C'],
  gasto: ['#FFA3B4', '#E6526E', '#7D172B'],
  obsidiana: ['#3A464D', '#20282C', '#101518'],
};

const COLORES_BORDE_ALERTA: Record<TonoOrbe, string> = {
  cian: 'rgba(165, 231, 255, 0.28)',
  violeta: 'rgba(209, 188, 255, 0.3)',
  ingreso: 'rgba(87, 245, 171, 0.28)',
  gasto: 'rgba(255, 138, 158, 0.34)',
  obsidiana: 'rgba(165, 231, 255, 0.18)',
};

const BRILLO_BOTON: [string, string] = [
  'rgba(255, 255, 255, 0.42)',
  'rgba(255, 255, 255, 0.03)',
];

/**
 * Muestra una alerta global con el estilo 3D obsidiana de la app.
 * Si el host aún no está montado, recurre a la alerta nativa original.
 */
export function mostrarAlerta(
  titulo: string,
  mensaje?: string,
  botones?: AlertButton[],
  opciones?: AlertOptions & {
    tono?: TonoOrbe;
    icono?: keyof typeof MaterialIcons.glyphMap;
  }
): void {
  if (listeners.size === 0) {
    if (originalAlertFn) {
      originalAlertFn(titulo, mensaje, botones, opciones);
    }
    return;
  }

  const botonesFinales: AlertButton[] =
    botones && botones.length > 0 ? botones : [{ text: 'Entendido', style: 'default' }];

  const inferido = inferirTonoEIcono(titulo, mensaje, botonesFinales);

  const nuevaAlerta: ConfiguracionAlerta3D = {
    id: `alerta_${++idCounter}_${Date.now()}`,
    titulo,
    mensaje,
    botones: botonesFinales,
    opciones,
    tono: opciones?.tono ?? inferido.tono,
    icono: opciones?.icono ?? inferido.icono,
  };

  listeners.forEach(listener => listener(nuevaAlerta));
}

/**
 * Host global de alertas 3D obsidiana.
 * Se monta una sola vez en `src/app/_layout.tsx` e intercepta `Alert.alert`
 * para que todas las alertas de la app compartan el mismo diseño.
 */
export const HostAlertas3D: React.FC = () => {
  const [cola, setCola] = useState<ConfiguracionAlerta3D[]>([]);
  const [escala] = useState(() => new Animated.Value(0.92));
  const [opacidad] = useState(() => new Animated.Value(0));

  const alertaActual = cola[0] ?? null;

  useEffect(() => {
    const onAlerta: ListenerAlerta = nueva => {
      setCola(prev => [...prev, nueva]);
    };
    listeners.add(onAlerta);

    if (!originalAlertFn) {
      originalAlertFn = Alert.alert.bind(Alert);
    }

    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      mostrarAlerta(title, message, buttons, options);
    };

    return () => {
      listeners.delete(onAlerta);
      if (listeners.size === 0 && originalAlertFn) {
        Alert.alert = originalAlertFn;
      }
    };
  }, []);

  useEffect(() => {
    if (!alertaActual) return;
    escala.setValue(0.92);
    opacidad.setValue(0);

    Animated.parallel([
      Animated.spring(escala, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [alertaActual, escala, opacidad]);

  const cerrarActual = useCallback(() => {
    setCola(prev => prev.slice(1));
  }, []);

  const handlePressBoton = useCallback(
    (boton: AlertButton) => {
      gatillarSeleccion();
      cerrarActual();
      boton.onPress?.();
    },
    [cerrarActual]
  );

  const handleDismiss = useCallback(() => {
    if (!alertaActual) return;
    const botonCancelar = alertaActual.botones.find(b => b.style === 'cancel');
    const esCancelable =
      alertaActual.opciones?.cancelable ??
      (Boolean(botonCancelar) || alertaActual.botones.length === 1);

    if (!esCancelable) return;

    cerrarActual();
    if (botonCancelar?.onPress) {
      botonCancelar.onPress();
    } else {
      alertaActual.opciones?.onDismiss?.();
    }
  }, [alertaActual, cerrarActual]);

  if (!alertaActual) return null;

  const tono = alertaActual.tono ?? 'cian';
  const icono = alertaActual.icono ?? 'info-outline';
  const esColumna = alertaActual.botones.length > 2;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: opacidad,
              transform: [{ scale: escala }],
            },
          ]}
        >
          <TarjetaVidrio
            variant="high"
            style={[
              styles.card,
              { borderColor: COLORES_BORDE_ALERTA[tono] },
            ]}
          >
            <View style={styles.orbWrap}>
              <OrbeGlossy tamano={54} tono={tono} sombra>
                <MaterialIcons name={icono} size={26} color="#FFFFFF" />
              </OrbeGlossy>
            </View>

            <View style={styles.textBlock}>
              <Text style={styles.title}>{alertaActual.titulo}</Text>
              {alertaActual.mensaje ? (
                <Text style={styles.message}>{alertaActual.mensaje}</Text>
              ) : null}
            </View>

            <View style={esColumna ? styles.buttonsCol : styles.buttonsRow}>
              {alertaActual.botones.map((boton, idx) => {
                const esCancelar = boton.style === 'cancel';
                const esDestructivo = boton.style === 'destructive';
                const tonoBoton: TonoOrbe = esDestructivo
                  ? 'gasto'
                  : tono === 'gasto'
                  ? 'cian'
                  : tono;

                if (esCancelar) {
                  return (
                    <TouchableOpacity
                      key={`${boton.text ?? 'cancel'}_${idx}`}
                      style={[
                        styles.cancelBtn,
                        !esColumna && styles.btnFlex,
                      ]}
                      onPress={() => handlePressBoton(boton)}
                      activeOpacity={0.78}
                    >
                      <Text style={styles.cancelBtnText} numberOfLines={1}>
                        {boton.text || 'Cancelar'}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={`${boton.text ?? 'ok'}_${idx}`}
                    style={[
                      styles.primaryBtnOuter,
                      !esColumna && styles.btnFlex,
                    ]}
                    onPress={() => handlePressBoton(boton)}
                    activeOpacity={0.82}
                  >
                    <LinearGradient
                      colors={GRADIENTES_BOTON[tonoBoton]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.85, y: 1 }}
                      style={styles.primaryBtnGradient}
                    >
                      <LinearGradient
                        colors={BRILLO_BOTON}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.primaryBtnSheen}
                        pointerEvents="none"
                      />
                      <Text style={styles.primaryBtnText} numberOfLines={1}>
                        {boton.text || 'Aceptar'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TarjetaVidrio>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 11, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  buttonsCol: {
    gap: 8,
    marginTop: 4,
  },
  btnFlex: {
    flex: 1,
  },
  cancelBtn: {
    minHeight: 44,
    borderRadius: 15,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9, 13, 15, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.16)',
  },
  cancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13.5,
    fontWeight: '700',
  },
  primaryBtnOuter: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  primaryBtnGradient: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryBtnSheen: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: '46%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
