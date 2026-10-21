import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { EncabezadoSuperior } from '@/compartido/componentes/EncabezadoSuperior';
import { useAgendaBoveda } from '@/datos/hooks';
import { OcurrenciaCompromiso, Compromiso } from '@/datos/tipos';
import {
  completarOcurrenciaCompromiso,
  actualizarCompromiso,
} from '@/datos/consultas/agenda';
import {
  vibracionExito as triggerSuccess,
  vibracionSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

import { ModalCompromiso } from './ModalCompromiso';
import { ModalDetalleCompromiso } from './ModalDetalleCompromiso';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function PantallaAgenda() {
  const hoy = useMemo(() => new Date(), []);
  const hoyStr = useMemo(() => {
    const y = hoy.getFullYear();
    const m = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const d = hoy.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [hoy]);

  const [currentYear, setCurrentYear] = useState(() => hoy.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => hoy.getMonth() + 1); // 1-indexed
  const [selectedDate, setSelectedDate] = useState(() => hoyStr);

  // Modales
  const [modalCompromisoVisible, setModalCompromisoVisible] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<OcurrenciaCompromiso | Compromiso | null>(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<OcurrenciaCompromiso | Compromiso | null>(null);

  // Hook reactivo de la bóveda para la agenda
  const { monthOccurrences, selectedDayOccurrences, upcomingCommitments } = useAgendaBoveda({
    year: currentYear,
    month: currentMonth,
    selectedDate,
  });

  // Mapeo de días que tienen compromisos en el mes actual
  const diasConCompromisos = useMemo(() => {
    const map: Record<string, { total: number; pending: number; completed: number }> = {};
    for (const occ of monthOccurrences) {
      if (occ.status === 'CANCELLED') continue;
      if (!map[occ.occurrenceDate]) {
        map[occ.occurrenceDate] = { total: 0, pending: 0, completed: 0 };
      }
      map[occ.occurrenceDate].total++;
      if (occ.status === 'COMPLETED') {
        map[occ.occurrenceDate].completed++;
      } else {
        map[occ.occurrenceDate].pending++;
      }
    }
    return map;
  }, [monthOccurrences]);

  // Navegación de meses
  const handlePrevMonth = () => {
    triggerSelection();
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerSelection();
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    triggerSelection();
    const actualYear = hoy.getFullYear();
    const actualMonth = hoy.getMonth() + 1;
    setCurrentYear(actualYear);
    setCurrentMonth(actualMonth);
    setSelectedDate(hoyStr);
  };

  // Cálculo de la cuadrícula del calendario (inicio en Lunes = 0)
  const calendarGrid = useMemo(() => {
    const firstDayIndex = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7;
    const totalDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: { dayNumber: number | null; dateStr: string | null }[] = [];

    // Celdas vacías previas
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNumber: null, dateStr: null });
    }

    // Celdas del mes
    for (let d = 1; d <= totalDays; d++) {
      const mesStr = currentMonth.toString().padStart(2, '0');
      const diaStr = d.toString().padStart(2, '0');
      cells.push({
        dayNumber: d,
        dateStr: `${currentYear}-${mesStr}-${diaStr}`,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Alternar completado rápidamente desde la lista
  const handleToggleCompleted = async (occ: OcurrenciaCompromiso) => {
    triggerSelection();
    try {
      if (occ.status === 'COMPLETED') {
        // Reabrir
        if (occ.recurrenceType === 'SINGLE') {
          await actualizarCompromiso(occ.id, { status: 'PENDING' });
        } else {
          const baseId = occ.seriesId || occ.id;
          await actualizarCompromiso(baseId, { status: 'PENDING' });
        }
      } else {
        await completarOcurrenciaCompromiso(occ, occ.occurrenceDate);
      }
      triggerSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el compromiso.');
    }
  };

  const handleOpenDetail = (occ: OcurrenciaCompromiso) => {
    triggerSelection();
    setSelectedCommitment(occ);
    setModalDetalleVisible(true);
  };

  const handleOpenEdit = (comp: OcurrenciaCompromiso | Compromiso) => {
    setEditingCommitment(comp);
    setModalCompromisoVisible(true);
  };

  const handleOpenNew = () => {
    triggerSelection();
    setEditingCommitment(null);
    setModalCompromisoVisible(true);
  };

  // Formato de título del día seleccionado
  const tituloDiaSeleccionado = useMemo(() => {
    if (selectedDate === hoyStr) {
      return 'Hoy';
    }
    const [, m, d] = selectedDate.split('-');
    const mesNom = MESES[parseInt(m, 10) - 1];
    return `${parseInt(d, 10)} de ${mesNom}`;
  }, [selectedDate, hoyStr]);

  return (
    <View style={styles.screen}>
      <EncabezadoSuperior
        seccion="AGENDA"
        etiquetaPeriodo={`${MESES[currentMonth - 1].substring(0, 3)} ${currentYear}`}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Title Row */}
        <View style={styles.mainTitleRow}>
          <View>
            <Text style={[styles.mainSectionTitle, TYPOGRAPHY.headlineLg]}>
              Agenda
            </Text>
            <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
              Compromisos y Recordatorios
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={handleOpenNew}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Nuevo compromiso"
          >
            <LinearGradient
              colors={['#9B5CFF', '#6A1FE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtnGradient}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Selector de Mes y Control de Hoy */}
        <View style={styles.monthHeaderRow}>
          <View style={styles.monthTitleBox}>
            <Text style={[styles.monthTitleText, TYPOGRAPHY.headlineSm]}>
              {MESES[currentMonth - 1]} {currentYear}
            </Text>
          </View>

          <View style={styles.monthNavActions}>
            <TouchableOpacity
              onPress={handleGoToday}
              style={[
                styles.todayBtn,
                selectedDate === hoyStr && styles.todayBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="today"
                size={14}
                color={selectedDate === hoyStr ? COLORS.primary : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.todayBtnText,
                  selectedDate === hoyStr && styles.todayBtnTextActive,
                  TYPOGRAPHY.labelCaps,
                ]}
              >
                Hoy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chevron-left" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tarjeta del Calendario Mensual */}
        <GlassCard variant="surface" style={styles.calendarCard}>
          {/* Encabezado de Días de Semana (L, M, M, J, V, S, D) */}
          <View style={styles.weekHeaderRow}>
            {DIAS_SEMANA.map((dia, idx) => (
              <View key={idx} style={styles.weekDayHeaderCell}>
                <Text style={[styles.weekDayHeaderText, TYPOGRAPHY.labelCaps]}>{dia}</Text>
              </View>
            ))}
          </View>

          {/* Cuadrícula de Días */}
          <View style={styles.daysGrid}>
            {calendarGrid.map((cell, idx) => {
              if (!cell.dayNumber || !cell.dateStr) {
                return <View key={idx} style={styles.dayCellEmpty} />;
              }

              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === hoyStr;
              const compromisosInfo = diasConCompromisos[cell.dateStr];
              const tieneCompromisos = Boolean(compromisosInfo && compromisosInfo.total > 0);
              const tienePendientes = Boolean(compromisosInfo && compromisosInfo.pending > 0);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => {
                    triggerSelection();
                    if (cell.dateStr) setSelectedDate(cell.dateStr);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      TYPOGRAPHY.numericTable,
                      isSelected && styles.dayNumberTextSelected,
                      isToday && !isSelected && styles.dayNumberTextToday,
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>

                  {/* Indicador de compromiso */}
                  {tieneCompromisos && (
                    <View
                      style={[
                        styles.commitmentDot,
                        tienePendientes
                          ? isSelected
                            ? styles.commitmentDotPendingSelected
                            : styles.commitmentDotPending
                          : styles.commitmentDotCompleted,
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Sección: Compromisos del Día Seleccionado */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleCol}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.headlineSm]}>
              Compromisos: {tituloDiaSeleccionado}
            </Text>
            <Text style={[styles.sectionSubtitle, TYPOGRAPHY.labelCaps]}>
              {selectedDayOccurrences.length}{' '}
              {selectedDayOccurrences.length === 1 ? 'compromiso registrado' : 'compromisos registrados'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={handleOpenNew}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Nuevo compromiso"
          >
            <LinearGradient
              colors={['#9B5CFF', '#6A1FE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtnGradient}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Lista de Compromisos del Día */}
        {selectedDayOccurrences.length === 0 ? (
          <GlassCard variant="low" style={styles.emptyDayCard}>
            <MaterialIcons name="event-available" size={32} color={COLORS.outline} />
            <Text style={[styles.emptyDayTitle, TYPOGRAPHY.bodySm]}>
              No hay compromisos agendados para este día.
            </Text>
            <TouchableOpacity onPress={handleOpenNew} style={styles.emptyDayActionLink}>
              <Text style={[styles.emptyDayActionText, TYPOGRAPHY.labelCaps]}>
                + Añadir un compromiso
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <View style={styles.commitmentsList}>
            {selectedDayOccurrences.map(occ => {
              const esCompletado = occ.status === 'COMPLETED';
              const esCancelado = occ.status === 'CANCELLED';

              return (
                <TouchableOpacity
                  key={occ.id}
                  style={[
                    styles.commitmentCard,
                    esCompletado && styles.commitmentCardCompleted,
                    esCancelado && styles.commitmentCardCancelled,
                  ]}
                  onPress={() => handleOpenDetail(occ)}
                  activeOpacity={0.7}
                >
                  {/* Checkbox circular de completado rápido */}
                  <TouchableOpacity
                    style={[
                      styles.checkboxCircle,
                      esCompletado && styles.checkboxCircleCompleted,
                      esCancelado && styles.checkboxCircleCancelled,
                    ]}
                    onPress={() => handleToggleCompleted(occ)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {esCompletado && (
                      <MaterialIcons name="check" size={14} color="#0B0F10" />
                    )}
                    {esCancelado && (
                      <MaterialIcons name="close" size={12} color={COLORS.cashflowExpense} />
                    )}
                  </TouchableOpacity>

                  {/* Información central */}
                  <View style={styles.commitmentCardContent}>
                    <Text
                      style={[
                        styles.commitmentCardTitle,
                        TYPOGRAPHY.bodySm,
                        esCompletado && styles.textStrikethrough,
                        esCancelado && styles.textStrikethrough,
                      ]}
                      numberOfLines={1}
                    >
                      {occ.title}
                    </Text>

                    <View style={styles.badgesRow}>
                      {Boolean(occ.time) && (
                        <View style={styles.chipPill}>
                          <MaterialIcons name="schedule" size={11} color={COLORS.secondary} />
                          <Text style={[styles.chipPillText, TYPOGRAPHY.numericTable]}>{occ.time}</Text>
                        </View>
                      )}

                      {Boolean(occ.relatedPerson) && (
                        <View style={styles.chipPill}>
                          <MaterialIcons name="person" size={11} color={COLORS.primary} />
                          <Text style={[styles.chipPillText, TYPOGRAPHY.bodySm]} numberOfLines={1}>
                            {occ.relatedPerson}
                          </Text>
                        </View>
                      )}

                      {occ.recurrenceType === 'MONTHLY' && (
                        <View style={styles.chipPillMonthly}>
                          <MaterialIcons name="update" size={11} color={COLORS.tertiary} />
                          <Text style={[styles.chipPillMonthlyText, TYPOGRAPHY.labelCaps]}>Mensual</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <MaterialIcons name="chevron-right" size={18} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Sección: Próximos compromisos (resumen extendido) */}
        {upcomingCommitments.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.upcomingHeaderRow}>
              <MaterialIcons name="upcoming" size={16} color={COLORS.secondary} />
              <Text style={[styles.upcomingTitle, TYPOGRAPHY.labelCaps]}>
                Próximos compromisos pendientes ({upcomingCommitments.length})
              </Text>
            </View>

            <View style={styles.upcomingList}>
              {upcomingCommitments.slice(0, 5).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.upcomingCard}
                  onPress={() => {
                    triggerSelection();
                    setSelectedDate(item.occurrenceDate);
                    handleOpenDetail(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.upcomingDateBadge}>
                    <Text style={[styles.upcomingDateDay, TYPOGRAPHY.numericTable]}>
                      {parseInt(item.occurrenceDate.split('-')[2], 10)}
                    </Text>
                    <Text style={[styles.upcomingDateMonth, TYPOGRAPHY.labelCaps]}>
                      {MESES[parseInt(item.occurrenceDate.split('-')[1], 10) - 1].slice(0, 3)}
                    </Text>
                  </View>

                  <View style={styles.upcomingContent}>
                    <Text style={[styles.upcomingTitleText, TYPOGRAPHY.bodySm]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.upcomingTimeText, TYPOGRAPHY.numericTable]}>
                      {item.time ? `${item.time} hs` : 'Todo el día'}
                      {item.relatedPerson ? ` • ${item.relatedPerson}` : ''}
                    </Text>
                  </View>

                  <MaterialIcons name="arrow-forward" size={14} color={COLORS.outline} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal para Crear y Editar Compromiso */}
      <ModalCompromiso
        visible={modalCompromisoVisible}
        initialDate={selectedDate}
        editingCommitment={editingCommitment}
        onClose={() => {
          setModalCompromisoVisible(false);
          setEditingCommitment(null);
        }}
      />

      {/* Modal para Ver Detalle y Operar */}
      <ModalDetalleCompromiso
        visible={modalDetalleVisible}
        commitment={selectedCommitment}
        onClose={() => {
          setModalDetalleVisible(false);
          setSelectedCommitment(null);
        }}
        onEdit={handleOpenEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 16,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  monthTitleBox: {
    flex: 1,
  },
  monthTitleText: {
    color: COLORS.onSurface,
  },
  monthNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  todayBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(138, 79, 255, 0.16)',
  },
  todayBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  todayBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  calendarCard: {
    padding: 12,
    borderRadius: 20,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayHeaderText: {
    color: COLORS.outline,
    fontSize: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 42,
  },
  dayCell: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 1,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(138, 79, 255, 0.08)',
  },
  dayCellSelected: {
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  dayNumberText: {
    color: COLORS.onSurface,
    fontSize: 13,
  },
  dayNumberTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  commitmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  commitmentDotPending: {
    backgroundColor: COLORS.primary,
  },
  commitmentDotPendingSelected: {
    backgroundColor: '#FFFFFF',
  },
  commitmentDotCompleted: {
    backgroundColor: COLORS.cashflowIncome,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitleCol: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
  },
  sectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  mainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainSectionTitle: {
    color: COLORS.onSurface,
  },
  mainSectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  actionBtnWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  emptyDayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
    borderRadius: 16,
  },
  emptyDayTitle: {
    color: COLORS.outline,
    textAlign: 'center',
  },
  emptyDayActionLink: {
    paddingVertical: 4,
  },
  emptyDayActionText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  commitmentsList: {
    gap: 10,
  },
  commitmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    gap: 12,
  },
  commitmentCardCompleted: {
    opacity: 0.65,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  commitmentCardCancelled: {
    opacity: 0.5,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.bordeContornoVariante,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleCompleted: {
    backgroundColor: COLORS.cashflowIncome,
    borderColor: COLORS.cashflowIncome,
  },
  checkboxCircleCancelled: {
    borderColor: COLORS.cashflowExpense,
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
  },
  commitmentCardContent: {
    flex: 1,
    gap: 4,
  },
  commitmentCardTitle: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: COLORS.onSurfaceVariant,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  chipPillText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
  },
  chipPillMonthly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(138, 79, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(209, 188, 255, 0.22)',
  },
  chipPillMonthlyText: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '600',
  },
  upcomingSection: {
    gap: 10,
    paddingTop: 8,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTitle: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  upcomingList: {
    gap: 8,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    gap: 12,
  },
  upcomingDateBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  upcomingDateDay: {
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 16,
  },
  upcomingDateMonth: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  upcomingContent: {
    flex: 1,
    gap: 2,
  },
  upcomingTitleText: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  upcomingTimeText: {
    color: COLORS.outline,
    fontSize: 11,
  },
});
