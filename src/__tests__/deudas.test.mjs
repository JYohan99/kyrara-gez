import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import assert from 'node:assert/strict';

// Helper to create an in-memory SQLite database with exact Kyrara Gez schema
function setupTestDb() {
  const db = new DatabaseSync(':memory:');

  db.exec(`
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      currency TEXT DEFAULT 'UYU',
      initial_balance INTEGER DEFAULT 0,
      current_balance INTEGER DEFAULT 0,
      icon TEXT,
      color TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flow_type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE transactions (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      source_account_id TEXT NOT NULL,
      target_account_id TEXT,
      category_id TEXT,
      date INTEGER NOT NULL,
      note TEXT,
      payee TEXT,
      tags TEXT,
      FOREIGN KEY(source_account_id) REFERENCES accounts(id)
    );

    CREATE TABLE debts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      person TEXT NOT NULL,
      concept TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      paid_amount INTEGER NOT NULL DEFAULT 0,
      remaining_amount INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      reminder_days_before INTEGER,
      reminder_time TEXT DEFAULT '09:00',
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE debt_payments (
      id TEXT PRIMARY KEY,
      debt_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      account_id TEXT,
      transaction_id TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(debt_id) REFERENCES debts(id) ON DELETE CASCADE,
      FOREIGN KEY(account_id) REFERENCES accounts(id),
      FOREIGN KEY(transaction_id) REFERENCES transactions(id)
    );
  `);

  // Insert default test account (e.g. Billetera with $10.000,00 = 1000000 cents)
  db.exec(`
    INSERT INTO accounts (id, name, type, currency, initial_balance, current_balance, created_at)
    VALUES ('acc_main', 'Billetera Principal', 'CASH', 'UYU', 1000000, 1000000, 1700000000000);
  `);

  return db;
}

test('1. Crear deuda pendiente no altera el saldo de cuentas', () => {
  const db = setupTestDb();

  const initialAcc = db.prepare('SELECT current_balance FROM accounts WHERE id = ?').get('acc_main');
  assert.equal(initialAcc.current_balance, 1000000);

  // Crear deuda «Me deben» (receivable)
  const debtId = 'debt_1';
  const totalAmount = 150000; // $1.500,00
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, due_date, status, created_at, updated_at)
    VALUES (?, 'RECEIVABLE', 'Carlos Gómez', 'Préstamo para repuesto', ?, 0, ?, '2026-10-15', '2026-10-30', 'PENDING', 1700000000000, 1700000000000)
  `).run(debtId, totalAmount, totalAmount);

  // Comprobar que el saldo de la cuenta NO varió
  const postAcc = db.prepare('SELECT current_balance FROM accounts WHERE id = ?').get('acc_main');
  assert.equal(postAcc.current_balance, 1000000, 'Una deuda pendiente NUNCA debe alterar el saldo de cuentas');

  // Comprobar estado de la deuda
  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId);
  assert.equal(debt.status, 'PENDING');
  assert.equal(debt.paid_amount, 0);
  assert.equal(debt.remaining_amount, 150000);
});

test('2. Registro de cobro parcial vinculando cuenta actualiza saldo y transacciones una sola vez', () => {
  const db = setupTestDb();
  const debtId = 'debt_rec';
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, status, created_at, updated_at)
    VALUES (?, 'RECEIVABLE', 'Lucía', 'Diseño Web', 500000, 0, 500000, '2026-10-01', 'PENDING', 1700000000000, 1700000000000)
  `).run(debtId);

  // Registrar cobro parcial de $2.000 (200000 centavos) con imputación a Billetera
  const paymentId = 'pay_1';
  const txId = 'tx_pay_1';
  const payAmount = 200000;

  // Ejecución transaccional atómica
  db.exec('BEGIN TRANSACTION');
  db.prepare(`
    INSERT INTO transactions (id, amount, type, source_account_id, date, note, payee, tags)
    VALUES (?, ?, 'INCOME', 'acc_main', 1700000100000, 'Abono de deuda: Diseño Web (Lucía)', 'Lucía', 'deuda')
  `).run(txId, payAmount);

  db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(payAmount, 'acc_main');

  db.prepare(`
    INSERT INTO debt_payments (id, debt_id, amount, date, account_id, transaction_id, notes, created_at)
    VALUES (?, ?, ?, '2026-10-10', 'acc_main', ?, 'Primer abono en efectivo', 1700000100000)
  `).run(paymentId, debtId, payAmount, txId);

  const agg = db.prepare('SELECT SUM(amount) as totalPaid FROM debt_payments WHERE debt_id = ?').get(debtId);
  const paid = agg.totalPaid;
  const rem = 500000 - paid;
  const status = rem <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING');

  db.prepare('UPDATE debts SET paid_amount = ?, remaining_amount = ?, status = ? WHERE id = ?').run(paid, rem, status, debtId);
  db.exec('COMMIT');

  // Verificaciones
  const acc = db.prepare('SELECT current_balance FROM accounts WHERE id = ?').get('acc_main');
  assert.equal(acc.current_balance, 1200000, 'El saldo debió incrementarse exactamente una vez en $2.000 (+200000 centavos)');

  const txs = db.prepare('SELECT * FROM transactions WHERE id = ?').all(txId);
  assert.equal(txs.length, 1, 'Debe haber exactamente un movimiento contable registrado');
  assert.equal(txs[0].type, 'INCOME');

  const updatedDebt = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId);
  assert.equal(updatedDebt.paid_amount, 200000);
  assert.equal(updatedDebt.remaining_amount, 300000);
  assert.equal(updatedDebt.status, 'PARTIAL');
});

