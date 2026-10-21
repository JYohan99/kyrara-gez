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

// Módulo de Agenda
export type TipoProgramacionCompromiso = 'SINGLE' | 'MONTHLY';
export type EstadoCompromiso = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Compromiso {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD' en hora local
  time?: string; // 'HH:mm' en hora local (opcional)
  description?: string;
  relatedPerson?: string;
  recurrenceType: TipoProgramacionCompromiso;
  seriesId?: string;
  status: EstadoCompromiso;
  createdAt: number;
  updatedAt: number;
}

export interface Recordatorio {
  id: string;
  commitmentId: string;
  daysBefore: number; // 0 = mismo día, 1 = 1 día antes, etc.
  time: string; // 'HH:mm'
  notificationId?: string;
  createdAt: number;
}

export interface ExcepcionRecurrencia {
  id: string;
  seriesId: string;
  originalDate: string; // 'YYYY-MM-DD'
  status: 'COMPLETED' | 'CANCELLED' | 'MODIFIED';
  modifiedCommitmentId?: string;
  createdAt: number;
}

export interface OcurrenciaCompromiso extends Compromiso {
  occurrenceDate: string; // Fecha concreta calculada 'YYYY-MM-DD'
  isRecurrent: boolean;
  isException?: boolean;
  reminders?: Recordatorio[];
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
export type CommitmentRecurrenceType = TipoProgramacionCompromiso;
export type CommitmentStatus = EstadoCompromiso;
export type Commitment = Compromiso;
export type CommitmentReminder = Recordatorio;
export type RecurrenceException = ExcepcionRecurrencia;
export type CommitmentOccurrence = OcurrenciaCompromiso;
