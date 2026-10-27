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
  obtenerDeudas,
  obtenerResumenDeudas,
  obtenerProductosFotos,
  obtenerCategoriasFotos,
  obtenerTarifasProducto,
  obtenerTarifaVigente,
  obtenerHistorialCambiosPrecios,
  obtenerEstadisticasCatalogoFotos,
  obtenerEvolucionTarifasProducto,
} from './consultas';
import {
  TipoFlujo,
  TipoDeuda,
  FiltroEstadoDeuda,
  FiltroEstadoProductoFoto,
  FiltroHistorialPrecios,
} from './tipos';

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

/**
 * Hook reactivo para consultar el listado de deudas y su resumen consolidado.
 */
export function useDeudasBoveda(filtros?: {
  type?: TipoDeuda;
  statusFilter?: FiltroEstadoDeuda;
  search?: string;
}) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const type = filtros?.type;
  const statusFilter = filtros?.statusFilter;
  const search = filtros?.search;

  const debts = useMemo(() => {
    void version;
    try {
      return obtenerDeudas({ type, statusFilter, search });
    } catch {
      return [];
    }
  }, [version, type, statusFilter, search]);

  const summary = useMemo(() => {
    void version;
    try {
      return obtenerResumenDeudas();
    } catch {
      return {
        totalReceivablePending: 0,
        totalPayablePending: 0,
        netBalance: 0,
        countReceivablePending: 0,
        countPayablePending: 0,
        countOverdue: 0,
      };
    }
  }, [version]);

  const reloadDeudas = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    debts,
    summary,
    reloadDeudas,
  };
}

/**
 * Hook reactivo para consultar productos fotográficos y categorías del catálogo.
 */
export function useProductosFotosBoveda(filtros?: {
  category?: string;
  search?: string;
  statusFilter?: FiltroEstadoProductoFoto;
}) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const category = filtros?.category;
  const search = filtros?.search;
  const statusFilter = filtros?.statusFilter;

  const products = useMemo(() => {
    void version;
    try {
      return obtenerProductosFotos({ category, search, statusFilter });
    } catch {
      return [];
    }
  }, [version, category, search, statusFilter]);

  const categories = useMemo(() => {
    void version;
    try {
      return obtenerCategoriasFotos();
    } catch {
      return [];
    }
  }, [version]);

  const reloadProducts = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    products,
    categories,
    reloadProducts,
  };
}

/**
 * Hook reactivo para consultar el historial de tarifas y tarifa vigente de un producto.
 */
export function useTarifasProductoBoveda(productId?: string) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const tariffs = useMemo(() => {
    void version;
    if (!productId) return [];
    try {
      return obtenerTarifasProducto(productId);
    } catch {
      return [];
    }
  }, [version, productId]);

  const currentTariff = useMemo(() => {
    void version;
    if (!productId) return null;
    try {
      return obtenerTarifaVigente(productId);
    } catch {
      return null;
    }
  }, [version, productId]);

  const reloadTariffs = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    tariffs,
    currentTariff,
    reloadTariffs,
  };
}

/**
 * Hook reactivo para consultar el historial de cambios de precios con filtros.
 */
export function useHistorialPreciosBoveda(filtros?: FiltroHistorialPrecios) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const productId = filtros?.productId;
  const startDate = filtros?.startDate;
  const endDate = filtros?.endDate;
  const currency = filtros?.currency;
  const search = filtros?.search;

  const history = useMemo(() => {
    void version;
    try {
      return obtenerHistorialCambiosPrecios({ productId, startDate, endDate, currency, search });
    } catch {
      return [];
    }
  }, [version, productId, startDate, endDate, currency, search]);

  const reloadHistory = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    history,
    reloadHistory,
  };
}

/**
 * Hook reactivo para consultar las estadísticas generales y métricas por moneda del catálogo.
 */
export function useEstadisticasCatalogoFotosBoveda() {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const stats = useMemo(() => {
    void version;
    try {
      return obtenerEstadisticasCatalogoFotos();
    } catch {
      return {
        totalProductosGlobal: 0,
        totalActivosGlobal: 0,
        totalInactivosGlobal: 0,
        totalSinPrecioGlobal: 0,
        totalSinCostoGlobal: 0,
        monedas: [],
        porMoneda: {},
      };
    }
  }, [version]);

  const reloadStats = useCallback(() => {
    emitirCambioBoveda();
  }, []);

  return {
    stats,
    reloadStats,
  };
}

/**
 * Hook reactivo para consultar la evolución histórica de un producto específico.
 */
export function useEvolucionTarifasProductoBoveda(productId?: string) {
  const version = useSyncExternalStore(suscribirCambiosBoveda, obtenerVersionBoveda);

  const evolution = useMemo(() => {
    void version;
    if (!productId) return [];
    try {
      return obtenerEvolucionTarifasProducto(productId);
    } catch {
      return [];
    }
  }, [version, productId]);

  return {
    evolution,
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
export const useVaultDebts = useDeudasBoveda;
export const useProductosBoveda = useProductosFotosBoveda;
export const useEstadisticasCatalogoProductosBoveda = useEstadisticasCatalogoFotosBoveda;
export const useVaultProducts = useProductosFotosBoveda;
export const useVaultProductTariffs = useTarifasProductoBoveda;
export const useVaultPriceHistory = useHistorialPreciosBoveda;
export const useVaultCatalogStats = useEstadisticasCatalogoFotosBoveda;
export const useVaultProductEvolution = useEvolucionTarifasProductoBoveda;
export const useVaultPhotoProducts = useProductosFotosBoveda;
export const useVaultPhotoProductTariffs = useTarifasProductoBoveda;
export const useVaultPhotoPriceHistory = useHistorialPreciosBoveda;
export const useVaultPhotoCatalogStats = useEstadisticasCatalogoFotosBoveda;
export const useVaultPhotoProductEvolution = useEvolucionTarifasProductoBoveda;

