import React, { createContext, useContext, useSyncExternalStore, useCallback, ReactNode } from 'react';
import { subscribeToVaultChanges, getVaultVersion, emitVaultChange } from './syncEvents';

interface VaultSyncContextValue {
  syncVersion: number;
  notifyChange: () => void;
}

const VaultSyncContext = createContext<VaultSyncContextValue | null>(null);

export const VaultSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const syncVersion = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const notifyChange = useCallback(() => {
    emitVaultChange();
  }, []);

  return (
    <VaultSyncContext.Provider value={{ syncVersion, notifyChange }}>
      {children}
    </VaultSyncContext.Provider>
  );
};

export function useVaultSync(): VaultSyncContextValue {
  const context = useContext(VaultSyncContext);
  if (!context) {
    return {
      syncVersion: getVaultVersion(),
      notifyChange: emitVaultChange,
    };
  }
  return context;
}
