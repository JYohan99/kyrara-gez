import { obtenerBaseDatos } from '../conexion';
import { Cuenta, TipoCuenta } from '../tipos';
import { emitirCambioBoveda } from '../sincronizacion';

export function obtenerCuentas(): Cuenta[] {
  const db = obtenerBaseDatos();
  const filas = db.getAllSync<{
    id: string;
    name: string;
    type: TipoCuenta;
    currency: string;
    initial_balance: number;
    current_balance: number;
    icon: string;
    color: string;
    is_archived: number;
    created_at: number;
  }>('SELECT * FROM accounts WHERE is_archived = 0 ORDER BY created_at ASC');

  return filas.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    currency: r.currency,
    initialBalance: r.initial_balance,
    currentBalance: r.current_balance,
    icon: r.icon,
    color: r.color,
    isArchived: r.is_archived === 1,
    createdAt: r.created_at,
  }));
}

export function crearCuenta(datos: {
  name: string;
  type: TipoCuenta;
  currency?: string;
  initialBalance: number; // en centavos
  icon?: string;
  color?: string;
}): Cuenta {
  const db = obtenerBaseDatos();
  const id = 'acc_' + Math.random().toString(36).substring(2, 10);
  const ahora = Date.now();
  const currency = datos.currency || 'UYU';
  const icon = datos.icon || (datos.type === 'CASH' ? 'payments' : datos.type === 'BANK' ? 'account-balance' : 'credit-card');
  const color = datos.color || '#8A4FFF';

  db.runSync(
    `INSERT INTO accounts (id, name, type, currency, initial_balance, current_balance, icon, color, is_archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, datos.name, datos.type, currency, datos.initialBalance, datos.initialBalance, icon, color, ahora]
  );

  emitirCambioBoveda();

  return {
    id,
    name: datos.name,
    type: datos.type,
    currency,
    initialBalance: datos.initialBalance,
    currentBalance: datos.initialBalance,
    icon,
    color,
    isArchived: false,
    createdAt: ahora,
  };
}

export function actualizarSaldoCuenta(id: string, nuevoSaldo: number): void {
  const db = obtenerBaseDatos();
  db.runSync('UPDATE accounts SET current_balance = ? WHERE id = ?', [nuevoSaldo, id]);
  emitirCambioBoveda();
}

export function actualizarCuenta(
  id: string,
  datos: { name?: string; icon?: string; color?: string; isArchived?: boolean }
): void {
  const db = obtenerBaseDatos();
  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (datos.name !== undefined) {
    sets.push('name = ?');
    params.push(datos.name);
  }
  if (datos.icon !== undefined) {
    sets.push('icon = ?');
    params.push(datos.icon);
  }
  if (datos.color !== undefined) {
    sets.push('color = ?');
    params.push(datos.color);
  }
  if (datos.isArchived !== undefined) {
    sets.push('is_archived = ?');
    params.push(datos.isArchived ? 1 : 0);
  }

  if (sets.length > 0) {
    params.push(id);
    db.runSync(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ?`, params);
    emitirCambioBoveda();
  }
}

export function obtenerSaldoTotalDisponible(): number {
  const cuentas = obtenerCuentas();
  return cuentas.reduce((acc, a) => acc + a.currentBalance, 0);
}

export function eliminarCuenta(id: string): void {
  const db = obtenerBaseDatos();
  const countRow = db.getFirstSync<{ total: number }>('SELECT COUNT(*) as total FROM accounts WHERE is_archived = 0');
  if (countRow && countRow.total <= 1) {
    throw new Error('No puedes eliminar la única cuenta activa. Debe existir al menos una cuenta en la bóveda.');
  }

  db.withTransactionSync(() => {
    db.runSync('DELETE FROM transactions WHERE source_account_id = ? OR target_account_id = ?', [id, id]);
    db.runSync('DELETE FROM accounts WHERE id = ?', [id]);
  });
  emitirCambioBoveda();
}

// Alias compatibles
export const getAccounts = obtenerCuentas;
export const createAccount = crearCuenta;
export const updateAccountBalance = actualizarSaldoCuenta;
export const updateAccount = actualizarCuenta;
export const getTotalAvailableBalance = obtenerSaldoTotalDisponible;
export const deleteAccount = eliminarCuenta;
