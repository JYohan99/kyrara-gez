import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { IconoCategoria } from '@/compartido/componentes/IconoCategoria';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { OrbeGlossy } from '@/compartido/componentes/OrbeGlossy';
import { SelectorSegmentado } from '@/compartido/componentes/SelectorSegmentado';
import { useCategoriasBoveda as useVaultCategories } from '@/datos/hooks';
import { eliminarCategoria as deleteCategory } from '@/datos/consultas/categorias';
import { obtenerDesgloseGastosPorCategoria as getCategoryExpenseBreakdown } from '@/datos/consultas/analiticas';
import { Categoria } from '@/datos/tipos';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { triggerError, triggerSuccess } from '@/compartido/utilidades/hapticos';

export interface PropiedadesPestanaCategorias {
  onNewCategory: (flowType: 'EXPENSE' | 'INCOME') => void;
}

export const PestanaCategorias: React.FC<PropiedadesPestanaCategorias> = () => {
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
    let chosen: Categoria | null = null;
    for (const c of expenses) {
      const amount = categoryBreakdown[c.id] || 0;
      if (amount > max) {
        max = amount;
        chosen = c;
      }
    }
    return chosen || expenses[0] || null;
  }, [allCategories, categoryBreakdown]);

  const handleDelete = (cat: Categoria) => {
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
            } catch (err: any) {
              triggerError();
              Alert.alert('No se puede eliminar', err?.message || 'Tiene transacciones asociadas.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Selector segmentado Gastos / Ingresos */}
      <SelectorSegmentado<'EXPENSE' | 'INCOME'>
        opciones={[
          {
            valor: 'EXPENSE',
            etiqueta: 'Gastos',
            icono: 'trending-down',
            tonoActivo: 'gasto',
            colorIconoInactivo: COLORS.cashflowExpense,
          },
          {
            valor: 'INCOME',
            etiqueta: 'Ingresos',
            icono: 'trending-up',
            tonoActivo: 'ingreso',
            colorIconoInactivo: COLORS.cashflowIncome,
          },
        ]}
        valorSeleccionado={filterType}
        onSeleccionar={setFilterType}
        compacto
      />

      {/* Hero: Categoría más activa este mes (si estamos en Gastos) */}
      {filterType === 'EXPENSE' && mostFrequentCat && (
        <GlassCard style={styles.frequentCard}>
          <View style={styles.frequentHeaderRow}>
            <OrbeGlossy tamano={46} tono="obsidiana">
              <IconoCategoria
                icon={mostFrequentCat.icon}
                size={22}
                color={mostFrequentCat.color}
              />
            </OrbeGlossy>
            <View style={styles.frequentTextCol}>
              <View style={styles.frequentTopRow}>
                <Text style={[styles.frequentCaps, TYPOGRAPHY.labelCaps]}>
                  MAYOR CONSUMO DEL MES
                </Text>
                <Text style={[styles.frequentAmount, TYPOGRAPHY.headlineSm]}>
                  {formatCurrency(categoryBreakdown[mostFrequentCat.id] || 0)}
                </Text>
              </View>
              <Text style={[styles.frequentTitle, TYPOGRAPHY.headlineSm]}>
                {mostFrequentCat.name}
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* 2-Column Grid */}
      <View style={styles.categories2ColGrid}>
        {filteredCategories.map(cat => {
          const spentThisMonth = categoryBreakdown[cat.id] || 0;
          return (
            <GlassCard key={cat.id} variant="surface" style={styles.categoryGridCard}>
              <View style={styles.catCardTop}>
                <OrbeGlossy tamano={40} tono="obsidiana">
                  <IconoCategoria
                    icon={cat.icon}
                    size={20}
                    color={cat.color}
                  />
                </OrbeGlossy>
                {!cat.isSystem && (
                  <TouchableOpacity
                    onPress={() => handleDelete(cat)}
                    style={styles.moreOptionsBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={COLORS.outline} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.catCardBottom}>
                <Text style={[styles.catGridName, TYPOGRAPHY.headlineSm]} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={[styles.catGridAmount, TYPOGRAPHY.bodySm, { color: COLORS.onSurfaceVariant }]}>
                  {filterType === 'EXPENSE'
                    ? (spentThisMonth > 0 ? formatCurrency(spentThisMonth) : 'Sin gastos')
                    : 'Activa'}
                </Text>
              </View>
            </GlassCard>
          );
        })}
      </View>
    </View>
  );
};

export const PestañaCategorias = PestanaCategorias;
export const CategoriesTab = PestanaCategorias;

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  frequentCard: {
    padding: 16,
  },
  frequentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: 10,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
