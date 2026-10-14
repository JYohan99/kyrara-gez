export type AccountType = 'CASH' | 'BANK' | 'PREPAID' | 'VAULT';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number; // en centavos
  currentBalance: number; // en centavos
  icon: string;
  color: string;
  isArchived: boolean;
  createdAt: number;
}

export type FlowType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Category {
  id: string;
  name: string;
  flowType: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface Transaction {
  id: string;
  amount: number; // en centavos
  type: FlowType;
  sourceAccountId: string;
  targetAccountId?: string;
  categoryId?: string;
  date: number; // timestamp
  note?: string;
  payee?: string;
  tags?: string;
}

export interface EnrichedTransaction extends Transaction {
  sourceAccountName: string;
  targetAccountName?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number; // en centavos
  period: string; // 'YYYY-MM'
  alertThreshold: number; // 0.90 (90%)
}

export interface EnrichedBudget extends Budget {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number; // en centavos
  remaining: number; // en centavos
  percent: number; // 0 a 100+
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export interface UserSettings {
  currency: string;
  numberFormat: 'PERIOD_COMMA' | 'COMMA_PERIOD';
  hideBalanceOnStartup: boolean;
  hasPin: boolean;
  biometricsEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

export interface CategorySpendBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number; // en centavos
  percent: number; // 0 a 100
}

export interface MonthlySavingsStat {
  monthLabel: string;
  period: string; // 'YYYY-MM'
  totalIncome: number; // en centavos
  totalExpense: number; // en centavos
  netSavings: number; // en centavos
  savingsRate: number; // porcentaje e.g. 37.8
}

export interface TimelineDataPoint {
  label: string;
  date: number;
  balanceCents: number;
  displayAmount: string;
}
