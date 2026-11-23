import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS } from '@/compartido/tema';
import { FormatoProducto } from '@/datos/tipos';
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

export interface PropiedadesEditorFormatosProducto {
  formatos: FormatoProducto[];
  onChangeFormatos: (formatos: FormatoProducto[]) => void;
  tipoCambio?: number;
}

export const EditorFormatosProducto: React.FC<PropiedadesEditorFormatosProducto> = ({
  formatos,
  onChangeFormatos,
}) => {
  const [nombreFormato, setNombreFormato] = useState('');
  const [precioTexto, setPrecioTexto] = useState('');
  const [costoTexto, setCostoTexto] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleAgregarFormato = () => {
    const nombre = nombreFormato.trim();
    if (!nombre) {
      triggerError();
      Alert.alert('Nombre requerido', 'Ingresa el nombre o variante del formato/tarifa (ej: Básico, Estándar, Premium).');
      return;
    }

    if (formatos.some(f => f.name.toLowerCase() === nombre.toLowerCase())) {
      triggerError();
      Alert.alert('Formato duplicado', `Ya existe un formato con el nombre "${nombre}".`);
      return;
    }

    const salePrice = precioTexto ? convertirMontoACentavos(precioTexto) : 0;
    const costPrice = costoTexto ? convertirMontoACentavos(costoTexto) : 0;
    const grossProfit = salePrice - costPrice;
    const grossMarginPercent = salePrice > 0 ? (grossProfit / salePrice) * 100 : null;

    const nuevoFormato: FormatoProducto = {
      id: 'fmt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: nombre,
      salePrice,
      costPrice,
      grossProfit,
      grossMarginPercent,
    };

    triggerSuccess();
    onChangeFormatos([...formatos, nuevoFormato]);
    setNombreFormato('');
    setPrecioTexto('');
    setCostoTexto('');
    setMostrarFormulario(false);
  };

  const handleEliminarFormato = (id: string) => {
    triggerSelection();
    onChangeFormatos(formatos.filter(f => f.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="tune" size={16} color="#00D2FF" />
          <Text style={styles.sectionTitle}>Formatos y Tarifas ({formatos.length})</Text>
        </View>

        <View style={styles.headerActions}>
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
              {mostrarFormulario ? 'Cerrar' : '+ Formato'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHint}>
        Agrega variantes o tarifas personalizadas para este servicio con su precio de venta y costo individual.
      </Text>

      {/* Formulario para agregar nuevo formato */}
      {mostrarFormulario && (
        <View style={styles.addFormBox}>
          <Text style={styles.addFormTitle}>Nueva variante / tarifa</Text>

          <View style={styles.inputRow}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.miniLabel}>Nombre o detalle</Text>
              <TextInput
                value={nombreFormato}
                onChangeText={setNombreFormato}
                placeholder="ej: Básico, 1 hora, etc."
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                style={styles.inputMini}
                autoFocus
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Precio venta</Text>
              <TextInput
                value={precioTexto}
                onChangeText={val => setPrecioTexto(formatearEntradaDinero(val))}
                placeholder="$ 0,00"
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                keyboardType="decimal-pad"
                style={styles.inputMini}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Costo base</Text>
              <TextInput
                value={costoTexto}
                onChangeText={val => setCostoTexto(formatearEntradaDinero(val))}
                placeholder="$ 0,00"
                placeholderTextColor={COLORS.onSurfaceVariant + '80'}
                keyboardType="decimal-pad"
                style={styles.inputMini}
              />
            </View>
          </View>

          <View style={styles.addFormActions}>
            <TouchableOpacity
              style={styles.confirmAddBtn}
              onPress={handleAgregarFormato}
              activeOpacity={0.8}
            >
              <MaterialIcons name="check" size={16} color="#06120D" />
              <Text style={styles.confirmAddBtnText}>Guardar formato</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de formatos agregados */}
      {formatos.length > 0 && (
        <View style={styles.formatosList}>
          {formatos.map(fmt => {
            const ganancia = (fmt.salePrice ?? 0) - (fmt.costPrice ?? 0);
            return (
              <View key={fmt.id} style={styles.formatoItem}>
                <View style={styles.formatoInfoCol}>
                  <View style={styles.formatoBadge}>
                    <Text style={styles.formatoName}>{fmt.name}</Text>
                  </View>
                  <View style={styles.preciosRow}>
                    <Text style={styles.precioVenta}>
                      Venta: {formatCurrency(fmt.salePrice)}
                    </Text>
                    {fmt.costPrice > 0 && (
                      <Text style={styles.precioCosto}>
                        • Costo: {formatCurrency(fmt.costPrice)}
                      </Text>
                    )}
                    {fmt.salePrice > 0 && (
                      <Text style={styles.gananciaText}>
                        • Ganancia: {formatCurrency(ganancia)}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleEliminarFormato(fmt.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#FF8A9E" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.22)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#00D2FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addToggleBtnText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHint: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  addFormBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addFormTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '500',
  },
  inputMini: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: COLORS.onSurface,
    fontSize: 12,
  },
  addFormActions: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  confirmAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00D2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  confirmAddBtnText: {
    color: '#06120D',
    fontSize: 12,
    fontWeight: '700',
  },
  formatosList: {
    gap: 6,
    marginTop: 4,
  },
  formatoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  formatoInfoCol: {
    flex: 1,
    gap: 4,
  },
  formatoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatoName: {
    color: '#00D2FF',
    fontSize: 12,
    fontWeight: '700',
  },
  preciosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  precioVenta: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontWeight: '600',
  },
  precioCosto: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  gananciaText: {
    color: '#57F5AB',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 138, 158, 0.1)',
  },
});

