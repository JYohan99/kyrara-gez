import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { VaultIllustration } from '@/shared/components/VaultIllustration';
import { KyraraEmblem } from '@/shared/components/KyraraEmblem';
import { GlassCard } from '@/shared/components/GlassCard';
import { GlowButton } from '@/shared/components/GlowButton';
import { createAccount, completeOnboarding } from '@/core/database';
import { AccountType } from '@/core/database/types';
import { parseAmountToCents } from '@/shared/utils/currency';

interface PresetItem {
  id: string;
  name: string;
  subtitle: string;
  type: AccountType;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  badge: string;
  badgeColor: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'cash',
    name: 'Efectivo en mano',
    subtitle: 'Billetes y monedas del día a día',
    type: 'CASH',
    icon: 'payments',
    color: COLORS.cashflowIncome,
    badge: 'Rápido',
    badgeColor: COLORS.cashflowIncome,
  },
  {
    id: 'bank',
    name: 'Cuenta bancaria',
    subtitle: 'Sueldo, ahorros o débito',
    type: 'BANK',
    icon: 'account-balance',
    color: COLORS.secondaryContainer,
    badge: 'Añadir',
    badgeColor: COLORS.secondary,
  },
  {
    id: 'prepaid',
    name: 'Tarjeta prepaga / virtual',
    subtitle: 'Mercado Pago, Prex, Ualá, PayPal',
    type: 'PREPAID',
    icon: 'credit-card',
    color: COLORS.primaryContainer,
    badge: 'Añadir',
    badgeColor: COLORS.primary,
  },
];

