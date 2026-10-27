import { obtenerBaseDatos } from '../conexion';
import { emitirCambioBoveda } from '../sincronizacion';
import {
  Deuda,
  PagoDeuda,
  ResumenDeudas,
  TipoDeuda,
  FiltroEstadoDeuda,
} from '../tipos';
import {
  programarNotificacionDeuda,
  cancelarNotificacionDeuda,
} from '@/compartido/servicios/notificaciones';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';

interface FilaDeudaRaw {
  id: string;
  type: TipoDeuda;
  person: string;
  concept: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  issue_date: string;
  due_date: string | null;
  status: string;
  notes: string | null;
  reminder_days_before: number | null;
  reminder_time: string | null;
  notification_id: string | null;
  created_at: number;
  updated_at: number;
}

interface FilaPagoRaw {
  id: string;
  debt_id: string;
  amount: number;
  date: string;
  account_id: string | null;
  account_name: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: number;
}

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const date = new Date(y, m - 1, d + dias);
  const ry = date.getFullYear();
  const rm = String(date.getMonth() + 1).padStart(2, '0');
  const rd = String(date.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

function mapearFilaADeuda(fila: FilaDeudaRaw): Deuda {
  const today = hoyISO();
  const in3Days = sumarDias(today, 3);
  const isPaid = fila.status === 'PAID';
  const isCancelled = fila.status === 'CANCELLED';

  const isOverdue = !isPaid && !isCancelled && Boolean(fila.due_date && fila.due_date < today);
  const isDueSoon =
    !isPaid &&
    !isCancelled &&
    !isOverdue &&
    Boolean(fila.due_date && fila.due_date >= today && fila.due_date <= in3Days);

  const progressPercentage =
    fila.total_amount > 0
      ? Math.min(100, Math.max(0, Math.round((fila.paid_amount / fila.total_amount) * 100)))
      : 0;

  return {
    id: fila.id,
    type: fila.type,
    person: fila.person,
    concept: fila.concept,
    totalAmount: fila.total_amount,
    paidAmount: fila.paid_amount,
    remainingAmount: fila.remaining_amount,
    issueDate: fila.issue_date,
    dueDate: fila.due_date || undefined,
    status: fila.status as any,
    notes: fila.notes || undefined,
    reminderDaysBefore: fila.reminder_days_before !== null ? fila.reminder_days_before : undefined,
    reminderTime: fila.reminder_time || undefined,
    notificationId: fila.notification_id || undefined,
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
    isOverdue,
    isDueSoon,
    progressPercentage,
  };
}

/**
 * Crea un nuevo registro de deuda en la bóveda local.
 * No modifica los saldos de ninguna cuenta bancaria ni efectivo.
 */
export function crearDeuda(datos: {
  type: TipoDeuda;
  person: string;
  concept: string;
  totalAmount: number;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  reminderDaysBefore?: number;
  reminderTime?: string;
}): Deuda {
  if (datos.totalAmount <= 0) {
    throw new Error('El importe de la deuda debe ser mayor a cero.');
  }
  if (!datos.person.trim()) {
    throw new Error('Debes indicar la persona o entidad.');
  }
  if (!datos.concept.trim()) {
    throw new Error('Debes indicar el concepto de la deuda.');
  }

  const db = obtenerBaseDatos();
  const id = `debt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  const paidAmount = 0;
  const remainingAmount = datos.totalAmount;
  const status = 'PENDING';
  const reminderTime = datos.reminderTime || '09:00';

  db.runSync(
    `INSERT INTO debts (
      id, type, person, concept, total_amount, paid_amount, remaining_amount,
      issue_date, due_date, status, notes, reminder_days_before, reminder_time,
      notification_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    [
      id,
      datos.type,
      datos.person.trim(),
      datos.concept.trim(),
      datos.totalAmount,
      paidAmount,
      remainingAmount,
      datos.issueDate,
      datos.dueDate || null,
      status,
      datos.notes?.trim() || null,
      datos.reminderDaysBefore !== undefined ? datos.reminderDaysBefore : null,
      reminderTime,
      now,
      now,
    ]
  );

  // Programar notificación si tiene vencimiento y recordatorio
  if (datos.dueDate && datos.reminderDaysBefore !== undefined) {
    programarNotificacionDeuda({
      debtId: id,
      type: datos.type,
      person: datos.person.trim(),
      concept: datos.concept.trim(),
      remainingAmountFormatted: formatCurrency(remainingAmount),
      dueDate: datos.dueDate,
      daysBefore: datos.reminderDaysBefore,
      reminderTime,
    })
      .then(notifId => {
        if (notifId) {
          try {
            db.runSync('UPDATE debts SET notification_id = ? WHERE id = ?', [notifId, id]);
          } catch {
            // Ignorar error si base de datos está ocupada
          }
        }
      })
      .catch(() => {});
  }

  emitirCambioBoveda();
  return obtenerDeudaPorId(id)!;
}

/**
 * Actualiza los datos de una deuda existente.
 */
export function actualizarDeuda(
  id: string,
  cambios: {
    type?: TipoDeuda;
    person?: string;
    concept?: string;
    totalAmount?: number;
    issueDate?: string;
    dueDate?: string | null;
    notes?: string | null;
    reminderDaysBefore?: number | null;
    reminderTime?: string | null;
  }
): Deuda {
  const db = obtenerBaseDatos();
  const actual = db.getFirstSync<FilaDeudaRaw>('SELECT * FROM debts WHERE id = ?', [id]);
  if (!actual) {
    throw new Error('La deuda especificada no existe.');
  }

  const now = Date.now();
  const person = cambios.person !== undefined ? cambios.person.trim() : actual.person;
  const concept = cambios.concept !== undefined ? cambios.concept.trim() : actual.concept;
  const type = cambios.type !== undefined ? cambios.type : actual.type;
  const issueDate = cambios.issueDate !== undefined ? cambios.issueDate : actual.issue_date;
  const dueDate = cambios.dueDate !== undefined ? cambios.dueDate : actual.due_date;
  const notes = cambios.notes !== undefined ? cambios.notes : actual.notes;
  const reminderDaysBefore =
    cambios.reminderDaysBefore !== undefined
      ? cambios.reminderDaysBefore
      : actual.reminder_days_before;
  const reminderTime =
    cambios.reminderTime !== undefined
      ? cambios.reminderTime
      : actual.reminder_time || '09:00';

  let totalAmount = actual.total_amount;
  let remainingAmount = actual.remaining_amount;
  let status = actual.status;

  if (cambios.totalAmount !== undefined && cambios.totalAmount !== actual.total_amount) {
    if (cambios.totalAmount < actual.paid_amount) {
      throw new Error(
        `El nuevo importe total ($${(cambios.totalAmount / 100).toFixed(2)}) no puede ser menor a lo ya pagado ($${(actual.paid_amount / 100).toFixed(2)}).`
      );
    }
    totalAmount = cambios.totalAmount;
    remainingAmount = totalAmount - actual.paid_amount;
    if (remainingAmount <= 0) {
      status = 'PAID';
    } else if (actual.paid_amount > 0) {
      status = 'PARTIAL';
    } else {
      status = 'PENDING';
    }
  }

  // Cancelar notificación previa si existía
  if (actual.notification_id) {
    cancelarNotificacionDeuda(actual.notification_id).catch(() => {});
  }

  db.runSync(
    `UPDATE debts SET
      type = ?, person = ?, concept = ?, total_amount = ?, remaining_amount = ?,
      issue_date = ?, due_date = ?, status = ?, notes = ?, reminder_days_before = ?,
      reminder_time = ?, notification_id = NULL, updated_at = ?
    WHERE id = ?`,
    [
      type,
      person,
      concept,
      totalAmount,
      remainingAmount,
      issueDate,
      dueDate || null,
      status,
      notes || null,
      reminderDaysBefore !== null ? reminderDaysBefore : null,
      reminderTime || null,
      now,
      id,
    ]
  );

  // Reprogramar notificación si corresponde
  if (dueDate && reminderDaysBefore !== null && reminderDaysBefore !== undefined && status !== 'PAID' && status !== 'CANCELLED') {
    programarNotificacionDeuda({
      debtId: id,
      type,
      person,
      concept,
      remainingAmountFormatted: formatCurrency(remainingAmount),
      dueDate,
      daysBefore: reminderDaysBefore,
      reminderTime: reminderTime || '09:00',
    })
      .then(notifId => {
        if (notifId) {
          try {
            db.runSync('UPDATE debts SET notification_id = ? WHERE id = ?', [notifId, id]);
          } catch {}
        }
      })
      .catch(() => {});
  }

  emitirCambioBoveda();
  return obtenerDeudaPorId(id)!;
}

/**
 * Marca una deuda como cancelada sin eliminar el historial de registros.
 */
export function cancelarDeuda(id: string): void {
  const db = obtenerBaseDatos();
  const actual = db.getFirstSync<FilaDeudaRaw>('SELECT * FROM debts WHERE id = ?', [id]);
  if (!actual) return;

  if (actual.notification_id) {
    cancelarNotificacionDeuda(actual.notification_id).catch(() => {});
  }

  db.runSync(
    'UPDATE debts SET status = "CANCELLED", notification_id = NULL, updated_at = ? WHERE id = ?',
    [Date.now(), id]
  );
  emitirCambioBoveda();
}

/**
 * Elimina una deuda y revierte de forma atómica sus pagos y movimientos en cuentas asociadas.
 */
export function eliminarDeuda(id: string): void {
  const db = obtenerBaseDatos();
  const debt = db.getFirstSync<FilaDeudaRaw>('SELECT * FROM debts WHERE id = ?', [id]);
  if (!debt) return;

  if (debt.notification_id) {
    cancelarNotificacionDeuda(debt.notification_id).catch(() => {});
  }

  const payments = db.getAllSync<FilaPagoRaw>('SELECT * FROM debt_payments WHERE debt_id = ?', [id]);

  db.withTransactionSync(() => {
    const txIdsToDelete: string[] = [];

    // Revertir cada pago que haya afectado cuentas
    for (const payment of payments) {
      if (payment.transaction_id && payment.account_id) {
        if (debt.type === 'RECEIVABLE') {
          db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
            payment.amount,
            payment.account_id,
          ]);
        } else {
          db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
            payment.amount,
            payment.account_id,
          ]);
        }
        txIdsToDelete.push(payment.transaction_id);
      }
    }

    db.runSync('DELETE FROM debt_payments WHERE debt_id = ?', [id]);
    db.runSync('DELETE FROM debts WHERE id = ?', [id]);

    for (const txId of txIdsToDelete) {
      db.runSync('DELETE FROM transactions WHERE id = ?', [txId]);
    }
  });

  emitirCambioBoveda();
}

