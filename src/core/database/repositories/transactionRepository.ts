import { getDatabase } from '../connection';
import { Transaction, EnrichedTransaction, FlowType } from '../types';
import { emitVaultChange } from '../../state/syncEvents';

export function createTransaction(data: {
  amount: number; // en centavos
  type: FlowType;
  sourceAccountId: string;
  targetAccountId?: string;
  categoryId?: string;
  date?: number; // timestamp
  note?: string;
  payee?: string;
  tags?: string;
}): Transaction {
  const db = getDatabase();
  const id = 'tx_' + Math.random().toString(36).substring(2, 10);
  const date = data.date || Date.now();
  const payee = data.payee?.trim() || '';
  const note = data.note?.trim() || '';
  const tags = data.tags?.trim() || '';

  // Operación atómica: insertar transacción y actualizar saldos de cuentas
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO transactions (id, amount, type, source_account_id, target_account_id, category_id, date, note, payee, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.amount,
        data.type,
        data.sourceAccountId,
        data.targetAccountId || null,
        data.categoryId || null,
        date,
        note,
        payee,
        tags,
      ]
    );

    if (data.type === 'EXPENSE') {
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?',
        [data.amount, data.sourceAccountId]
      );
    } else if (data.type === 'INCOME') {
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?',
        [data.amount, data.sourceAccountId]
      );
    } else if (data.type === 'TRANSFER' && data.targetAccountId) {
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?',
        [data.amount, data.sourceAccountId]
      );
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?',
        [data.amount, data.targetAccountId]
      );
    }
  });

  emitVaultChange();

  return {
    id,
    amount: data.amount,
    type: data.type,
    sourceAccountId: data.sourceAccountId,
    targetAccountId: data.targetAccountId,
    categoryId: data.categoryId,
    date,
    note,
    payee,
    tags,
  };
}

export function getTransactions(filters?: {
  type?: FlowType;
  accountId?: string;
  categoryId?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): EnrichedTransaction[] {
  const db = getDatabase();
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
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.type) {
    query += ' AND t.type = ?';
    params.push(filters.type);
  }
  if (filters?.accountId) {
    query += ' AND (t.source_account_id = ? OR t.target_account_id = ?)';
    params.push(filters.accountId, filters.accountId);
  }
  if (filters?.categoryId) {
    query += ' AND t.category_id = ?';
    params.push(filters.categoryId);
  }
  if (filters?.startDate) {
    query += ' AND t.date >= ?';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += ' AND t.date <= ?';
    params.push(filters.endDate);
  }
  if (filters?.search && filters.search.trim()) {
    query += ' AND (t.payee LIKE ? OR t.note LIKE ? OR c.name LIKE ?)';
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY t.date DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const rows = db.getAllSync<{
    id: string;
    amount: number;
    type: FlowType;
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
    targetAccountId: r.target_account_id || undefined,
    categoryId: r.category_id || undefined,
    date: r.date,
    note: r.note || undefined,
    payee: r.payee || undefined,
    tags: r.tags || undefined,
    sourceAccountName: r.source_account_name || 'Cuenta',
    targetAccountName: r.target_account_name || undefined,
    categoryName: r.category_name || (r.type === 'TRANSFER' ? 'Transferencia' : 'General'),
    categoryIcon: r.category_icon || (r.type === 'TRANSFER' ? 'sync-alt' : 'receipt'),
    categoryColor: r.category_color || (r.type === 'TRANSFER' ? '#8A4FFF' : '#A5E7FF'),
  }));
}

