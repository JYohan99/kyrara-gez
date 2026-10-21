import { obtenerBaseDatos } from '../conexion';
import { obtenerMovimientos } from './movimientos';
import { emitirCambioBoveda } from '../sincronizacion';
import { sincronizarNotificacionesPendientes } from './agenda';

export function exportarBaseDatosAJson(): string {
  const db = obtenerBaseDatos();
  const accounts = db.getAllSync('SELECT * FROM accounts');
  const categories = db.getAllSync('SELECT * FROM categories');
  const transactions = db.getAllSync('SELECT * FROM transactions');
  const budgets = db.getAllSync('SELECT * FROM budgets');
  const settings = db.getAllSync('SELECT * FROM settings');
  const commitments = db.getAllSync('SELECT * FROM commitments');
  const reminders = db.getAllSync('SELECT * FROM reminders');
  const recurrence_exceptions = db.getAllSync('SELECT * FROM recurrence_exceptions');

  return JSON.stringify(
    {
      version: '1.1.0',
      exportDate: new Date().toISOString(),
      generator: 'Kyrara Gez Local Vault',
      data: {
        accounts,
        categories,
        transactions,
        budgets,
        settings,
        commitments,
        reminders,
        recurrence_exceptions,
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
    'Monto',
    'Cuenta_Origen',
    'Cuenta_Destino',
    'Categoria',
    'Beneficiario',
    'Nota',
  ];
  const rows = transactions.map(t => {
    const fecha = new Date(t.date).toISOString().slice(0, 19).replace('T', ' ');
    const monto = (t.amount / 100).toFixed(2);
    const tipo = t.type === 'EXPENSE' ? 'Gasto' : t.type === 'INCOME' ? 'Ingreso' : 'Transferencia';
    return [
      t.id,
      `"${fecha}"`,
      `"${tipo}"`,
      monto,
      `"${(t.sourceAccountName || '').replace(/"/g, '""')}"`,
      t.targetAccountName ? `"${t.targetAccountName.replace(/"/g, '""')}"` : '""',
      `"${(t.categoryName || '').replace(/"/g, '""')}"`,
      `"${(t.payee || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ];
  });

  // \uFEFF asegura que Excel reconozca codificación UTF-8
  return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function restaurarBaseDatosDesdeJson(jsonString: string): {
  accounts: number;
  transactions: number;
  budgets: number;
  categories: number;
  commitments: number;
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
  let comCount = 0;

  db.withTransactionSync(() => {
    db.execSync(`
      DELETE FROM transactions;
      DELETE FROM budgets;
      DELETE FROM accounts;
      DELETE FROM categories;
      DELETE FROM reminders;
      DELETE FROM recurrence_exceptions;
      DELETE FROM commitments;
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

    if (Array.isArray(data.commitments)) {
      for (const cm of data.commitments) {
        db.runSync(
          `INSERT INTO commitments (id, title, date, time, description, related_person, recurrence_type, series_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cm.id,
            cm.title,
            cm.date,
            cm.time || null,
            cm.description || null,
            cm.related_person || cm.relatedPerson || null,
            cm.recurrence_type || cm.recurrenceType || 'SINGLE',
            cm.series_id || cm.seriesId || null,
            cm.status || 'PENDING',
            cm.created_at || cm.createdAt || Date.now(),
            cm.updated_at || cm.updatedAt || Date.now(),
          ]
        );
        comCount++;
      }
    }

    if (Array.isArray(data.reminders)) {
      for (const rm of data.reminders) {
        db.runSync(
          `INSERT INTO reminders (id, commitment_id, days_before, time, notification_id, created_at)
           VALUES (?, ?, ?, ?, NULL, ?)`,
          [
            rm.id,
            rm.commitment_id || rm.commitmentId,
            rm.days_before ?? rm.daysBefore ?? 0,
            rm.time || '09:00',
            rm.created_at || rm.createdAt || Date.now(),
          ]
        );
      }
    }

    if (Array.isArray(data.recurrence_exceptions)) {
      for (const ex of data.recurrence_exceptions) {
        db.runSync(
          `INSERT INTO recurrence_exceptions (id, series_id, original_date, status, modified_commitment_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ex.id,
            ex.series_id || ex.seriesId,
            ex.original_date || ex.originalDate,
            ex.status,
            ex.modified_commitment_id || ex.modifiedCommitmentId || null,
            ex.created_at || ex.createdAt || Date.now(),
          ]
        );
      }
    }
  });

  emitirCambioBoveda();

  // Reprogramar notificaciones de los compromisos restaurados
  sincronizarNotificacionesPendientes().catch(() => {});

  return {
    accounts: accCount,
    transactions: txCount,
    budgets: bgtCount,
    categories: catCount,
    commitments: comCount,
  };
}

// Alias compatibles
export const exportDatabaseToJson = exportarBaseDatosAJson;
export const exportTransactionsToCsv = exportarMovimientosACsv;
export const exportarTransaccionesACsv = exportarMovimientosACsv;
export const restoreDatabaseFromJson = restaurarBaseDatosDesdeJson;

