import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Line, Path, Circle } from 'react-native-svg';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { TimelineDataPoint } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';

export interface TrendSplineChartCardProps {
  netSavings: number;
  isSurplus: boolean;
  timelinePoints: TimelineDataPoint[];
}

export const TrendSplineChartCard: React.FC<TrendSplineChartCardProps> = ({
  netSavings,
  isSurplus,
  timelinePoints,
}) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.sectionCaps, TYPOGRAPHY.labelCaps]}>
            TENDENCIA TEMPORAL
          </Text>
          <Text style={[styles.cardTitle, TYPOGRAPHY.headlineSm]}>
            Evolución de tu dinero
          </Text>
        </View>

        <View style={styles.statusBadgeIncome}>
          <Text style={[styles.statusBadgeText, TYPOGRAPHY.labelCaps, { color: COLORS.cashflowIncome }]}>
            {isSurplus ? 'Ritmo positivo' : 'En equilibrio'}
          </Text>
        </View>
      </View>

      <View style={styles.heroAccumulatedRow}>
        <Text
          style={[
            styles.heroAccumulatedAmount,
            TYPOGRAPHY.displayHeroMobile,
            { color: isSurplus ? COLORS.onSurface : COLORS.cashflowExpense },
          ]}
        >
          {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
        </Text>
        <Text
          style={[
            styles.heroAccumulatedSub,
            TYPOGRAPHY.bodySm,
            { color: isSurplus ? COLORS.cashflowIncome : COLORS.cashflowExpense },
          ]}
        >
          acumulados en este período
        </Text>
      </View>

      {/* SVG CURVE CHART */}
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={120} viewBox="0 0 320 120" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="balanceGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#00D2FF" stopOpacity="0.35" />
              <Stop offset="65%" stopColor="#8A4FFF" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#8A4FFF" stopOpacity="0.0" />
            </LinearGradient>
            <LinearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#00D2FF" />
              <Stop offset="60%" stopColor="#55D8E9" />
              <Stop offset="100%" stopColor="#D1BCFF" />
            </LinearGradient>
          </Defs>

          {/* Dashed Horizontal Guides */}
          <Line x1="0" y1="20" x2="320" y2="20" stroke="#313536" strokeDasharray="3, 3" strokeOpacity="0.4" />
          <Line x1="0" y1="65" x2="320" y2="65" stroke="#313536" strokeDasharray="3, 3" strokeOpacity="0.4" />
          <Line x1="0" y1="110" x2="320" y2="110" stroke="#313536" strokeDasharray="3, 3" strokeOpacity="0.4" />

          {/* Area under curve */}
          <Path
            d="M 0,95 Q 40,88 80,82 T 160,52 T 240,32 T 320,12 L 320,120 L 0,120 Z"
            fill="url(#balanceGlow)"
          />

          {/* Trend Spline Stroke */}
          <Path
            d="M 0,95 Q 40,88 80,82 T 160,52 T 240,32 T 320,12"
            fill="none"
            stroke="url(#strokeGradient)"
            strokeLinecap="round"
            strokeWidth={3}
          />

          {/* Highlight Marker Circles */}
          <Circle cx="12" cy="94" r="4" fill="#101415" stroke="#00D2FF" strokeWidth="2.5" />
          <Circle cx="160" cy="52" r="4.5" fill="#101415" stroke="#55D8E9" strokeWidth="2.5" />
          <Circle cx="308" cy="14" r="5.5" fill="#8A4FFF" stroke="#D1BCFF" strokeWidth="2.5" />
        </Svg>

        {/* Labels under chart points */}
        {timelinePoints.length >= 3 && (
          <View style={styles.chartLabelsRow}>
            <View style={styles.chartLabelItem}>
              <Text style={[styles.chartPointVal, TYPOGRAPHY.labelCaps]}>
                {timelinePoints[0].displayAmount}
              </Text>
              <Text style={[styles.chartPointDate, TYPOGRAPHY.labelCaps]}>
                {timelinePoints[0].label}
              </Text>
            </View>

            <View style={[styles.chartLabelItem, { alignItems: 'center' }]}>
              <Text style={[styles.chartPointVal, TYPOGRAPHY.labelCaps]}>
                {timelinePoints[1].displayAmount}
              </Text>
              <Text style={[styles.chartPointDate, TYPOGRAPHY.labelCaps]}>
                {timelinePoints[1].label}
              </Text>
            </View>

            <View style={[styles.chartLabelItem, { alignItems: 'flex-end' }]}>
              <Text style={[styles.chartPointValToday, TYPOGRAPHY.labelCaps]}>
                {timelinePoints[2].displayAmount}
              </Text>
              <Text style={[styles.chartPointDateToday, TYPOGRAPHY.labelCaps]}>
                {timelinePoints[2].label}
              </Text>
            </View>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 28, 29, 0.95)',
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionCaps: {
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: COLORS.onSurface,
    marginTop: 2,
  },
  statusBadgeIncome: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
  },
  statusBadgeText: {
    fontSize: 10,
  },
  heroAccumulatedRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  heroAccumulatedAmount: {
    fontWeight: '700',
  },
  heroAccumulatedSub: {
    marginTop: 2,
  },
  chartWrapper: {
    marginTop: 4,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  chartLabelItem: {
    gap: 2,
  },
  chartPointVal: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  chartPointDate: {
    color: COLORS.outline,
    fontSize: 9,
  },
  chartPointValToday: {
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: 10,
  },
  chartPointDateToday: {
    color: COLORS.secondary,
    fontSize: 9,
  },
});
