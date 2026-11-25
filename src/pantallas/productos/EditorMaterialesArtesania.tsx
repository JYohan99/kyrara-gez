import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { SelectorSegmentado } from '@/compartido/componentes/SelectorSegmentado';
import { MaterialArtesania, Producto } from '@/datos/tipos';
import {
  formatearMoneda as formatCurrency,
  formatearEntradaDinero,
  convertirMontoACentavos,
} from '@/compartido/utilidades/moneda';
import {
  gatillarSeleccion as triggerSelection,
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
} from '@/compartido/utilidades/hapticos';
import { calcularInversionMateriales } from '@/datos/consultas/productos';

export interface PropiedadesEditorMaterialesArtesania {
  materiales: MaterialArtesania[];
  onChangeMateriales: (materiales: MaterialArtesania[]) => void;
  productosCatalogo?: Producto[];
  productoIdExcluir?: string;
}

export const EditorMaterialesArtesania: React.FC<PropiedadesEditorMaterialesArtesania> = ({
  materiales,
  onChangeMateriales,
  productosCatalogo = [],
  productoIdExcluir,
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modo, setModo] = useState<'CATALOGO' | 'MANUAL'>('CATALOGO');

  // Formulario nuevo material
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [nombreManual, setNombreManual] = useState('');
  const [unidadManual, setUnidadManual] = useState('un.');
  const [cantidadTexto, setCantidadTexto] = useState('1');
  const [costoUnitarioTexto, setCostoUnitarioTexto] = useState('');

  // Productos disponibles para usar como insumos (excluyendo el que se está editando)
  const insumosDisponibles = useMemo(() => {
    return productosCatalogo.filter(p => p.id !== productoIdExcluir);
  }, [productosCatalogo, productoIdExcluir]);

  const inversionTotalCentavos = useMemo(() => {
    return calcularInversionMateriales(materiales);
  }, [materiales]);

  const handleSeleccionarProductoCatalogo = (prod: Producto) => {
    triggerSelection();
    setSelectedProductId(prod.id);
    setNombreManual(prod.name);
    setUnidadManual(prod.saleUnit || 'un.');

    // Tomar el costo del producto si tiene, o su precio base
    const costoRef = prod.costPrice && prod.costPrice > 0 ? prod.costPrice : (prod.basePrice || 0);
    if (costoRef > 0) {
      const centavosStr = (costoRef / 100).toFixed(2).replace('.', ',');
      setCostoUnitarioTexto(formatearEntradaDinero(centavosStr));
    }
  };

  const handleAgregarMaterial = () => {
    let finalName = '';
    let finalProductId: string | undefined = undefined;
    let finalUnit = unidadManual.trim() || 'un.';

    if (modo === 'CATALOGO') {
      if (!selectedProductId) {
        triggerError();
        Alert.alert('Selecciona un insumo', 'Por favor, selecciona un producto del catálogo o cambia a modo manual.');
        return;
      }
      const prod = insumosDisponibles.find(p => p.id === selectedProductId);
      if (!prod) {
        triggerError();
        Alert.alert('Insumo no encontrado', 'El producto seleccionado no está disponible.');
        return;
      }
      finalName = prod.name;
      finalProductId = prod.id;
      finalUnit = prod.saleUnit || 'un.';
    } else {
      finalName = nombreManual.trim();
      if (!finalName) {
        triggerError();
        Alert.alert('Nombre requerido', 'Ingresa el nombre del material o insumo (ej: Marco de madera, Vidrio, Pegamento).');
        return;
      }
    }

    const cantidadNum = parseFloat(cantidadTexto.replace(',', '.')) || 0;
    if (cantidadNum <= 0) {
      triggerError();
      Alert.alert('Cantidad requerida', 'Ingresa una cantidad mayor a 0 para este material.');
      return;
    }

    const unitCostCentavos = costoUnitarioTexto ? convertirMontoACentavos(costoUnitarioTexto) : 0;
    if (unitCostCentavos <= 0) {
      triggerError();
      Alert.alert('Costo requerido', 'Ingresa el costo unitario del material para poder calcular la inversión.');
      return;
    }

    const nuevoMaterial: MaterialArtesania = {
      id: 'mat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      productId: finalProductId,
      name: finalName,
      quantity: cantidadNum,
      unitCost: unitCostCentavos,
      unit: finalUnit,
    };

    triggerSuccess();
    onChangeMateriales([...materiales, nuevoMaterial]);

    // Reset formulario
    setSelectedProductId('');
    setNombreManual('');
    setCantidadTexto('1');
    setCostoUnitarioTexto('');
    setUnidadManual('un.');
    setMostrarFormulario(false);
  };

  const handleEliminarMaterial = (id: string) => {
    triggerSelection();
    onChangeMateriales(materiales.filter(m => m.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Cabecera de la Ficha de Materiales */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="palette" size={18} color="#00D2FF" />
          </View>
          <View>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.titularPequeno]}>
              Ficha de Materiales ({materiales.length})
            </Text>

          </View>
        </View>

        <TouchableOpacity
          style={styles.addToggleBtn}
          onPress={() => {
            triggerSelection();
            setMostrarFormulario(!mostrarFormulario);
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name={mostrarFormulario ? 'close' : 'add'} size={16} color="#00D2FF" />
          <Text style={styles.addToggleBtnText}>
            {mostrarFormulario ? 'Cerrar' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Formulario desplegable para agregar nuevo material */}
      {mostrarFormulario && (
        <View style={styles.formCard}>
          <Text style={[styles.formTitle, TYPOGRAPHY.etiquetaMayusculas]}>
            Nuevo Material / Insumo
          </Text>

          {/* Selector de modo: Catálogo vs Manual */}
          <SelectorSegmentado<'CATALOGO' | 'MANUAL'>
            opciones={[
              { valor: 'CATALOGO', etiqueta: 'Del Catálogo', icono: 'inventory', tonoActivo: 'cian' },
              { valor: 'MANUAL', etiqueta: 'Ingreso Manual', icono: 'edit', tonoActivo: 'violeta' },
            ]}
            valorSeleccionado={modo}
            onSeleccionar={setModo}
            compacto
            style={{ marginBottom: 12 }}
          />

          {modo === 'CATALOGO' ? (
            <View style={styles.catalogSelectContainer}>
              <Text style={styles.fieldLabel}>Selecciona el producto del inventario:</Text>
              {insumosDisponibles.length === 0 ? (
                <Text style={styles.emptyCatalogNotice}>
                  No hay productos activos en el catálogo para usar como insumo. Usa la opción &quot;Ingreso Manual&quot;.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogChipsScroll}>
                  {insumosDisponibles.map(prod => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[styles.productChip, isSelected && styles.productChipActive]}
                        onPress={() => handleSeleccionarProductoCatalogo(prod)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.productChipText, isSelected && styles.productChipTextActive]}>
                          {prod.name}
                        </Text>
                        <Text style={[styles.productChipSub, isSelected && styles.productChipSubActive]}>
                          Stock: {prod.currentStock} {prod.saleUnit}s
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.manualInputsRow}>
              <View style={[styles.fieldCol, { flex: 2 }]}>
                <Text style={styles.fieldLabel}>Nombre del material</Text>
                <TextInput
                  value={nombreManual}
                  onChangeText={setNombreManual}
                  placeholder="ej. Marco, Madera, Vidrio"
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  style={styles.input}
                />
              </View>
              <View style={[styles.fieldCol, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Unidad</Text>
                <TextInput
                  value={unidadManual}
                  onChangeText={setUnidadManual}
                  placeholder="un., cm, etc."
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  style={styles.input}
                />
              </View>
            </View>
          )}

          {/* Fila: Cantidad y Costo Unitario */}
          <View style={styles.numbersRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Cantidad requerida</Text>
              <TextInput
                value={cantidadTexto}
                onChangeText={val => setCantidadTexto(val.replace(/[^0-9.,]/g, ''))}
                placeholder="1"
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Costo unitario</Text>
              <View style={styles.moneyInputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  value={costoUnitarioTexto}
                  onChangeText={val => setCostoUnitarioTexto(formatearEntradaDinero(val))}
                  placeholder="0,00"
                  placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.moneyInput]}
                />
              </View>
            </View>
          </View>

          {/* Subtotal preview */}
          {cantidadTexto && costoUnitarioTexto ? (
            <View style={styles.subtotalPreviewRow}>
              <Text style={styles.subtotalPreviewLabel}>Subtotal de este material:</Text>
              <Text style={styles.subtotalPreviewValue}>
                {formatCurrency(
                  Math.round(
                    (parseFloat(cantidadTexto.replace(',', '.')) || 0) *
                    convertirMontoACentavos(costoUnitarioTexto)
                  )
                )}
              </Text>
            </View>
          ) : null}

          {/* Botón Guardar en Lista */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAgregarMaterial}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-circle-outline" size={18} color="#06120D" />
            <Text style={styles.submitBtnText}>Agregar Material a la Lista</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Materiales Configurados */}
      {materiales.length > 0 && (
        <View style={styles.materialsList}>
          {materiales.map((m, index) => {
            const subtotal = Math.round((m.quantity || 1) * (m.unitCost || 0));
            return (
              <View key={m.id || index} style={styles.materialCard}>
                <View style={styles.materialMain}>
                  <View style={styles.materialNameRow}>
                    <Text style={[styles.materialName, TYPOGRAPHY.cuerpoMedio]}>
                      {m.name}
                    </Text>
                    {m.productId ? (
                      <View style={styles.catalogTag}>
                        <MaterialIcons name="link" size={11} color="#00D2FF" />
                        <Text style={styles.catalogTagText}>Inventariado</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.materialDetail}>
                    {m.quantity} {m.unit || 'un.'} × {formatCurrency(m.unitCost)} c/u
                  </Text>
                </View>

                <View style={styles.materialRight}>
                  <Text style={styles.materialSubtotal}>
                    {formatCurrency(subtotal)}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleEliminarMaterial(m.id)}
                    activeOpacity={0.6}
                    accessibilityLabel={`Eliminar material ${m.name}`}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.sectionSubtitle}>Total: </Text>
        <Text style={styles.investmentValue}>
          {formatCurrency(inversionTotalCentavos)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111A16',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#00D2FF',
    fontWeight: '700',
  },

  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
  },
  addToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D2FF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
  },
  investmentValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00D2FF',
  },
  formCard: {
    backgroundColor: '#16221E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formTitle: {
    fontSize: 11,
    color: '#00D2FF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  catalogSelectContainer: {
    marginBottom: 12,
  },
  catalogChipsScroll: {
    marginTop: 6,
  },
  productChip: {
    backgroundColor: '#1E2C26',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  productChipActive: {
    backgroundColor: 'rgba(0, 210, 255, 0.2)',
    borderColor: '#00D2FF',
  },
  productChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0EAE5',
  },
  productChipTextActive: {
    color: '#00D2FF',
  },
  productChipSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  productChipSubActive: {
    color: '#80E8FF',
  },
  emptyCatalogNotice: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 6,
  },
  manualInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0D1512',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  moneyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1512',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
  },
  currencySymbol: {
    fontSize: 14,
    color: '#00D2FF',
    fontWeight: '700',
    marginRight: 4,
  },
  moneyInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  subtotalPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  subtotalPreviewLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  subtotalPreviewValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00D2FF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00D2FF',
    borderRadius: 8,
    paddingVertical: 10,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#06120D',
  },
  materialsList: {
    gap: 8,
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16221E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  materialMain: {
    flex: 1,
    marginRight: 10,
  },
  materialNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  materialName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  catalogTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catalogTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00D2FF',
  },
  materialDetail: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  materialRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtn: {
    padding: 4,
  },
});
