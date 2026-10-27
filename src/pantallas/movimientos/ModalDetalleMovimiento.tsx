import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { BotonBrillante as GlowButton } from '@/compartido/componentes/BotonBrillante';
import {
  MovimientoEnriquecido as EnrichedTransaction,
  actualizarMovimiento as updateTransaction,
  eliminarMovimiento as deleteTransaction,
} from '@/datos';
import {
  formatearMoneda as formatCurrency,
  convertirMontoACentavos as parseAmountToCents,
} from '@/compartido/utilidades/moneda';
import {
  vibracionLigera as triggerImpactLight,
  vibracionExito as triggerSuccess,
  vibracionAdvertencia as triggerWarning,
  vibracionSeleccion as triggerSelection,
} from '@/compartido/utilidades/hapticos';

export interface PropiedadesModalDetalleMovimiento {
  visible: boolean;
  transaction: EnrichedTransaction | null;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

export function ModalDetalleMovimiento({
  visible,
  transaction,
  onClose,
  onDeleted,
  onUpdated,
}: PropiedadesModalDetalleMovimiento) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPayee, setEditPayee] = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editNote, setEditNote] = useState('');

  if (!transaction) return null;

  const isExpense = transaction.type === 'EXPENSE';
  const isIncome = transaction.type === 'INCOME';

  const typeColor = isIncome
    ? COLORS.cashflowIncome
    : isExpense
    ? COLORS.cashflowExpense
    : COLORS.cashflowTransfer;

  const typeLabel = isIncome
    ? 'INGRESO ASENTADO'
    : isExpense
    ? 'GASTO REGISTRADO'
    : 'TRASPASO DE FONDOS';

  const txDate = new Date(transaction.date);
  const formattedDate = txDate.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = txDate.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleStartEditing = () => {
    triggerSelection();
    setEditPayee(transaction.payee || '');
    setEditAmountStr((transaction.amount / 100).toFixed(2));
    setEditNote(transaction.note || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const amountCents = parseAmountToCents(editAmountStr);
    if (amountCents <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a 0');
      return;
    }

    try {
      updateTransaction(transaction.id, {
        amount: amountCents,
        payee: editPayee.trim() || undefined,
        note: editNote.trim() || undefined,
      });
      triggerSuccess();
      setIsEditing(false);
      if (onUpdated) onUpdated();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    }
  };

  const handleShareVoucher = async () => {
    triggerImpactLight();
    const message = `🏛️ KYRARA GEZ • COMPROBANTE DE BÓVEDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tipo: ${typeLabel}
Monto: ${isIncome ? '+' : isExpense ? '-' : ''}${formatCurrency(transaction.amount)}
Beneficiario/Comercio: ${transaction.payee || transaction.categoryName}
Categoría: ${transaction.categoryName}
Cuenta: ${transaction.sourceAccountName}${transaction.targetAccountName ? ` ➔ ${transaction.targetAccountName}` : ''}
Fecha: ${formattedDate} a las ${formattedTime}
${transaction.note ? `Nota: "${transaction.note}"\n` : ''}ID Local: TX-${transaction.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seguridad Cero Nube • Cifrado Local SQLite AES-256`;

    try {
      await Share.share({
        message,
        title: `Comprobante ${transaction.payee || transaction.categoryName}`,
      });
    } catch {
      // Ignorar cancelaciones
    }
  };

  const handleDeletePrompt = () => {
    triggerWarning();
    Alert.alert(
      'Eliminar Registro',
      '¿Deseas revertir esta operación de tu bóveda local? El saldo de la cuenta será restablecido automáticamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(transaction.id);
            triggerSuccess();
            onClose();
            if (onDeleted) onDeleted();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {
        setIsEditing(false);
        onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            setIsEditing(false);
            onClose();
          }}
        />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <MaterialIcons name="verified-user" size={14} color={COLORS.secondary} />
              <Text style={[styles.headerBadgeText, TYPOGRAPHY.labelCaps]}>
                Comprobante de Bóveda
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsEditing(false);
                onClose();
              }}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" size={22} color={COLORS.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.body}
          >
            {/* Voucher Ticket Card */}
            <GlassCard variant="surface" style={styles.voucherCard}>
              {/* Type Chip */}
              <View style={[styles.typeChip, { backgroundColor: `${typeColor}18` }]}>
                <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
                <Text style={[styles.typeChipText, { color: typeColor }, TYPOGRAPHY.labelCaps]}>
                  {typeLabel}
                </Text>
              </View>

              {/* Amount Display or Edit Input */}
              {isEditing ? (
                <View style={styles.editAmountBox}>
                  <Text style={[styles.editAmountCurrency, TYPOGRAPHY.labelCaps]}>UYU ($)</Text>
                  <TextInput
                    style={[styles.editAmountInput, TYPOGRAPHY.displayHeroMobile]}
                    value={editAmountStr}
                    onChangeText={setEditAmountStr}
                    keyboardType="numeric"
                    autoFocus
                    placeholderTextColor={COLORS.outline}
                  />
                </View>
              ) : (
                <Text
                  style={[
                    styles.amountText,
                    { color: typeColor },
                    TYPOGRAPHY.displayHeroMobile,
                  ]}
                >
                  {isIncome ? '+ ' : isExpense ? '- ' : ''}
                  {formatCurrency(transaction.amount)}
                </Text>
              )}

              {/* Security Banner */}
              <View style={styles.watermarkRow}>
                <MaterialIcons name="lock" size={12} color={COLORS.outline} />
                <Text style={[styles.watermarkText, TYPOGRAPHY.labelCaps]}>
                  Bóveda Cero Nube • Hash TX-{transaction.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>

              <View style={styles.ticketDivider} />

              {/* Data Table */}
              <View style={styles.dataGrid}>
                {/* Concepto / Payee */}
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, TYPOGRAPHY.labelCaps]}>Concepto / Comercio</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={editPayee}
                      onChangeText={setEditPayee}
                      placeholder="Ej. Supermercado, Alquiler..."
                      placeholderTextColor={COLORS.outline}
                    />
                  ) : (
                    <Text style={[styles.dataValue, TYPOGRAPHY.bodyMd]}>
                      {transaction.payee || transaction.categoryName}
                    </Text>
                  )}
                </View>

                {/* Categoría */}
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, TYPOGRAPHY.labelCaps]}>Categoría</Text>
                  <View style={styles.categoryBadge}>
                    <MaterialIcons
                      name={transaction.categoryIcon as any}
                      size={16}
                      color={transaction.categoryColor || COLORS.secondary}
                    />
                    <Text style={[styles.categoryName, TYPOGRAPHY.bodySm]}>
                      {transaction.categoryName}
                    </Text>
                  </View>
                </View>

                {/* Cuenta Origen */}
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, TYPOGRAPHY.labelCaps]}>Cuenta Implicada</Text>
                  <View style={styles.accountBadge}>
                    <MaterialIcons name="account-balance" size={14} color={COLORS.secondary} />
                    <Text style={[styles.accountName, TYPOGRAPHY.bodySm]}>
                      {transaction.sourceAccountName}
                      {transaction.targetAccountName ? ` ➔ ${transaction.targetAccountName}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Fecha y Hora */}
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, TYPOGRAPHY.labelCaps]}>Momento de Asentamiento</Text>
                  <Text style={[styles.dataValue, TYPOGRAPHY.bodySm]}>
                    {formattedDate} • {formattedTime}
                  </Text>
                </View>

                {/* Nota */}
                <View style={styles.dataRow}>
                  <Text style={[styles.dataLabel, TYPOGRAPHY.labelCaps]}>Nota de Auditoría</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.textInput, { minHeight: 60 }]}
                      value={editNote}
                      onChangeText={setEditNote}
                      placeholder="Añadir observaciones..."
                      placeholderTextColor={COLORS.outline}
                      multiline
                    />
                  ) : (
                    <Text style={[styles.dataValue, TYPOGRAPHY.bodySm]}>
                      {transaction.note ? `"${transaction.note}"` : 'Sin observaciones adicionales'}
                    </Text>
                  )}
                </View>
              </View>
            </GlassCard>

            {/* Actions Grid */}
            <View style={styles.actionsContainer}>
              {isEditing ? (
                <View style={styles.editingActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={[styles.cancelEditText, TYPOGRAPHY.labelCaps]}>Cancelar</Text>
                  </TouchableOpacity>
                  <GlowButton
                    title="Guardar Cambios"
                    variant="secondary"
                    onPress={handleSaveEdit}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    activeOpacity={0.8}
                    onPress={handleShareVoucher}
                  >
                    <MaterialIcons name="share" size={18} color="#0B0F10" />
                    <Text style={[styles.shareBtnText, TYPOGRAPHY.labelCaps]}>
                      Compartir Comprobante
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.secondaryActionsRow}>
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      activeOpacity={0.8}
                      onPress={handleStartEditing}
                    >
                      <MaterialIcons name="edit" size={16} color={COLORS.secondary} />
                      <Text style={[styles.editActionText, TYPOGRAPHY.labelCaps]}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      activeOpacity={0.8}
                      onPress={handleDeletePrompt}
                    >
                      <MaterialIcons name="delete-outline" size={16} color={COLORS.cashflowExpense} />
                      <Text style={[styles.deleteActionText, TYPOGRAPHY.labelCaps]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    flexShrink: 1,
    backgroundColor: '#0E1314',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
    overflow: 'hidden',
  },
  scrollArea: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 222, 196, 0.1)',
  },
  headerBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  voucherCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  editAmountBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  editAmountCurrency: {
    color: COLORS.outline,
    fontSize: 10,
  },
  editAmountInput: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
    textAlign: 'center',
    minWidth: 180,
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  watermarkText: {
    color: COLORS.outline,
    fontSize: 10,
  },
  ticketDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
    borderStyle: 'dashed',
  },
  dataGrid: {
    width: '100%',
    gap: 14,
  },
  dataRow: {
    gap: 4,
  },
  dataLabel: {
    color: COLORS.outline,
    fontSize: 10,
  },
  dataValue: {
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryName: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accountName: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 10,
  },
  shareBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnText: {
    color: '#0B0F10',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 222, 196, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 196, 0.2)',
  },
  editActionText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 138, 158, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 158, 0.2)',
  },
  deleteActionText: {
    color: COLORS.cashflowExpense,
    fontSize: 11,
    fontWeight: '700',
  },
  editingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelEditBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelEditText: {
    color: COLORS.outline,
    fontSize: 11,
  },
});

// Alias compatibles
export const TransactionDetailModal = ModalDetalleMovimiento;
export type TransactionDetailModalProps = PropiedadesModalDetalleMovimiento;