export default function OnboardingScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType>('CASH');
  const [accountName, setAccountName] = useState('');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAccountModal = (preset?: PresetItem) => {
    if (preset) {
      setSelectedType(preset.type);
      setAccountName(preset.name);
    } else {
      setSelectedType('CASH');
      setAccountName('Mi Cuenta');
    }
    setInitialBalanceInput('');
    setModalVisible(true);
  };

  const handleCreateAccount = () => {
    if (!accountName.trim()) return;

    setIsSubmitting(true);
    try {
      const cents = parseAmountToCents(initialBalanceInput);
      createAccount({
        name: accountName.trim(),
        type: selectedType,
        initialBalance: cents,
      });

      // Mark onboarding as completed
      completeOnboarding();
      setModalVisible(false);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error creating account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipOrQuickStart = () => {
    // If user clicks direct entry without configuring, create default Cash account with $0
    createAccount({
      name: 'Efectivo en mano',
      type: 'CASH',
      initialBalance: 0,
    });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Distinctive Badge */}
        <View style={styles.topBadgeContainer}>
          <View style={styles.topBadge}>
            <View style={styles.pulseDot} />
            <Text style={[styles.topBadgeText, TYPOGRAPHY.labelCaps]}>
              Bienvenido a Kyrara Gez · Sin cuentas ni registro
            </Text>
          </View>
        </View>

        {/* Emblem Halo */}
        <View style={styles.emblemContainer}>
          <View style={styles.emblemHalo} />
          <KyraraEmblem size={68} />
        </View>

        {/* Hero SVG: Bóveda Luminous Safe */}
        <View style={styles.illustrationContainer}>
          <VaultIllustration width={280} height={176} />
        </View>

        {/* Header Texts */}
        <View style={styles.headerTexts}>
          <Text style={[styles.mainTitle, TYPOGRAPHY.headlineLg]}>
            Tus finanzas privadas, {'\n'}
            <Text style={styles.titleHighlight}>solo para tus ojos</Text>
          </Text>
          <Text style={[styles.subtitle, TYPOGRAPHY.bodyMd]}>
            Una forma transparente de entender a dónde va tu dinero. Sin registros, sin nubes y
            sin intermediarios. Todo vive en tu teléfono.
          </Text>
        </View>

        {/* Action Card: Primer Paso */}
        <GlassCard style={styles.accountsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.walletIconBox}>
              <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardHeaderTextContainer}>
              <Text style={[styles.cardTitle, TYPOGRAPHY.headlineSm]}>
                Comencemos por tus cuentas
              </Text>
              <Text style={[styles.cardSubtitle, TYPOGRAPHY.bodySm]}>
                Para saber cuánto dinero tienes disponible, crea tus fuentes habituales de dinero.
              </Text>
            </View>
          </View>

          {/* Quick Presets List */}
          <View style={styles.presetsList}>
            {PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetItem}
                activeOpacity={0.7}
                onPress={() => openAccountModal(preset)}
              >
                <View style={styles.presetLeft}>
                  <View
                    style={[
                      styles.presetIconBox,
                      { backgroundColor: `${preset.color}15` },
                    ]}
                  >
                    <MaterialIcons name={preset.icon} size={22} color={preset.color} />
                  </View>
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetName, TYPOGRAPHY.bodyMd]}>{preset.name}</Text>
                    <Text style={[styles.presetSubtitle, TYPOGRAPHY.bodySm]}>
                      {preset.subtitle}
                    </Text>
                  </View>
                </View>

                <View style={styles.presetRight}>
                  <View style={styles.presetBadge}>
                    <Text style={[styles.presetBadgeText, { color: preset.badgeColor }]}>
                      {preset.badge}
                    </Text>
                  </View>
                  <MaterialIcons name="add-circle" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Primary CTA */}
          <GlowButton
            title="Crear mi primera cuenta"
            onPress={() => openAccountModal()}
            icon={<MaterialIcons name="add" size={22} color="#FFFFFF" />}
            style={styles.ctaButton}
          />
        </GlassCard>

        {/* Direct quick bypass link */}
        <TouchableOpacity
          style={styles.quickStartButton}
          onPress={handleSkipOrQuickStart}
          activeOpacity={0.6}
        >
          <Text style={[styles.quickStartText, TYPOGRAPHY.labelCaps]}>
            Comenzar con cuenta de efectivo predeterminada
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Configurar Cuenta Inicial */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, TYPOGRAPHY.headlineSm]}>Nueva Cuenta</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Account Type Selector */}
            <View style={styles.typeSelectorRow}>
              {(['CASH', 'BANK', 'PREPAID', 'VAULT'] as AccountType[]).map(t => {
                const isSelected = selectedType === t;
                const label =
                  t === 'CASH'
                    ? 'Efectivo'
                    : t === 'BANK'
                    ? 'Banco'
                    : t === 'PREPAID'
                    ? 'Prepaga'
                    : 'Bóveda';
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedType(t)}
                    style={[
                      styles.typePill,
                      isSelected && styles.typePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        isSelected && styles.typePillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Input: Nombre */}
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>Nombre de la cuenta</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Ej. Efectivo, Santander, Prex"
              placeholderTextColor={COLORS.outline}
            />

            {/* Input: Saldo Inicial */}
            <Text style={[styles.inputLabel, TYPOGRAPHY.labelCaps]}>
              Saldo inicial disponible (UYU $)
            </Text>
            <TextInput
              style={styles.input}
              value={initialBalanceInput}
              onChangeText={setInitialBalanceInput}
              placeholder="0,00"
              placeholderTextColor={COLORS.outline}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <GlowButton
                title="Confirmar y Comenzar"
                onPress={handleCreateAccount}
                loading={isSubmitting}
                style={styles.modalSubmitButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cashflowIncome,
  },
  topBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  emblemHalo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.25,
  },
  illustrationContainer: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    alignItems: 'center',
    marginVertical: 12,
    maxWidth: 340,
  },
  mainTitle: {
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleHighlight: {
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  accountsCard: {
    width: '100%',
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  walletIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  presetsList: {
    gap: 8,
    marginBottom: 16,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerHigh,
    padding: 12,
    borderRadius: 12,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  presetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  presetSubtitle: {
    color: COLORS.onSurfaceVariant,
  },
  presetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetBadge: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  presetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ctaButton: {
    width: '100%',
  },
  quickStartButton: {
    marginTop: 18,
    paddingVertical: 10,
  },
  quickStartText: {
    color: COLORS.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    color: COLORS.onSurface,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  typePillText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.onSurface,
    fontSize: 16,
  },
  modalButtons: {
    marginTop: 24,
  },
  modalSubmitButton: {
    width: '100%',
  },
});
