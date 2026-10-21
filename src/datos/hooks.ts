import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { suscribirCambiosBoveda, obtenerVersionBoveda, emitirCambioBoveda } from './sincronizacion';
import {
  obtenerCuentas,
  obtenerMovimientos,
  obtenerResumenPeriodo,
  obtenerPresupuestos,
  obtenerCategorias,
  obtenerDesgloseGastosPorCategoria,
  obtenerMayoresGastos,
  obtenerHistoricoAhorroMensual,
  obtenerLineaTiempoLiquidez,
  obtenerAjustesSeguridad,
  obtenerOcurrenciasPorMes,
  obtenerProximosCompromisos,
} from './consultas';
import { TipoFlujo } from './tipos';

/**
 * Hook reactivo para cuentas patrimoniales y saldo disponible consolidado.
 */
export function useCuentasBoveda() {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const accounts = useMemo(() => {
    void version;
    try {
      return obtenerCuentas();
    } catch {
      return [];
    }
  }, [version]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  }, [accounts]);

  const reloadAccounts = useCallback(() => {
    emitirCambioBoveda();
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
export function useMovimientosBoveda(filtros?: {
  type?: TipoFlujo;
  accountId?: string;
  categoryId?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const type = filtros?.type;
  const accountId = filtros?.accountId;
  const categoryId = filtros?.categoryId;
  const search = filtros?.search;
  const startDate = filtros?.startDate;
  const endDate = filtros?.endDate;
  const limit = filtros?.limit;

  const transactions = useMemo(() => {
    void version;
    try {
      return obtenerMovimientos({
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
      return obtenerResumenPeriodo(startDate, endDate);
    } catch {
      return { totalIncome: 0, totalExpense: 0, netSavings: 0, count: 0 };
    }
  }, [version, startDate, endDate]);

  const reloadTransactions = useCallback(() => {
    emitirCambioBoveda();
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
export function usePresupuestosBoveda(periodo: string) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const budgets = useMemo(() => {
    void version;
    try {
      return obtenerPresupuestos(periodo);
    } catch {
      return [];
    }
  }, [version, periodo]);

  const reloadBudgets = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    budgets,
    reloadBudgets,
  };
}

/**
 * Hook reactivo para analítica, gráficos de evolución y hábitos de consumo.
 */
export function useAnaliticasBoveda(startDate?: number, endDate?: number) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const summary = useMemo(() => {
    void version;
    try {
      return obtenerResumenPeriodo(startDate, endDate);
    } catch {
      return { totalIncome: 0, totalExpense: 0, netSavings: 0, count: 0 };
    }
  }, [version, startDate, endDate]);

  const categories = useMemo(() => {
    void version;
    try {
      return obtenerDesgloseGastosPorCategoria(startDate, endDate);
    } catch {
      return [];
    }
  }, [version, startDate, endDate]);

  const topExpenses = useMemo(() => {
    void version;
    try {
      return obtenerMayoresGastos(startDate, endDate, 3);
    } catch {
      return [];
    }
  }, [version, startDate, endDate]);

  const monthlyHistory = useMemo(() => {
    void version;
    try {
      return obtenerHistoricoAhorroMensual(4);
    } catch {
      return [];
    }
  }, [version]);

  const timelinePoints = useMemo(() => {
    void version;
    try {
      if (startDate !== undefined && endDate !== undefined) {
        return obtenerLineaTiempoLiquidez(startDate, endDate);
      }
      return [];
    } catch {
      return [];
    }
  }, [version, startDate, endDate]);

  const reloadAnalytics = useCallback(() => {
    emitirCambioBoveda();
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
export function useCategoriasBoveda(flowType?: 'EXPENSE' | 'INCOME') {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const categories = useMemo(() => {
    void version;
    try {
      return obtenerCategorias(flowType);
    } catch {
      return [];
    }
  }, [version, flowType]);

  const reloadCategories = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    categories,
    reloadCategories,
  };
}

/**
 * Hook reactivo para configuración de seguridad (PIN y biometría).
 */
export function useSeguridadBoveda() {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const security = useMemo(() => {
    void version;
    try {
      return obtenerAjustesSeguridad();
    } catch {
      return { hasPin: false, pinCode: '', biometricsEnabled: false, requirePinOnStartup: false };
    }
  }, [version]);

  const reloadSecurity = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    security,
    reloadSecurity,
  };
}

/**
 * Hook reactivo para el módulo de Agenda (compromisos por mes, día seleccionado y próximos).
 */
export function useAgendaBoveda(opciones?: {
  year?: number;
  month?: number;
  selectedDate?: string;
}) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const optYear = opciones?.year;
  const optMonth = opciones?.month;
  const optSelectedDate = opciones?.selectedDate;

  const { year, month } = useMemo(() => {
    if (optYear !== undefined && optMonth !== undefined) {
      return { year: optYear, month: optMonth };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [optYear, optMonth]);

  const monthOccurrences = useMemo(() => {
    void version;
    try {
      return obtenerOcurrenciasPorMes(year, month);
    } catch {
      return [];
    }
  }, [version, year, month]);

  const selectedDayOccurrences = useMemo(() => {
    if (!optSelectedDate) return [];
    return monthOccurrences.filter(o => o.occurrenceDate === optSelectedDate);
  }, [monthOccurrences, optSelectedDate]);

  const upcomingCommitments = useMemo(() => {
    void version;
    try {
      return obtenerProximosCompromisos(30);
    } catch {
      return [];
    }
  }, [version]);

  const reloadAgenda = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    monthOccurrences,
    selectedDayOccurrences,
    upcomingCommitments,
    reloadAgenda,
  };
}

// Alias compatibles
export const useVaultAccounts = useCuentasBoveda;
export const useVaultTransactions = useMovimientosBoveda;
export const useVaultBudgets = usePresupuestosBoveda;
export const useVaultAnalytics = useAnaliticasBoveda;
export const useVaultCategories = useCategoriasBoveda;
export const useVaultSecurity = useSeguridadBoveda;
export const useVaultAgenda = useAgendaBoveda;