/**
 * Obtiene el listado de deudas aplicando filtros por tipo, estado y búsqueda.
 */
export function obtenerDeudas(filtros?: {
  type?: TipoDeuda;
  statusFilter?: FiltroEstadoDeuda;
  search?: string;
}): Deuda[] {
  const db = obtenerBaseDatos();
  let query = 'SELECT * FROM debts WHERE 1=1';
  const params: (string | number)[] = [];

  if (filtros?.type) {
    query += ' AND type = ?';
    params.push(filtros.type);
  }

  query += ' ORDER BY CASE status WHEN "PENDING" THEN 1 WHEN "PARTIAL" THEN 2 WHEN "PAID" THEN 3 ELSE 4 END, CASE WHEN due_date IS NOT NULL THEN due_date ELSE "9999-12-31" END ASC, created_at DESC';

  const rows = db.getAllSync<FilaDeudaRaw>(query, params);
  let debts = rows.map(mapearFilaADeuda);

  if (filtros?.statusFilter && filtros.statusFilter !== 'TODAS') {
    switch (filtros.statusFilter) {
      case 'PENDIENTES':
        debts = debts.filter(d => d.status === 'PENDING');
        break;
      case 'PARCIALES':
        debts = debts.filter(d => d.status === 'PARTIAL');
        break;
      case 'PAGADAS':
        debts = debts.filter(d => d.status === 'PAID');
        break;
      case 'VENCIDAS':
        debts = debts.filter(d => d.isOverdue);
        break;
    }
  }

  if (filtros?.search && filtros.search.trim()) {
    const term = filtros.search.trim().toLowerCase();
    debts = debts.filter(
      d =>
        d.person.toLowerCase().includes(term) ||
        d.concept.toLowerCase().includes(term) ||
        (d.notes && d.notes.toLowerCase().includes(term))
    );
  }

  return debts;
}

