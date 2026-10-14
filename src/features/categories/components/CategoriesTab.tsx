import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { useVaultCategories } from '@/core/state';
import { deleteCategory, getCategoryExpenseBreakdown } from '@/core/database';
import { Category } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';
import { triggerSelection, triggerError, triggerSuccess } from '@/shared/utils/haptics';

export interface CategoriesTabProps {
  onNewCategory: (flowType: 'EXPENSE' | 'INCOME') => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ onNewCategory }) => {
  const [filterType, setFilterType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  // Categorías reactivas
  const { categories: allCategories } = useVaultCategories();

  // Breakdown de gastos para el mes actual
  const categoryBreakdown = useMemo(() => {
    if (!allCategories) return {};
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const breakdown = getCategoryExpenseBreakdown(start, end);
    const map: Record<string, number> = {};
    breakdown.forEach(b => {
      map[b.categoryId] = b.totalAmount;
    });
    return map;
  }, [allCategories]);

  const filteredCategories = useMemo(() => {
    return allCategories.filter(c => c.flowType === filterType);
  }, [allCategories, filterType]);

  const mostFrequentCat = useMemo(() => {
    const expenses = allCategories.filter(c => c.flowType === 'EXPENSE');
    let max = 0;
    let chosen: Category | null = null;
    for (const c of expenses) {
      const amount = categoryBreakdown[c.id] || 0;
      if (amount > max) {
        max = amount;
        chosen = c;
      }
    }
    return chosen || expenses[0] || null;
  }, [allCategories, categoryBreakdown]);

  const handleDelete = (cat: Category) => {
    if (cat.isSystem) {
      triggerError();
      Alert.alert('Categoría del sistema', 'Las categorías predeterminadas del sistema no pueden eliminarse.');
      return;
    }

    Alert.alert(
      'Eliminar categoría',
      `¿Deseas eliminar "${cat.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              deleteCategory(cat.id);
              triggerSuccess();
            } catch (err) {
              console.error('Error deleting category:', err);
              triggerError();
              Alert.alert('Error', 'No se pudo eliminar la categoría.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.mainSectionTitle, TYPOGRAPHY.headlineLg]}>
            Categorías
          </Text>
          <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
            Organiza tus hábitos de gasto e ingreso
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => {
            triggerSelection();
            onNewCategory(filterType);
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, TYPOGRAPHY.labelCaps]}>
            Nueva
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Toggle: Gastos vs Ingresos */}
      <View style={styles.catTypeToggleContainer}>
        <TouchableOpacity
          style={[
            styles.catTypeBtn,
            filterType === 'EXPENSE' && styles.catTypeBtnActiveExpense,
          ]}
          onPress={() => {
            triggerSelection();
            setFilterType('EXPENSE');
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.catTypeDot,
              { backgroundColor: filterType === 'EXPENSE' ? COLORS.cashflowExpense : 'transparent' },
            ]}
          />
          <Text
            style={[
              styles.catTypeBtnText,
              TYPOGRAPHY.labelCaps,
              filterType === 'EXPENSE' && { color: COLORS.cashflowExpense },
            ]}
          >
            Gastos ({allCategories.filter(c => c.flowType === 'EXPENSE').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.catTypeBtn,
            filterType === 'INCOME' && styles.catTypeBtnActiveIncome,
          ]}
          onPress={() => {
            triggerSelection();
            setFilterType('INCOME');
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.catTypeDot,
              { backgroundColor: filterType === 'INCOME' ? COLORS.cashflowIncome : 'transparent' },
            ]}
          />
          <Text
            style={[
              styles.catTypeBtnText,
              TYPOGRAPHY.labelCaps,
              filterType === 'INCOME' && { color: COLORS.cashflowIncome },
            ]}
          >
            Ingresos ({allCategories.filter(c => c.flowType === 'INCOME').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Most Frequent Banner */}
      {filterType === 'EXPENSE' && mostFrequentCat && (
        <GlassCard style={styles.frequentCard}>
          <View style={styles.frequentIconBox}>
            <MaterialIcons
              name={mostFrequentCat.icon as any || 'restaurant'}
              size={24}
              color={COLORS.cashflowExpense}
            />
          </View>
          <View style={styles.frequentTextCol}>
            <View style={styles.frequentTopRow}>
              <Text style={[styles.frequentCaps, TYPOGRAPHY.labelCaps]}>
                MÁS FRECUENTE
              </Text>
              <Text style={[styles.frequentAmount, TYPOGRAPHY.numericTable]}>
                {formatCurrency(categoryBreakdown[mostFrequentCat.id] || 0, { showDecimals: false })}
              </Text>
            </View>
            <Text style={[styles.frequentTitle, TYPOGRAPHY.headlineSm]}>
              {mostFrequentCat.name}
            </Text>
          </View>
        </GlassCard>
      )}

      {/* Categories 2-Column Grid */}
      <View style={styles.categories2ColGrid}>
        {filteredCategories.map(cat => {
          const totalAmount = categoryBreakdown[cat.id] || 0;

          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryGridCard}
              onLongPress={() => handleDelete(cat)}
              activeOpacity={0.85}
            >
              <View style={styles.catCardTop}>
                <View
                  style={[
                    styles.catGridIconBox,
                    { backgroundColor: `${cat.color || COLORS.primary}25` },
                  ]}
                >
                  <MaterialIcons
                    name={cat.icon as any || 'category'}
                    size={22}
                    color={cat.color || COLORS.primary}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(cat)}
                  style={styles.moreOptionsBtn}
                >
                  <MaterialIcons name="more-vert" size={18} color={COLORS.outline} />
                </TouchableOpacity>
              </View>

              <View style={styles.catCardBottom}>
                <Text style={[styles.catGridName, TYPOGRAPHY.headlineSm]} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text
                  style={[
                    styles.catGridAmount,
                    TYPOGRAPHY.numericTable,
                    { color: cat.flowType === 'INCOME' ? COLORS.cashflowIncome : COLORS.cashflowExpense },
                  ]}
                >
                  {formatCurrency(totalAmount, { showDecimals: false })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  sectionHeaderRow: {
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
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
  },
  actionBtnText: {
    color: '#FFFFFF',
  },
  catTypeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 3,
  },
  catTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  catTypeBtnActiveExpense: {
    backgroundColor: COLORS.surfaceContainer,
  },
  catTypeBtnActiveIncome: {
    backgroundColor: COLORS.surfaceContainer,
  },
  catTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catTypeBtnText: {
    color: COLORS.onSurfaceVariant,
  },
  frequentCard: {
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 138, 158, 0.1)',
  },
  frequentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequentTextCol: {
    flex: 1,
  },
  frequentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frequentCaps: {
    color: COLORS.cashflowExpense,
  },
  frequentAmount: {
    color: COLORS.onSurface,
  },
  frequentTitle: {
    color: COLORS.onSurface,
    marginTop: 2,
  },
  categories2ColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryGridCard: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    gap: 10,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catGridIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOptionsBtn: {
    padding: 4,
  },
  catCardBottom: {
    gap: 2,
  },
  catGridName: {
    color: COLORS.onSurface,
  },
  catGridAmount: {
    marginTop: 2,
  },
});
