type VaultListener = () => void;

const listeners = new Set<VaultListener>();
let vaultVersion = 0;

/**
 * Suscribe un callback a cualquier cambio de datos en la bóveda SQLite.
 * Retorna una función de desuscripción.
 */
export function subscribeToVaultChanges(listener: VaultListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Retorna el número de versión actual del almacén SQLite.
 * Se utiliza con `useSyncExternalStore`.
 */
export function getVaultVersion(): number {
  return vaultVersion;
}

/**
 * Emite una notificación global indicando que los datos de la bóveda
 * (transacciones, cuentas, categorías o presupuestos) han mutado.
 */
export function emitVaultChange(): void {
  vaultVersion++;
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.error('Error executing vault sync listener:', err);
    }
  }
}
