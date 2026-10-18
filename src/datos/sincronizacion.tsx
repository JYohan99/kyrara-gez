import React, { createContext, useContext, useSyncExternalStore, useCallback, ReactNode } from 'react';

type OyenteBoveda = () => void;

const oyentes = new Set<OyenteBoveda>();
let versionBoveda = 0;

/**
 * Suscribe un callback a cualquier cambio de datos en la bóveda SQLite.
 * Retorna una función de desuscripción.
 */
export function suscribirCambiosBoveda(oyente: OyenteBoveda): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/**
 * Retorna el número de versión actual del almacén SQLite para useSyncExternalStore.
 */
export function obtenerVersionBoveda(): number {
  return versionBoveda;
}

/**
 * Emite una notificación global indicando que los datos de la bóveda
 * (transacciones, cuentas, categorías o presupuestos) han cambiado.
 */
export function emitirCambioBoveda(): void {
  versionBoveda++;
  for (const oyente of oyentes) {
    try {
      oyente();
    } catch (err) {
      console.error('Error al ejecutar oyente de sincronización:', err);
    }
  }
}

interface ValorContextoSincronizacion {
  syncVersion: number;
  notifyChange: () => void;
}

const ContextoSincronizacionBoveda = createContext<ValorContextoSincronizacion | null>(null);

export const ProveedorSincronizacionBoveda: React.FC<{ children: ReactNode }> = ({ children }) => {
  const syncVersion = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const notifyChange = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return (
    <ContextoSincronizacionBoveda.Provider value={{ syncVersion, notifyChange }}>
      {children}
    </ContextoSincronizacionBoveda.Provider>
  );
};

export function useSincronizacionBoveda(): ValorContextoSincronizacion {
  const context = useContext(ContextoSincronizacionBoveda);
  if (!context) {
    return {
      syncVersion: obtenerVersionBoveda(),
      notifyChange: emitirCambioBoveda,
    };
  }
  return context;
}

// Alias compatibles
export const subscribeToVaultChanges = suscribirCambiosBoveda;
export const getVaultVersion = obtenerVersionBoveda;
export const emitVaultChange = emitirCambioBoveda;
export const VaultSyncProvider = ProveedorSincronizacionBoveda;
export const useVaultSync = useSincronizacionBoveda;
