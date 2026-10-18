import { obtenerBaseDatos } from '../conexion';
import { obtenerMovimientos } from './movimientos';
import { emitirCambioBoveda } from '../sincronizacion';

export function exportarBaseDatosAJson(): string {
  const db = obtenerBaseDatos();
  const accounts = db.getAllSync('SELECT * FROM accounts');
  const categories = db.getAllSync('SELECT * FROM categories');
  const transactions = db.getAllSync('SELECT * FROM transactions');
  const budgets = db.getAllSync('SELECT * FROM budgets');
  const settings = db.getAllSync('SELECT * FROM settings');

  return JSON.stringify(
    {
      version: '1.0.4',
      exportDate: new Date().toISOString(),
      generator: 'Kyrara Gez Local Vault',
      data: {
        accounts,
        categories,
        transactions,
        budgets,
        settings,
      },
    },
    null,
    2
  );
}

export function exportarMovimientosACsv(): string {
  const transactions = obtenerMovimientos();
  const headers = [
    'ID',
    'Fecha',
    'Tipo',
    'Monto_Centavos',
    'Cuenta_Origen',
    'Cuenta_Destino',
    'Categoria',
    'Beneficiario',
    'Nota',
  ];
  const rows = transactions.map(t => [
    t.id,
    new Date(t.date).toISOString(),
    t.type,
    t.amount,
    `"${t.sourceAccountName}"`,
    t.targetAccountName ? `"${t.targetAccountName}"` : '""',
    `"${t.categoryName || ''}"`,
    `"${t.payee || ''}"`,
    `"${t.note || ''}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function restaurarBaseDatosDesdeJson(jsonString: string): {
  accounts: number;
  transactions: number;
  budgets: number;
  categories: number;
} {
  const parsed = JSON.parse(jsonString);
  const data = parsed.data || parsed;
  if (!data || !Array.isArray(data.accounts)) {
    throw new Error('Formato de archivo inválido. No contiene la estructura de Kyrara Gez.');
  }

  const db = obtenerBaseDatos();
  let accCount = 0;
  let txCount = 0;
  let bgtCount = 0;
  let catCount = 0;

  db.withTransactionSync(() => {
    db.execSync(`
      DELETE FROM transactions;
      DELETE FROM budgets;
      DELETE FROM accounts;
      DELETE FROM categories;
    `);

    if (Array.isArray(data.categories)) {
      for (const c of data.categories) {
        db.runSync(
          'INSERT INTO categories (id, name, flow_type, icon, color, is_system) VALUES (?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.flow_type || c.flowType, c.icon, c.color, (c.is_system || c.isSystem) ? 1 : 0]
        );
        catCount++;
      }
    }

    if (Array.isArray(data.accounts)) {
      for (const a of data.accounts) {
        db.runSync(
          `INSERT INTO accounts (id, name, type, currency, initial_balance, current_balance, icon, color, is_archived, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            a.id,
            a.name,
            a.type,
            a.currency || 'UYU',
            a.initial_balance ?? a.initialBalance ?? 0,
            a.current_balance ?? a.currentBalance ?? 0,
            a.icon || 'account-balance',
            a.color || '#8A4FFF',
            (a.is_archived || a.isArchived) ? 1 : 0,
            a.created_at || a.createdAt || Date.now(),
          ]
        );
        accCount++;
      }
    }

    if (Array.isArray(data.transactions)) {
      for (const t of data.transactions) {
        db.runSync(
          `INSERT INTO transactions (id, amount, type, source_account_id, target_account_id, category_id, date, note, payee, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.amount,
            t.type,
            t.source_account_id || t.sourceAccountId,
            t.target_account_id || t.targetAccountId || null,
            t.category_id || t.categoryId || null,
            t.date,
            t.note || null,
            t.payee || null,
            t.tags || null,
          ]
        );
        txCount++;
      }
    }

    if (Array.isArray(data.budgets)) {
      for (const b of data.budgets) {
        db.runSync(
          `INSERT INTO budgets (id, category_id, monthly_limit, period, alert_threshold)
           VALUES (?, ?, ?, ?, ?)`,
          [
            b.id,
            b.category_id || b.categoryId,
            b.monthly_limit ?? b.monthlyLimit,
            b.period,
            b.alert_threshold ?? b.alertThreshold ?? 0.9,
          ]
        );
        bgtCount++;
      }
    }
  });

  emitirCambioBoveda();

  return {
    accounts: accCount,
    transactions: txCount,
    budgets: bgtCount,
    categories: catCount,
  };
}

// Alias compatibles
export const exportDatabaseToJson = exportarBaseDatosAJson;
export const exportTransactionsToCsv = exportarMovimientosACsv;
export const exportarTransaccionesACsv = exportarMovimientosACsv;
export const restoreDatabaseFromJson = restaurarBaseDatosDesdeJson;

