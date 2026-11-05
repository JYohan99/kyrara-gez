import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard, EncabezadoSuperior, BotonFlotanteAccion } from '@/compartido/componentes';
import { ModalNuevoMovimiento as NewTransactionModal } from '@/pantallas/movimientos/ModalNuevoMovimiento';
import { ModalDetalleMovimiento as TransactionDetailModal } from '@/pantallas/movimientos/ModalDetalleMovimiento';
import { vibracionSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';
import { TipoFlujo as FlowType } from '@/datos';
import { MovimientoEnriquecido as EnrichedTransaction, Cuenta } from '@/datos/tipos';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { useCuentasBoveda as useVaultAccounts, useMovimientosBoveda as useVaultTransactions } from '@/datos/hooks';
import { FilaMovimiento as TransactionRow } from '@/pantallas/movimientos/FilaMovimiento';
import { ModalCuenta as AccountModal } from '@/pantallas/cuentas/ModalCuenta';

export function PantallaInicio() {
  // Hooks reactivos de la bóveda
  const { accounts, totalBalance: totalCents } = useVaultAccounts();
  const { transactions: recentTransactions, summary } = useVaultTransactions({ limit: 4 });

  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<FlowType>('EXPENSE');
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Cuenta | null>(null);

  const currentMonthLabel = useMemo(() => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const openModal = (type: FlowType) => {
    triggerSelection();
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <EncabezadoSuperior seccion="INICIO" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Line */}
        <View style={styles.statusRow}>
          <View style={styles.dateSelector}>
            <MaterialIcons name="calendar-today" size={14} color={COLORS.secondary} />
            <Text style={[styles.dateText, TYPOGRAPHY.numericTable]}>{currentMonthLabel}</Text>
          </View>
        </View>

        {/* Hero Card: Dinero Disponible */}
        <GlassCard style={styles.heroCard}>
          {/* Ambient Glows */}
          <View style={styles.heroGlowPurple} />
          <View style={styles.heroGlowCyan} />

          <View style={styles.heroHeader}>
            <View style={styles.heroLabelRow}>
              <Text style={[styles.heroLabel, TYPOGRAPHY.labelCaps]}>Dinero disponible</Text>
              <TouchableOpacity
                onPress={() => {
                  triggerSelection();
                  setIsBalanceHidden(!isBalanceHidden);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeBtn}
              >
                <MaterialIcons
                  name={isBalanceHidden ? 'visibility-off' : 'visibility'}
                  size={18}
                  color={COLORS.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.flowBadge}>
              <MaterialIcons name="auto-awesome" size={12} color={COLORS.primary} />
            </View>
          </View>

          {/* Hero Figure */}
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceNumber, TYPOGRAPHY.displayHeroMobile]}>
              {formatCurrency(totalCents, { hidden: isBalanceHidden })}
            </Text>
          </View>

          {/* Cashflow Quick Metrics Strip */}
          <TouchableOpacity
            style={styles.metricsStrip}
            activeOpacity={0.8}
            onPress={() => {
              triggerSelection();
              router.push('/(tabs)/movimientos');
            }}
          >
            {/* Ingresos */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeading}>
                <MaterialIcons name="trending-up" size={14} color={COLORS.cashflowIncome} />
                <Text style={[styles.metricLabel, { color: COLORS.cashflowIncome }, TYPOGRAPHY.labelCaps]}>
                  Ingresos
                </Text>
              </View>
              <Text style={[styles.metricValue, TYPOGRAPHY.numericTable]}>
                +{formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            {/* Gastos */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeading}>
                <MaterialIcons name="trending-down" size={14} color={COLORS.cashflowExpense} />
                <Text style={[styles.metricLabel, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                  Gastos
                </Text>
              </View>
              <Text style={[styles.metricValue, TYPOGRAPHY.numericTable]}>
                -{formatCurrency(summary.totalExpense)}
              </Text>
            </View>

            {/* Superávit */}
            <View style={styles.metricCol}>
              <View style={styles.metricHeading}>
                <MaterialIcons name="savings" size={14} color={COLORS.primary} />
                <Text style={[styles.metricLabel, { color: COLORS.primary }, TYPOGRAPHY.labelCaps]}>
                  Superávit
                </Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  summary.netSavings >= 0 ? { color: COLORS.primaryFixedDim } : { color: COLORS.cashflowExpense },
                  TYPOGRAPHY.numericTable,
                ]}
              >
                {summary.netSavings >= 0 ? '+' : ''}
                {formatCurrency(summary.netSavings)}
              </Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Quick Operational Actions (Gasto, Ingreso, Traspaso) */}
        <GlassCard variant="low" style={styles.quickActionsCard}>
          <View style={styles.sectionHeaderSimple}>
            <Text style={[styles.sectionTitleCaps, TYPOGRAPHY.labelCaps]}>Acceso rápido</Text>
            <Text style={[styles.sectionLink, TYPOGRAPHY.labelCaps]}>Operar</Text>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionBtnExpense}
              activeOpacity={0.7}
              onPress={() => openModal('EXPENSE')}
            >
              <MaterialIcons name="remove-circle-outline" size={18} color={COLORS.cashflowExpense} />
              <Text style={[styles.actionBtnText, { color: COLORS.cashflowExpense }, TYPOGRAPHY.labelCaps]}>
                Gasto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnIncome}
              activeOpacity={0.7}
              onPress={() => openModal('INCOME')}
            >
              <MaterialIcons name="add-circle-outline" size={18} color={COLORS.cashflowIncome} />
              <Text style={[styles.actionBtnText, { color: COLORS.cashflowIncome }, TYPOGRAPHY.labelCaps]}>
                Ingreso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnTransfer}
              activeOpacity={0.7}
              onPress={() => openModal('TRANSFER')}
            >
              <MaterialIcons name="swap-horiz" size={18} color={COLORS.primary} />
              <Text style={[styles.actionBtnText, { color: COLORS.primary }, TYPOGRAPHY.labelCaps]}>
                Traspaso
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Mis Cuentas */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.headlineSm]}>Mis cuentas</Text>
            <Text style={[styles.sectionActionText, TYPOGRAPHY.labelCaps]}>
              {accounts.length} {accounts.length === 1 ? 'configurada' : 'configuradas'}
            </Text>
          </View>

          <View style={styles.accountsGrid}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={styles.accountCardWrapper}
                activeOpacity={0.7}
                onPress={() => {
                  triggerSelection();
                  setEditingAccount(acc);
                  setAccountModalVisible(true);
                }}
              >
                <GlassCard variant="high" style={styles.accountCard}>
                  <View style={styles.accountCardTop}>
                    <View
                      style={[
                        styles.accountIconBox,
                        {
                          backgroundColor:
                            acc.type === 'CASH'
                              ? `${COLORS.cashflowIncome}20`
                              : acc.type === 'BANK'
                                ? `${COLORS.secondaryContainer}20`
                                : `${COLORS.primaryContainer}20`,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={
                          acc.type === 'CASH'
                            ? 'payments'
                            : acc.type === 'BANK'
                              ? 'account-balance'
                              : acc.type === 'PREPAID'
                                ? 'credit-card'
                                : 'lock'
                        }
                        size={18}
                        color={
                          acc.type === 'CASH'
                            ? COLORS.cashflowIncome
                            : acc.type === 'BANK'
                              ? COLORS.secondary
                              : COLORS.primary
                        }
                      />
                    </View>
                    <Text style={[styles.accountTypeBadge, TYPOGRAPHY.labelCaps]}>
                      {acc.type === 'CASH'
                        ? 'Físico'
                        : acc.type === 'BANK'
                          ? 'Banco'
                          : acc.type === 'PREPAID'
                            ? 'Virtual'
                            : 'Vault'}
                    </Text>
                  </View>

                  <View style={styles.accountCardBottom}>
                    <Text style={[styles.accountCardName, TYPOGRAPHY.bodySm]} numberOfLines={1}>
                      {acc.name}
                    </Text>
                    <Text style={[styles.accountCardBalance, TYPOGRAPHY.numericTable]}>
                      {formatCurrency(acc.currentBalance, { hidden: isBalanceHidden })}
                    </Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}

            {/* Tarjeta para agregar nueva cuenta */}
            <TouchableOpacity
              style={styles.addAccountCard}
              activeOpacity={0.7}
              onPress={() => {
                triggerSelection();
                setEditingAccount(null);
                setAccountModalVisible(true);
              }}
            >
              <View style={styles.addAccountIconBox}>
                <MaterialIcons name="add" size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.addAccountTitle, TYPOGRAPHY.labelCaps]}>
                + Nueva cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Últimos Movimientos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, TYPOGRAPHY.headlineSm]}>Últimos movimientos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/movimientos')}>
              <View style={styles.viewAllRow}>
                <Text style={[styles.viewAllText, TYPOGRAPHY.labelCaps]}>Ver todos</Text>
                <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <GlassCard variant="surface" style={styles.recentEmptyCard}>
              <MaterialIcons name="receipt-long" size={24} color={COLORS.outline} />
              <Text style={[styles.recentEmptyText, TYPOGRAPHY.bodySm]}>
                Aún no has registrado transacciones este mes.
              </Text>
              <TouchableOpacity onPress={() => openModal('EXPENSE')}>
                <Text style={[styles.recentAddLink, TYPOGRAPHY.labelCaps]}>
                  + Añadir un gasto o ingreso
                </Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <View style={styles.recentList}>
              {recentTransactions.map((tx, idx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  mostrarDivisor={idx < recentTransactions.length - 1}
                  onPress={() => {
                    triggerSelection();
                    setSelectedTransaction(tx);
                    setDetailModalVisible(true);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón Circular Flotante (FAB) - Nuevo Movimiento */}
      <BotonFlotanteAccion
        onPress={() => openModal('EXPENSE')}
        accessibilityLabel="Nuevo movimiento"
      />

      {/* New Transaction Modal */}
      <NewTransactionModal
        visible={modalVisible}
        initialType={modalType}
        onClose={() => setModalVisible(false)}
      />

      {/* Transaction Detail Voucher Modal */}
      <TransactionDetailModal
        visible={detailModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
      />

      {/* Account Modal (Crear / Editar cuenta) */}
      <AccountModal
        visible={accountModalVisible}
        editingAccount={editingAccount}
        onClose={() => setAccountModalVisible(false)}
      />
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
    paddingTop: 16,
    paddingBottom: 110,
    gap: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cashflowIncome,
  },
  liveText: {
    color: COLORS.cashflowIncome,
    fontSize: 9,
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(24, 28, 29, 0.95)',
    position: 'relative',
    overflow: 'hidden',
    gap: 12,
  },
  heroGlowPurple: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  heroGlowCyan: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLabel: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  eyeBtn: {
    padding: 2,
  },
  flowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  flowBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
  },
  balanceRow: {
    marginVertical: 4,
  },
  balanceNumber: {
    color: COLORS.onSurface,
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricCol: {
    flex: 1,
    gap: 2,
  },
  metricHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 9,
  },
  metricValue: {
    color: COLORS.onSurface,
  },
  quickActionsCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  sectionHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleCaps: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  sectionLink: {
    color: COLORS.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnExpense: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 138, 158, 0.1)',
  },
  actionBtnIncome: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(87, 245, 171, 0.1)',
  },
  actionBtnTransfer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(138, 79, 255, 0.1)',
  },
  actionBtnText: {
    fontSize: 10,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.onSurface,
  },
  sectionActionText: {
    color: COLORS.primary,
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accountCardWrapper: {
    width: '48%',
  },
  accountCard: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  addAccountCard: {
    width: '48%',
    minHeight: 88,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(209, 188, 255, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(209, 188, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addAccountIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(209, 188, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountTitle: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeBadge: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  accountCardBottom: {
    gap: 2,
  },
  accountCardName: {
    color: COLORS.onSurfaceVariant,
  },
  accountCardBalance: {
    color: COLORS.onSurface,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: COLORS.primary,
  },
  recentEmptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  recentEmptyText: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  recentAddLink: {
    color: COLORS.secondary,
    marginTop: 4,
  },
  recentList: {
    backgroundColor: '#16191B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
});

// Alias compatible
export const HomeScreen = PantallaInicio;

