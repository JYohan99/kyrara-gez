import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { useVaultAccounts } from '@/core/state';
import { Account } from '@/core/database/types';
import { formatCurrency } from '@/shared/utils/currency';
import { triggerSelection } from '@/shared/utils/haptics';

export interface AccountsTabProps {
  onNewAccount: () => void;
  onEditAccount: (account: Account) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  onNewAccount,
  onEditAccount,
}) => {
  const { accounts } = useVaultAccounts();
  const [hideBalances, setHideBalances] = useState(false);

  // Total balance consolidado
  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  }, [accounts]);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.mainSectionTitle, TYPOGRAPHY.headlineLg]}>
            Mis Cuentas
          </Text>
          <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
            Dónde está tu dinero
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => {
            triggerSelection();
            onNewAccount();
          }}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Nueva cuenta"
        >
          <MaterialIcons name="add" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Hero Card: Total Consolidado */}
      <GlassCard style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={[styles.heroTotalLabel, TYPOGRAPHY.labelCaps]}>TOTAL CONSOLIDADO</Text>
            <View style={styles.heroBalanceRow}>
              <Text style={[styles.heroBalanceText, TYPOGRAPHY.displayHeroMobile]}>
                {hideBalances ? '••••••••' : formatCurrency(totalBalance)}
              </Text>
              <Text style={[styles.heroCurrencyLabel, TYPOGRAPHY.labelCaps]}>UYU</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => {
              triggerSelection();
              setHideBalances(!hideBalances);
            }}
          >
            <MaterialIcons
              name={hideBalances ? 'visibility' : 'visibility-off'}
              size={18}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.heroStatusRow}>
          <View style={styles.statusDotRow}>
            <View style={styles.activeDot} />
            <Text style={[styles.statusText, TYPOGRAPHY.bodySm]}>
              {accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
            </Text>
          </View>
          <Text style={[styles.liquidText, TYPOGRAPHY.labelCaps]}>BÓVEDA LOCAL</Text>
        </View>

        {/* Distribution Bar */}
        {totalBalance > 0 && accounts.length > 0 && (
          <View style={styles.distBarSection}>
            <View style={styles.distBarTrack}>
              {accounts.map(a => {
                const share = (Math.max(0, a.currentBalance) / totalBalance) * 100;
                if (share <= 0) return null;
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.distBarPiece,
                      { width: `${share}%`, backgroundColor: a.color || COLORS.primary },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.distLegendRow}>
              {accounts.slice(0, 4).map(a => {
                const share = Math.round((Math.max(0, a.currentBalance) / totalBalance) * 100);
                return (
                  <View key={a.id} style={styles.distLegendItem}>
                    <View
                      style={[
                        styles.distLegendDot,
                        { backgroundColor: a.color || COLORS.primary },
                      ]}
                    />
                    <Text style={[styles.distLegendText, TYPOGRAPHY.labelCaps]} numberOfLines={1}>
                      {share}% {a.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </GlassCard>

      {/* Accounts List */}
      <View style={styles.accountsListSection}>
        <Text style={[styles.listHeaderLabel, TYPOGRAPHY.labelCaps]}>
          CUENTAS DISPONIBLES (TOCA PARA EDITAR)
        </Text>

        <View style={styles.accountsGrid}>
          {accounts.map(acc => {
            const share = totalBalance > 0
              ? Math.round((Math.max(0, acc.currentBalance) / totalBalance) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={acc.id}
                style={styles.accountCard}
                onPress={() => {
                  triggerSelection();
                  onEditAccount(acc);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.accCardTop}>
                  <View style={styles.accCardLeft}>
                    <View
                      style={[
                        styles.accIconBox,
                        { backgroundColor: `${acc.color || COLORS.primary}25` },
                      ]}
                    >
                      <MaterialIcons
                        name={acc.icon as any || 'account-balance'}
                        size={22}
                        color={acc.color || COLORS.primary}
                      />
                    </View>
                    <View style={styles.accInfoCol}>
                      <View style={styles.accNameRow}>
                        <Text style={[styles.accName, TYPOGRAPHY.headlineSm]}>
                          {acc.name}
                        </Text>
                        {acc.type === 'BANK' && (
                          <View style={styles.principalBadge}>
                            <Text style={[styles.principalBadgeText, TYPOGRAPHY.labelCaps]}>
                              Banco
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.accTypeLabel, TYPOGRAPHY.bodySm]}>
                        {acc.type === 'CASH'
                          ? 'Efectivo Físico'
                          : acc.type === 'BANK'
                            ? 'Caja de Ahorro UYU'
                            : acc.type === 'PREPAID'
                              ? 'Tarjeta Prepaga'
                              : 'Bóveda de Reserva'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.accCardRight}>
                    <Text style={[styles.accBalance, TYPOGRAPHY.numericTable]}>
                      {hideBalances ? '••••••••' : formatCurrency(acc.currentBalance)}
                    </Text>
                    <Text style={[styles.accShare, TYPOGRAPHY.labelCaps]}>
                      {share}% del total
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainSectionTitle: {
    color: COLORS.onSurface,
  },
  mainSectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  actionBtnPrimary: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(209, 188, 255, 0.14)',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 28, 29, 0.95)',
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTotalLabel: {
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  heroBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  heroBalanceText: {
    color: COLORS.onSurface,
  },
  heroCurrencyLabel: {
    color: COLORS.onSurfaceVariant,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cashflowIncome,
  },
  statusText: {
    color: COLORS.onSurfaceVariant,
  },
  liquidText: {
    color: COLORS.tertiary,
    marginLeft: 'auto',
  },
  distBarSection: {
    gap: 8,
    paddingTop: 4,
  },
  distBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  distBarPiece: {
    height: '100%',
  },
  distLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  distLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distLegendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  distLegendText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  accountsListSection: {
    gap: 10,
  },
  listHeaderLabel: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  accountsGrid: {
    gap: 10,
  },
  accountCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
  },
  accCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accInfoCol: {
    flex: 1,
  },
  accNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accName: {
    color: COLORS.onSurface,
  },
  principalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 210, 255, 0.15)',
  },
  principalBadgeText: {
    color: COLORS.secondary,
    fontSize: 9,
  },
  accTypeLabel: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  accCardRight: {
    alignItems: 'flex-end',
  },
  accBalance: {
    color: COLORS.onSurface,
  },
  accShare: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
});
