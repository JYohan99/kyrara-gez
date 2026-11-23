import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { useCategoriasBoveda } from '@/datos/hooks';
import { obtenerGrupoCategoria } from '@/datos/consultas/categorias';
import { Categoria } from '@/datos/tipos';
import { triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalGestionCategorias {
  visible: boolean;
  onClose: () => void;
}

export const ModalGestionCategorias: React.FC<PropiedadesModalGestionCategorias> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [flowFilter, setFlowFilter] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [busqueda, setBusqueda] = useState('');

  // Obtenemos todas las categorías (incluso las desactivadas) para poder activarlas
  const {
    allCategories,
    toggleCategoryActive,
    setAllCategoriesActive,
    toggleGroupActive,
  } = useCategoriasBoveda(flowFilter, false);

  // Filtrado por búsqueda
  const categoriasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return allCategories;
    const q = busqueda.trim().toLowerCase();
    return allCategories.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        obtenerGrupoCategoria(c.name).toLowerCase().includes(q)
    );
  }, [allCategories, busqueda]);

  // Agrupación por dominio / área
  const grupos = useMemo(() => {
    const mapa = new Map<string, Categoria[]>();
    for (const cat of categoriasFiltradas) {
      const grupo = obtenerGrupoCategoria(cat.name);
      if (!mapa.has(grupo)) {
        mapa.set(grupo, []);
      }
      mapa.get(grupo)!.push(cat);
    }
    return Array.from(mapa.entries()).map(([nombre, items]) => ({
      nombre,
      items,
      todasActivas: items.every(i => i.isActive !== false),
    }));
  }, [categoriasFiltradas]);

  const activasCount = useMemo(() => {
    return allCategories.filter(c => c.isActive !== false).length;
  }, [allCategories]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons name="tune" size={22} color={COLORS.secondary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, TYPOGRAPHY.titularPequeno]}>
                  Mis Categorías Visibles
                </Text>
                <Text style={styles.headerSubtitle}>
                  {activasCount} de {allCategories.length} activas en {flowFilter === 'EXPENSE' ? 'Gastos' : 'Ingresos'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Segmented Control Gastos / Ingresos */}
          <View style={styles.segmentTrack}>
            <TouchableOpacity
              style={[styles.segmentBtn, flowFilter === 'EXPENSE' && styles.segmentBtnActive]}
              onPress={() => {
                triggerSelection();
                setFlowFilter('EXPENSE');
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="trending-down"
                size={16}
                color={flowFilter === 'EXPENSE' ? '#06120D' : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  flowFilter === 'EXPENSE' && styles.segmentBtnTextActive,
                ]}
              >
                Gastos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, flowFilter === 'INCOME' && styles.segmentBtnActive]}
              onPress={() => {
                triggerSelection();
                setFlowFilter('INCOME');
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="trending-up"
                size={16}
                color={flowFilter === 'INCOME' ? '#06120D' : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  flowFilter === 'INCOME' && styles.segmentBtnTextActive,
                ]}
              >
                Ingresos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Buscador y Acciones Rápidas */}
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={COLORS.onSurfaceVariant} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar categoría o grupo..."
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                style={styles.searchInput}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="cancel" size={16} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  triggerSelection();
                  setAllCategoriesActive(flowFilter, true);
                }}
              >
                <Text style={styles.quickActionBtnText}>Activar todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  triggerSelection();
                  setAllCategoriesActive(flowFilter, false);
                }}
              >
                <Text style={styles.quickActionBtnText}>Desactivar todas</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Grupos y Categorías */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
          >
            {grupos.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={32} color={COLORS.onSurfaceVariant} />
                <Text style={styles.emptyStateText}>
                  No se encontraron categorías con &quot;{busqueda}&quot;
                </Text>
              </View>
            ) : (
              grupos.map(grupo => (
                <View key={grupo.nombre} style={styles.groupCard}>
                  {/* Encabezado del grupo con acción rápida */}
                  <View style={styles.groupHeaderRow}>
                    <Text style={styles.groupHeaderTitle}>{grupo.nombre}</Text>
                    <TouchableOpacity
                      style={styles.groupToggleBtn}
                      onPress={() => {
                        triggerSelection();
                        const nombres = grupo.items.map(i => i.name);
                        toggleGroupActive(nombres, !grupo.todasActivas);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.groupToggleBtnText}>
                        {grupo.todasActivas ? 'Desactivar grupo' : 'Activar grupo'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Items del grupo */}
                  <View style={styles.groupItemsContainer}>
                    {grupo.items.map((cat, idx) => {
                      const isActive = cat.isActive !== false;
                      const isLast = idx === grupo.items.length - 1;
                      return (
                        <View
                          key={cat.id}
                          style={[styles.categoryRow, !isLast && styles.categoryRowBorder]}
                        >
                          <View style={styles.categoryLeft}>
                            <View
                              style={[
                                styles.categoryIconBox,
                                {
                                  backgroundColor: isActive ? `${cat.color}20` : 'rgba(255, 255, 255, 0.04)',
                                  borderColor: isActive ? `${cat.color}40` : 'transparent',
                                },
                              ]}
                            >
                              <MaterialIcons
                                name={cat.icon as any || 'category'}
                                size={18}
                                color={isActive ? cat.color : COLORS.onSurfaceVariant + '70'}
                              />
                            </View>
                            <Text
                              style={[
                                styles.categoryName,
                                !isActive && styles.categoryNameInactive,
                              ]}
                              numberOfLines={1}
                            >
                              {cat.name}
                            </Text>
                          </View>

                          <Switch
                            value={isActive}
                            onValueChange={val => {
                              triggerSelection();
                              toggleCategoryActive(cat.id, val);
                            }}
                            trackColor={{
                              false: 'rgba(255, 255, 255, 0.08)',
                              true: 'rgba(87, 245, 171, 0.35)',
                            }}
                            thumbColor={isActive ? COLORS.secondary : '#757575'}
                            style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : undefined}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalCard: {
    flex: 1,
    backgroundColor: '#0F1315',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(87, 245, 171, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#161B1E',
    borderRadius: 14,
    padding: 4,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  segmentBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#06120D',
  },
  toolbar: {
    marginTop: 12,
    marginBottom: 8,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  quickActionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickActionBtnText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
  },
  groupCard: {
    backgroundColor: '#14181A',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  groupHeaderTitle: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  groupToggleBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  groupToggleBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  groupItemsContainer: {
    paddingHorizontal: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  categoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  categoryNameInactive: {
    color: COLORS.onSurfaceVariant + '70',
    textDecorationLine: 'line-through',
  },
});
