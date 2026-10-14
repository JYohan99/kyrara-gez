import { getDatabase } from '../connection';
import { Account, AccountType } from '../types';
import { emitVaultChange } from '../../state/syncEvents';

export function getAccounts(): Account[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    name: string;
    type: AccountType;
    currency: string;
    initial_balance: number;
    current_balance: number;
    icon: string;
    color: string;
    is_archived: number;
    created_at: number;
  }>('SELECT * FROM accounts WHERE is_archived = 0 ORDER BY created_at ASC');

  return rows.map(r => ({
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

export function createAccount(data: {
  name: string;
  type: AccountType;
  currency?: string;
  initialBalance: number; // en centavos
  icon?: string;
  color?: string;
}): Account {
  const db = getDatabase();
  const id = 'acc_' + Math.random().toString(36).substring(2, 10);
  const now = Date.now();
  const currency = data.currency || 'UYU';
  const icon = data.icon || (data.type === 'CASH' ? 'payments' : data.type === 'BANK' ? 'account-balance' : 'credit-card');
  const color = data.color || '#8A4FFF';

  db.runSync(
    `INSERT INTO accounts (id, name, type, currency, initial_balance, current_balance, icon, color, is_archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, data.name, data.type, currency, data.initialBalance, data.initialBalance, icon, color, now]
  );

  emitVaultChange();

  return {
    id,
    name: data.name,
    type: data.type,
    currency,
    initialBalance: data.initialBalance,
    currentBalance: data.initialBalance,
    icon,
    color,
    isArchived: false,
    createdAt: now,
  };
}

export function updateAccountBalance(id: string, newBalance: number): void {
  const db = getDatabase();
  db.runSync('UPDATE accounts SET current_balance = ? WHERE id = ?', [newBalance, id]);
  emitVaultChange();
}

export function updateAccount(
  id: string,
  data: { name?: string; icon?: string; color?: string; isArchived?: boolean }
): void {
  const db = getDatabase();
  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (data.name !== undefined) {
    sets.push('name = ?');
    params.push(data.name);
  }
  if (data.icon !== undefined) {
    sets.push('icon = ?');
    params.push(data.icon);
  }
  if (data.color !== undefined) {
    sets.push('color = ?');
    params.push(data.color);
  }
  if (data.isArchived !== undefined) {
    sets.push('is_archived = ?');
    params.push(data.isArchived ? 1 : 0);
  }

  if (sets.length > 0) {
    params.push(id);
    db.runSync(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ?`, params);
    emitVaultChange();
  }
}

export function getTotalAvailableBalance(): number {
  const accounts = getAccounts();
  return accounts.reduce((acc, a) => acc + a.currentBalance, 0);
}
