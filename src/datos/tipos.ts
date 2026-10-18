export type TipoCuenta = 'CASH' | 'BANK' | 'PREPAID' | 'VAULT';

export interface Cuenta {
  id: string;
  name: string;
  type: TipoCuenta;
  currency: string;
  initialBalance: number; // en centavos
  currentBalance: number; // en centavos
  icon: string;
  color: string;
  isArchived: boolean;
  isDefault?: number;
  createdAt: number;
}

export type TipoFlujo = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Categoria {
  id: string;
  name: string;
  flowType: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface Movimiento {
  id: string;
  amount: number; // en centavos
  type: TipoFlujo;
  sourceAccountId: string;
  targetAccountId?: string;
  categoryId?: string;
  date: number; // timestamp
  note?: string;
  payee?: string;
  tags?: string;
}

export interface MovimientoEnriquecido extends Movimiento {
  sourceAccountName: string;
  targetAccountName?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface Presupuesto {
  id: string;
  categoryId: string;
  monthlyLimit: number; // en centavos
  period: string; // 'YYYY-MM'
  alertThreshold: number; // 0.90 (90%)
}

export interface PresupuestoEnriquecido extends Presupuesto {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number; // en centavos
  remaining: number; // en centavos
  percent: number; // 0 a 100+
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export interface AjustesUsuario {
  currency: string;
  numberFormat: 'PERIOD_COMMA' | 'COMMA_PERIOD';
  hideBalanceOnStartup: boolean;
  hasPin: boolean;
  biometricsEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

export interface DesgloseGastoCategoria {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number; // en centavos
  percent: number; // 0 a 100
}

export interface EstadisticaAhorroMensual {
  monthLabel: string;
  period: string; // 'YYYY-MM'
  totalIncome: number; // en centavos
  totalExpense: number; // en centavos
  netSavings: number; // en centavos
  savingsRate: number; // porcentaje e.g. 37.8
}

export interface PuntoLineaTiempo {
  label: string;
  date: number;
  balanceCents: number;
  displayAmount: string;
}

// Alias compatibles
export type AccountType = TipoCuenta;
export type Account = Cuenta;
export type FlowType = TipoFlujo;
export type Category = Categoria;
export type Transaction = Movimiento;
export type EnrichedTransaction = MovimientoEnriquecido;
export type Budget = Presupuesto;
export type EnrichedBudget = PresupuestoEnriquecido;
export type UserSettings = AjustesUsuario;
export type CategorySpendBreakdown = DesgloseGastoCategoria;
export type MonthlySavingsStat = EstadisticaAhorroMensual;
export type TimelineDataPoint = PuntoLineaTiempo;
