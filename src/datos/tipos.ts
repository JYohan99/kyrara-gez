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

// Módulo de Deudas (Préstamos por cobrar y obligaciones por pagar)
export type TipoDeuda = 'RECEIVABLE' | 'PAYABLE'; // RECEIVABLE: Me deben / PAYABLE: Debo
export type EstadoDeuda = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface Deuda {
  id: string;
  type: TipoDeuda;
  person: string;
  concept: string;
  totalAmount: number; // en centavos
  paidAmount: number; // en centavos acumulados
  remainingAmount: number; // en centavos pendientes (totalAmount - paidAmount)
  issueDate: string; // 'YYYY-MM-DD'
  dueDate?: string; // 'YYYY-MM-DD' (opcional)
  status: EstadoDeuda;
  notes?: string;
  reminderDaysBefore?: number; // 0 = mismo día, 1 = 1 día antes, etc.
  reminderTime?: string; // 'HH:mm'
  notificationId?: string;
  createdAt: number;
  updatedAt: number;
  // Campos calculados para vista
  isOverdue?: boolean;
  isDueSoon?: boolean;
  progressPercentage?: number;
}

export interface PagoDeuda {
  id: string;
  debtId: string;
  amount: number; // en centavos
  date: string; // 'YYYY-MM-DD'
  accountId?: string;
  accountName?: string;
  transactionId?: string;
  notes?: string;
  createdAt: number;
}

export interface ResumenDeudas {
  totalReceivablePending: number; // en centavos
  totalPayablePending: number; // en centavos
  netBalance: number; // en centavos (receivable - payable)
  countReceivablePending: number;
  countPayablePending: number;
  countOverdue: number;
}

export type FiltroEstadoDeuda = 'TODAS' | 'PENDIENTES' | 'PARCIALES' | 'PAGADAS' | 'VENCIDAS';

// ==========================================
// MÓDULO CATÁLOGO Y PRECIOS DE PRODUCTOS
// ==========================================

export interface TarifaProducto {
  id: string;
  productId: string;
  salePrice: number; // en centavos (ej: 15000 = $150,00)
  costPrice: number; // en centavos (ej: 8000 = $80,00)
  costUsd?: number; // costo de referencia en USD (ej: 2.50)
  exchangeRate?: number; // tipo de cambio utilizado (ej: 42.50)
  validFrom: string; // 'YYYY-MM-DD'
  validTo?: string; // 'YYYY-MM-DD' | null (null = tarifa vigente actual)
  notes?: string;
  currency?: string; // 'UYU' | 'USD'
  createdAt: number;
  updatedAt: number;
}
export type TarifaProductoFoto = TarifaProducto;

export interface Producto {
  id: string;
  name: string;
  category: string;
  sizeFormat?: string;
  saleUnit: string;
  description?: string;
  isActive: boolean;
  basePrice?: number; // precio de venta vigente en centavos
  costPrice?: number; // costo vigente en centavos
  costUsd?: number; // costo de referencia en USD
  exchangeRate?: number; // tipo de cambio utilizado
  priceValidFrom?: string; // fecha de vigencia de tarifa actual 'YYYY-MM-DD'
  currency?: string; // e.g. 'UYU'
  createdAt: number;
  updatedAt: number;
  // Campos calculados automáticamente para presentación
  grossProfit?: number; // basePrice - costPrice (en centavos)
  grossMarginPercent?: number | null; // (grossProfit / basePrice) * 100
  tariffsCount?: number;
}
export type ProductoFoto = Producto;

export type FiltroEstadoProducto = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';
export type FiltroEstadoProductoFoto = FiltroEstadoProducto;

export interface FiltroProductos {
  category?: string;
  search?: string;
  statusFilter?: FiltroEstadoProducto;
}
export type FiltroProductosFotos = FiltroProductos;

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
export type DebtType = TipoDeuda;
export type DebtStatus = EstadoDeuda;
export type Debt = Deuda;
export type DebtPayment = PagoDeuda;
export type DebtSummary = ResumenDeudas;
export type DebtStatusFilter = FiltroEstadoDeuda;
export type Product = Producto;
export type ProductTariff = TarifaProducto;
export type ProductStatusFilter = FiltroEstadoProducto;
export type ProductFilter = FiltroProductos;
export type PhotoProduct = Producto;
export type PhotoProductStatusFilter = FiltroEstadoProducto;
export type PhotoProductFilter = FiltroProductos;
export type PhotoProductTariff = TarifaProducto;
export type PhotoProductPrice = TarifaProducto;

