import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { subscribeToVaultChanges, getVaultVersion, emitVaultChange } from './syncEvents';
import {
  getAccounts,
  getTransactions,
  getPeriodSummary,
  getBudgets,
  getCategories,
  getCategoryExpenseBreakdown,
  getTopExpenseTransactions,
  getHistoricalMonthlySavings,
  getLiquidityTimeline,
  getSecuritySettings,
  FlowType,
} from '../database';

/**
 * Hook reactivo para cuentas patrimoniales y saldo disponible consolidado.
 */
export function useVaultAccounts() {
  const version = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const accounts = useMemo(() => {
    void version;
    try {
      return getAccounts();
    } catch {
      return [];
    }
  }, [version]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  }, [accounts]);

  const reloadAccounts = useCallback(() => {
    emitVaultChange();
  }, []);

  return {
    accounts,
    totalBalance,
    reloadAccounts,
  };
}

/**
 * Hook reactivo para consultar transacciones y resúmenes de período.
 */
export function useVaultTransactions(filters?: {
  type?: FlowType;
  accountId?: string;
  categoryId?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}) {
  const version = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const type = filters?.type;
  const accountId = filters?.accountId;
  const categoryId = filters?.categoryId;
  const search = filters?.search;
  const startDate = filters?.startDate;
  const endDate = filters?.endDate;
  const limit = filters?.limit;

  const transactions = useMemo(() => {
    void version;
    try {
      return getTransactions({
        type,
        accountId,
        categoryId,
        search,
        startDate,
        endDate,
        limit,
      });
    } catch {
      return [];
    }
  }, [version, type, accountId, categoryId, search, startDate, endDate, limit]);

  const summary = useMemo(() => {
    void version;
    try {
      return getPeriodSummary(startDate, endDate);
    } catch {
      return { totalIncome: 0, totalExpense: 0, netSavings: 0, count: 0 };
    }
  }, [version, startDate, endDate]);

  const reloadTransactions = useCallback(() => {
    emitVaultChange();
  }, []);

  return {
    transactions,
    summary,
    reloadTransactions,
  };
}

/**
 * Hook reactivo para presupuestos de un período específico.
 */
export function useVaultBudgets(period: string) {
  const version = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const budgets = useMemo(() => {
    void version;
    try {
      return getBudgets(period);
    } catch {
      return [];
    }
  }, [version, period]);

  const reloadBudgets = useCallback(() => {
    emitVaultChange();
  }, []);

  return {
    budgets,
    reloadBudgets,
  };
}

/**
 * Hook reactivo para analítica, gráficos de evolución y hábitos de consumo.
 */
export function useVaultAnalytics(startDate?: number, endDate?: number) {
  const version = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const summary = useMemo(() => {
    void version;
    try {
      return getPeriodSummary(startDate, endDate);
    } catch {
      return { totalIncome: 0, totalExpense: 0, netSavings: 0, count: 0 };
    }
  }, [version, startDate, endDate]);

  const categories = useMemo(() => {
    void version;
    try {
      return getCategoryExpenseBreakdown(startDate, endDate);
    } catch {
      return [];
    }
  }, [version, startDate, endDate]);

  const topExpenses = useMemo(() => {
    void version;
    try {
      return getTopExpenseTransactions(startDate, endDate, 3);
    } catch {
      return [];
    }
  }, [version, startDate, endDate]);

  const monthlyHistory = useMemo(() => {
    void version;
    try {
      return getHistoricalMonthlySavings(4);
    } catch {
      return [];
    }
  }, [version]);

  const timelinePoints = useMemo(() => {
    void version;
    try {
      if (startDate !== undefined && endDate !== undefined) {
        return getLiquidityTimeline(startDate, endDate);
      }
      return [];
    } catch {
      return [];
    }
  }, [version, startDate, endDate]);

  const reloadAnalytics = useCallback(() => {
    emitVaultChange();
  }, []);

  return {
    summary,
    categories,
    topExpenses,
    monthlyHistory,
    timelinePoints,
    reloadAnalytics,
  };
}

/**
 * Hook reactivo para catálogo de categorías.
 */
export function useVaultCategories(flowType?: 'EXPENSE' | 'INCOME') {
  const version = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const categories = useMemo(() => {
    void version;
    try {
      return getCategories(flowType);
    } catch {
      return [];
    }
  }, [version, flowType]);

  const reloadCategories = useCallback(() => {
    emitVaultChange();
  }, []);

  return {
    categories,
    reloadCategories,
  };
}

/**
 * Hook reactivo para configuración de seguridad (PIN y biometría).
 */
export function useVaultSecurity() {
  const version = useSyncExternalStore(subscribeToVaultChanges, getVaultVersion);

  const security = useMemo(() => {
    void version;
    try {
      return getSecuritySettings();
    } catch {
      return { hasPin: false, pinCode: '', biometricsEnabled: false, requirePinOnStartup: false };
    }
  }, [version]);

  const reloadSecurity = useCallback(() => {
    emitVaultChange();
  }, []);

  return {
    security,
    reloadSecurity,
  };
}
