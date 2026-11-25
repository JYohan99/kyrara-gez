import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS } from '@/compartido/tema';
import { useCategoriasBoveda } from '@/datos/hooks';
import { obtenerGrupoCategoria, ORDEN_GRUPOS } from '@/datos/consultas/categorias';
import { Categoria, TipoFlujo } from '@/datos/tipos';
import { triggerSelection } from '@/compartido/utilidades/hapticos';
import { IconoCategoria } from '@/compartido/componentes/IconoCategoria';
import { BarraBusqueda } from '@/compartido/componentes/BarraBusqueda';
import { SelectorSegmentado } from '@/compartido/componentes/SelectorSegmentado';
import { EncabezadoModal } from '@/compartido/componentes/EncabezadoModal';

export interface PropiedadesModalSelectorCategorias {
  visible: boolean;
  onClose: () => void;
  modo: 'SELECCION' | 'GESTION';
  // Props para modo 'SELECCION' (Nuevo Movimiento)
  categoriaSeleccionadaId?: string;
  onSeleccionarCategoria?: (id: string) => void;
  // Props opcionales / compartidas
  tipoFlujoInicial?: TipoFlujo;
}

export const ModalSelectorCategorias: React.FC<PropiedadesModalSelectorCategorias> = ({
  visible,
  onClose,
  modo,
  categoriaSeleccionadaId,
  onSeleccionarCategoria,
  tipoFlujoInicial = 'EXPENSE',
}) => {
  const [tipoFlujo, setTipoFlujo] = useState<'EXPENSE' | 'INCOME'>(
    tipoFlujoInicial === 'INCOME' ? 'INCOME' : 'EXPENSE'
  );
  const [busqueda, setBusqueda] = useState('');

  // En modo GESTIÓN necesitamos todas (incluso inactivas); en SELECCIÓN solo las activas
  const {
    categories: categoriasActivas,
    allCategories,
    frequencyMap,
    toggleCategoryActive,
    setAllCategoriesActive,
    toggleGroupActive,
  } = useCategoriasBoveda(tipoFlujo, modo === 'SELECCION');

  const listaBase = modo === 'GESTION' ? allCategories : categoriasActivas;

  // Filtrado de búsqueda
  const categoriasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return listaBase;
    const q = busqueda.trim().toLowerCase();
    return listaBase.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        obtenerGrupoCategoria(c.name).toLowerCase().includes(q)
    );
  }, [listaBase, busqueda]);

  // Agrupación por dominio / temática
  const grupos = useMemo(() => {
    const mapa = new Map<string, Categoria[]>();

    // En modo selección sin búsqueda: destacar las más usadas si tienen historial
    if (modo === 'SELECCION' && !busqueda.trim()) {
      const frecuentes = listaBase
        .filter(c => (frequencyMap[c.id] || 0) > 0)
        .slice(0, 6);
      if (frecuentes.length > 0) {
        mapa.set('★ Más Usadas', frecuentes);
      }
    }

    for (const cat of categoriasFiltradas) {
      const g = obtenerGrupoCategoria(cat.name);
      if (!mapa.has(g)) {
        mapa.set(g, []);
      }
      mapa.get(g)!.push(cat);
    }

    const resultado = Array.from(mapa.entries()).map(([nombre, items]) => ({
      nombre,
      items,
      todasActivas: items.every(i => i.isActive !== false),
    }));

    // Ordenar los grupos según el orden explícito de ORDEN_GRUPOS (★ Más Usadas siempre al inicio)
    resultado.sort((a, b) => {
      if (a.nombre === '★ Más Usadas') return -1;
      if (b.nombre === '★ Más Usadas') return 1;
      const idxA = ORDEN_GRUPOS.indexOf(a.nombre);
      const idxB = ORDEN_GRUPOS.indexOf(b.nombre);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.nombre.localeCompare(b.nombre);
    });

    return resultado;
  }, [categoriasFiltradas, listaBase, frequencyMap, busqueda, modo]);

  const activasCount = useMemo(() => {
    return allCategories.filter(c => c.isActive !== false).length;
  }, [allCategories]);

  const handleCardPress = (cat: Categoria) => {
    triggerSelection();
    if (modo === 'SELECCION') {
      if (onSeleccionarCategoria) {
        onSeleccionarCategoria(cat.id);
      }
      onClose();
    } else {
      const currentActive = cat.isActive !== false;
      toggleCategoryActive(cat.id, !currentActive);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetCard}>
          {/* Encabezado glossy 3D */}
          <EncabezadoModal
            titulo={modo === 'GESTION' ? 'Mis Categorías Visibles' : 'Todas las categorías'}
            subtitulo={
              modo === 'GESTION'
                ? `${activasCount} de ${allCategories.length} activas en ${tipoFlujo === 'EXPENSE' ? 'Gastos' : 'Ingresos'}`
                : 'Toca una categoría para seleccionarla en el movimiento'
            }
            icono={modo === 'GESTION' ? 'tune' : 'category'}
            tono="cian"
            onCerrar={onClose}
            mostrarManija={false}
          />

          {/* En modo GESTIÓN: Selector de Gastos / Ingresos */}
          {modo === 'GESTION' && (
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
              valorSeleccionado={tipoFlujo === 'INCOME' ? 'INCOME' : 'EXPENSE'}
              onSeleccionar={setTipoFlujo}
              compacto
              style={{ marginBottom: 12 }}
            />
          )}

          {/* Barra de Búsqueda y Acciones Rápidas */}
          <View style={styles.toolbar}>
            <BarraBusqueda
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por nombre o grupo..."
            />

            {modo === 'GESTION' && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    triggerSelection();
                    setAllCategoriesActive(tipoFlujo, true);
                  }}
                >
                  <Text style={styles.quickActionBtnText}>Activar todas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    triggerSelection();
                    setAllCategoriesActive(tipoFlujo, false);
                  }}
                >
                  <Text style={styles.quickActionBtnText}>Desactivar todas</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Lista de Secciones y Cuadrícula en 2 Columnas */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
          >
            {grupos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={32} color={COLORS.onSurfaceVariant} />
                <Text style={styles.emptyText}>
                  No se encontraron categorías para &quot;{busqueda}&quot;
                </Text>
              </View>
            ) : (
              grupos.map(grupo => (
                <View key={grupo.nombre} style={styles.groupSection}>
                  <View style={styles.groupHeaderRow}>
                    <Text style={styles.groupTitle}>{grupo.nombre}</Text>

                    {/* Botón para activar/desactivar grupo completo en Ajustes */}
                    {modo === 'GESTION' && (
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
                    )}
                  </View>

                  {/* Cuadrícula idéntica en 2 columnas */}
                  <View style={styles.twoColumnGrid}>
                    {grupo.items.map(cat => {
                      const isSelected = modo === 'SELECCION' && categoriaSeleccionadaId === cat.id;
                      const isActive = cat.isActive !== false;

                      return (
                        <TouchableOpacity
                          key={grupo.nombre + '_' + cat.id}
                          style={[
                            styles.gridCard,
                            isSelected && {
                              borderColor: cat.color,
                              backgroundColor: `${cat.color}24`,
                            },
                            modo === 'GESTION' && isActive && {
                              borderColor: `${cat.color}50`,
                              backgroundColor: `${cat.color}15`,
                            },
                            modo === 'GESTION' && !isActive && styles.gridCardInactive,
                          ]}
                          onPress={() => handleCardPress(cat)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.iconBox,
                              {
                                backgroundColor: isActive ? `${cat.color}25` : 'rgba(255, 255, 255, 0.04)',
                                borderColor: isActive ? `${cat.color}40` : 'transparent',
                              },
                            ]}
                          >
                            <IconoCategoria
                              icon={cat.icon}
                              size={16}
                              color={isActive ? cat.color : COLORS.onSurfaceVariant + '60'}
                            />
                          </View>

                          <Text
                            style={[
                              styles.cardText,
                              isSelected && { color: '#FFFFFF', fontWeight: '700' },
                              modo === 'GESTION' && !isActive && styles.cardTextInactive,
                            ]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>

                          {modo === 'SELECCION' && isSelected && (
                            <MaterialIcons name="check" size={15} color={cat.color} />
                          )}

                          {modo === 'GESTION' && (
                            <MaterialIcons
                              name={isActive ? 'check-circle' : 'radio-button-unchecked'}
                              size={16}
                              color={isActive ? COLORS.secondary : COLORS.onSurfaceVariant + '60'}
                            />
                          )}
                        </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  sheetCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#14181A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolbar: {
    marginTop: 12,
    marginBottom: 6,
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  quickActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
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
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  groupTitle: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  groupToggleBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  groupToggleBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1F22',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: '47%',
    flex: 1,
  },
  gridCardInactive: {
    opacity: 0.45,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'transparent',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  cardTextInactive: {
    color: COLORS.onSurfaceVariant + '80',
    textDecorationLine: 'line-through',
  },
});
