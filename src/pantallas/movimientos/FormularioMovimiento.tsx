import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { ModalSelectorFecha as DatePickerModal } from '@/compartido/componentes/ModalSelectorFecha';
import { TipoFlujo as FlowType, TipoCuenta, crearMovimiento as createTransaction } from '@/datos';
import { useCuentasBoveda as useVaultAccounts, useCategoriasBoveda as useVaultCategories } from '@/datos/hooks';
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

export interface PropiedadesFormularioMovimiento {
  initialType?: FlowType;
  isScreen?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

export const FormularioMovimiento: React.FC<PropiedadesFormularioMovimiento> = ({
  initialType = 'EXPENSE',
  isScreen = false,
  onSuccess,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const amountInputRef = useRef<TextInput>(null);

  const [type, setType] = useState<FlowType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSourceAccountModalVisible, setIsSourceAccountModalVisible] = useState(false);
  const [isTargetAccountModalVisible, setIsTargetAccountModalVisible] = useState(false);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hooks reactivos de la bóveda
  const { accounts } = useVaultAccounts();
  const { categories } = useVaultCategories(type === 'TRANSFER' ? 'EXPENSE' : type);

  const [userSelectedSourceAccountId, setUserSelectedSourceAccountId] = useState<string | null>(null);
  const [userSelectedTargetAccountId, setUserSelectedTargetAccountId] = useState<string | null>(null);
  const [userSelectedCategoryId, setUserSelectedCategoryId] = useState<string | null>(null);

  // Derivar IDs activos dinámicamente evitando desajustes
  const activeSourceAccountId =
    (userSelectedSourceAccountId && accounts.some(a => a.id === userSelectedSourceAccountId))
      ? userSelectedSourceAccountId
      : (accounts[0]?.id ?? '');

  const activeTargetAccountId =
    (userSelectedTargetAccountId && accounts.some(a => a.id === userSelectedTargetAccountId))
      ? userSelectedTargetAccountId
      : (accounts.length > 1 ? accounts[1]?.id : (accounts[0]?.id ?? ''));

  const activeCategoryId =
    (userSelectedCategoryId && categories.some(c => c.id === userSelectedCategoryId))
      ? userSelectedCategoryId
      : (categories[0]?.id ?? '');

  const activeSourceAccount = accounts.find(a => a.id === activeSourceAccountId) || accounts[0];
  const activeTargetAccount = accounts.find(a => a.id === activeTargetAccountId) || accounts[1] || accounts[0];

  const handleTypeChange = (newType: FlowType) => {
    triggerSelection();
    setType(newType);
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatMoneyInput(text);
    setAmountStr(formatted);
  };

  const handleSubmit = () => {
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
  };

  const actionColor =
    type === 'EXPENSE'
      ? COLORS.cashflowExpense
      : type === 'INCOME'
        ? COLORS.cashflowIncome
        : COLORS.primaryContainer;

  const amountLength = amountStr.length || 1;
  const dynamicFontSize =
    amountLength <= 5
      ? 46
      : amountLength <= 7
        ? 38
        : amountLength <= 9
          ? 30
          : amountLength <= 11
            ? 24
            : 20;
  const dynamicCurrencySize = Math.max(dynamicFontSize - 4, 18);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : (isScreen ? undefined : 'height')}
      style={isScreen ? styles.screenContainer : styles.modalOverlay}
    >
      {!isScreen && onCancel && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />
      )}

      <View
        style={
          isScreen
            ? [styles.screenContent, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 20) }]
            : [styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]
        }
      >
        {/* Top Bar: Botón Cerrar (X) + Segmented Capsule de Tipos */}
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

          {/* Segmented Capsule: Ingreso, Gasto, Traspaso */}
          <View style={styles.segmentedCapsule}>
            {/* Ingreso */}
            <TouchableOpacity
              style={[
                styles.segmentedItem,
                type === 'INCOME' ? styles.segmentedItemActiveIncome : styles.segmentedItemInactive,
              ]}
              onPress={() => handleTypeChange('INCOME')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="arrow-downward"
                size={16}
                color={type === 'INCOME' ? COLORS.cashflowIncome : COLORS.onSurfaceVariant}
              />
              {type === 'INCOME' && (
                <Text style={[styles.segmentedLabel, { color: COLORS.cashflowIncome }]}>
                  Ingreso
                </Text>
              )}
            </TouchableOpacity>

            {/* Gasto */}
            <TouchableOpacity
              style={[
                styles.segmentedItem,
                type === 'EXPENSE' ? styles.segmentedItemActiveExpense : styles.segmentedItemInactive,
              ]}
              onPress={() => handleTypeChange('EXPENSE')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="arrow-upward"
                size={16}
                color={type === 'EXPENSE' ? COLORS.cashflowExpense : COLORS.onSurfaceVariant}
              />
              {type === 'EXPENSE' && (
                <Text style={[styles.segmentedLabel, { color: COLORS.cashflowExpense }]}>
                  Gasto
                </Text>
              )}
            </TouchableOpacity>

            {/* Traspaso */}
            <TouchableOpacity
              style={[
                styles.segmentedItem,
                type === 'TRANSFER' ? styles.segmentedItemActiveTransfer : styles.segmentedItemInactive,
              ]}
              onPress={() => handleTypeChange('TRANSFER')}
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

          <View style={styles.topBarSpacer} />
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={styles.formScrollContent}
        >
          {/* Hero Amount Input */}
          <View style={styles.heroAmountContainer}>
            <TouchableOpacity
              style={styles.heroAmountRow}
              activeOpacity={1}
              onPress={() => amountInputRef.current?.focus()}
            >
              <Text style={[styles.heroCurrencySymbol, { fontSize: dynamicCurrencySize }]}>$</Text>
              <TextInput
                ref={amountInputRef}
                style={[styles.heroAmountInput, { fontSize: dynamicFontSize }]}
                value={amountStr}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.28)"
                keyboardType="decimal-pad"
                autoFocus={!isScreen}
                cursorColor={actionColor}
                scrollEnabled={false}
              />
            </TouchableOpacity>
          </View>

          {/* Date Capsule Pill */}
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

          {/* Account Selector Pill */}
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
                  <Text style={styles.transferRoleLabel}>Origen</Text>
                  <Text style={styles.transferAccountName} numberOfLines={1} ellipsizeMode="tail">
                    {activeSourceAccount?.name || 'Origen'}
                  </Text>
                  {activeSourceAccount && (
                    <Text style={styles.transferAccountBalance} numberOfLines={1} ellipsizeMode="tail">
                      {formatCurrency(activeSourceAccount.currentBalance)}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={16} color={COLORS.outline} />
              </TouchableOpacity>

              {/* Flecha separadora */}
              <View style={styles.transferArrowBox}>
                <MaterialIcons name="arrow-forward" size={15} color={COLORS.primary} />
              </View>

              {/* Destino */}
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
                  <Text style={styles.transferRoleLabel}>Destino</Text>
                  <Text style={styles.transferAccountName} numberOfLines={1} ellipsizeMode="tail">
                    {activeTargetAccount?.name || 'Destino'}
                  </Text>
                  {activeTargetAccount && (
                    <Text style={styles.transferAccountBalance} numberOfLines={1} ellipsizeMode="tail">
                      {formatCurrency(activeTargetAccount.currentBalance)}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={16} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Box: Concepto / Comercio y Notas */}
          <View style={styles.inputsSection}>
            <View style={styles.modernInputBox}>
              <MaterialIcons name="notes" size={20} color={COLORS.outline} style={styles.inputIconPrefix} />
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
              <MaterialIcons name="edit" size={18} color={COLORS.outline} style={styles.inputIconPrefix} />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Añadir notas o detalle"
                placeholderTextColor={COLORS.outline}
                style={styles.modernTextInput}
              />
            </View>
          </View>

          {/* Categories Selector Horizontal Pills + [ ⌄ ] Siempre visible */}
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

              {/* Botón [ ⌄ ] fijo y visible en todo momento */}
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

          {/* Prominent Action Button: Guardar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.guardarButton,
                { backgroundColor: actionColor },
              ]}
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

      {/* Date Picker Modal */}
      {isDatePickerVisible && (
        <DatePickerModal
          visible={isDatePickerVisible}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onClose={() => setIsDatePickerVisible(false)}
        />
      )}

      {/* Source Account Selector Modal */}
      <Modal
        visible={isSourceAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSourceAccountModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsSourceAccountModalVisible(false)}
          />
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, TYPOGRAPHY.titularPequeno]}>
                {type === 'TRANSFER' ? 'Cuenta Origen' : 'Seleccionar cuenta'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsSourceAccountModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {accounts.map(acc => {
                const isSelected = activeSourceAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountOptionItem,
                      isSelected && styles.accountOptionItemSelected,
                    ]}
                    onPress={() => {
                      triggerSelection();
                      setUserSelectedSourceAccountId(acc.id);
                      setIsSourceAccountModalVisible(false);
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
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountOptionName}>{acc.name}</Text>
                      <Text style={styles.accountOptionBalance}>
                        {formatCurrency(acc.currentBalance)}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color={COLORS.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Target Account Selector Modal (for TRANSFER) */}
      <Modal
        visible={isTargetAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTargetAccountModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsTargetAccountModalVisible(false)}
          />
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, TYPOGRAPHY.titularPequeno]}>
                Cuenta Destino
              </Text>
              <TouchableOpacity
                onPress={() => setIsTargetAccountModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {accounts.map(acc => {
                const isSelected = activeTargetAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountOptionItem,
                      isSelected && styles.accountOptionItemSelected,
                    ]}
                    onPress={() => {
                      triggerSelection();
                      setUserSelectedTargetAccountId(acc.id);
                      setIsTargetAccountModalVisible(false);
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
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountOptionName}>{acc.name}</Text>
                      <Text style={styles.accountOptionBalance}>
                        {formatCurrency(acc.currentBalance)}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color={COLORS.secondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Categories Modal */}
      <Modal
        visible={isCategoryPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCategoryPickerVisible(false)}
          />
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={[styles.pickerModalTitle, TYPOGRAPHY.titularPequeno]}>
                Todas las categorías
              </Text>
              <TouchableOpacity
                onPress={() => setIsCategoryPickerVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              <View style={styles.categoriesGridInModal}>
                {categories.map(cat => {
                  const isSelected = activeCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        { minWidth: '47%', flex: 1 },
                        isSelected && {
                          borderColor: cat.color,
                          backgroundColor: `${cat.color}24`,
                        },
                      ]}
                      onPress={() => {
                        triggerSelection();
                        setUserSelectedCategoryId(cat.id);
                        setIsCategoryPickerVisible(false);
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '92%',
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B0F10',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollArea: {
    flexShrink: 1,
  },
  formScrollContent: {
    paddingBottom: 24,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  circularCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 38,
  },

  // Segmented Capsule
  segmentedCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181C1E',
    borderRadius: 24,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentedItem: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedItemInactive: {
    width: 34,
    height: 34,
  },
  segmentedItemActiveExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 138, 158, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentedItemActiveIncome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(87, 245, 171, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentedItemActiveTransfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentedLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Hero Amount
  heroAmountContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  heroCurrencySymbol: {
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  heroAmountInput: {
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 40,
    paddingVertical: 0,
    paddingHorizontal: 2,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Date Capsule Pill
  dateRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  dateCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181C1E',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateCapsuleText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },

  // Account Selector Pill
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  accountIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfoCol: {
    flexShrink: 1,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  accountBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 1,
  },

  // Transfer Row (strictly symmetrical 50/50 without deformation)
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
    width: '100%',
  },
  transferCard: {
    flex: 1,
    minWidth: 0,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  transferIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transferInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  transferRoleLabel: {
    color: COLORS.outline,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transferAccountName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  transferAccountBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 1,
  },
  transferArrowBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Inputs Section
  inputsSection: {
    marginBottom: 6,
  },
  modernInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputIconPrefix: {
    marginRight: 10,
  },
  modernTextInput: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '500',
  },

  // Categories Row with fixed button
  categoriesContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#161A1C',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryPillText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryDropdownFixedBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161A1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },

  // Action Button
  bottomBar: {
    marginTop: 22,
    marginBottom: 6,
  },
  guardarButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guardarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Picker Modals (Accounts & Categories)
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#14181A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerModalTitle: {
    color: COLORS.onSurface,
  },
  accountOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 12,
  },
  accountOptionItemSelected: {
    backgroundColor: 'rgba(165, 231, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  accountOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountOptionName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  accountOptionBalance: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  categoriesGridInModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

// Alias compatibles
export const TransactionForm = FormularioMovimiento;
export type TransactionFormProps = PropiedadesFormularioMovimiento;
