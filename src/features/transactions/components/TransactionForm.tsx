import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlowButton } from '@/shared/components/GlowButton';
import { FlowType, createTransaction } from '@/core/database';
import { useVaultAccounts, useVaultCategories } from '@/core/state';
import { parseAmountToCents, formatCurrency, formatMoneyInput } from '@/shared/utils/currency';
import {
  triggerSuccess,
  triggerError,
  triggerSelection,
} from '@/shared/utils/haptics';

export interface TransactionFormProps {
  initialType?: FlowType;
  isScreen?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialType = 'EXPENSE',
  isScreen = false,
  onSuccess,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<FlowType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Hooks reactivos de la bóveda
  const { accounts } = useVaultAccounts();
  const { categories } = useVaultCategories(type === 'TRANSFER' ? 'EXPENSE' : type);

  const [userSelectedSourceAccountId, setUserSelectedSourceAccountId] = useState<string | null>(null);
  const [userSelectedTargetAccountId, setUserSelectedTargetAccountId] = useState<string | null>(null);
  const [userSelectedCategoryId, setUserSelectedCategoryId] = useState<string | null>(null);

  // Derivar IDs activos dinámicamente evitando llamadas a setState dentro de useEffect
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
        payee: payee.trim() || (type === 'TRANSFER' ? 'Transferencia interna' : undefined),
        note: note.trim() || undefined,
      });

      triggerSuccess();

      // Limpiar campos
      setAmountStr('');
      setPayee('');
      setNote('');

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

  const parsedCents = parseAmountToCents(amountStr);

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
            ? [styles.screenContent, { paddingBottom: Math.max(insets.bottom, 20) }]
            : [styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, TYPOGRAPHY.headlineSm]}>
              {isScreen ? 'Registrar Operación' : 'Nueva Operación'}
            </Text>
          </View>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Operation Type Switcher */}
        <View style={styles.typeSwitcherRow}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'EXPENSE' && styles.typeButtonExpenseActive]}
            onPress={() => handleTypeChange('EXPENSE')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="remove-circle-outline"
              size={18}
              color={type === 'EXPENSE' ? COLORS.cashflowExpense : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'EXPENSE' && { color: COLORS.cashflowExpense, fontWeight: '700' },
                TYPOGRAPHY.labelCaps,
              ]}
            >
              Gasto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'INCOME' && styles.typeButtonIncomeActive]}
            onPress={() => handleTypeChange('INCOME')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={18}
              color={type === 'INCOME' ? COLORS.cashflowIncome : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'INCOME' && { color: COLORS.cashflowIncome, fontWeight: '700' },
                TYPOGRAPHY.labelCaps,
              ]}
            >
              Ingreso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'TRANSFER' && styles.typeButtonTransferActive]}
            onPress={() => handleTypeChange('TRANSFER')}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="swap-horiz"
              size={18}
              color={type === 'TRANSFER' ? COLORS.primary : COLORS.onSurfaceVariant}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'TRANSFER' && { color: COLORS.primary, fontWeight: '700' },
                TYPOGRAPHY.labelCaps,
              ]}
            >
              Traspaso
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Amount Hero Input */}
          <View style={styles.amountBox}>
            <Text style={[styles.currencyPrefix, TYPOGRAPHY.headlineSm]}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0,00"
              placeholderTextColor={COLORS.outline}
              keyboardType="decimal-pad"
              autoFocus={!isScreen}
            />
          </View>
          {parsedCents > 0 && (
            <Text style={[styles.amountPreview, TYPOGRAPHY.labelCaps]}>
              {formatCurrency(parsedCents)}
            </Text>
          )}

          {/* Concept / Payee Input */}
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>
            {type === 'EXPENSE'
              ? 'Comercio o concepto'
              : type === 'INCOME'
              ? 'Fuente o pagador'
              : 'Motivo del traspaso'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={payee}
            onChangeText={setPayee}
            placeholder={
              type === 'EXPENSE'
                ? 'Ej. Supermercado, Combustible, Farmacia'
                : type === 'INCOME'
                ? 'Ej. Sueldo, Honorarios, Venta'
                : 'Ej. Ahorro a reserva, Fondo semanal'
            }
            placeholderTextColor={COLORS.outline}
          />

          {/* Account Selector(s) */}
          {type === 'TRANSFER' ? (
            <View style={styles.transferAccountsGroup}>
              <View style={styles.transferCol}>
                <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Desde (Origen)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
                  {accounts.map(acc => (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => {
                        triggerSelection();
                        setUserSelectedSourceAccountId(acc.id);
                      }}
                      style={[
                        styles.accountChip,
                        activeSourceAccountId === acc.id && styles.accountChipActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.accountChipText,
                          activeSourceAccountId === acc.id && styles.accountChipTextActive,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.transferCol}>
                <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Hacia (Destino)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
                  {accounts.map(acc => (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => {
                        triggerSelection();
                        setUserSelectedTargetAccountId(acc.id);
                      }}
                      style={[
                        styles.accountChip,
                        activeTargetAccountId === acc.id && styles.accountChipActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.accountChipText,
                          activeTargetAccountId === acc.id && styles.accountChipTextActive,
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>
                {type === 'EXPENSE' ? 'Pagado con' : 'Ingresado a'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
                {accounts.map(acc => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => {
                      triggerSelection();
                      setUserSelectedSourceAccountId(acc.id);
                    }}
                    style={[
                      styles.accountChip,
                      activeSourceAccountId === acc.id && styles.accountChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.accountChipText,
                        activeSourceAccountId === acc.id && styles.accountChipTextActive,
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Category Selector (only for EXPENSE and INCOME) */}
          {type !== 'TRANSFER' && (
            <View style={styles.categorySection}>
              <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Categoría</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(cat => {
                  const isSelected = activeCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        triggerSelection();
                        setUserSelectedCategoryId(cat.id);
                      }}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          borderColor: cat.color,
                          backgroundColor: `${cat.color}20`,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Note Input */}
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nota adicional (opcional)</Text>
          <TextInput
            style={styles.textInput}
            value={note}
            onChangeText={setNote}
            placeholder="Detalle o etiqueta..."
            placeholderTextColor={COLORS.outline}
          />

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <GlowButton
              title={
                type === 'EXPENSE'
                  ? 'Registrar Gasto'
                  : type === 'INCOME'
                  ? 'Registrar Ingreso'
                  : 'Realizar Traspaso'
              }
              onPress={handleSubmit}
              loading={loading}
              variant={type === 'EXPENSE' ? 'primary' : type === 'INCOME' ? 'secondary' : 'primary'}
              icon={
                <MaterialIcons
                  name={type === 'EXPENSE' ? 'remove' : type === 'INCOME' ? 'add' : 'sync-alt'}
                  size={20}
                  color="#FFFFFF"
                />
              }
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  screenContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: COLORS.onSurface,
  },
  typeSwitcherRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeButtonExpenseActive: {
    backgroundColor: 'rgba(255, 138, 158, 0.15)',
    borderColor: COLORS.cashflowExpense,
  },
  typeButtonIncomeActive: {
    backgroundColor: 'rgba(87, 245, 171, 0.15)',
    borderColor: COLORS.cashflowIncome,
  },
  typeButtonTransferActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    borderColor: COLORS.primaryContainer,
  },
  typeButtonText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  formContent: {
    paddingBottom: 20,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    marginBottom: 6,
  },
  currencyPrefix: {
    color: COLORS.secondary,
    marginRight: 8,
    fontSize: 28,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
    minWidth: 140,
  },
  amountPreview: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.onSurface,
    fontSize: 15,
  },
  transferAccountsGroup: {
    gap: 8,
  },
  transferCol: {
    flex: 1,
  },
  accountsScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountChipActive: {
    borderColor: COLORS.secondary,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
  },
  accountChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '500',
  },
  accountChipTextActive: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  categorySection: {
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  submitContainer: {
    marginTop: 24,
  },
});
