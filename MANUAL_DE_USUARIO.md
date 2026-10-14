# Manual de Usuario • Kyrara Gez
### *Cockpit Financiero Personal — Arquitectura Bóveda Cero Nube*

---

## 1. Filosofía y Privacidad: "Bóveda Cero Nube"

**Kyrara Gez** fue concebida bajo un estándar de privacidad innegociable: **tu información financiera no le pertenece a nadie más que a ti**. 

* **Cero Telemetría y Cero Servidores:** La aplicación no se comunica con servidores remotos, no recopila analíticas, ni envía rastreadores a terceros.
* **Almacenamiento Local Cifrado (AES-256):** Toda la información —cuentas, saldos, categorías, transacciones, notas y límites presupuestarios— reside exclusivamente en el almacenamiento local cifrado de tu dispositivo mediante SQLite.
* **Convención Monetaria:** Diseñada para el manejo en **Pesos Uruguayos (UYU / `$`)**, con formateo contable estándar (`$ 142.850,00`) y representación interna en enteros de centavos para garantizar exactitud matemática absoluta y evitar pérdidas de redondeo.

---

## 2. Acceso Inicial y Pantalla de Bloqueo (Bóveda Guard)

Al abrir la aplicación, tus datos están protegidos por el escudo **Bóveda Guard**:

```
 ┌───────────────────────────────────────────────┐
 │               [ KYRARA GEZ ]                  │
 │              Bóveda Protegida                 │
 │   Ingresa tu PIN de 4 dígitos para acceder   │
 │                                               │
 │                 ●  ●  ○  ○                    │
 │                                               │
 │             [1]     [2]     [3]               │
 │             [4]     [5]     [6]               │
 │             [7]     [8]     [9]               │
 │           [Huella]  [0]    [Borrar]           │
 └───────────────────────────────────────────────┘
```

* **PIN Maestro por Defecto:** `1234` *(puedes personalizarlo en la pestaña Cuentas > Ajustes)*.
* **Respuesta Háptica Física:** Cada dígito marcado emite una confirmación táctil ligera. Al ingresar el PIN correcto, se produce una vibración de éxito; si el PIN es incorrecto, una vibración de alerta.
* **Acceso Biométrico:** Tocando el icono de huella dactilar/Face ID en la esquina inferior izquierda del teclado puedes desbloquear tu bóveda al instante.

---

## 3. Guía de Navegación: Las 5 Pantallas del Cockpit

La barra inferior proporciona acceso directo a las áreas de gestión del cockpit:

| Pestaña | Función Principal |
| :--- | :--- |
| **Inicio** | Resumen financiero global, dinero disponible, accesos directos y últimos movimientos. |
| **Movimientos** | Historial transaccional cronológico, buscador en tiempo real, filtros y comprobantes. |
| **(+) Central** | Formulario rápido para registrar gastos, ingresos y transferencias entre cuentas. |
| **Presupuestos** | Monitor de ritmo mensual, velocidad de gasto diario y límites por categoría. |
| **Análisis** | Curvas de liquidez, tasa de ahorro, desglose porcentual y top 3 gastos. |
| **Cuentas** | Gestión de fondos, categorías de gasto/ingreso y configuración de bóveda. |

---

### 3.1. Pantalla de Inicio (Dashboard)

El centro de mando de tus finanzas cotidianas:

1. **Tarjeta Hero "Dinero Disponible":**
   * Muestra la suma consolidada de todas tus cuentas activas.
   * **Modo Privacidad (Botón de Ojo):** Toca el icono del ojo para ocultar u ofuscar tus montos (`$ ••••••`) cuando estés en la calle o en lugares públicos.
   * **Insignia Kyrara Flow:** Indica el balance neto del mes corriente (*Superávit en verde esmeralda o Déficit en coral*).
2. **Acceso Rápido Operativo:**
   * **Gasto:** Abre el registro express de salidas de dinero.
   * **Ingreso:** Asienta un cobro, sueldo o entrada extraordinaria.
   * **Traspaso:** Mueve fondos entre dos de tus cuentas sin alterar el total general.
   * **Informe:** Despliega el **Informe Ejecutivo de Cierre de Mes**.
3. **Mis Cuentas:**
   * Carrusel con el saldo de cada una de tus cuentas (Efectivo, Cajas de Ahorro, Tarjetas Prepagas).
4. **Últimos Movimientos:**
   * Feed de las 4 operaciones más recientes. Tocando cualquiera de ellas accedes al **Comprobante Digital de Bóveda**.

---

### 3.2. Pantalla de Movimientos

