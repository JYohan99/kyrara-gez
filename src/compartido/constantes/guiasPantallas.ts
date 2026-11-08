import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS } from '../tema';

export interface ElementoGuia {
  icono: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  descripcion: string;
  colorIcono?: string;
}

export interface GuiaPantalla {
  titulo: string;
  subtitulo: string;
  elementos: ElementoGuia[];
}

export const GUIAS_PANTALLAS: Record<string, GuiaPantalla> = {
  INICIO: {
    titulo: 'Panel Principal (Inicio)',
    subtitulo: 'Tu resumen financiero consolidado y centro de operaciones rápidas.',
    elementos: [
      {
        icono: 'visibility',
        titulo: 'Ocultar o mostrar saldos',
        descripcion: 'Toca el ícono del ojo para ocultar tus montos por privacidad si hay personas cerca.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'trending-up',
        titulo: 'Métricas de flujo (Ingresos / Gastos / Superávit)',
        descripcion: 'Resumen en tiempo real del dinero ganado y gastado este mes. Toca esta franja para ir directamente a la pantalla de Movimientos.',
        colorIcono: COLORS.cashflowIncome,
      },
      {
        icono: 'flash-on',
        titulo: 'Acceso Rápido (Gasto, Ingreso, Traspaso)',
        descripcion: 'Botones directos para abrir el formulario y registrar cualquier operación en segundos.',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'account-balance-wallet',
        titulo: 'Mis Cuentas',
        descripcion: 'Toca cualquier tarjeta para editarla o ajustar su saldo. Usa la tarjeta "+ Nueva cuenta" para dar de alta bancos o billeteras.',
        colorIcono: COLORS.tertiary,
      },
      {
        icono: 'receipt-long',
        titulo: 'Últimos movimientos',
        descripcion: 'Historial reciente del mes. Toca "Ver todos" para el historial completo o toca un movimiento para ver su comprobante.',
        colorIcono: COLORS.primaryFixedDim,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Botón Flotante (+)',
        descripcion: 'Acceso permanente para registrar rápidamente una nueva transacción desde cualquier lugar.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  MOVIMIENTOS: {
    titulo: 'Movimientos e Historial',
    subtitulo: 'Registro cronológico y detallado de todas tus operaciones financieras.',
    elementos: [
      {
        icono: 'receipt-long',
        titulo: 'Resumen del Mes',
        descripcion: 'Muestra el total acumulado de ingresos, gastos, ahorro neto y la cantidad de operaciones registradas.',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'search',
        titulo: 'Búsqueda y Filtros',
        descripcion: 'Busca por comercio o filtra para ver únicamente Gastos, Ingresos o Traspasos.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'calendar-today',
        titulo: 'Agrupación por Fecha',
        descripcion: 'Tus transacciones se ordenan día a día. Toca la cabecera de cualquier fecha para expandir o plegar sus movimientos.',
        colorIcono: COLORS.outline,
      },
      {
        icono: 'receipt',
        titulo: 'Comprobante de Movimiento',
        descripcion: 'Toca cualquier fila para abrir el voucher con todos los datos (cuenta origen, destino, categoría, notas y hora exacta).',
        colorIcono: COLORS.primaryFixedDim,
      },
      {
        icono: 'delete-outline',
        titulo: 'Eliminar Movimiento',
        descripcion: 'Mantén presionado cualquier movimiento para eliminarlo. El saldo de tus cuentas se recalculará automáticamente.',
        colorIcono: COLORS.cashflowExpense,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Botón Flotante (+)',
        descripcion: 'Abre el formulario para añadir un nuevo movimiento de dinero.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  CATEGORÍAS: {
    titulo: 'Categorías de Gastos e Ingresos',
    subtitulo: 'Organiza y clasifica tus flujos de dinero con íconos y colores.',
    elementos: [
      {
        icono: 'tune',
        titulo: 'Filtro Gastos / Ingresos',
        descripcion: 'Alterna entre tus categorías de gasto (ej. Comida, Alquiler) y de ingreso (ej. Sueldo, Freelance).',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'local-fire-department',
        titulo: 'Mayor Consumo del Mes',
        descripcion: 'Detecta en tiempo real la categoría en la que más dinero has gastado durante el mes en curso.',
        colorIcono: COLORS.cashflowExpense,
      },
      {
        icono: 'grid-view',
        titulo: 'Cuadrícula con Gasto en Vivo',
        descripcion: 'Cada tarjeta indica cuánto dinero llevas gastado este mes en esa categoría.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'delete-outline',
        titulo: 'Eliminar Categorías',
        descripcion: 'Toca el ícono de papelera para borrar categorías personalizadas (las categorías del sistema vienen protegidas).',
        colorIcono: COLORS.cashflowExpense,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Nueva Categoría (+)',
        descripcion: 'Pulsa el botón flotante para crear una categoría con nombre, ícono y color a tu elección.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  PRODUCTOS: {
    titulo: 'Catálogo de Productos y Precios',
    subtitulo: 'Control de artículos con precios de venta, costos y control de inventario.',
    elementos: [
      {
        icono: 'search',
        titulo: 'Buscador de Productos',
        descripcion: 'Localiza rápidamente cualquier producto por su nombre o categoría.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'sell',
        titulo: 'Precios y Márgenes',
        descripcion: 'Visualiza el precio de venta al público y el costo de compra para conocer tu rentabilidad.',
        colorIcono: COLORS.cashflowIncome,
      },
      {
        icono: 'inventory-2',
        titulo: 'Control de Inventario',
        descripcion: 'Gestiona compras, ventas, devoluciones y stock mínimo con alertas automáticas.',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Nuevo Producto (+)',
        descripcion: 'Usa el botón flotante para registrar un nuevo producto en tu catálogo.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  PRESUPUESTOS: {
    titulo: 'Presupuestos Mensuales',
    subtitulo: 'Fija límites de gasto por categoría y mantén tus ahorros protegidos.',
    elementos: [
      {
        icono: 'donut-large',
        titulo: 'Límites de Gasto',
        descripcion: 'Define la cantidad máxima que deseas gastar en cada rubro durante el mes.',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'linear-scale',
        titulo: 'Barra de Progreso',
        descripcion: 'Muestra visualmente cuánto has consumido de tu presupuesto y cuánto te queda disponible.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'notifications-active',
        titulo: 'Alertas de Límite',
        descripcion: 'La barra cambia de color y te avisa cuando estás cerca o sobrepasas el monto establecido.',
        colorIcono: COLORS.cashflowExpense,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Nuevo Presupuesto (+)',
        descripcion: 'Crea un nuevo tope presupuestario para la categoría que elijas.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  DEUDAS: {
    titulo: 'Control de Deudas y Préstamos',
    subtitulo: 'Seguimiento de dinero por cobrar y compromisos por pagar.',
    elementos: [
      {
        icono: 'handshake',
        titulo: 'Por Cobrar / Por Pagar',
        descripcion: 'Separa claramente el dinero que te deben otras personas de las deudas que tú debes saldar.',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'payments',
        titulo: 'Registro de Abonos',
        descripcion: 'Registra pagos parciales o marca la deuda como pagada por completo.',
        colorIcono: COLORS.cashflowIncome,
      },
      {
        icono: 'schedule',
        titulo: 'Vencimientos',
        descripcion: 'Lleva el control de los plazos de vencimiento acordados para cada compromiso.',
        colorIcono: COLORS.outline,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Nueva Deuda (+)',
        descripcion: 'Registra un nuevo préstamo o crédito con nombre de persona y monto.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  AGENDA: {
    titulo: 'Agenda Financiera',
    subtitulo: 'Planificación de pagos futuros, vencimientos y recordatorios.',
    elementos: [
      {
        icono: 'calendar-today',
        titulo: 'Calendario Mensual',
        descripcion: 'Visualiza tus pagos y cobros programados día a día.',
        colorIcono: COLORS.primary,
      },
      {
        icono: 'notifications',
        titulo: 'Recordatorios',
        descripcion: 'Anticípate a las fechas de corte de tarjetas, alquileres o servicios esenciales.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'add-circle-outline',
        titulo: 'Nuevo Evento (+)',
        descripcion: 'Programa un recordatorio o vencimiento a futuro.',
        colorIcono: COLORS.primary,
      },
    ],
  },
  AJUSTES: {
    titulo: 'Ajustes del Sistema',
    subtitulo: 'Seguridad, respaldos de datos y configuración general.',
    elementos: [
      {
        icono: 'backup',
        titulo: 'Copia de Seguridad',
        descripcion: 'Exporta o restaura una copia de seguridad completa de tu base de datos SQLite.',
        colorIcono: COLORS.secondary,
      },
      {
        icono: 'security',
        titulo: 'Privacidad Total',
        descripcion: 'Todos tus datos financieros viven 100% en tu teléfono de forma local.',
        colorIcono: COLORS.cashflowIncome,
      },
    ],
  },
};

