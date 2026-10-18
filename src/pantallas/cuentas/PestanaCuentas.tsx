import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { useCuentasBoveda as useVaultAccounts } from '@/datos/hooks';
import { Cuenta } from '@/datos/tipos';
import { formatearMoneda as formatCurrency } from '@/compartido/utilidades/moneda';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesPestanaCuentas {
  onNewAccount: () => void;
  onEditAccount: (account: Cuenta) => void;
}
export type AccountsTabProps = PropiedadesPestanaCuentas;

export const PestanaCuentas: React.FC<PropiedadesPestanaCuentas> = ({
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
          style={styles.actionBtnWrapper}
          onPress={() => {
            triggerSelection();
            onNewAccount();
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Nueva cuenta"
        >
          <LinearGradient
            colors={['#9B5CFF', '#6A1FE8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionBtnGradient}
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Hero Card: Total Consolidado */}
      <GlassCard style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelGroup}>
            <View style={styles.heroDot} />
            <Text style={[styles.heroLabelText, TYPOGRAPHY.labelCaps]}>
              PATRIMONIO TOTAL
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerSelection();
              setHideBalances(!hideBalances);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name={hideBalances ? 'visibility-off' : 'visibility'}
              size={20}
              color={COLORS.outline}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.heroBalanceText, TYPOGRAPHY.displayHeroMobile]}>
          {hideBalances ? '••••••' : formatCurrency(totalBalance)}
        </Text>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroStatLabel, TYPOGRAPHY.labelCaps]}>Cuentas Activas</Text>
            <Text style={[styles.heroStatValue, TYPOGRAPHY.headlineSm]}>
              {accounts.length}
            </Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroStatLabel, TYPOGRAPHY.labelCaps]}>Moneda Base</Text>
            <Text style={[styles.heroStatValue, TYPOGRAPHY.headlineSm]}>UYU ($)</Text>
          </View>
        </View>
      </GlassCard>

      {/* List of Accounts */}
      <View style={styles.listSection}>
        <Text style={[styles.listSectionTitle, TYPOGRAPHY.labelCaps]}>
          CUENTAS BANCARIAS Y BILLETERAS
        </Text>

        <View style={styles.accountsList}>
          {accounts.map(acc => {
            const share = totalBalance > 0
              ? Math.max(0, Math.round((acc.currentBalance / totalBalance) * 100))
              : 0;

            const iconName = acc.type === 'CASH'
              ? 'payments'
              : acc.type === 'PREPAID'
              ? 'credit-card'
              : acc.type === 'VAULT'
              ? 'lock'
              : 'account-balance';

            const iconColor = acc.type === 'CASH'
              ? COLORS.cashflowIncome
              : acc.type === 'PREPAID'
              ? COLORS.secondary
              : acc.type === 'VAULT'
              ? '#FFB74D'
              : COLORS.primary;

            return (
              <TouchableOpacity
                key={acc.id}
                style={styles.accCard}
                onPress={() => {
                  triggerSelection();
                  onEditAccount(acc);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.accCardLeft}>
                  <View style={[styles.accIconBox, { backgroundColor: `${iconColor}20` }]}>
                    <MaterialIcons name={iconName as any} size={22} color={iconColor} />
                  </View>
                  <View style={styles.accInfoCol}>
                    <View style={styles.accNameRow}>
                      <Text style={[styles.accName, TYPOGRAPHY.headlineSm]}>
                        {acc.name}
                      </Text>
                      {acc.isDefault === 1 && (
                        <View style={styles.principalBadge}>
                          <Text style={[styles.principalBadgeText, TYPOGRAPHY.labelCaps]}>
                            Principal
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.accTypeLabel, TYPOGRAPHY.bodySm]}>
                      {acc.type === 'BANK'
                        ? 'Banco'
                        : acc.type === 'CASH'
                        ? 'Efectivo'
                        : acc.type === 'PREPAID'
                        ? 'Prepagada / Digital'
                        : 'Bóveda de Ahorro'}
                    </Text>
                  </View>
                </View>

                <View style={styles.accCardRight}>
                  <Text style={[styles.accBalance, TYPOGRAPHY.headlineSm]}>
                    {hideBalances ? '••••' : formatCurrency(acc.currentBalance)}
                  </Text>
                  <Text style={[styles.accShare, TYPOGRAPHY.bodySm]}>
                    {share}% del total
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const PestañaCuentas = PestanaCuentas;
export const AccountsTab = PestanaCuentas;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  mainSectionTitle: {
    color: COLORS.onSurface,
  },
  mainSectionSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  actionBtnWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    shadowColor: '#8A4FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroCard: {
    padding: 20,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  heroLabelText: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  heroBalanceText: {
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroStatItem: {
    flex: 1,
    gap: 4,
  },
  heroStatLabel: {
    color: COLORS.outline,
    fontSize: 10,
  },
  heroStatValue: {
    color: COLORS.onSurface,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  listSection: {
    gap: 10,
    marginTop: 8,
  },
  listSectionTitle: {
    color: COLORS.outline,
    letterSpacing: 1.1,
    paddingHorizontal: 2,
  },
  accountsList: {
    gap: 8,
  },
  accCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
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