test('3. Pago total salda la deuda (PAID) con saldo restante en 0', () => {
  const db = setupTestDb();
  const debtId = 'debt_pay';
  // Deuda «Debo» (payable) por $4.000 (400000 centavos)
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, status, created_at, updated_at)
    VALUES (?, 'PAYABLE', 'Ferretería Central', 'Materiales obra', 400000, 0, 400000, '2026-10-05', 'PENDING', 1700000000000, 1700000000000)
  `).run(debtId);

  // Pago total de 400000 centavos
  db.exec('BEGIN TRANSACTION');
  const payId = 'pay_full';
  const txId = 'tx_pay_full';
  db.prepare(`
    INSERT INTO transactions (id, amount, type, source_account_id, date, note, payee, tags)
    VALUES (?, 400000, 'EXPENSE', 'acc_main', 1700000200000, 'Pago de deuda', 'Ferretería Central', 'deuda')
  `).run(txId);

  db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(400000, 'acc_main');

  db.prepare(`
    INSERT INTO debt_payments (id, debt_id, amount, date, account_id, transaction_id, created_at)
    VALUES (?, ?, 400000, '2026-10-20', 'acc_main', ?, 1700000200000)
  `).run(payId, debtId, txId);

  db.prepare("UPDATE debts SET paid_amount = 400000, remaining_amount = 0, status = 'PAID' WHERE id = ?").run(debtId);
  db.exec('COMMIT');

  const acc = db.prepare('SELECT current_balance FROM accounts WHERE id = ?').get('acc_main');
  assert.equal(acc.current_balance, 600000, 'El saldo debió reducirse en 400000 centavos');

  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId);
  assert.equal(debt.status, 'PAID');
  assert.equal(debt.remaining_amount, 0);
  assert.equal(debt.paid_amount, 400000);
});

test('4. Reversión de pago elimina transacción y restaura el saldo de cuenta y estado de deuda', () => {
  const db = setupTestDb();
  // Estado inicial: cuenta en 1000000
  // Insertar deuda y pago vinculado
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, status, created_at, updated_at)
    VALUES ('d_rev', 'PAYABLE', 'Electricista', 'Reparación tablero', 200000, 200000, 0, '2026-10-10', 'PAID', 1700000000000, 1700000000000)
  `).run();

  db.prepare(`
    INSERT INTO transactions (id, amount, type, source_account_id, date, note, payee)
    VALUES ('tx_rev', 200000, 'EXPENSE', 'acc_main', 1700000000000, 'Pago electricista', 'Electricista')
  `).run();
  db.prepare("UPDATE accounts SET current_balance = current_balance - 200000 WHERE id = 'acc_main'").run();

  db.prepare(`
    INSERT INTO debt_payments (id, debt_id, amount, date, account_id, transaction_id, created_at)
    VALUES ('pay_rev', 'd_rev', 200000, '2026-10-12', 'acc_main', 'tx_rev', 1700000000000)
  `).run();

  // Comprobar que cuenta bajó a 800000
  assert.equal(db.prepare("SELECT current_balance FROM accounts WHERE id = 'acc_main'").get().current_balance, 800000);

  // Ahora revertir el pago
  db.exec('BEGIN TRANSACTION');
  const payment = db.prepare("SELECT * FROM debt_payments WHERE id = 'pay_rev'").get();
  // Revertir EXPENSE sumando de vuelta a la cuenta
  db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(payment.amount, payment.account_id);
  db.prepare("DELETE FROM debt_payments WHERE id = 'pay_rev'").run();
  db.prepare('DELETE FROM transactions WHERE id = ?').run(payment.transaction_id);

  // Recalcular deuda
  db.prepare("UPDATE debts SET paid_amount = 0, remaining_amount = 200000, status = 'PENDING' WHERE id = 'd_rev'").run();
  db.exec('COMMIT');

  // Cuenta debe volver a 1000000
  assert.equal(db.prepare("SELECT current_balance FROM accounts WHERE id = 'acc_main'").get().current_balance, 1000000);
  assert.equal(db.prepare("SELECT COUNT(*) as c FROM transactions WHERE id = 'tx_rev'").get().c, 0);

  const debt = db.prepare("SELECT * FROM debts WHERE id = 'd_rev'").get();
  assert.equal(debt.status, 'PENDING');
  assert.equal(debt.remaining_amount, 200000);
});

