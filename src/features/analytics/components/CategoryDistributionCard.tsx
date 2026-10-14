import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { CategorySpendBreakdown } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';

export interface CategoryDistributionCardProps {
  categories: CategorySpendBreakdown[];
}

export const CategoryDistributionCard: React.FC<CategoryDistributionCardProps> = ({
  categories,
}) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={[styles.sectionCaps, TYPOGRAPHY.labelCaps]}>
            DISTRIBUCIÓN
          </Text>
          <Text style={[styles.cardTitle, TYPOGRAPHY.headlineSm]}>
            ¿En qué se fue el dinero?
          </Text>
        </View>
        <Text style={[styles.countText, TYPOGRAPHY.labelCaps]}>
          {categories.length} categorías
        </Text>
      </View>

      {/* Segmented Multi-Category Bar */}
      {categories.length > 0 ? (
        <View style={styles.segmentedBarTrack}>
          {categories.map((c, i) => (
            <View
              key={c.categoryId || i}
              style={[
                styles.segmentPiece,
                {
                  width: `${Math.max(2, c.percent)}%`,
                  backgroundColor: c.categoryColor || COLORS.primary,
                },
              ]}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCatBar}>
          <Text style={[styles.emptyBarText, TYPOGRAPHY.bodySm]}>
            No hay gastos registrados en este período.
          </Text>
        </View>
      )}

      {/* Interactive Category List */}
      <View style={styles.categoryItemList}>
        {categories.map(c => (
          <View key={c.categoryId} style={styles.categoryRowItem}>
            <View style={styles.catLeftInfo}>
              <View
                style={[
                  styles.catIconSquare,
                  { backgroundColor: `${c.categoryColor}25` },
                ]}
              >
                <MaterialIcons
                  name={c.categoryIcon as any || 'category'}
                  size={18}
                  color={c.categoryColor || COLORS.primary}
                />
              </View>
              <View style={styles.catTextCol}>
                <Text style={[styles.catNameText, TYPOGRAPHY.bodyMd]}>
                  {c.categoryName}
                </Text>
                <Text style={[styles.catPercentSubtext, TYPOGRAPHY.bodySm]}>
                  {c.percent}% del total
                </Text>
              </View>
            </View>

            <View style={styles.catRightCol}>
              <Text style={[styles.catAmountText, TYPOGRAPHY.numericTable]}>
                {formatCurrency(c.totalAmount, { showDecimals: false })}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color={COLORS.outline} />
            </View>
          </View>
        ))}
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
  countText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  segmentedBarTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segmentPiece: {
    height: '100%',
  },
  emptyCatBar: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyBarText: {
    color: COLORS.onSurfaceVariant,
  },
  categoryItemList: {
    gap: 12,
    paddingTop: 4,
  },
  categoryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTextCol: {
    flex: 1,
  },
  catNameText: {
    color: COLORS.onSurface,
  },
  catPercentSubtext: {
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  catRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catAmountText: {
    color: COLORS.onSurface,
  },
});