/**
 * Obtiene una deuda específica por su identificador.
 */
export function obtenerDeudaPorId(id: string): Deuda | null {
  const db = obtenerBaseDatos();
  const row = db.getFirstSync<FilaDeudaRaw>('SELECT * FROM debts WHERE id = ?', [id]);
  if (!row) return null;
  return mapearFilaADeuda(row);
}

/**
 * Obtiene el historial de pagos o cobros registrados para una deuda.
 */
export function obtenerPagosDeuda(debtId: string): PagoDeuda[] {
  const db = obtenerBaseDatos();
  const rows = db.getAllSync<FilaPagoRaw>(
    `SELECT dp.*, a.name as account_name
     FROM debt_payments dp
     LEFT JOIN accounts a ON dp.account_id = a.id
     WHERE dp.debt_id = ?
     ORDER BY dp.created_at DESC`,
    [debtId]
  );

  return rows.map(r => ({
    id: r.id,
    debtId: r.debt_id,
    amount: r.amount,
    date: r.date,
    accountId: r.account_id || undefined,
    accountName: r.account_name || undefined,
    transactionId: r.transaction_id || undefined,
    notes: r.notes || undefined,
    createdAt: r.created_at,
  }));
}

/**
 * Registra un cobro o pago (parcial o total) para una deuda.
 * Si se selecciona una cuenta (accountId):
 * - Registra una transacción contable real (INCOME para cobro de 'RECEIVABLE', EXPENSE para pago de 'PAYABLE').
 * - Actualiza atómicamente el saldo de la cuenta una sola vez.
 * - Garantiza que no se duplique el dinero.
 */
