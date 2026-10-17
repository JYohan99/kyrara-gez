import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { KyraraEmblem } from '@/shared/components/KyraraEmblem';
import {
  triggerImpactLight,
  triggerImpactMedium,
  triggerSuccess,
  triggerError,
} from '@/shared/utils/haptics';

interface LockScreenProps {
  correctPin: string;
  onUnlocked: () => void;
  allowBiometrics?: boolean;
}

export function LockScreen({
  correctPin,
  onUnlocked,
  allowBiometrics = true,
}: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'biometric'>('biometric');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isAuthenticatingRef = useRef(false);
  const hasAutoPromptedRef = useRef(false);
  const onUnlockedRef = useRef(onUnlocked);

  useEffect(() => {
    onUnlockedRef.current = onUnlocked;
  }, [onUnlocked]);

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4) return;
    triggerImpactLight();
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorText('');

    if (nextPin.length === 4) {
      if (nextPin === correctPin) {
        triggerSuccess();
        onUnlockedRef.current();
      } else {
        triggerError();
        setErrorText('Código PIN incorrecto');
        setTimeout(() => {
          setPin('');
        }, 400);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      triggerImpactMedium();
      setPin(pin.slice(0, -1));
      setErrorText('');
    }
  };

  const promptBiometricAuth = useCallback(async () => {
    if (isAuthenticatingRef.current) return;

    try {
      isAuthenticatingRef.current = true;
      setIsAuthenticating(true);
      setErrorText('');

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsBiometricSupported(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Bóveda',
        promptSubtitle: 'Usa tu huella o toca "Ingresar con PIN"',
        cancelLabel: 'Ingresar con PIN',
        disableDeviceFallback: true,
      });

      if (result.success) {
        triggerSuccess();
        onUnlockedRef.current();
      } else {
        // Si el usuario cancela o pulsa "Ingresar con PIN", no mostrar error
        // para que la pantalla de PIN quede limpia y lista para escribir
        if (
          result.error !== 'user_cancel' &&
          result.error !== 'user_fallback' &&
          result.error !== 'app_cancel' &&
          result.error !== 'system_cancel'
        ) {
          triggerError();
          setErrorText('Identificación no reconocida');
        }
      }
    } catch (err) {
      console.error('Error during biometric auth:', err);
      triggerError();
      setErrorText('Error en sensor biométrico');
    } finally {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initBiometrics() {
      if (!allowBiometrics) {
        setIsBiometricSupported(false);
        return;
      }

      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!isMounted) return;

        const supported = hasHardware && isEnrolled;
        setIsBiometricSupported(supported);

        if (supported) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('facial');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
          }

          // Auto-prompt sólo UNA vez al inicio
          if (!hasAutoPromptedRef.current) {
            hasAutoPromptedRef.current = true;
            setTimeout(() => {
              if (isMounted) {
                promptBiometricAuth();
              }
            }, 350);
          }
        }
      } catch (err) {
        console.error('Error initializing biometrics:', err);
      }
    }

    initBiometrics();

    return () => {
      isMounted = false;
    };
  }, [allowBiometrics, promptBiometricAuth]);

  return (
    <View style={styles.overlay}>
      {/* Ambient background glows */}
      <View style={styles.glowViolet} />
      <View style={styles.glowCyan} />

      <View style={styles.content}>
        {/* Emblem & Titles */}
        <View style={styles.header}>
          <KyraraEmblem size={56} />
          <Text style={[styles.title, TYPOGRAPHY.headlineLg]}>Bóveda Protegida</Text>
          <Text style={[styles.subtitle, TYPOGRAPHY.bodySm]}>
            Ingresa tu PIN de 4 dígitos para acceder
          </Text>
        </View>

        {/* 4 PIN Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map(idx => {
            const isFilled = pin.length > idx;
            const hasError = !!errorText;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  hasError && styles.dotError,
                ]}
              />
            );
          })}
        </View>

        {errorText ? (
          <Text style={[styles.errorText, TYPOGRAPHY.labelCaps]}>{errorText}</Text>
        ) : (
          <View style={styles.errorPlaceholder} />
        )}

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {/* Row 1 */}
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keyBtn}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.keyText, TYPOGRAPHY.headlineLg]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 2 */}
          <View style={styles.keypadRow}>
            {['4', '5', '6'].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keyBtn}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.keyText, TYPOGRAPHY.headlineLg]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 3 */}
          <View style={styles.keypadRow}>
            {['7', '8', '9'].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.keyBtn}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.keyText, TYPOGRAPHY.headlineLg]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 4 */}
          <View style={styles.keypadRow}>
            {allowBiometrics && isBiometricSupported ? (
              <TouchableOpacity
                style={styles.keyBtnAction}
                onPress={promptBiometricAuth}
                activeOpacity={0.7}
                disabled={isAuthenticating}
              >
                <MaterialIcons
                  name={biometricType === 'facial' ? 'face' : 'fingerprint'}
                  size={28}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.keyBtnEmpty} />
            )}

            <TouchableOpacity
              style={styles.keyBtn}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, TYPOGRAPHY.headlineLg]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyBtnAction}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <MaterialIcons name="backspace" size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <MaterialIcons name="lock" size={14} color={COLORS.cashflowIncome} />
          <Text style={[styles.footerText, TYPOGRAPHY.labelCaps]}>
            Cifrado Local Seguro • Sin Nube
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  glowViolet: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(138, 79, 255, 0.18)',
  },
  glowCyan: {
    position: 'absolute',
    bottom: '15%',
    right: '15%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.onSurface,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 10,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(209, 188, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  dotError: {
    backgroundColor: COLORS.cashflowExpense,
    borderColor: COLORS.cashflowExpense,
  },
  errorText: {
    color: COLORS.cashflowExpense,
    height: 20,
    textAlign: 'center',
  },
  errorPlaceholder: {
    height: 20,
  },
  keypad: {
    width: '100%',
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(28, 32, 33, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(209, 188, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnAction: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnEmpty: {
    width: 68,
    height: 68,
  },
  keyText: {
    color: COLORS.onSurface,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
});
