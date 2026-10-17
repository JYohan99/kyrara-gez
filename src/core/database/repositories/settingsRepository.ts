import { getDatabase } from '../connection';
import { initDatabase } from '../schema';
import { emitVaultChange } from '../../state/syncEvents';

export function getSetting(key: string, defaultValue: string = ''): string {
  const db = getDatabase();
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : defaultValue;
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
  emitVaultChange();
}

export function hasCompletedOnboarding(): boolean {
  return true;
}

export function completeOnboarding(): void {
  setSetting('has_completed_onboarding', 'true');
}

export function resetDatabase(): void {
  const db = getDatabase();
  db.execSync(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS budgets;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS settings;
  `);
  initDatabase();
  emitVaultChange();
}

// ----------------- SECURITY & LOCK -----------------

export function getSecuritySettings(): {
  hasPin: boolean;
  pinCode: string;
  biometricsEnabled: boolean;
  requirePinOnStartup: boolean;
} {
  const pin = getSetting('security_pin', '');
  const bio = getSetting('biometrics_enabled', 'true');
  const startup = getSetting('require_pin_on_startup', 'false');

  return {
    hasPin: pin.length === 4,
    pinCode: pin,
    biometricsEnabled: bio === 'true',
    requirePinOnStartup: startup === 'true',
  };
}

export function setSecurityPin(pin: string): void {
  setSetting('security_pin', pin);
  setSetting('require_pin_on_startup', 'true');
}

export function removeSecurityPin(): void {
  setSetting('security_pin', '');
  setSetting('require_pin_on_startup', 'false');
}

export function setBiometricsEnabled(enabled: boolean): void {
  setSetting('biometrics_enabled', enabled ? 'true' : 'false');
}

export function setRequirePinOnStartup(enabled: boolean): void {
  setSetting('require_pin_on_startup', enabled ? 'true' : 'false');
}
