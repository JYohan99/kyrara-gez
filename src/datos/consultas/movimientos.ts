import { obtenerBaseDatos } from '../conexion';
import { Movimiento, MovimientoEnriquecido, TipoFlujo } from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';

export function crearMovimiento(datos: {
  amount: number; // en centavos
  type: TipoFlujo;
  sourceAccountId: string;
  targetAccountId?: string;
  categoryId?: string;
  date?: number; // timestamp
  note?: string;
  payee?: string;
  tags?: string;
}): Movimiento {
  const db = obtenerBaseDatos();
  const id = 'tx_' + Math.random().toString(36).substring(2, 10);
  const date = datos.date || Date.now();
  const payee = datos.payee?.trim() || '';
  const note = datos.note?.trim() || '';
  const tags = datos.tags?.trim() || '';

  // Operación atómica: insertar transacción y actualizar saldos de cuentas
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO transactions (id, amount, type, source_account_id, target_account_id, category_id, date, note, payee, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        datos.amount,
        datos.type,
        datos.sourceAccountId,
        datos.targetAccountId || null,
        datos.categoryId || null,
        date,
        note,
        payee,
        tags,
      ]
    );

    if (datos.type === 'EXPENSE') {
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?',
        [datos.amount, datos.sourceAccountId]
      );
    } else if (datos.type === 'INCOME') {
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?',
        [datos.amount, datos.sourceAccountId]
      );
    } else if (datos.type === 'TRANSFER' && datos.targetAccountId) {
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?',
        [datos.amount, datos.sourceAccountId]
      );
      db.runSync(
        'UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?',
        [datos.amount, datos.targetAccountId]
      );
    }
  });

  emitirCambioBoveda();

  return {
    id,
    amount: datos.amount,
    type: datos.type,
    sourceAccountId: datos.sourceAccountId,
    targetAccountId: datos.targetAccountId,
    categoryId: datos.categoryId,
    date,
    note,
    payee,
    tags,
  };
}

export function obtenerMovimientos(filtros?: {
  type?: TipoFlujo;
  accountId?: string;
  categoryId?: string;
  search?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): MovimientoEnriquecido[] {
  const db = obtenerBaseDatos();
  let consulta = `
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

  if (filtros?.type) {
    consulta += ' AND t.type = ?';
    params.push(filtros.type);
  }
  if (filtros?.accountId) {
    consulta += ' AND (t.source_account_id = ? OR t.target_account_id = ?)';
    params.push(filtros.accountId, filtros.accountId);
  }
  if (filtros?.categoryId) {
    consulta += ' AND t.category_id = ?';
    params.push(filtros.categoryId);
  }
  if (filtros?.startDate) {
    consulta += ' AND t.date >= ?';
    params.push(filtros.startDate);
  }
  if (filtros?.endDate) {
    consulta += ' AND t.date <= ?';
    params.push(filtros.endDate);
  }
  if (filtros?.search && filtros.search.trim()) {
    consulta += ' AND (t.payee LIKE ? OR t.note LIKE ? OR c.name LIKE ?)';
    const termino = `%${filtros.search.trim()}%`;
    params.push(termino, termino, termino);
  }

  consulta += ' ORDER BY t.date DESC';

  if (filtros?.limit) {
    consulta += ' LIMIT ?';
    params.push(filtros.limit);
  }

  const filas = db.getAllSync<{
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
  }>(consulta, params);

  return filas.map(r => ({
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

export function eliminarMovimiento(id: string): void {
  const db = obtenerBaseDatos();
  const tx = db.getFirstSync<{
    id: string;
    amount: number;
    type: TipoFlujo;
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

  emitirCambioBoveda();
}

export function actualizarMovimiento(
  id: string,
  datos: {
    amount?: number;
    payee?: string;
    note?: string;
    categoryId?: string;
    sourceAccountId?: string;
    targetAccountId?: string;
    date?: number;
  }
): void {
  const db = obtenerBaseDatos();
  const tx = db.getFirstSync<{
    id: string;
    amount: number;
    type: TipoFlujo;
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
    const nuevoMonto = datos.amount !== undefined ? datos.amount : tx.amount;
    const nuevaCuentaOrigen =
      datos.sourceAccountId !== undefined ? datos.sourceAccountId : tx.source_account_id;
    const nuevaCuentaDestino =
      datos.targetAccountId !== undefined ? datos.targetAccountId : tx.target_account_id;
    const nuevaCategoria =
      datos.categoryId !== undefined ? datos.categoryId : tx.category_id;
    const nuevoBeneficiario = datos.payee !== undefined ? datos.payee : tx.payee;
    const nuevaNota = datos.note !== undefined ? datos.note : tx.note;
    const nuevaFecha = datos.date !== undefined ? datos.date : tx.date;

    // 3. Actualizar registro en base de datos
    db.runSync(
      `UPDATE transactions 
       SET amount = ?, source_account_id = ?, target_account_id = ?, category_id = ?, payee = ?, note = ?, date = ?
       WHERE id = ?`,
      [
        nuevoMonto,
        nuevaCuentaOrigen,
        nuevaCuentaDestino || null,
        nuevaCategoria || null,
        nuevoBeneficiario || null,
        nuevaNota || null,
        nuevaFecha,
        id,
      ]
    );

    // 4. Aplicar impacto del nuevo saldo
    if (tx.type === 'EXPENSE') {
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        nuevoMonto,
        nuevaCuentaOrigen,
      ]);
    } else if (tx.type === 'INCOME') {
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        nuevoMonto,
        nuevaCuentaOrigen,
      ]);
    } else if (tx.type === 'TRANSFER' && nuevaCuentaDestino) {
      db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        nuevoMonto,
        nuevaCuentaOrigen,
      ]);
      db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        nuevoMonto,
        nuevaCuentaDestino,
      ]);
    }
  });

  emitirCambioBoveda();
}

export function obtenerResumenPeriodo(startDate?: number, endDate?: number): {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  count: number;
} {
  const db = obtenerBaseDatos();
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

  const rows = db.getAllSync<{ type: TipoFlujo; total: number; count: number }>(query, params);

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

// Alias compatibles
export const createTransaction = crearMovimiento;
export const getTransactions = obtenerMovimientos;
export const deleteTransaction = eliminarMovimiento;
export const updateTransaction = actualizarMovimiento;
export const getPeriodSummary = obtenerResumenPeriodo;