export function deleteTransaction(id: string): void {
  const db = getDatabase();
  const tx = db.getFirstSync<{
    id: string;
    amount: number;
    type: FlowType;
    source_account_id: string;
    target_account_id?: string;
  }>('SELECT id, amount, type, source_account_id, target_account_id FROM transactions WHERE id = ?', [id]);

  if (!tx) return;

  db.withTransactionSync(() => {
    // Revertir modificaciones de saldo
    if (tx.type === 'EXPENSE') {
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        tx.amount,
        tx.source_account_id,
      ]);
    } else if (tx.type === 'INCOME') {
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        tx.amount,
        tx.source_account_id,
      ]);
    } else if (tx.type === 'TRANSFER' && tx.target_account_id) {
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        tx.amount,
        tx.source_account_id,
      ]);
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        tx.amount,
        tx.target_account_id,
      ]);
    }

    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  });

  emitVaultChange();
}

export function updateTransaction(
  id: string,
  data: {
    amount?: number;
    payee?: string;
    note?: string;
    categoryId?: string;
    sourceAccountId?: string;
    targetAccountId?: string;
    date?: number;
  }
): void {
  const db = getDatabase();
  const tx = db.getFirstSync<{
    id: string;
    amount: number;
    type: FlowType;
    source_account_id: string;
    target_account_id?: string;
    category_id?: string;
    payee?: string;
    note?: string;
    date: number;
  }>(
    'SELECT id, amount, type, source_account_id, target_account_id, category_id, payee, note, date FROM transactions WHERE id = ?',
    [id]
  );

  if (!tx) return;

  db.withTransactionSync(() => {
    // 1. Revertir saldo anterior
    if (tx.type === 'EXPENSE') {
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        tx.amount,
        tx.source_account_id,
      ]);
    } else if (tx.type === 'INCOME') {
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        tx.amount,
        tx.source_account_id,
      ]);
    } else if (tx.type === 'TRANSFER' && tx.target_account_id) {
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        tx.amount,
        tx.source_account_id,
      ]);
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        tx.amount,
        tx.target_account_id,
      ]);
    }

    // 2. Preparar nuevos valores
    const newAmount = data.amount !== undefined ? data.amount : tx.amount;
    const newSourceAccountId =
      data.sourceAccountId !== undefined ? data.sourceAccountId : tx.source_account_id;
    const newTargetAccountId =
      data.targetAccountId !== undefined ? data.targetAccountId : tx.target_account_id;
    const newCategoryId =
      data.categoryId !== undefined ? data.categoryId : tx.category_id;
    const newPayee = data.payee !== undefined ? data.payee : tx.payee;
    const newNote = data.note !== undefined ? data.note : tx.note;
    const newDate = data.date !== undefined ? data.date : tx.date;

    // 3. Actualizar registro en base de datos
    db.runSync(
      `UPDATE transactions 
       SET amount = ?, source_account_id = ?, target_account_id = ?, category_id = ?, payee = ?, note = ?, date = ?
       WHERE id = ?`,
      [
        newAmount,
        newSourceAccountId,
        newTargetAccountId || null,
        newCategoryId || null,
        newPayee || null,
        newNote || null,
        newDate,
        id,
      ]
    );

    // 4. Aplicar impacto del nuevo saldo
    if (tx.type === 'EXPENSE') {
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        newAmount,
        newSourceAccountId,
      ]);
    } else if (tx.type === 'INCOME') {
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        newAmount,
        newSourceAccountId,
      ]);
    } else if (tx.type === 'TRANSFER' && newTargetAccountId) {
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        newAmount,
        newSourceAccountId,
      ]);
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        newAmount,
        newTargetAccountId,
      ]);
    }
  });

  emitVaultChange();
}

export function getPeriodSummary(startDate?: number, endDate?: number): {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  count: number;
} {
  const db = getDatabase();
  let query = 'SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE 1=1';
  const params: number[] = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY type';

  const rows = db.getAllSync<{ type: FlowType; total: number; count: number }>(query, params);

  let totalIncome = 0;
  let totalExpense = 0;
  let count = 0;

  for (const r of rows) {
    count += r.count;
    if (r.type === 'INCOME') {
      totalIncome = r.total;
    } else if (r.type === 'EXPENSE') {
      totalExpense = r.total;
    }
  }

  return {
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    count,
  };
}
