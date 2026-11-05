import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import {
  crearCuenta as createAccount,
  actualizarCuenta as updateAccount,
  actualizarSaldoCuenta as updateAccountBalance,
  eliminarCuenta as deleteAccount,
} from '@/datos/consultas/cuentas';
import { Cuenta, TipoCuenta } from '@/datos/tipos';
import {
  convertirMontoACentavos as parseAmountToCents,
  formatearEntradaDinero as formatMoneyInput,
} from '@/compartido/utilidades/moneda';
import {
  gatillarExito as triggerSuccess,
  gatillarError as triggerError,
  gatillarSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalCuenta {
  visible: boolean;
  editingAccount?: Cuenta | null;
  onClose: () => void;
  onSaved?: () => void;
}
export type AccountModalProps = PropiedadesModalCuenta;

// ==========================================
// CONFIGURACIÓN DE TIPOS DE CUENTA
// ==========================================

interface OpcionTipoCuenta {
  tipo: TipoCuenta;
  etiqueta: string;
  icono: keyof typeof MaterialIcons.glyphMap;
  color: string;
  fondoActivo: string;
  bordeActivo: string;
}

const TIPOS_CUENTA: OpcionTipoCuenta[] = [
  {
    tipo: 'BANK',
    etiqueta: 'Banco',
    icono: 'account-balance',
    color: '#00D2FF',
    fondoActivo: 'rgba(0, 210, 255, 0.16)',
    bordeActivo: 'rgba(0, 210, 255, 0.35)',
  },
  {
    tipo: 'CASH',
    etiqueta: 'Efectivo',
    icono: 'payments',
    color: '#57F5AB',
    fondoActivo: 'rgba(87, 245, 171, 0.16)',
    bordeActivo: 'rgba(87, 245, 171, 0.35)',
  },
  {
    tipo: 'PREPAID',
    etiqueta: 'Virtual',
    icono: 'credit-card',
    color: '#D1BCFF',
    fondoActivo: 'rgba(209, 188, 255, 0.18)',
    bordeActivo: 'rgba(209, 188, 255, 0.38)',
  },
  {
    tipo: 'VAULT',
    etiqueta: 'Bóveda',
    icono: 'savings',
    color: '#FFA25B',
    fondoActivo: 'rgba(255, 162, 91, 0.16)',
    bordeActivo: 'rgba(255, 162, 91, 0.35)',
  },
];

function getDynamicFontSize(length: number): number {
  if (length <= 7) return 46;
  if (length <= 9) return 38;
  if (length <= 11) return 30;
  if (length <= 14) return 24;
  return 20;
}

// ==========================================
// SUBCOMPONENTE: CURSOR PARPADEANTE
// ==========================================

interface PropiedadesCursor {
  visible: boolean;
  height: number;
  color: string;
}

const CursorParpadeante: React.FC<PropiedadesCursor> = React.memo(
  function CursorParpadeante({ visible, height, color }) {
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

    if (!visible) return null;

    return (
      <Animated.View
        style={{
          width: 2.5,
          height,
          backgroundColor: color,
          borderRadius: 1.5,
          marginLeft: 2,
          opacity: animOpacity,
        }}
      />
    );
  }
);

// ==========================================
// CONTENIDO DEL MODAL
// ==========================================

interface PropiedadesContenidoModalCuenta {
  editingAccount?: Cuenta | null;
  onClose: () => void;
  onSaved?: () => void;
}

const formatInitialBalance = (cents?: number) => {
  if (cents === undefined || cents === null || isNaN(cents)) return '';
  const units = Math.floor(cents / 100);
  const remainder = cents % 100;
  if (remainder === 0) {
    return formatMoneyInput(units.toString());
  }
  return formatMoneyInput(`${units},${remainder.toString().padStart(2, '0')}`);
};

const ContenidoModalCuenta: React.FC<PropiedadesContenidoModalCuenta> = ({
  editingAccount,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(editingAccount);
  const [name, setName] = useState(editingAccount?.name ?? '');
  const [accountType, setAccountType] = useState<TipoCuenta>(editingAccount?.type ?? 'BANK');
  const [amountStr, setAmountStr] = useState(() => formatInitialBalance(editingAccount?.currentBalance));
  const [isInputFocused, setIsInputFocused] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  const selectedTypeConfig = useMemo(
    () => TIPOS_CUENTA.find(t => t.tipo === accountType) || TIPOS_CUENTA[0],
    [accountType]
  );

  const dynamicFontSize = useMemo(() => getDynamicFontSize(amountStr.length), [amountStr.length]);
  const dynamicCurrencySize = Math.max(dynamicFontSize - 4, 18);

  const handleAmountChange = useCallback((text: string) => {
    const formatted = formatMoneyInput(text);
    setAmountStr(formatted);
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      triggerError();
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para la cuenta.');
      return;
    }

    try {
      const cents = parseAmountToCents(amountStr);

      if (isEditing && editingAccount) {
        updateAccountBalance(editingAccount.id, cents);
        updateAccount(editingAccount.id, {
          name: name.trim(),
          type: accountType,
        });
      } else {
        createAccount({
          name: name.trim(),
          type: accountType,
          initialBalance: cents,
          currency: 'UYU',
        });
      }

      triggerSuccess();
      onClose();
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Error saving account:', err);
      triggerError();
      Alert.alert('Error', 'No se pudo guardar la cuenta en la base de datos.');
    }
  };

  const handleDelete = () => {
    if (!editingAccount) return;

    triggerSelection();
    Alert.alert(
      'Eliminar Cuenta',
      `¿Estás seguro de que deseas eliminar "${editingAccount.name}"?\n\nEsta acción eliminará la cuenta y sus movimientos asociados de forma permanente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Cuenta',
          style: 'destructive',
          onPress: () => {
            try {
              deleteAccount(editingAccount.id);
              triggerSuccess();
              onClose();
              if (onSaved) onSaved();
            } catch (err: any) {
              console.error('Error al eliminar cuenta:', err);
              triggerError();
              Alert.alert('No se pudo eliminar', err.message || 'Error al eliminar la cuenta.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.modalDrawer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Drawer Handle */}
      <View style={styles.drawerHandle} />

      {/* Top Bar: Cerrar (X) + Cápsula Título + Eliminar (Trash) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circularCloseBtn}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Cerrar"
        >
          <MaterialIcons name="close" size={20} color={COLORS.onSurface} />
        </TouchableOpacity>

        <View style={styles.topBarCapsule}>
          <MaterialIcons
            name={isEditing ? 'tune' : 'account-balance-wallet'}
            size={15}
            color={COLORS.primary}
          />
          <Text style={[styles.topBarCapsuleTitle, TYPOGRAPHY.labelCaps]}>
            {isEditing ? 'Ajustar Cuenta' : 'Nueva Cuenta'}
          </Text>
        </View>

        {isEditing ? (
          <TouchableOpacity
            style={styles.circularDeleteBtn}
            onPress={handleDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Eliminar cuenta"
          >
            <MaterialIcons name="delete-outline" size={20} color={COLORS.cashflowExpense} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarSpacer} />
        )}
      </View>

      {/* Scroll Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        contentContainerStyle={styles.drawerScrollContent}
      >
        {/* Hero Amount Display con Input Invisible */}
        <View style={styles.heroAmountContainer}>
          <Text style={[styles.heroAmountLabel, TYPOGRAPHY.labelCaps]}>
            {isEditing ? 'Saldo Actual' : 'Saldo Inicial'}
          </Text>

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
              color={selectedTypeConfig.color}
            />
          </TouchableOpacity>

          <TextInput
            ref={amountInputRef}
            style={styles.hiddenAmountInput}
            value={amountStr}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            autoFocus={!isEditing}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            caretHidden
          />
        </View>

        {/* Input: Nombre de la Cuenta */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nombre de la cuenta</Text>
          <View style={styles.modernInputBox}>
            <MaterialIcons
              name="badge"
              size={18}
              color={COLORS.outline}
              style={styles.inputIconPrefix}
            />
            <TextInput
              style={styles.modernTextInput}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Banco Santander, Efectivo, Prex"
              placeholderTextColor={COLORS.outline}
            />
          </View>
        </View>

        {/* Selector de Tipo de Cuenta */}
        <View style={styles.typeSelectorContainer}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Tipo de cuenta</Text>
          <View style={styles.typeGrid}>
            {TIPOS_CUENTA.map(t => {
              const active = accountType === t.tipo;
              return (
                <TouchableOpacity
                  key={t.tipo}
                  style={[
                    styles.typeOption,
                    active && {
                      backgroundColor: t.fondoActivo,
                      borderColor: t.bordeActivo,
                    },
                  ]}
                  onPress={() => {
                    triggerSelection();
                    setAccountType(t.tipo);
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialIcons
                    name={t.icono}
                    size={20}
                    color={active ? t.color : COLORS.outline}
                  />
                  <Text
                    style={[
                      styles.typeOptionLabel,
                      TYPOGRAPHY.labelCaps,
                      active && styles.typeOptionLabelActive,
                    ]}
                  >
                    {t.etiqueta}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botón Principal (Guardar / Crear) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.guardarButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={isEditing ? 'check-circle-outline' : 'add-circle-outline'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={[styles.guardarButtonText, TYPOGRAPHY.labelCaps]}>
              {isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export const ModalCuenta: React.FC<PropiedadesModalCuenta> = ({
  visible,
  editingAccount,
  onClose,
  onSaved,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        {visible && (
          <ContenidoModalCuenta
            key={editingAccount ? `edit-${editingAccount.id}` : 'new-account'}
            editingAccount={editingAccount}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const AccountModal = ModalCuenta;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalDrawer: {
    backgroundColor: '#0E1214',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    maxHeight: '90%',
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  drawerHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  circularCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181C1E',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarCapsuleTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  circularDeleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 138, 158, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 158, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 38,
  },
  scrollArea: {
    flexShrink: 1,
  },
  drawerScrollContent: {
    paddingBottom: 16,
  },
  heroAmountContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    position: 'relative',
    backgroundColor: '#14181A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  heroAmountLabel: {
    color: COLORS.outline,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  heroCurrencySymbol: {
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 6,
  },
  heroAmountText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroAmountPlaceholder: {
    color: 'rgba(255, 255, 255, 0.22)',
  },
  hiddenAmountInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  inputContainer: {
    gap: 6,
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  modernInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161A1C',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputIconPrefix: {
    marginRight: 10,
  },
  modernTextInput: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: '500',
  },
  typeSelectorContainer: {
    gap: 6,
    marginBottom: 18,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#161A1C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  typeOptionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  typeOptionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomBar: {
    marginTop: 4,
    marginBottom: 4,
  },
  guardarButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guardarButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
