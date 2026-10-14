import { getDatabase } from '../connection';
import { Budget, EnrichedBudget } from '../types';
import { getCategories } from './categoryRepository';
import { emitVaultChange } from '../../state/syncEvents';

export function setBudget(data: {
  categoryId: string;
  monthlyLimit: number; // en centavos
  period: string; // 'YYYY-MM'
  alertThreshold?: number;
}): Budget {
  const db = getDatabase();
  const alertThreshold = data.alertThreshold ?? 0.9;

  const existing = db.getFirstSync<{ id: string }>(
    'SELECT id FROM budgets WHERE category_id = ? AND period = ?',
    [data.categoryId, data.period]
  );

  const id = existing ? existing.id : 'bgt_' + Math.random().toString(36).substring(2, 10);

  if (existing) {
    db.runSync(
      'UPDATE budgets SET monthly_limit = ?, alert_threshold = ? WHERE id = ?',
      [data.monthlyLimit, alertThreshold, id]
    );
  } else {
    db.runSync(
      'INSERT INTO budgets (id, category_id, monthly_limit, period, alert_threshold) VALUES (?, ?, ?, ?, ?)',
      [id, data.categoryId, data.monthlyLimit, data.period, alertThreshold]
    );
  }

  emitVaultChange();

  return {
    id,
    categoryId: data.categoryId,
    monthlyLimit: data.monthlyLimit,
    period: data.period,
    alertThreshold,
  };
}

export function getBudgets(period: string): EnrichedBudget[] {
  const db = getDatabase();
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const startDate = new Date(year, month - 1, 1).getTime();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

  const rows = db.getAllSync<{
    id: string;
    category_id: string;
    monthly_limit: number;
    period: string;
    alert_threshold: number;
    category_name: string;
    category_icon: string;
    category_color: string;
  }>(
    `SELECT b.id, b.category_id, b.monthly_limit, b.period, b.alert_threshold,
            c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.period = ?
     ORDER BY b.monthly_limit DESC`,
    [period]
  );

  return rows.map(b => {
    const spentRow = db.getFirstSync<{ total_spent: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total_spent
       FROM transactions
       WHERE type = 'EXPENSE' AND category_id = ? AND date >= ? AND date <= ?`,
      [b.category_id, startDate, endDate]
    );

    const spent = spentRow ? spentRow.total_spent : 0;
    const remaining = Math.max(0, b.monthly_limit - spent);
    const percent = b.monthly_limit > 0 ? Math.round((spent / b.monthly_limit) * 100) : 0;

    return {
      id: b.id,
      categoryId: b.category_id,
      monthlyLimit: b.monthly_limit,
      period: b.period,
      alertThreshold: b.alert_threshold,
      categoryName: b.category_name,
      categoryIcon: b.category_icon,
      categoryColor: b.category_color,
      spent,
      remaining,
      percent,
      isOverBudget: spent > b.monthly_limit,
      isNearLimit: percent >= b.alert_threshold * 100,
    };
  });
}

export function deleteBudget(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM budgets WHERE id = ?', [id]);
  emitVaultChange();
}

export function cloneBudgets(fromPeriod: string, toPeriod: string): number {
  const db = getDatabase();
  const sourceBudgets = db.getAllSync<{
    category_id: string;
    monthly_limit: number;
    alert_threshold: number;
  }>('SELECT category_id, monthly_limit, alert_threshold FROM budgets WHERE period = ?', [fromPeriod]);

  let cloned = 0;
  db.withTransactionSync(() => {
    for (const b of sourceBudgets) {
      setBudget({
        categoryId: b.category_id,
        monthlyLimit: b.monthly_limit,
        period: toPeriod,
        alertThreshold: b.alert_threshold,
      });
      cloned++;
    }
  });

  emitVaultChange();
  return cloned;
}

export function seedRecommendedBudgets(period: string): void {
  const db = getDatabase();
  const categories = getCategories('EXPENSE');

  const presets: Record<string, number> = {
    'Alimentación': 1000000, // $ 10.000
    'Transporte': 500000,    // $ 5.000
    'Vivienda y Servicios': 1800000, // $ 18.000
    'Salud y Cuidado': 300000, // $ 3.000
    'Ocio y Suscripciones': 450000, // $ 4.500
    'Educación': 250000, // $ 2.500
    'Otros Gastos': 300000, // $ 3.000
  };

  db.withTransactionSync(() => {
    for (const cat of categories) {
      const limit = presets[cat.name] || 400000;
      setBudget({
        categoryId: cat.id,
        monthlyLimit: limit,
        period,
        alertThreshold: 0.9,
      });
    }
  });

  emitVaultChange();
}