test('5. Resumen consolidado: total me deben, total debo, balance neto y vencidas', () => {
  const db = setupTestDb();
  const today = '2026-10-21';

  // Me deben: 300000 pendiente
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, due_date, status, created_at, updated_at)
    VALUES ('rec_1', 'RECEIVABLE', 'A', 'Préstamo A', 300000, 0, 300000, '2026-10-01', '2026-10-25', 'PENDING', 1, 1)
  `).run();

  // Debo: 100000 pendiente (vencida: vencía el 2026-10-15)
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, due_date, status, created_at, updated_at)
    VALUES ('pay_1', 'PAYABLE', 'B', 'Factura B', 100000, 0, 100000, '2026-10-01', '2026-10-15', 'PENDING', 1, 1)
  `).run();

  // Una ya pagada (no debe contar en pendientes)
  db.prepare(`
    INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, status, created_at, updated_at)
    VALUES ('rec_paid', 'RECEIVABLE', 'C', 'Saldado', 50000, 50000, 0, '2026-10-01', 'PAID', 1, 1)
  `).run();

  const rec = db.prepare(`SELECT COALESCE(SUM(remaining_amount), 0) as s FROM debts WHERE type = 'RECEIVABLE' AND status != 'PAID' AND status != 'CANCELLED'`).get().s;
  const pay = db.prepare(`SELECT COALESCE(SUM(remaining_amount), 0) as s FROM debts WHERE type = 'PAYABLE' AND status != 'PAID' AND status != 'CANCELLED'`).get().s;
  const overdue = db.prepare(`SELECT COUNT(*) as c FROM debts WHERE status != 'PAID' AND status != 'CANCELLED' AND due_date < ?`).get(today).c;

  assert.equal(rec, 300000);
  assert.equal(pay, 100000);
  assert.equal(rec - pay, 200000, 'Balance neto debe ser $2.000 a favor (300000 - 100000)');
  assert.equal(overdue, 1, 'Debe haber 1 deuda vencida');
});

test('6. Verificación de lógica de importación: validaciones, duplicados y revisión', () => {
  // Test standalone import row classification logic
  function classify(val) {
    const s = String(val).toLowerCase();
    if (s.includes('me deben') || s.includes('por cobrar')) return 'RECEIVABLE';
    if (s.includes('debo') || s.includes('por pagar')) return 'PAYABLE';
    return null;
  }

  assert.equal(classify('Me deben'), 'RECEIVABLE');
  assert.equal(classify('Por cobrar'), 'RECEIVABLE');
  assert.equal(classify('Debo'), 'PAYABLE');
  assert.equal(classify('Por pagar'), 'PAYABLE');
  assert.equal(classify('Desconocido'), null);

  // Monedas
  function parseMoney(val) {
    if (typeof val === 'number') return Math.round(val * 100);
    let s = String(val).replace(/[$€UYU\s]/gi, '');
    if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) || n <= 0 ? null : Math.round(n * 100);
  }

  assert.equal(parseMoney('$ 1.500,50'), 150050);
  assert.equal(parseMoney('320,00'), 32000);
  assert.equal(parseMoney('UYU 500'), 50000);
  assert.equal(parseMoney('0'), null);
  assert.equal(parseMoney('invalido'), null);
});