Tu registro contable completo con búsqueda instantánea:

* **Buscador en Tiempo Real:** Filtra inmediatamente por comercio (ej. *Ta-Ta, Ancap, Tienda Inglesa*), categoría o notas descriptivas.
* **Filtros por Tipo (Píldoras):**
  * `Todos`: Visualiza la totalidad del flujo.
  * `Gastos`: Solo salidas registradas.
  * `Ingresos`: Solo entradas de capital.
  * `Traspasos`: Solo transferencias internas entre cuentas.
* **Agrupación Cronológica:** Las operaciones se agrupan en secciones (*Hoy, Ayer, 05 de Octubre...*) con subtotales por fecha.
* **Interacción con cada Registro:**
  * **Toque corto:** Abre el **Comprobante Digital / Ticket de Bóveda**.
  * **Toque prolongado (Long Press):** Despliega el diálogo de confirmación para eliminar la transacción y revertir el saldo de la cuenta automáticamente.

---

### 3.3. Formulario Central (+) de Nuevo Movimiento

Permite asentar operaciones en segundos con integridad atómica:

1. **Seleccionar Flujo:** Pestañas superiores para alternar entre `GASTO`, `INGRESO` o `TRASPASO`.
2. **Monto:** Ingreso en pesos uruguayos con teclado numérico.
3. **Cuenta:** 
   * En gastos/ingresos: Selecciona la cuenta origen.
   * En traspasos: Selecciona **Cuenta Origen** (de donde sale el dinero) y **Cuenta Destino** (donde se acredita).
4. **Categoría e Icono:** Asigna la clasificación del gasto (Alimentación, Transporte, Servicios, etc.).
5. **Comercio / Beneficiario y Notas:** Campos opcionales para auditoría personal (ej. *Cena familiar, Pago de alquiler, Combustible*).
6. **Asentar Operación:** Al presionar el botón brillante, los saldos de las cuentas se actualizan de forma atómica en SQLite.

---

### 3.4. Pantalla de Presupuestos y Planificación

Control de gasto inteligente basado en ritmo y velocidad:

* **Indicador de Ritmo Temporal:** Muestra en qué día del mes te encuentras (ej. *"Día 8 de 31"*).
* **Tarjeta de Límite Mensual Global:** 
  * Total presupuestado vs. Total gastado hasta la fecha.
  * Porcentaje consumido y ritmo relativo (ej. `+7% ritmo previsto`).
* **Insignia de Velocidad de Gasto:** 
  * Calcula exactamente cuánto puedes gastar por día restante para no exceder tu límite (ej. `$ 1.822/día`).
* **Barras de Progreso por Categoría:**
  * Cada categoría con límite asignado muestra su porcentaje de uso.
  * **Alerta Visual:** Al superar el 90% del límite, la barra cambia automáticamente de color a tono de advertencia.
* **Herramientas de Presupuesto:**
  * **+ Asignar Límite:** Permite definir un techo mensual para cualquier categoría.
  * **Clonar Mes Anterior:** Replica en un toque la estructura presupuestaria del mes pasado sin tener que reescribirla.

---

### 3.5. Pantalla de Análisis y Comprensión de Hábitos

Diagnóstico visual de tu salud financiera:

* **Selector de Período:** Alterna entre *Este mes*, *Mes anterior*, *Últimos 3 meses*, *Últimos 6 meses* o *Todo el año*.
* **Tarjeta de Balance Neto & Tasa de Ahorro:**
  * Proporción visual entre dinero gastado vs. dinero preservado.
  * Cálculo exacto de tu **Tasa de Ahorro Real** (`% de ingresos retenidos`).
* **Gráfica de Tendencia Líquida (Curva Bézier SVG):**
  * Curva fluida con degradados neón y puntos de control que ilustran el flujo acumulado de tu capital día por día.
* **Segmentación de Categorías:** Barra multi-segmentada que desglosa visualmente en qué rubros se concentró el capital.
* **Top 3 Compras Más Grandes:** Identifica los tres gastos de mayor impacto que definieron tu mes.
* **Histórico de Ahorro:** Gráfico de columnas comparando tu rendimiento en los últimos 4 meses.
* **Botón "Informe" (Cabecera):** Abre el reporte formal de cierre de mes.

---

### 3.6. Pantalla de Cuentas, Categorías y Ajustes

Configuración de fondos y control de la bóveda:

