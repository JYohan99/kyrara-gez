import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY, COMMON_STYLES } from '@/compartido/tema';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { EncabezadoSuperior, TarjetaVidrio as GlassCard, BotonFlotanteAccion, EstadoVacio, BarraBusqueda, SelectorSegmentado, ChipFiltro } from '@/compartido/componentes';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';
import { useDeudasBoveda } from '@/datos/hooks';
import { Deuda, TipoDeuda, FiltroEstadoDeuda } from '@/datos/tipos';
import { ModalDeuda } from './ModalDeuda';
import { ModalDetalleDeuda } from './ModalDetalleDeuda';
import { TarjetaDeuda } from './TarjetaDeuda';

const FILTROS_ESTADO: { label: string; valor: FiltroEstadoDeuda }[] = [
  { label: 'Todas', valor: 'TODAS' },
  { label: 'Pendientes', valor: 'PENDIENTES' },
  { label: 'Parciales', valor: 'PARCIALES' },
  { label: 'Pagadas', valor: 'PAGADAS' },
  { label: 'Vencidas', valor: 'VENCIDAS' },
];

export const PantallaDeudas: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [tipoActivo, setTipoActivo] = useState<TipoDeuda>('RECEIVABLE');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoDeuda>('TODAS');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  // Estados de modales
  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [deudaSeleccionadaParaEditar, setDeudaSeleccionadaParaEditar] = useState<Deuda | null>(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [deudaDetalleId, setDeudaDetalleId] = useState<string | null>(null);

  const { debts, summary, reloadDeudas } = useDeudasBoveda({
    type: tipoActivo,
    statusFilter: filtroEstado,
    search: terminoBusqueda,
  });

  const onRefresh = () => {
    setRefrescando(true);
    reloadDeudas();
    setTimeout(() => setRefrescando(false), 300);
  };

  const handleAbrirCrear = () => {
    triggerSelection();
    setDeudaSeleccionadaParaEditar(null);
    setModalFormularioVisible(true);
  };

  const handleAbrirDetalle = (deuda: Deuda) => {
    triggerSelection();
    setDeudaDetalleId(deuda.id);
    setModalDetalleVisible(true);
  };

  const handleEditarDesdeDetalle = (deuda: Deuda) => {
    setModalDetalleVisible(false);
    setDeudaSeleccionadaParaEditar(deuda);
    setTimeout(() => {
      setModalFormularioVisible(true);
    }, 200);
  };

  const esCobro = tipoActivo === 'RECEIVABLE';

  return (
    <View style={COMMON_STYLES.screen}>
      <EncabezadoSuperior seccion="DEUDAS" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View>

            <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
              Control de préstamos y obligaciones
            </Text>
          </View>
        </View>

        {/* Resumen Hero Card */}
        <GlassCard variant="high" style={styles.summaryHeroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.heroLabel, TYPOGRAPHY.labelCaps]}>Balance neto pendiente</Text>
              <Text
                style={[
                  styles.heroBalanceNumber,
                  {
                    color:
                      summary.netBalance > 0
                        ? COLORS.cashflowIncome
                        : summary.netBalance < 0
                          ? COLORS.cashflowExpense
                          : COLORS.onSurface,
                  },
                  TYPOGRAPHY.displayHeroMobile,
                ]}
              >
                {summary.netBalance >= 0 ? '+ ' : '- '}
                {formatCurrency(Math.abs(summary.netBalance))}
              </Text>
            </View>

            {summary.countOverdue > 0 && (
              <View style={styles.overdueAlertPill}>
                <MaterialIcons name="warning" size={13} color={COLORS.cashflowExpense} />
                <Text style={[styles.overdueAlertText, TYPOGRAPHY.labelCaps]}>
                  {summary.countOverdue} {summary.countOverdue === 1 ? 'vencida' : 'vencidas'}
                </Text>
              </View>
            )}
          </View>

          {/* Metrics Strip */}
          <View style={styles.metricsStrip}>
            {/* Por Cobrar */}
            <TouchableOpacity
              style={[
                styles.metricCol,
                tipoActivo === 'RECEIVABLE' && styles.metricColActive,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                triggerSelection();
                setTipoActivo('RECEIVABLE');
              }}
            >
              <View style={styles.metricHeading}>
                <MaterialIcons name="call-received" size={14} color={COLORS.cashflowIncome} />
                <Text style={[styles.metricLabel, { color: COLORS.cashflowIncome }, TYPOGRAPHY.labelCaps]}>
                  Me deben
                </Text>
                <View style={[styles.badgeCount, { backgroundColor: 'rgba(87, 245, 171, 0.2)' }]}>
                  <Text style={[styles.badgeCountText, { color: COLORS.cashflowIncome }, TYPOGRAPHY.labelCaps]}>
                    {summary.countReceivablePending}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, TYPOGRAPHY.numericTable]}>
                +{formatCurrency(summary.totalReceivablePending)}
              </Text>
            </TouchableOpacity>

            <View style={styles.metricsDivider} />

            {/* Por Pagar */}
            <TouchableOpacity
              style={[
                styles.metricCol,
                tipoActivo === 'PAYABLE' && styles.metricColActive,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                triggerSelection();
                setTipoActivo('PAYABLE');
              }}
            >
              <View style={styles.metricHeading}>
                <MaterialIcons name="call-made" size={14} color={COLORS.cashflowExpense} />
                <Text style={[styles.metricLabel, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                  Debo
                </Text>
                <View style={[styles.badgeCount, { backgroundColor: 'rgba(255, 138, 158, 0.2)' }]}>
                  <Text style={[styles.badgeCountText, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                    {summary.countPayablePending}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, TYPOGRAPHY.numericTable]}>
                -{formatCurrency(summary.totalPayablePending)}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Segmented Switch: «Me deben» / «Debo» */}
        <SelectorSegmentado<TipoDeuda>
          opciones={[
            {
              valor: 'RECEIVABLE',
              etiqueta: `Me deben (${summary.countReceivablePending})`,
              icono: 'call-received',
              tonoActivo: 'ingreso',
              colorIconoInactivo: COLORS.cashflowIncome,
            },
            {
              valor: 'PAYABLE',
              etiqueta: `Debo (${summary.countPayablePending})`,
              icono: 'call-made',
              tonoActivo: 'gasto',
              colorIconoInactivo: COLORS.cashflowExpense,
            },
          ]}
          valorSeleccionado={tipoActivo}
          onSeleccionar={setTipoActivo}
          style={{ marginBottom: 14 }}
        />

        {/* Buscador */}
        <BarraBusqueda
          value={terminoBusqueda}
          onChangeText={setTerminoBusqueda}
          placeholder={esCobro ? 'Buscar persona o concepto por cobrar...' : 'Buscar acreedor o concepto por pagar...'}
          style={{ marginBottom: 14 }}
        />

        {/* Filtros por Estado */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {FILTROS_ESTADO.map(f => {
            const isSelected = filtroEstado === f.valor;
            return (
              <ChipFiltro
                key={f.valor}
                etiqueta={f.label}
                activo={isSelected}
                tono={f.valor === 'VENCIDAS' ? 'gasto' : f.valor === 'PAGADAS' ? 'ingreso' : 'cian'}
                mayusculas
                onPress={() => setFiltroEstado(f.valor)}
              />
            );
          })}
        </ScrollView>

        {/* Listado de Deudas */}
        <View style={styles.listContainer}>
          {debts.length === 0 ? (
            <EstadoVacio
              icono={esCobro ? 'sentiment-satisfied-alt' : 'sentiment-very-satisfied'}
              colorIcono={COLORS.primary}
              titulo={
                terminoBusqueda
                  ? 'No se encontraron coincidencias'
                  : esCobro
                    ? 'No tienes cobros pendientes'
                    : 'No tienes deudas registradas'
              }
              descripcion={
                terminoBusqueda
                  ? 'Intenta con otro término de búsqueda o limpia los filtros.'
                  : esCobro
                    ? 'Toca el botón + para registrar a alguien que te debe dinero.'
                    : 'Toca el botón + para anotar un pago u obligación pendiente.'
              }
            />
          ) : (
            debts.map(deuda => (
              <TarjetaDeuda
                key={deuda.id}
                deuda={deuda}
                esCobro={esCobro}
                onPress={handleAbrirDetalle}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Botón Circular Flotante (FAB) - Nueva Deuda */}
      <BotonFlotanteAccion
        onPress={handleAbrirCrear}
        accessibilityLabel="Nueva deuda"
      />

      {/* Modal Crear / Editar Deuda */}
      <ModalDeuda
        visible={modalFormularioVisible}
        onClose={() => {
          setModalFormularioVisible(false);
          setDeudaSeleccionadaParaEditar(null);
        }}
        deudaParaEditar={deudaSeleccionadaParaEditar}
        tipoInicial={tipoActivo}
      />

      {/* Modal Detalle / Comprobante */}
      <ModalDetalleDeuda
        visible={modalDetalleVisible}
        deudaId={deudaDetalleId}
        onClose={() => {
          setModalDetalleVisible(false);
          setDeudaDetalleId(null);
        }}
        onEditar={handleEditarDesdeDetalle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainSectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  summaryHeroCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroLabel: {
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  heroBalanceNumber: {
    fontWeight: '700',
  },
  overdueAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 158, 0.3)',
  },
  overdueAlertText: {
    color: COLORS.cashflowExpense,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 10,
  },
  metricCol: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricColActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricsDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.borderGlass,
  },
  metricHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
  },
  badgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeCountText: {
    fontSize: 8,
    fontWeight: '700',
  },
  metricValue: {
    color: COLORS.onSurface,
    fontSize: 13,
  },
  filterChipsScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  listContainer: {
    gap: 12,
  },
});

