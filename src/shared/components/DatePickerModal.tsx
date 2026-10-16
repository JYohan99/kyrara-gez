import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import {
  MONTH_NAMES,
  DAY_NAMES_SHORT,
  isSameDay,
  isToday,
  isYesterday,
  getDaysInMonth,
  getFirstDayOfMonthIndex,
  createSafeDate,
} from '@/shared/utils/date';
import { triggerSelection, triggerImpactLight } from '@/shared/utils/haptics';

export interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [tempDate, setTempDate] = useState<Date>(selectedDate);

  if (!visible) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayOfMonthIndex(viewYear, viewMonth);

  const handlePrevMonth = () => {
    triggerSelection();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    triggerSelection();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    triggerSelection();
    const newDate = createSafeDate(viewYear, viewMonth, day);
    setTempDate(newDate);
  };

  const handleQuickToday = () => {
    triggerSelection();
    const now = new Date();
    setTempDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleQuickYesterday = () => {
    triggerSelection();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const safeYesterday = createSafeDate(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
    setTempDate(safeYesterday);
    setViewYear(safeYesterday.getFullYear());
    setViewMonth(safeYesterday.getMonth());
  };

  const handleConfirm = () => {
    triggerImpactLight();
    onSelectDate(tempDate);
    onClose();
  };

  // Generar celdas de días
  const dayCells = [];
  // Espacios vacíos antes del 1er día del mes
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<View key={`empty-${i}`} style={styles.dayCellEmpty} />);
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(viewYear, viewMonth, day);
    const isSelected = isSameDay(cellDate, tempDate);
    const isCurrentDay = isSameDay(cellDate, today);

    dayCells.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={[
          styles.dayCell,
          isCurrentDay && !isSelected && styles.dayCellToday,
          isSelected && styles.dayCellSelected,
        ]}
        onPress={() => handleSelectDay(day)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayCellText,
            isCurrentDay && !isSelected && styles.dayCellTodayText,
            isSelected && styles.dayCellSelectedText,
          ]}
        >
          {day}
        </Text>
        {isCurrentDay && !isSelected && <View style={styles.todayDot} />}
      </TouchableOpacity>
    );
  }

  const isTempToday = isToday(tempDate);
  const isTempYesterday = isYesterday(tempDate);

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.calendarCard}>
        {/* Header con título y botón cerrar */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <MaterialIcons name="calendar-month" size={20} color={COLORS.primary} />
            <Text style={[styles.title, TYPOGRAPHY.labelCaps]}>Fecha de Operación</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Atajos rápidos (Hoy / Ayer) */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={[styles.shortcutChip, isTempToday && styles.shortcutChipActive]}
            onPress={handleQuickToday}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.shortcutChipText,
                isTempToday && styles.shortcutChipTextActive,
              ]}
            >
              Hoy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutChip, isTempYesterday && styles.shortcutChipActive]}
            onPress={handleQuickYesterday}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.shortcutChipText,
                isTempYesterday && styles.shortcutChipTextActive,
              ]}
            >
              Ayer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navegación Mes / Año */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-left" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>

          <Text style={[styles.monthNavText, TYPOGRAPHY.headlineSm]}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Encabezados de días de la semana */}
        <View style={styles.weekDaysRow}>
          {DAY_NAMES_SHORT.map((name, idx) => (
            <Text key={`weekday-${idx}`} style={styles.weekDayText}>
              {name}
            </Text>
          ))}
        </View>

        {/* Grilla de días */}
        <View style={styles.gridContainer}>{dayCells}</View>

        {/* Acciones inferiores */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <MaterialIcons name="check" size={18} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shortcutChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shortcutChipActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.25)',
    borderColor: COLORS.primary,
  },
  shortcutChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  shortcutChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 10,
  },
  monthNavText: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    color: COLORS.outline,
    fontSize: 11,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 4,
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(165, 231, 255, 0.08)',
  },
  dayCellText: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '500',
  },
  dayCellTodayText: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  dayCellSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