#### Pestaña "Mis Cuentas":
* **Barra de Distribución Patrimonial:** Muestra qué porcentaje de tu dinero está en efectivo, cuentas bancarias o billeteras electrónicas.
* **Gestión de Cuentas:** Tarjetas individuales con saldo actual. Al tocar una cuenta, puedes editar su nombre, tipo, saldo inicial o archivarse.
* **+ Nueva Cuenta:** Agrega fondos en efectivo, cajas de ahorro, depósitos o tarjetas prepagas.

#### Pestaña "Categorías":
* Selector para revisar y clasificar categorías de **Gasto** o de **Ingreso**.
* Visualización de la categoría más activa del mes.
* **+ Nueva Categoría:** Permite crear rubros personalizados eligiendo nombre, tipo de flujo, icono y color característico.

#### Pestaña "Ajustes de Bóveda":
* **Seguridad Bóveda Guard:** Modifica tu PIN de 4 dígitos o activa/desactiva el desbloqueo biométrico.
* **Copias de Seguridad (Exportación):**
  * **Exportar Copia Cifrada (.kyrarabez):** Genera un archivo con hash criptográfico SHA-256 conteniendo todas tus cuentas, categorías, presupuestos y movimientos. Se comparte directamente mediante el menú nativo del teléfono (WhatsApp, Google Drive, Correo o Archivo Local).
  * **Exportar a Planilla CSV:** Genera un archivo `.csv` compatible con Excel y Google Sheets.
* **Restaurar Copia de Seguridad:** Permite pegar o cargar el contenido de un respaldo `.kyrarabez`, validando su integridad antes de sincronizar la base de datos local.
* **Mantenimiento y Auditoría:** Consulta cuántos registros y cuentas residen en la base de datos local SQLite.
* **Restablecimiento Total:** Borra los datos locales y reinstala el estado de fábrica de la bóveda (requiere doble confirmación).

---

## 4. Funcionalidades Especiales

### 4.1. Comprobante Digital de Movimiento ("Ticket de Bóveda")

Al tocar cualquier transacción en la app, se despliega su comprobante oficial:

* **Sello de Auditoría:** Identificador único (`TX-#...`) que valida que la operación fue asentada en la base de datos local con cifrado AES-256.
* **Ficha Técnica Detallada:** Monto en UYU con color identificador (verde esmeralda para ingresos, coral para gastos, violeta para traspasos), fecha, hora de registro, comercio, categoría, cuenta y notas.
* **Compartir Comprobante:** Genera un recibo digital estructurado y abre el menú de compartir nativo para enviarlo a terceros o guardarlo como comprobante de pago.
* **Edición en Caliente:** Permite modificar el monto, comercio o notas directamente desde el comprobante. El motor SQLite reconcilia y recalcula los saldos de las cuentas automáticamente sin desfasar el balance general.
* **Eliminar:** Reversa contablemente la transacción devolviendo los fondos a su estado anterior.

---

### 4.2. Informe Ejecutivo de Cierre de Mes

Disponible tanto en el botón *"Informe"* del panel de Inicio como en la cabecera de Análisis:

* **Diagnóstico Consolidado:** Ingresos totales, gastos totales, balance neto final (superávit/déficit) y tasa de ahorro.
* **Índice de Disciplina:** Medición del apego a tus techos presupuestarios.
* **Ranking de Categorías:** Las 3 categorías que demandaron mayor capital en el mes.
* **Exportación Oficial:** Formatea el cierre en un texto limpio listo para ser compartido o guardado en tus notas privadas.

---

## 5. Preguntas Frecuentes y Buenas Prácticas

### ¿Qué sucede si cambio de teléfono?
Como Kyrara Gez no almacena información en la nube, antes de cambiar de dispositivo ve a **Cuentas > Ajustes > Exportar Copia Cifrada (.kyrarabez)** y envíate el archivo por correo, Drive o mensajería privada. En tu nuevo dispositivo, instala la aplicación y selecciona **Restaurar Copia** en los Ajustes para recuperar tus finanzas en segundos.

### ¿Qué pasa si olvido mi código PIN?
Por seguridad, el PIN protege el acceso local. Si tienes habilitada la biometría (huella o Face ID), puedes usar el sensor para ingresar y luego dirigirte a Ajustes para redefinir tu PIN.

### ¿Se pueden usar decimales en los montos?
Sí. El sistema admite importes enteros y con centavos (ej. `$ 1.250,50`). La moneda principal es el Peso Uruguayo (`UYU`).

### ¿La aplicación consume datos móviles o internet?
No. La aplicación funciona con **0% de conexión a internet**. Puedes utilizarla en modo avión, en zonas sin señal o sin chip SIM con exactamente la misma rapidez y funcionalidad.
