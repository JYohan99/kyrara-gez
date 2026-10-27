import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { ModalSelectorFecha as DatePickerModal } from '@/compartido/componentes/ModalSelectorFecha';
import {
  TipoFlujo as FlowType,
  TipoCuenta,
  crearMovimiento as createTransaction,
  Cuenta as Account,
  Categoria as Category,
} from '@/datos';
import {
  useCuentasBoveda as useVaultAccounts,
  useCategoriasBoveda as useVaultCategories,
} from '@/datos/hooks';
import {
  convertirMontoACentavos as parseAmountToCents,
  formatearMoneda as formatCurrency,
  formatearEntradaDinero as formatMoneyInput,
} from '@/compartido/utilidades/moneda';
import {
  formatearFechaAmigable as formatFriendlyDate,
  esHoy as isToday,
  esAyer as isYesterday,
} from '@/compartido/utilidades/fecha';
import {
  vibracionExito as triggerSuccess,
  vibracionError as triggerError,
  vibracionSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';
import { styles } from './FormularioMovimiento.styles';

export interface PropiedadesFormularioMovimiento {
  initialType?: FlowType;
  isScreen?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ==========================================
// UTILIDADES DE ICONOS Y COLORES
// ==========================================

function getAccountIcon(accType?: TipoCuenta): keyof typeof MaterialIcons.glyphMap {
  switch (accType) {
    case 'CASH':
      return 'payments';
    case 'BANK':
      return 'account-balance';
    case 'PREPAID':
      return 'credit-card';
    case 'VAULT':
      return 'savings';
    default:
      return 'account-balance-wallet';
  }
}

function getAccountColor(accType?: TipoCuenta): string {
  switch (accType) {
    case 'CASH':
      return COLORS.cashflowIncome;
    case 'BANK':
      return COLORS.secondaryContainer;
    case 'PREPAID':
      return COLORS.primaryContainer;
    case 'VAULT':
      return COLORS.tertiary;
    default:
      return COLORS.primary;
  }
}

function getActionColor(type: FlowType): string {
  switch (type) {
    case 'EXPENSE':
      return COLORS.cashflowExpense;
    case 'INCOME':
      return COLORS.cashflowIncome;
    case 'TRANSFER':
    default:
      return COLORS.primaryContainer;
  }
}

function getDynamicFontSize(length: number): number {
  if (length <= 7) return 50;
  if (length <= 9) return 42;
  if (length <= 11) return 32;
  if (length <= 14) return 24;
  return 20;
}

// ==========================================
// SUBCOMPONENTE: CURSOR PARPADEANTE NATIVO
// ==========================================

interface PropiedadesCursor {
  visible: boolean;
  height: number;
  color: string;
}

const CursorParpadeante: React.FC<PropiedadesCursor> = React.memo(({ visible, height, color }) => {
  const [animOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!visible) {
      animOpacity.setValue(0);
      return;
    }
    animOpacity.setValue(1);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 90,
          delay: 480,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 90,
          delay: 480,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [visible, animOpacity]);

  return (
    <Animated.View
      style={[
        styles.cursorBar,
        {
          height,
          backgroundColor: color,
          opacity: visible ? animOpacity : 0,
        },
      ]}
    />
  );
});
CursorParpadeante.displayName = 'CursorParpadeante';

// ==========================================
// SUBCOMPONENTE: MODAL SELECTOR DE CUENTAS
// ==========================================

interface PropiedadesModalCuentas {
  visible: boolean;
  title: string;
  accounts: Account[];
  selectedAccountId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ModalSelectorCuentas: React.FC<PropiedadesModalCuentas> = React.memo(
  ({ visible, title, accounts, selectedAccountId, onSelect, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, TYPOGRAPHY.titularPequeno]}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalAccountScroll}>
              {accounts.map(acc => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.accountOptionItem, isSelected && styles.accountOptionItemSelected]}
                    onPress={() => {
                      triggerSelection();
                      onSelect(acc.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.accountOptionIconBox,
                        { backgroundColor: `${getAccountColor(acc.type)}20` },
                      ]}
                    >
                      <MaterialIcons
                        name={getAccountIcon(acc.type)}
                        size={20}
                        color={getAccountColor(acc.type)}
                      />
                    </View>
                    <View style={styles.accountOptionInfo}>
                      <Text style={styles.accountOptionName}>{acc.name}</Text>
                      <Text style={styles.accountOptionBalance}>
                        {formatCurrency(acc.currentBalance)}
                      </Text>
                    </View>
                    {isSelected && <MaterialIcons name="check" size={20} color={COLORS.secondary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
);
ModalSelectorCuentas.displayName = 'ModalSelectorCuentas';

// ==========================================
// SUBCOMPONENTE: MODAL TODAS LAS CATEGORÍAS
// ==========================================

interface PropiedadesModalCategorias {
  visible: boolean;
  categories: Category[];
  selectedCategoryId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ModalSelectorCategorias: React.FC<PropiedadesModalCategorias> = React.memo(
  ({ visible, categories, selectedCategoryId, onSelect, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, TYPOGRAPHY.titularPequeno]}>
                Todas las categorías
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalCategoryScroll}>
              <View style={styles.categoriesGridInModal}>
                {categories.map(cat => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        styles.categoryPillInModal,
                        isSelected && {
                          borderColor: cat.color,
                          backgroundColor: `${cat.color}24`,
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        onSelect(cat.id);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryPillDot, { backgroundColor: cat.color }]} />
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
);
ModalSelectorCategorias.displayName = 'ModalSelectorCategorias';

// ==========================================
// SUBCOMPONENTE: CÁPSULA SELECTORA DE TIPO
// ==========================================

interface PropiedadesSegmentedType {
  type: FlowType;
  onChangeType: (type: FlowType) => void;
}

const ControlSegmentadoTipo: React.FC<PropiedadesSegmentedType> = React.memo(
  ({ type, onChangeType }) => {
    return (
      <View style={styles.segmentedCapsule}>
        {/* Ingreso */}
        <TouchableOpacity
          style={[
            styles.segmentedItem,
            type === 'INCOME' ? styles.segmentedItemActiveIncome : styles.segmentedItemInactive,
          ]}
          onPress={() => onChangeType('INCOME')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="arrow-downward"
            size={16}
            color={type === 'INCOME' ? COLORS.cashflowIncome : COLORS.onSurfaceVariant}
          />
          {type === 'INCOME' && (
            <Text style={[styles.segmentedLabel, { color: COLORS.cashflowIncome }]}>Ingreso</Text>
          )}
        </TouchableOpacity>

        {/* Gasto */}
        <TouchableOpacity
          style={[
            styles.segmentedItem,
            type === 'EXPENSE' ? styles.segmentedItemActiveExpense : styles.segmentedItemInactive,
          ]}
          onPress={() => onChangeType('EXPENSE')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="arrow-upward"
            size={16}
            color={type === 'EXPENSE' ? COLORS.cashflowExpense : COLORS.onSurfaceVariant}
          />
          {type === 'EXPENSE' && (
            <Text style={[styles.segmentedLabel, { color: COLORS.cashflowExpense }]}>Gasto</Text>
          )}
        </TouchableOpacity>

        {/* Traspaso */}
        <TouchableOpacity
          style={[
            styles.segmentedItem,
            type === 'TRANSFER' ? styles.segmentedItemActiveTransfer : styles.segmentedItemInactive,
          ]}
          onPress={() => onChangeType('TRANSFER')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="swap-horiz"
            size={18}
            color={type === 'TRANSFER' ? COLORS.cashflowTransfer : COLORS.onSurfaceVariant}
          />
          {type === 'TRANSFER' && (
            <Text style={[styles.segmentedLabel, { color: COLORS.cashflowTransfer }]}>
              Traspaso
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }
);
ControlSegmentadoTipo.displayName = 'ControlSegmentadoTipo';

// ==========================================
// COMPONENTE PRINCIPAL: FORMULARIO MOVIMIENTO
// ==========================================

export const FormularioMovimiento: React.FC<PropiedadesFormularioMovimiento> = ({
  initialType = 'EXPENSE',
  isScreen = false,
  onSuccess,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const amountInputRef = useRef<TextInput>(null);

  // Estados del formulario
  const [type, setType] = useState<FlowType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Estados de modales
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSourceAccountModalVisible, setIsSourceAccountModalVisible] = useState(false);
  const [isTargetAccountModalVisible, setIsTargetAccountModalVisible] = useState(false);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

  // Hooks reactivos de la bóveda
  const { accounts } = useVaultAccounts();
  const { categories } = useVaultCategories(type === 'TRANSFER' ? 'EXPENSE' : type);

  // Selección manual del usuario
  const [userSelectedSourceAccountId, setUserSelectedSourceAccountId] = useState<string | null>(null);
  const [userSelectedTargetAccountId, setUserSelectedTargetAccountId] = useState<string | null>(null);
  const [userSelectedCategoryId, setUserSelectedCategoryId] = useState<string | null>(null);

  // Derivación optimizada y memoizada de cuentas y categoría activas
  const activeSourceAccount = useMemo(() => {
    if (userSelectedSourceAccountId) {
      const match = accounts.find(a => a.id === userSelectedSourceAccountId);
      if (match) return match;
    }
    return accounts[0] || undefined;
  }, [accounts, userSelectedSourceAccountId]);

  const activeTargetAccount = useMemo(() => {
    if (userSelectedTargetAccountId) {
      const match = accounts.find(a => a.id === userSelectedTargetAccountId);
      if (match) return match;
    }
    return accounts.length > 1 ? accounts[1] : accounts[0] || undefined;
  }, [accounts, userSelectedTargetAccountId]);

  const activeCategory = useMemo(() => {
    if (userSelectedCategoryId) {
      const match = categories.find(c => c.id === userSelectedCategoryId);
      if (match) return match;
    }
    return categories[0] || undefined;
  }, [categories, userSelectedCategoryId]);

  const activeSourceAccountId = activeSourceAccount?.id ?? '';
  const activeTargetAccountId = activeTargetAccount?.id ?? '';
  const activeCategoryId = activeCategory?.id ?? '';

  // Controladores de eventos
  const handleTypeChange = useCallback((newType: FlowType) => {
    triggerSelection();
    setType(newType);
  }, []);

  const handleAmountChange = useCallback((text: string) => {
    const formatted = formatMoneyInput(text);
    setAmountStr(formatted);
  }, []);

  const handleSubmit = useCallback(() => {
    const cents = parseAmountToCents(amountStr);
    if (cents <= 0) {
      triggerError();
      Alert.alert('Monto requerido', 'Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!activeSourceAccountId) {
      triggerError();
      Alert.alert('Cuenta requerida', 'Debes seleccionar una cuenta para la operación.');
      return;
    }

    if (type === 'TRANSFER' && activeSourceAccountId === activeTargetAccountId) {
      triggerError();
      Alert.alert(
        'Transferencia inválida',
        'La cuenta origen y la cuenta destino deben ser diferentes.'
      );
      return;
    }

    setLoading(true);
    try {
      createTransaction({
        amount: cents,
        type,
        sourceAccountId: activeSourceAccountId,
        targetAccountId: type === 'TRANSFER' ? activeTargetAccountId : undefined,
        categoryId: type !== 'TRANSFER' ? activeCategoryId : undefined,
        date: selectedDate.getTime(),
        payee: payee.trim() || (type === 'TRANSFER' ? 'Transferencia interna' : undefined),
        note: note.trim() || undefined,
      });

      triggerSuccess();

      // Limpiar campos
      setAmountStr('');
      setPayee('');
      setNote('');
      setSelectedDate(new Date());

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo guardar la operación en la base de datos.');
    } finally {
      setLoading(false);
    }
  }, [
    amountStr,
    activeSourceAccountId,
    activeTargetAccountId,
    activeCategoryId,
    type,
    selectedDate,
    payee,
    note,
    onSuccess,
  ]);

  const actionColor = useMemo(() => getActionColor(type), [type]);
  const dynamicFontSize = useMemo(() => getDynamicFontSize(amountStr.length), [amountStr.length]);
  const dynamicCurrencySize = Math.max(dynamicFontSize - 4, 18);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : isScreen ? undefined : 'height'}
      style={isScreen ? styles.screenContainer : styles.modalOverlay}
    >
      {!isScreen && onCancel && (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
      )}

      <View
        style={
          isScreen
            ? [
                styles.screenContent,
                {
                  paddingTop: Math.max(insets.top, 16),
                  paddingBottom: Math.max(insets.bottom, 20),
                },
              ]
            : [styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]
        }
      >
        {/* Barra Superior: Cerrar (X) + Selector de Tipo */}
        <View style={styles.topBar}>
          {onCancel ? (
            <TouchableOpacity
              style={styles.circularCloseBtn}
              onPress={onCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={20} color={COLORS.onSurface} />
            </TouchableOpacity>
          ) : (
            <View style={styles.topBarSpacer} />
          )}

          <ControlSegmentadoTipo type={type} onChangeType={handleTypeChange} />

          <View style={styles.topBarSpacer} />
        </View>

        {/* Cuerpo del Formulario con Desplazamiento */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.formScrollContent}
        >
          {/* Monto Principal con Cursor Nativo Inmóvil */}
          <View style={styles.heroAmountContainer}>
            <TouchableOpacity
              style={styles.heroAmountRow}
              activeOpacity={1}
              onPress={() => amountInputRef.current?.focus()}
            >
              <Text style={[styles.heroCurrencySymbol, { fontSize: dynamicCurrencySize }]}>$</Text>
              <Text
                style={[
                  styles.heroAmountText,
                  { fontSize: dynamicFontSize },
                  !amountStr && styles.heroAmountPlaceholder,
                ]}
              >
                {amountStr || '0'}
              </Text>
              <CursorParpadeante
                visible={isInputFocused}
                height={dynamicFontSize * 0.82}
                color={actionColor}
              />
            </TouchableOpacity>

            <TextInput
              ref={amountInputRef}
              style={styles.hiddenAmountInput}
              value={amountStr}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              autoFocus={!isScreen}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              caretHidden
            />
          </View>

          {/* Selector de Fecha Estilo Cápsula */}
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateCapsule}
              onPress={() => {
                triggerSelection();
                setIsDatePickerVisible(true);
              }}
              activeOpacity={0.75}
            >
              <MaterialIcons name="event" size={15} color={COLORS.outline} />
              <Text style={styles.dateCapsuleText}>
                {isToday(selectedDate)
                  ? 'Hoy'
                  : isYesterday(selectedDate)
                    ? 'Ayer'
                    : formatFriendlyDate(selectedDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Cuentas: Píldora individual o 50/50 Symmetrical Traspaso */}
          {type !== 'TRANSFER' ? (
            <View style={styles.accountRow}>
              <TouchableOpacity
                style={styles.accountPill}
                onPress={() => {
                  triggerSelection();
                  setIsSourceAccountModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.accountIconBox,
                    { backgroundColor: `${getAccountColor(activeSourceAccount?.type)}18` },
                  ]}
                >
                  <MaterialIcons
                    name={getAccountIcon(activeSourceAccount?.type)}
                    size={18}
                    color={getAccountColor(activeSourceAccount?.type)}
                  />
                </View>
                <View style={styles.accountInfoCol}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {activeSourceAccount?.name || 'Seleccionar cuenta'}
                  </Text>
                  {activeSourceAccount && (
                    <Text style={styles.accountBalance}>
                      {formatCurrency(activeSourceAccount.currentBalance)}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transferRow}>
              {/* Origen */}
              <View style={styles.transferCol}>
                <TouchableOpacity
                  style={styles.transferCard}
                  onPress={() => {
                    triggerSelection();
                    setIsSourceAccountModalVisible(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.transferIconBox,
                      { backgroundColor: `${getAccountColor(activeSourceAccount?.type)}18` },
                    ]}
                  >
                    <MaterialIcons
                      name={getAccountIcon(activeSourceAccount?.type)}
                      size={16}
                      color={getAccountColor(activeSourceAccount?.type)}
                    />
                  </View>
                  <View style={styles.transferInfoCol}>
                    <Text style={styles.transferRoleLabel} numberOfLines={1}>
                      Origen
                    </Text>
                    <Text style={styles.transferAccountName} numberOfLines={1} ellipsizeMode="tail">
                      {activeSourceAccount?.name || 'Origen'}
                    </Text>
                    {activeSourceAccount && (
                      <Text
                        style={styles.transferAccountBalance}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {formatCurrency(activeSourceAccount.currentBalance)}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={15}
                    color={COLORS.outline}
                    style={styles.transferArrowDown}
                  />
                </TouchableOpacity>
              </View>

              {/* Flecha separadora */}
              <View style={styles.transferArrowBox}>
                <MaterialIcons name="arrow-forward" size={15} color={COLORS.primary} />
              </View>

              {/* Destino */}
              <View style={styles.transferCol}>
                <TouchableOpacity
                  style={styles.transferCard}
                  onPress={() => {
                    triggerSelection();
                    setIsTargetAccountModalVisible(true);
                  }}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.transferIconBox,
                      { backgroundColor: `${getAccountColor(activeTargetAccount?.type)}18` },
                    ]}
                  >
                    <MaterialIcons
                      name={getAccountIcon(activeTargetAccount?.type)}
                      size={16}
                      color={getAccountColor(activeTargetAccount?.type)}
                    />
                  </View>
                  <View style={styles.transferInfoCol}>
                    <Text style={styles.transferRoleLabel} numberOfLines={1}>
                      Destino
                    </Text>
                    <Text style={styles.transferAccountName} numberOfLines={1} ellipsizeMode="tail">
                      {activeTargetAccount?.name || 'Destino'}
                    </Text>
                    {activeTargetAccount && (
                      <Text
                        style={styles.transferAccountBalance}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {formatCurrency(activeTargetAccount.currentBalance)}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={15}
                    color={COLORS.outline}
                    style={styles.transferArrowDown}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sección de Entradas: Comercio/Concepto y Notas */}
          <View style={styles.inputsSection}>
            <View style={styles.modernInputBox}>
              <MaterialIcons
                name="notes"
                size={20}
                color={COLORS.outline}
                style={styles.inputIconPrefix}
              />
              <TextInput
                value={payee}
                onChangeText={setPayee}
                placeholder={
                  type === 'EXPENSE'
                    ? 'Comercio o concepto...'
                    : type === 'INCOME'
                      ? 'Fuente o pagador...'
                      : 'Motivo del traspaso...'
                }
                placeholderTextColor={COLORS.outline}
                style={styles.modernTextInput}
              />
            </View>

            <View style={[styles.modernInputBox, { marginTop: 10 }]}>
              <MaterialIcons
                name="edit"
                size={18}
                color={COLORS.outline}
                style={styles.inputIconPrefix}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Añadir notas o detalle"
                placeholderTextColor={COLORS.outline}
                style={styles.modernTextInput}
              />
            </View>
          </View>

          {/* Carrusel de Categorías con Botón [ ⌄ ] Fijo */}
          {type !== 'TRANSFER' && (
            <View style={styles.categoriesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContent}
                keyboardShouldPersistTaps="handled"
                style={styles.categoriesScrollView}
              >
                {categories.map(cat => {
                  const isSelected = activeCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        isSelected && {
                          borderColor: cat.color,
                          backgroundColor: `${cat.color}24`,
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setUserSelectedCategoryId(cat.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryPillDot, { backgroundColor: cat.color }]} />
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.categoryDropdownFixedBtn}
                onPress={() => {
                  triggerSelection();
                  setIsCategoryPickerVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Ver todas las categorías"
              >
                <MaterialIcons name="keyboard-arrow-down" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          )}

          {/* Botón Principal Guardar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.guardarButton, { backgroundColor: actionColor }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator
                  color={type === 'TRANSFER' ? '#FFFFFF' : '#0B0F10'}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.guardarButtonText,
                    { color: type === 'TRANSFER' ? '#FFFFFF' : '#0B0F10' },
                  ]}
                >
                  Guardar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Selector de Fecha Modal */}
      {isDatePickerVisible && (
        <DatePickerModal
          visible={isDatePickerVisible}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onClose={() => setIsDatePickerVisible(false)}
        />
      )}

      {/* Modal Cuenta Origen */}
      <ModalSelectorCuentas
        visible={isSourceAccountModalVisible}
        title={type === 'TRANSFER' ? 'Cuenta Origen' : 'Seleccionar cuenta'}
        accounts={accounts}
        selectedAccountId={activeSourceAccountId}
        onSelect={setUserSelectedSourceAccountId}
        onClose={() => setIsSourceAccountModalVisible(false)}
      />

      {/* Modal Cuenta Destino (Traspaso) */}
      <ModalSelectorCuentas
        visible={isTargetAccountModalVisible}
        title="Cuenta Destino"
        accounts={accounts}
        selectedAccountId={activeTargetAccountId}
        onSelect={setUserSelectedTargetAccountId}
        onClose={() => setIsTargetAccountModalVisible(false)}
      />

      {/* Modal Todas las Categorías */}
      <ModalSelectorCategorias
        visible={isCategoryPickerVisible}
        categories={categories}
        selectedCategoryId={activeCategoryId}
        onSelect={setUserSelectedCategoryId}
        onClose={() => setIsCategoryPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};



// Alias compatibles
export const TransactionForm = FormularioMovimiento;
export type TransactionFormProps = PropiedadesFormularioMovimiento;
