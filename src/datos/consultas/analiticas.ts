import { obtenerBaseDatos } from '../conexion';
import {
  DesgloseGastoCategoria,
  MovimientoEnriquecido,
  EstadisticaAhorroMensual,
  PuntoLineaTiempo,
  TipoFlujo,
} from '../tipos';
import { obtenerResumenPeriodo } from './movimientos';
import { obtenerSaldoTotalDisponible } from './cuentas';

export function obtenerDesgloseGastosPorCategoria(
  startDate?: number,
  endDate?: number
): DesgloseGastoCategoria[] {
  const db = obtenerBaseDatos();
  let query = `
    SELECT 
      c.id as category_id,
      COALESCE(c.name, 'Otros Gastos') as category_name,
      COALESCE(c.icon, 'more-horiz') as category_icon,
      COALESCE(c.color, '#958DA1') as category_color,
      SUM(t.amount) as total_amount
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE'
  `;
  const params: (string | number)[] = [];
  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
  }
  query += ' GROUP BY c.id ORDER BY total_amount DESC';

  const rows = db.getAllSync<{
    category_id: string | null;
    category_name: string;
    category_icon: string;
    category_color: string;
    total_amount: number;
  }>(query, params);

  const overallExpense = rows.reduce((sum, r) => sum + r.total_amount, 0);

  return rows.map(r => ({
    categoryId: r.category_id || 'other',
    categoryName: r.category_name,
    categoryIcon: r.category_icon,
    categoryColor: r.category_color,
    totalAmount: r.total_amount,
    percent: overallExpense > 0 ? Math.round((r.total_amount / overallExpense) * 100) : 0,
  }));
}

export function obtenerMayoresGastos(
  startDate?: number,
  endDate?: number,
  limit: number = 3
): MovimientoEnriquecido[] {
  const db = obtenerBaseDatos();
  let query = `
    SELECT 
      t.id, t.amount, t.type, t.source_account_id, t.target_account_id,
      t.category_id, t.date, t.note, t.payee, t.tags,
      sa.name as source_account_name,
      ta.name as target_account_name,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    LEFT JOIN accounts sa ON t.source_account_id = sa.id
    LEFT JOIN accounts ta ON t.target_account_id = ta.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'EXPENSE'
  `;
  const params: (string | number)[] = [];
  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
  }
  query += ' ORDER BY t.amount DESC LIMIT ?';
  params.push(limit);

  const rows = db.getAllSync<{
    id: string;
    amount: number;
    type: TipoFlujo;
    source_account_id: string;
    target_account_id?: string;
    category_id?: string;
    date: number;
    note?: string;
    payee?: string;
    tags?: string;
    source_account_name?: string;
    target_account_name?: string;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
  }>(query, params);

  return rows.map(r => ({
    id: r.id,
    amount: r.amount,
    type: r.type,
    sourceAccountId: r.source_account_id,
    targetAccountId: r.target_account_id,
    categoryId: r.category_id,
    date: r.date,
    note: r.note,
    payee: r.payee,
    tags: r.tags,
    sourceAccountName: r.source_account_name || 'Desconocida',
    targetAccountName: r.target_account_name,
    categoryName: r.category_name || 'Sin Categoría',
    categoryIcon: r.category_icon || 'more-horiz',
    categoryColor: r.category_color || '#958DA1',
  }));
}

export function obtenerHistoricoAhorroMensual(monthsCount: number = 4): EstadisticaAhorroMensual[] {
  const stats: EstadisticaAhorroMensual[] = [];
  const monthShorts = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const period = `${y}-${m.toString().padStart(2, '0')}`;
    const start = new Date(y, m - 1, 1).getTime();
    const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();

    const summary = obtenerResumenPeriodo(start, end);
    const savingsRate = summary.totalIncome > 0
      ? Math.max(0, Math.round((summary.netSavings / summary.totalIncome) * 1000) / 10)
      : 0;

    stats.push({
      monthLabel: monthShorts[m - 1],
      period,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netSavings: summary.netSavings,
      savingsRate,
    });
  }

  return stats;
}

export function obtenerLineaTiempoLiquidez(startDate: number, endDate: number): PuntoLineaTiempo[] {
  const currentTotal = obtenerSaldoTotalDisponible();
  const summary = obtenerResumenPeriodo(startDate, endDate);
  const netPeriod = summary.netSavings;
  const startBalance = currentTotal - netPeriod;
  const midBalance = startBalance + Math.round(netPeriod / 2);

  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const midD = new Date(startDate + (endDate - startDate) / 2);

  const monthShorts = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const formatShort = (d: Date) => `${d.getDate().toString().padStart(2, '0')} ${monthShorts[d.getMonth()]}`;

  return [
    {
      label: formatShort(startD),
      date: startDate,
      balanceCents: startBalance,
      displayAmount: `$ ${(startBalance / 100).toLocaleString('es-UY', { maximumFractionDigits: 0 })}`,
    },
    {
      label: formatShort(midD),
      date: midD.getTime(),
      balanceCents: midBalance,
      displayAmount: `$ ${(midBalance / 100).toLocaleString('es-UY', { maximumFractionDigits: 0 })}`,
    },
    {
      label: 'Hoy (' + formatShort(endD) + ')',
      date: endDate,
      balanceCents: currentTotal,
      displayAmount: `$ ${(currentTotal / 100).toLocaleString('es-UY', { maximumFractionDigits: 0 })}`,
    },
  ];
}

// Alias compatibles
export const getCategoryExpenseBreakdown = obtenerDesgloseGastosPorCategoria;
export const getTopExpenseTransactions = obtenerMayoresGastos;
export const getHistoricalMonthlySavings = obtenerHistoricoAhorroMensual;
export const getLiquidityTimeline = obtenerLineaTiempoLiquidez;