export function registrarPagoDeuda(
  debtId: string,
  pago: {
    amount: number;
    date: string;
    accountId?: string;
    notes?: string;
  }
): PagoDeuda {
  if (pago.amount <= 0) {
    throw new Error('El importe abonado debe ser mayor a cero.');
  }

  const db = obtenerBaseDatos();
  const debt = db.getFirstSync<FilaDeudaRaw>('SELECT * FROM debts WHERE id = ?', [debtId]);
  if (!debt) {
    throw new Error('La deuda especificada no existe.');
  }

  if (pago.amount > debt.remaining_amount) {
    throw new Error(
      `El importe abonado ($${(pago.amount / 100).toFixed(2)}) no puede ser superior al saldo pendiente ($${(debt.remaining_amount / 100).toFixed(2)}).`
    );
  }

  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();
  let transactionId: string | null = null;

  db.withTransactionSync(() => {
    // Si se vinculó una cuenta real, generar el movimiento contable y actualizar su saldo
    if (pago.accountId) {
      const account = db.getFirstSync<{ id: string; current_balance: number }>(
        'SELECT id, current_balance FROM accounts WHERE id = ?',
        [pago.accountId]
      );
      if (!account) {
        throw new Error('La cuenta bancaria o de efectivo seleccionada no existe.');
      }

      transactionId = `tx_${paymentId}`;
      const isReceivable = debt.type === 'RECEIVABLE';
      const txType = isReceivable ? 'INCOME' : 'EXPENSE';
      const parsedDate = new Date(pago.date).getTime() || now;
      const txNote = `Abono de deuda: ${debt.concept} (${debt.person})${pago.notes ? ' - ' + pago.notes : ''}`;

      db.runSync(
        `INSERT INTO transactions (
          id, amount, type, source_account_id, target_account_id, category_id,
          date, note, payee, tags
        ) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, 'deuda')`,
        [
          transactionId,
          pago.amount,
          txType,
          pago.accountId,
          parsedDate,
          txNote,
          debt.person,
        ]
      );

      // Actualizar saldo de la cuenta de forma atómica y única
      if (isReceivable) {
        db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
          pago.amount,
          pago.accountId,
        ]);
      } else {
        db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
          pago.amount,
          pago.accountId,
        ]);
      }
    }

    // Insertar el pago en debt_payments
    db.runSync(
      `INSERT INTO debt_payments (
        id, debt_id, amount, date, account_id, transaction_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        debtId,
        pago.amount,
        pago.date,
        pago.accountId || null,
        transactionId,
        pago.notes?.trim() || null,
        now,
      ]
    );

    // Recalcular saldo pagado y saldo pendiente de la deuda
    const agg = db.getFirstSync<{ totalPaid: number }>(
      'SELECT COALESCE(SUM(amount), 0) as totalPaid FROM debt_payments WHERE debt_id = ?',
      [debtId]
    );
    const newPaidAmount = agg ? agg.totalPaid : pago.amount;
    const newRemainingAmount = Math.max(0, debt.total_amount - newPaidAmount);

    let newStatus: string;
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PENDING';
    }

    db.runSync(
      'UPDATE debts SET paid_amount = ?, remaining_amount = ?, status = ?, updated_at = ? WHERE id = ?',
      [newPaidAmount, newRemainingAmount, newStatus, now, debtId]
    );

    // Si la deuda quedó saldada y tenía notificación programada, cancelarla
    if (newStatus === 'PAID' && debt.notification_id) {
      cancelarNotificacionDeuda(debt.notification_id).catch(() => {});
      db.runSync('UPDATE debts SET notification_id = NULL WHERE id = ?', [debtId]);
    }
  });

  emitirCambioBoveda();

  return {
    id: paymentId,
    debtId,
    amount: pago.amount,
    date: pago.date,
    accountId: pago.accountId,
    transactionId: transactionId || undefined,
    notes: pago.notes?.trim(),
    createdAt: now,
  };
}

/**
 * Elimina un pago específico de una deuda y revierte la transacción contable si existía.
 */
export function eliminarPagoDeuda(paymentId: string): void {
  const db = obtenerBaseDatos();
  const payment = db.getFirstSync<FilaPagoRaw>(
    'SELECT * FROM debt_payments WHERE id = ?',
    [paymentId]
  );
  if (!payment) return;

  const debt = db.getFirstSync<FilaDeudaRaw>(
    'SELECT * FROM debts WHERE id = ?',
    [payment.debt_id]
  );
  if (!debt) return;

  db.withTransactionSync(() => {
    // Si tuvo transacción y cuenta vinculada, revertir saldo
    if (payment.transaction_id && payment.account_id) {
      if (debt.type === 'RECEIVABLE') {
        db.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
          payment.amount,
          payment.account_id,
        ]);
      } else {
        db.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
          payment.amount,
          payment.account_id,
        ]);
      }
    }

    db.runSync('DELETE FROM debt_payments WHERE id = ?', [paymentId]);

    if (payment.transaction_id) {
      db.runSync('DELETE FROM transactions WHERE id = ?', [payment.transaction_id]);
    }

    // Recalcular saldo y estado de la deuda
    const agg = db.getFirstSync<{ totalPaid: number }>(
      'SELECT COALESCE(SUM(amount), 0) as totalPaid FROM debt_payments WHERE debt_id = ?',
      [debt.id]
    );
    const newPaidAmount = agg ? agg.totalPaid : 0;
    const newRemainingAmount = Math.max(0, debt.total_amount - newPaidAmount);

    let newStatus: string;
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PENDING';
    }

    db.runSync(
      'UPDATE debts SET paid_amount = ?, remaining_amount = ?, status = ?, updated_at = ? WHERE id = ?',
      [newPaidAmount, newRemainingAmount, newStatus, Date.now(), debt.id]
    );
  });

  emitirCambioBoveda();
}

/**
 * Calcula el resumen consolidado de importes pendientes («Me deben», «Debo» y Balance neto).
 */
export function obtenerResumenDeudas(): ResumenDeudas {
  const db = obtenerBaseDatos();
  const today = hoyISO();

  const recRow = db.getFirstSync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total, COUNT(*) as count
     FROM debts
     WHERE type = 'RECEIVABLE' AND status != 'PAID' AND status != 'CANCELLED'`
  );

  const payRow = db.getFirstSync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total, COUNT(*) as count
     FROM debts
     WHERE type = 'PAYABLE' AND status != 'PAID' AND status != 'CANCELLED'`
  );

  const overdueRow = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM debts
     WHERE status != 'PAID' AND status != 'CANCELLED' AND due_date IS NOT NULL AND due_date < ?`,
    [today]
  );

  const totalReceivable = recRow ? recRow.total : 0;
  const totalPayable = payRow ? payRow.total : 0;
  const countReceivable = recRow ? recRow.count : 0;
  const countPayable = payRow ? payRow.count : 0;
  const countOverdue = overdueRow ? overdueRow.count : 0;

  return {
    totalReceivablePending: totalReceivable,
    totalPayablePending: totalPayable,
    netBalance: totalReceivable - totalPayable,
    countReceivablePending: countReceivable,
    countPayablePending: countPayable,
    countOverdue,
  };
}

// Alias compatibles
export const createDebt = crearDeuda;
export const updateDebt = actualizarDeuda;
export const cancelDebt = cancelarDeuda;
export const deleteDebt = eliminarDeuda;
export const getDebts = obtenerDeudas;
export const getDebtById = obtenerDeudaPorId;
export const getDebtPayments = obtenerPagosDeuda;
export const recordDebtPayment = registrarPagoDeuda;
export const deleteDebtPayment = eliminarPagoDeuda;
export const getDebtsSummary = obtenerResumenDeudas;