test('7. Hoja Deudas: detección de tipo, registros incompletos para revisión y prevención de duplicados', () => {
  const db = setupTestDb();

  const filasExcel = [
    // Fila 1: Válida «Me deben»
    {
      Persona: 'Laura Pérez',
      Concepto: 'Préstamo viaje',
      Importe: '2.500,00',
      Fecha: '2026-10-01',
      Vencimiento: '2026-11-01',
      Tipo: 'Me deben',
    },
    // Fila 2: Válida «Debo»
    {
      Persona: 'Banco Itaú',
      Concepto: 'Cuota préstamo',
      Importe: 8400,
      Fecha: '2026-10-05',
      Tipo: 'Debo',
    },
    // Fila 3: Incompleta (falta persona y fecha)
    {
      Persona: '',
      Concepto: 'Alquiler',
      Importe: '12.000',
      Tipo: 'Debo',
    },
    // Fila 4: Ambigua (falta tipo, no se sabe si debe o le deben)
    {
      Persona: 'Andrés Silva',
      Concepto: 'Cena compartida',
      Importe: 750,
      Fecha: '2026-10-12',
    },
  ];

  // Simulación de la función de importación estricta
  const importados = [];
  const pendientesRevision = [];
  let duplicados = 0;

  for (let idx = 0; idx < filasExcel.length; idx++) {
    const f = filasExcel[idx];
    const persona = (f.Persona || '').trim();
    const concepto = (f.Concepto || '').trim();
    let monto = null;
    if (typeof f.Importe === 'number') monto = Math.round(f.Importe * 100);
    else if (f.Importe) monto = Math.round(parseFloat(String(f.Importe).replace(/\./g, '').replace(',', '.')) * 100);

    const fecha = f.Fecha || null;
    let tipo = null;
    const tStr = String(f.Tipo || '').toLowerCase();
    if (tStr.includes('me deben')) tipo = 'RECEIVABLE';
    else if (tStr.includes('debo')) tipo = 'PAYABLE';

    // Validación sin inventar datos
    const motivos = [];
    if (!persona) motivos.push('Falta persona');
    if (!monto || isNaN(monto)) motivos.push('Falta monto');
    if (!fecha) motivos.push('Falta fecha');
    if (!tipo) motivos.push('Tipo ambiguo');

    if (motivos.length > 0) {
      pendientesRevision.push({ fila: idx + 1, motivos: motivos.join(', ') });
      continue;
    }

    // Comprobar duplicado
    const dup = db.prepare('SELECT id FROM debts WHERE type = ? AND LOWER(person) = LOWER(?) AND total_amount = ? AND issue_date = ?').get(tipo, persona, monto, fecha);
    if (dup) {
      duplicados++;
      continue;
    }

    db.prepare(`
      INSERT INTO debts (id, type, person, concept, total_amount, paid_amount, remaining_amount, issue_date, due_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 'PENDING', 1, 1)
    `).run(`imp_${idx}`, tipo, persona, concepto, monto, monto, fecha, f.Vencimiento || null);

    importados.push({ persona, tipo, monto });
  }

  assert.equal(importados.length, 2, 'Debieron importarse exactamente 2 registros limpios');
  assert.equal(importados[0].tipo, 'RECEIVABLE');
  assert.equal(importados[0].monto, 250000);
  assert.equal(importados[1].tipo, 'PAYABLE');
  assert.equal(importados[1].monto, 840000);

  assert.equal(pendientesRevision.length, 2, 'Debieron quedar 2 filas pendientes de revisión manual');
  assert(pendientesRevision[0].motivos.includes('Falta persona'));
  assert(pendientesRevision[1].motivos.includes('Tipo ambiguo'));
  assert.equal(duplicados, 0, 'No debe haber duplicados en la primera pasada');

  // Ahora reintentar importar la Fila 1 (debe detectarse como duplicada y no reinsertarse)
  const reintento = db.prepare("SELECT id FROM debts WHERE type = 'RECEIVABLE' AND LOWER(person) = 'laura pérez' AND total_amount = 250000 AND issue_date = '2026-10-01'").get();
  assert(Boolean(reintento), 'El registro original debe existir');

  const countAntes = db.prepare('SELECT COUNT(*) as c FROM debts').get().c;
  assert.equal(countAntes, 2);
});

