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
import { LinearGradient } from 'expo-linear-gradient';
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
import { BotonBrillante } from '@/compartido/componentes/BotonBrillante';
import { EncabezadoModal } from '@/compartido/componentes/EncabezadoModal';
import { OrbeGlossy, TonoOrbeGlossy } from '@/compartido/componentes/OrbeGlossy';
import { TarjetaVidrio } from '@/compartido/componentes/TarjetaVidrio';

export interface PropiedadesModalCuenta {
  visible: boolean;
  editingAccount?: Cuenta | null;
  onClose: () => void;
  onSaved?: () => void;
}

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
  const [isNameFocused, setIsNameFocused] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // Auto-enfoque al abrir modal para desplegar el teclado inmediatamente
  useEffect(() => {
    const timer = setTimeout(() => {
      amountInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

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
      {/* Encabezado unificado glossy 3D */}
      <EncabezadoModal
        titulo={isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
        subtitulo={
          isEditing
            ? 'Actualiza el nombre, tipo o saldo de tu cuenta'
            : 'Crea una cuenta para registrar tus saldos'
        }
        icono={selectedTypeConfig.icono}
        tono={
          accountType === 'CASH'
            ? 'ingreso'
            : accountType === 'BANK'
              ? 'cian'
              : 'violeta'
        }
        onCerrar={onClose}
        accionDerecha={
          isEditing ? (
            <OrbeGlossy
              tamano={36}
              tono="gasto"
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Eliminar cuenta"
            >
              <MaterialIcons name="delete-outline" size={18} color="#FFFFFF" />
            </OrbeGlossy>
          ) : undefined
        }
      />

      {/* Scroll Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        contentContainerStyle={styles.drawerScrollContent}
      >
        {/* Hero Amount Display con Input Invisible en TarjetaVidrio */}
        <TarjetaVidrio variant="surface" style={styles.heroAmountContainer}>
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
        </TarjetaVidrio>

        {/* Input: Nombre de la Cuenta (cápsula glossy 3D) */}
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={
              isNameFocused
                ? ['rgba(0, 210, 255, 0.78)', 'rgba(165, 231, 255, 0.42)', 'rgba(138, 79, 255, 0.4)']
                : ['rgba(165, 231, 255, 0.4)', 'rgba(74, 84, 92, 0.38)', 'rgba(209, 188, 255, 0.2)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.inputCapsuleRim}
          >
            <LinearGradient
              colors={['#1F2A2F', '#11181B', '#090D0F', '#141D20']}
              locations={[0, 0.46, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.inputCapsuleBody}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(165, 231, 255, 0.05)', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
                style={styles.inputCapsuleGloss}
              />
              <OrbeGlossy tamano={32} tono="obsidiana" style={styles.inputOrbPrefix}>
                <MaterialIcons name="badge" size={16} color={COLORS.secondary} />
              </OrbeGlossy>
              <TextInput
                style={styles.modernTextInput}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la cuenta"
                placeholderTextColor="rgba(204, 195, 216, 0.52)"
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
              />
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Selector de Tipo de Cuenta con OrbeGlossy */}
        <View style={styles.typeSelectorContainer}>
          <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Tipo de cuenta</Text>
          <View style={styles.typeGrid}>
            {TIPOS_CUENTA.map(t => {
              const active = accountType === t.tipo;
              const tonoOrbe: TonoOrbeGlossy = !active
                ? 'obsidiana'
                : t.tipo === 'CASH'
                  ? 'ingreso'
                  : t.tipo === 'BANK'
                    ? 'cian'
                    : 'violeta';

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
                  activeOpacity={0.78}
                >
                  <OrbeGlossy tamano={38} tono={tonoOrbe} sombra={active}>
                    <MaterialIcons
                      name={t.icono}
                      size={18}
                      color={active ? '#FFFFFF' : t.color}
                    />
                  </OrbeGlossy>
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
          <BotonBrillante
            title={isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}
            onPress={handleSave}
          />
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
    paddingVertical: 16,
    paddingHorizontal: 10,
    position: 'relative',
    borderRadius: 20,
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
  inputCapsuleRim: {
    borderRadius: 999,
    padding: 1.5,
  },
  inputCapsuleBody: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 6,
    minHeight: 48,
    overflow: 'hidden',
  },
  inputCapsuleGloss: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: '46%',
    borderRadius: 999,
  },
  inputOrbPrefix: {
    marginRight: 10,
  },
  modernTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 4,
  },
  typeSelectorContainer: {
    gap: 8,
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
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 18, 20, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(165, 231, 255, 0.14)',
    gap: 7,
  },
  typeOptionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  typeOptionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bottomBar: {
    marginTop: 4,
    marginBottom: 4,
  },
});
