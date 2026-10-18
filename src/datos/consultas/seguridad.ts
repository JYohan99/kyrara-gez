import { obtenerBaseDatos } from '../conexion';
import { inicializarBaseDatos } from '../esquema';
import { emitirCambioBoveda } from '../sincronizacion';

export function obtenerAjuste(clave: string, valorPredeterminado: string = ''): string {
  const db = obtenerBaseDatos();
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [clave]);
  return row ? row.value : valorPredeterminado;
}

export function fijarAjuste(clave: string, valor: string): void {
  const db = obtenerBaseDatos();
  db.runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [clave, valor]
  );
  emitirCambioBoveda();
}

export function haCompletadoOnboarding(): boolean {
  return true;
}

export function completarOnboarding(): void {
  fijarAjuste('has_completed_onboarding', 'true');
}

export function restablecerBaseDatos(): void {
  const db = obtenerBaseDatos();
  db.execSync(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS budgets;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS settings;
  `);
  inicializarBaseDatos();
  emitirCambioBoveda();
}

// ----------------- SEGURIDAD Y BLOQUEO PIN -----------------

export function obtenerAjustesSeguridad(): {
  hasPin: boolean;
  pinCode: string;
  biometricsEnabled: boolean;
  requirePinOnStartup: boolean;
} {
  const pin = obtenerAjuste('security_pin', '');
  const bio = obtenerAjuste('biometrics_enabled', 'true');
  const startup = obtenerAjuste('require_pin_on_startup', 'false');

  return {
    hasPin: pin.length === 4,
    pinCode: pin,
    biometricsEnabled: bio === 'true',
    requirePinOnStartup: startup === 'true',
  };
}

export function fijarPinSeguridad(pin: string): void {
  fijarAjuste('security_pin', pin);
  fijarAjuste('require_pin_on_startup', 'true');
}

export function eliminarPinSeguridad(): void {
  fijarAjuste('security_pin', '');
  fijarAjuste('require_pin_on_startup', 'false');
}

export function fijarBiometriaHabilitada(habilitada: boolean): void {
  fijarAjuste('biometrics_enabled', habilitada ? 'true' : 'false');
}

export function fijarRequerirPinAlIniciar(requerir: boolean): void {
  fijarAjuste('require_pin_on_startup', requerir ? 'true' : 'false');
}

// Alias compatibles
export const getSetting = obtenerAjuste;
export const setSetting = fijarAjuste;
export const hasCompletedOnboarding = haCompletadoOnboarding;
export const completeOnboarding = completarOnboarding;
export const resetDatabase = restablecerBaseDatos;
export const getSecuritySettings = obtenerAjustesSeguridad;
export const setSecurityPin = fijarPinSeguridad;
export const removeSecurityPin = eliminarPinSeguridad;
export const setBiometricsEnabled = fijarBiometriaHabilitada;
export const setRequirePinOnStartup = fijarRequerirPinAlIniciar;

export const establecerPinSeguridad = fijarPinSeguridad;
export const establecerBiometriaHabilitada = fijarBiometriaHabilitada;
export const establecerRequerirPinAlIniciar = fijarRequerirPinAlIniciar;

