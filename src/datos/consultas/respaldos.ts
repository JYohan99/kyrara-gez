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
  const debts = db.getAllSync('SELECT * FROM debts');
  const debt_payments = db.getAllSync('SELECT * FROM debt_payments');
  const photo_products = db.getAllSync('SELECT * FROM photo_products');
  const photo_product_prices = db.getAllSync('SELECT * FROM photo_product_prices');

  return JSON.stringify(
    {
      version: '1.2.0',
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
        debts,
        debt_payments,
        photo_products,
        photo_product_prices,
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
  debts?: number;
  photoProducts?: number;
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
  let debtCount = 0;
  let photoProductCount = 0;

  db.withTransactionSync(() => {
    db.execSync(`
      DELETE FROM photo_product_prices;
      DELETE FROM photo_products;
      DELETE FROM debt_payments;
      DELETE FROM debts;
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

    if (Array.isArray(data.debts)) {
      for (const d of data.debts) {
        db.runSync(
          `INSERT INTO debts (
            id, type, person, concept, total_amount, paid_amount, remaining_amount,
            issue_date, due_date, status, notes, reminder_days_before, reminder_time,
            notification_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
          [
            d.id,
            d.type,
            d.person,
            d.concept,
            d.total_amount ?? d.totalAmount,
            d.paid_amount ?? d.paidAmount ?? 0,
            d.remaining_amount ?? d.remainingAmount,
            d.issue_date || d.issueDate,
            d.due_date || d.dueDate || null,
            d.status || 'PENDING',
            d.notes || null,
            d.reminder_days_before ?? d.reminderDaysBefore ?? null,
            d.reminder_time || d.reminderTime || '09:00',
            d.created_at || d.createdAt || Date.now(),
            d.updated_at || d.updatedAt || Date.now(),
          ]
        );
        debtCount++;
      }
    }

    if (Array.isArray(data.debt_payments)) {
      for (const dp of data.debt_payments) {
        db.runSync(
          `INSERT INTO debt_payments (
            id, debt_id, amount, date, account_id, transaction_id, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dp.id,
            dp.debt_id || dp.debtId,
            dp.amount,
            dp.date,
            dp.account_id || dp.accountId || null,
            dp.transaction_id || dp.transactionId || null,
            dp.notes || null,
            dp.created_at || dp.createdAt || Date.now(),
          ]
        );
      }
    }

    if (Array.isArray(data.photo_products)) {
      for (const p of data.photo_products) {
        db.runSync(
          `INSERT INTO photo_products (
            id, name, category, size_format, sale_unit, description,
            is_active, base_price, cost_price, currency, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name,
            p.category || 'General',
            p.size_format || p.sizeFormat || null,
            p.sale_unit || p.saleUnit || 'Unidad',
            p.description || null,
            p.is_active !== undefined ? (p.is_active ? 1 : 0) : (p.isActive ? 1 : 0),
            p.base_price ?? p.basePrice ?? 0,
            p.cost_price ?? p.costPrice ?? 0,
            p.currency || 'UYU',
            p.created_at || p.createdAt || Date.now(),
            p.updated_at || p.updatedAt || Date.now(),
          ]
        );
        photoProductCount++;
      }
    }

    if (Array.isArray(data.photo_product_prices)) {
      for (const pr of data.photo_product_prices) {
        db.runSync(
          `INSERT INTO photo_product_prices (
            id, product_id, sale_price, cost_price, cost_usd, exchange_rate,
            valid_from, valid_to, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pr.id,
            pr.product_id || pr.productId,
            pr.sale_price ?? pr.salePrice ?? 0,
            pr.cost_price ?? pr.costPrice ?? 0,
            pr.cost_usd ?? pr.costUsd ?? null,
            pr.exchange_rate ?? pr.exchangeRate ?? null,
            pr.valid_from || pr.validFrom,
            pr.valid_to || pr.validTo || null,
            pr.notes || null,
            pr.created_at || pr.createdAt || Date.now(),
            pr.updated_at || pr.updatedAt || Date.now(),
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
    debts: debtCount,
    photoProducts: photoProductCount,
  };
}

// Alias compatibles
export const exportDatabaseToJson = exportarBaseDatosAJson;
export const exportTransactionsToCsv = exportarMovimientosACsv;
export const exportarTransaccionesACsv = exportarMovimientosACsv;
export const restoreDatabaseFromJson = restaurarBaseDatosDesdeJson;

