import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES } from '../tema/colores';
import { TIPOGRAFIA } from '../tema/tipografia';
import { EmblemaKyrara } from './EmblemaKyrara';
import {
  vibracionLigera,
  vibracionMedia,
  vibracionExito,
  vibracionError,
} from '../utilidades/hapticos';

interface PropiedadesPantallaBloqueo {
  correctPin: string;
  onUnlocked: () => void;
  allowBiometrics?: boolean;
}

export function PantallaBloqueo({
  correctPin,
  onUnlocked,
  allowBiometrics = true,
}: PropiedadesPantallaBloqueo) {
  const [pin, setPin] = useState('');
  const [textoError, setTextoError] = useState('');
  const [soportaBiometria, setSoportaBiometria] = useState(false);
  const [tipoBiometria, setTipoBiometria] = useState<'fingerprint' | 'facial' | 'biometric'>('biometric');
  const [autenticando, setAutenticando] = useState(false);

  const autenticandoRef = useRef(false);
  const autoSolicitadoRef = useRef(false);
  const alDesbloquearRef = useRef(onUnlocked);

  useEffect(() => {
    alDesbloquearRef.current = onUnlocked;
  }, [onUnlocked]);

  const manejarPulsacionNumero = (digito: string) => {
    if (pin.length >= 4) return;
    vibracionLigera();
    const siguientePin = pin + digito;
    setPin(siguientePin);
    setTextoError('');

    if (siguientePin.length === 4) {
      if (siguientePin === correctPin) {
        vibracionExito();
        alDesbloquearRef.current();
      } else {
        vibracionError();
        setTextoError('Código PIN incorrecto');
        setTimeout(() => {
          setPin('');
        }, 400);
      }
    }
  };

  const manejarBorrar = () => {
    if (pin.length > 0) {
      vibracionMedia();
      setPin(pin.slice(0, -1));
      setTextoError('');
    }
  };

  const solicitarAutenticacionBiometrica = useCallback(async () => {
    if (autenticandoRef.current) return;

    try {
      autenticandoRef.current = true;
      setAutenticando(true);
      setTextoError('');

      const tieneHardware = await LocalAuthentication.hasHardwareAsync();
      const estaRegistrado = await LocalAuthentication.isEnrolledAsync();

      if (!tieneHardware || !estaRegistrado) {
        setSoportaBiometria(false);
        return;
      }

      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Bóveda',
        promptSubtitle: 'Usa tu huella o toca "Ingresar con PIN"',
        cancelLabel: 'Ingresar con PIN',
        disableDeviceFallback: true,
      });

      if (resultado.success) {
        vibracionExito();
        alDesbloquearRef.current();
      } else {
        if (
          resultado.error !== 'user_cancel' &&
          resultado.error !== 'user_fallback' &&
          resultado.error !== 'app_cancel' &&
          resultado.error !== 'system_cancel'
        ) {
          vibracionError();
          setTextoError('Identificación no reconocida');
        }
      }
    } catch (err) {
      console.error('Error durante autenticación biométrica:', err);
      vibracionError();
      setTextoError('Error en sensor biométrico');
    } finally {
      autenticandoRef.current = false;
      setAutenticando(false);
    }
  }, []);

  useEffect(() => {
    let montado = true;

    async function inicializarBiometria() {
      if (!allowBiometrics) {
        setSoportaBiometria(false);
        return;
      }

      try {
        const tieneHardware = await LocalAuthentication.hasHardwareAsync();
        const estaRegistrado = await LocalAuthentication.isEnrolledAsync();

        if (!montado) return;

        const soportado = tieneHardware && estaRegistrado;
        setSoportaBiometria(soportado);

        if (soportado) {
          const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setTipoBiometria('facial');
          } else if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setTipoBiometria('fingerprint');
          }

          if (!autoSolicitadoRef.current) {
            autoSolicitadoRef.current = true;
            setTimeout(() => {
              if (montado) {
                solicitarAutenticacionBiometrica();
              }
            }, 350);
          }
        }
      } catch (err) {
        console.error('Error al inicializar biometría:', err);
      }
    }

    inicializarBiometria();

    return () => {
      montado = false;
    };
  }, [allowBiometrics, solicitarAutenticacionBiometrica]);

  return (
    <View style={estilos.superposicion}>
      <View style={estilos.resplandorVioleta} />
      <View style={estilos.resplandorCian} />

      <View style={estilos.contenido}>
        <View style={estilos.cabecera}>
          <EmblemaKyrara size={56} />
          <Text style={[estilos.titulo, TIPOGRAFIA.titularGrande]}>Bóveda Protegida</Text>
          <Text style={[estilos.subtitulo, TIPOGRAFIA.cuerpoPequeno]}>
            Ingresa tu PIN de 4 dígitos para acceder
          </Text>
        </View>

        <View style={estilos.filaPuntos}>
          {[0, 1, 2, 3].map(idx => {
            const estaLleno = pin.length > idx;
            const tieneError = !!textoError;
            return (
              <View
                key={idx}
                style={[
                  estilos.punto,
                  estaLleno && estilos.puntoLleno,
                  tieneError && estilos.puntoError,
                ]}
              />
            );
          })}
        </View>

        {textoError ? (
          <Text style={[estilos.textoError, TIPOGRAFIA.etiquetaMayusculas]}>{textoError}</Text>
        ) : (
          <View style={estilos.marcadorError} />
        )}

        <View style={estilos.teclado}>
          <View style={estilos.filaTeclado}>
            {['1', '2', '3'].map(num => (
              <TouchableOpacity
                key={num}
                style={estilos.botonTecla}
                onPress={() => manejarPulsacionNumero(num)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.textoTecla, TIPOGRAFIA.titularGrande]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={estilos.filaTeclado}>
            {['4', '5', '6'].map(num => (
              <TouchableOpacity
                key={num}
                style={estilos.botonTecla}
                onPress={() => manejarPulsacionNumero(num)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.textoTecla, TIPOGRAFIA.titularGrande]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={estilos.filaTeclado}>
            {['7', '8', '9'].map(num => (
              <TouchableOpacity
                key={num}
                style={estilos.botonTecla}
                onPress={() => manejarPulsacionNumero(num)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.textoTecla, TIPOGRAFIA.titularGrande]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={estilos.filaTeclado}>
            {allowBiometrics && soportaBiometria ? (
              <TouchableOpacity
                style={estilos.botonTeclaAccion}
                onPress={solicitarAutenticacionBiometrica}
                activeOpacity={0.7}
                disabled={autenticando}
              >
                <MaterialIcons
                  name={tipoBiometria === 'facial' ? 'face' : 'fingerprint'}
                  size={28}
                  color={COLORES.primario}
                />
              </TouchableOpacity>
            ) : (
              <View style={estilos.botonTeclaVacio} />
            )}

            <TouchableOpacity
              style={estilos.botonTecla}
              onPress={() => manejarPulsacionNumero('0')}
              activeOpacity={0.7}
            >
              <Text style={[estilos.textoTecla, TIPOGRAFIA.titularGrande]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonTeclaAccion}
              onPress={manejarBorrar}
              activeOpacity={0.7}
            >
              <MaterialIcons name="backspace" size={24} color={COLORES.enSuperficieVariante} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.pie}>
          <MaterialIcons name="lock" size={14} color={COLORES.ingreso} />
          <Text style={[estilos.textoPie, TIPOGRAFIA.etiquetaMayusculas]}>
            Cifrado Local Seguro • Sin Nube
          </Text>
        </View>
      </View>
    </View>
  );
}

// Alias compatible
export const LockScreen = PantallaBloqueo;

const estilos = StyleSheet.create({
  superposicion: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B0F10',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resplandorVioleta: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
  },
  resplandorCian: {
    position: 'absolute',
    bottom: '15%',
    right: '15%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
  },
  contenido: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  cabecera: {
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    color: COLORES.enSuperficie,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitulo: {
    color: COLORES.enSuperficieVariante,
    textAlign: 'center',
  },
  filaPuntos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 10,
  },
  punto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(209, 188, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  puntoLleno: {
    backgroundColor: COLORES.secundario,
    borderColor: COLORES.secundario,
    shadowColor: COLORES.secundario,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  puntoError: {
    backgroundColor: COLORES.gasto,
    borderColor: COLORES.gasto,
  },
  textoError: {
    color: COLORES.gasto,
    height: 20,
    textAlign: 'center',
  },
  marcadorError: {
    height: 20,
  },
  teclado: {
    width: '100%',
    gap: 16,
  },
  filaTeclado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  botonTecla: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(28, 32, 33, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(209, 188, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTeclaAccion: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTeclaVacio: {
    width: 68,
    height: 68,
  },
  textoTecla: {
    color: COLORES.enSuperficie,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  textoPie: {
    color: COLORES.enSuperficieVariante,
    letterSpacing: 1,
  },
});