// Calculadora de Precios de Productos (Fase 3)
export interface LineaCalculoProducto {
  producto: Producto;
  cantidad: number;
  precioUnitario: number; // en centavos (0 si no registrado)
  costoUnitario: number;  // en centavos (0 si no registrado)
  tienePrecio: boolean;
  tieneCosto: boolean;
  esInactivo?: boolean;
  moneda: string;
  subtotalImporte: number | null; // en centavos (null si no tiene precio)
  subtotalCosto: number | null;   // en centavos (null si no tiene costo)
  subtotalGanancia: number | null;// en centavos (null si falta precio o costo)
  margenPorcentual: number | null;// porcentaje (null si falta dato o importe es 0)
}
export type LineaCalculoFoto = LineaCalculoProducto;

export interface TotalesMonedaCalculoProducto {
  moneda: string;
  cantidadLineas: number;
  totalUnidades: number;
  totalImporte: number; // en centavos
  totalCosto: number;   // en centavos
  totalGanancia: number;// en centavos
  margenPorcentual: number | null;
  itemsSinPrecio: number;
  itemsSinCosto: number;
  esCalculoCompleto: boolean;
}
export type TotalesMonedaCalculoFoto = TotalesMonedaCalculoProducto;

export interface ResultadoCalculadoraProductos {
  lineas: LineaCalculoProducto[];
  totalesPorMoneda: Record<string, TotalesMonedaCalculoProducto>;
  monedas: string[];
  esMultimoneda: boolean;
  tieneFaltantes: boolean;
}
export type ResultadoCalculadoraFotos = ResultadoCalculadoraProductos;

export type ProductCalculatorLine = LineaCalculoProducto;
export type ProductCalculatorCurrencyTotals = TotalesMonedaCalculoProducto;
export type ProductCalculatorResult = ResultadoCalculadoraProductos;
export type PhotoCalculatorLine = LineaCalculoProducto;
export type PhotoCalculatorCurrencyTotals = TotalesMonedaCalculoProducto;
export type PhotoCalculatorResult = ResultadoCalculadoraProductos;

// Fase 4: Historial y Estadísticas de Precios y Rentabilidad de Productos
export interface CambioPrecioHistorial {
  id: string;
  productId: string;
  productName: string;
  sizeFormat?: string;
  category: string;
  saleUnit: string;
  currency: string;
  // Valores nuevos/vigentes del cambio
  newSalePrice: number; // en centavos
  newCostPrice: number; // en centavos
  newGrossProfit: number; // en centavos
  newGrossMarginPercent: number | null; // %
  // Valores anteriores (null si es la primera tarifa)
  previousSalePrice: number | null;
  previousCostPrice: number | null;
  previousGrossProfit: number | null;
  previousGrossMarginPercent: number | null;
  // Diferencias y variaciones porcentuales
  salePriceDiff: number | null; // en centavos
  salePriceDiffPercent: number | null; // %
  costPriceDiff: number | null; // en centavos
  costPriceDiffPercent: number | null; // %
  // Fechas y metadatos
  validFrom: string; // 'YYYY-MM-DD'
  validTo?: string;  // 'YYYY-MM-DD'
  notes?: string;
  isInitialTariff: boolean;
  isCurrent: boolean;
  createdAt: number;
}

export interface FiltroHistorialPrecios {
  productId?: string;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  currency?: string;
  search?: string;
}

export interface EstadisticasMonedaProductos {
  moneda: string;
  totalProductos: number;
  productosActivos: number;
  productosInactivos: number;
  productosSinPrecio: number;
  productosSinCosto: number;
  productosConPrecioYCosto: number;
  precioPromedio: number | null; // en centavos
  costoPromedio: number | null;   // en centavos
  gananciaPromedio: number | null;// en centavos
  margenPromedio: number | null;  // %
  totalTarifasRegistradas: number;
}
export type EstadisticasMonedaFotos = EstadisticasMonedaProductos;

export interface EstadisticasCatalogoProductos {
  totalProductosGlobal: number;
  totalActivosGlobal: number;
  totalInactivosGlobal: number;
  totalSinPrecioGlobal: number;
  totalSinCostoGlobal: number;
  monedas: string[];
  porMoneda: Record<string, EstadisticasMonedaProductos>;
}
export type EstadisticasCatalogoFotos = EstadisticasCatalogoProductos;

export interface EvolucionTarifaItem {
  id: string;
  validFrom: string;
  validTo?: string;
  salePrice: number; // en centavos
  costPrice: number; // en centavos
  grossProfit: number;
  grossMarginPercent: number | null;
  salePriceDiff: number | null;
  salePriceDiffPercent: number | null;
  notes?: string;
  isCurrent: boolean;
}

export type PriceHistoryChange = CambioPrecioHistorial;
export type PriceHistoryFilter = FiltroHistorialPrecios;
export type CatalogStatistics = EstadisticasCatalogoProductos;
export type PhotoPriceHistoryChange = CambioPrecioHistorial;
export type PhotoPriceHistoryFilter = FiltroHistorialPrecios;
export type PhotoCatalogStatistics = EstadisticasCatalogoProductos;

