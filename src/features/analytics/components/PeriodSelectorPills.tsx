import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { triggerSelection } from '@/shared/utils/haptics';

export type PeriodOption = 'THIS_MONTH' | 'PREV_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'ALL_YEAR';

export interface PeriodSelectorPillsProps {
  selectedPeriod: PeriodOption;
  onSelectPeriod: (p: PeriodOption) => void;
}

const PERIOD_PILLS: { key: PeriodOption; label: string; showPulse?: boolean }[] = [
  { key: 'THIS_MONTH', label: 'Este mes', showPulse: true },
  { key: 'PREV_MONTH', label: 'Mes anterior' },
  { key: 'LAST_3_MONTHS', label: 'Últimos 3 meses' },
  { key: 'LAST_6_MONTHS', label: 'Últimos 6 meses' },
  { key: 'ALL_YEAR', label: 'Todo el año' },
];

export const PeriodSelectorPills: React.FC<PeriodSelectorPillsProps> = ({
  selectedPeriod,
  onSelectPeriod,
}) => {
  return (
    <View style={styles.pillsScrollContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScrollContent}
      >
        {PERIOD_PILLS.map(p => {
          const isActive = selectedPeriod === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodPill, isActive && styles.periodPillActive]}
              onPress={() => {
                triggerSelection();
                onSelectPeriod(p.key);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodPillLabel,
                  TYPOGRAPHY.labelCaps,
                  isActive && styles.periodPillLabelActive,
                ]}
              >
                {p.label}
              </Text>
              {isActive && p.showPulse && <View style={styles.pulseDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pillsScrollContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  periodPillActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  periodPillLabel: {
    color: COLORS.onSurfaceVariant,
  },
  periodPillLabelActive: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cashflowIncome,
  },
});
