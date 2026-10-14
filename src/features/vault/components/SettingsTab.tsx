import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/core/theme';
import { GlassCard } from '@/shared/components/GlassCard';
import { useVaultSecurity } from '@/core/state';
import {
  exportDatabaseToJson,
  exportTransactionsToCsv,
  resetDatabase,
  setBiometricsEnabled,
  setRequirePinOnStartup,
} from '@/core/database';
import { triggerSelection } from '@/shared/utils/haptics';

export interface SettingsTabProps {
  onOpenPinModal: () => void;
  onOpenRestoreModal: () => void;
  onShowBackupContent: (title: string, content: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onOpenPinModal,
  onOpenRestoreModal,
  onShowBackupContent,
}) => {
  const { security } = useVaultSecurity();
  const [themeMode, setThemeMode] = useState<'DARK' | 'LIGHT' | 'SYSTEM'>('DARK');

  const handleToggleBiometrics = (val: boolean) => {
    triggerSelection();
    setBiometricsEnabled(val);
  };

  const handleToggleStartupPin = (val: boolean) => {
    triggerSelection();
    setRequirePinOnStartup(val);
  };

  const handleExportBackup = async () => {
    triggerSelection();
    const json = exportDatabaseToJson();
    try {
      await Share.share({
        title: 'Respaldo Kyrara Gez (.kyrarabez)',
        message: json,
      });
    } catch {
      onShowBackupContent('Respaldo .kyrarabez (JSON Autónomo)', json);
    }
  };

  const handleExportCsv = async () => {
    triggerSelection();
    const csv = exportTransactionsToCsv();
    try {
      await Share.share({
        title: 'Movimientos Kyrara Gez.csv',
        message: csv,
      });
    } catch {
      onShowBackupContent('Exportación CSV / Excel', csv);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Restablecer datos',
      '¿Deseas restablecer la base de datos local? Todos los registros no respaldados se eliminarán definitivamente de este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: () => {
            resetDatabase();
            router.replace('/(onboarding)');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Intro */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.mainSectionTitle, TYPOGRAPHY.headlineLg]}>
            Ajustes y Privacidad
          </Text>
          <Text style={[styles.mainSectionSubtitle, TYPOGRAPHY.bodySm]}>
            Control absoluto y almacenamiento local en tu terminal
          </Text>
        </View>

        <View style={styles.offlineBadge}>
          <MaterialIcons name="offline-bolt" size={14} color={COLORS.tertiary} />
          <Text style={[styles.offlineText, TYPOGRAPHY.labelCaps]}>OFFLINE</Text>
        </View>
      </View>

      {/* Bóveda Cero Nube Hero Banner */}
      <GlassCard style={styles.vaultBanner}>
        <View style={styles.vaultBannerTop}>
          <View style={styles.vaultShieldIcon}>
            <MaterialIcons name="enhanced-encryption" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.vaultBannerTitles}>
            <Text style={[styles.vaultCaps, TYPOGRAPHY.labelCaps]}>BÓVEDA CERO NUBE</Text>
            <Text style={[styles.vaultHeadline, TYPOGRAPHY.headlineSm]}>
              Tu dinero no sale de este teléfono
            </Text>
          </View>
        </View>
        <Text style={[styles.vaultDescription, TYPOGRAPHY.bodySm]}>
          Kyrara Gez opera sin servidores remotos, telemetría ni cuentas online. Las transacciones,
          presupuestos y balances residen únicamente en la memoria física de tu teléfono con SQLite cifrado.
        </Text>
        <View style={styles.vaultBadgesRow}>
          <View style={styles.safePill}>
            <MaterialIcons name="verified-user" size={14} color={COLORS.cashflowIncome} />
            <Text style={[styles.safePillText, TYPOGRAPHY.labelCaps]}>100% Offline & Privado</Text>
          </View>
          <View style={styles.cipherPill}>
            <MaterialIcons name="lock" size={13} color={COLORS.onSurfaceVariant} />
            <Text style={[styles.cipherPillText, TYPOGRAPHY.labelCaps]}>SQLite Local</Text>
          </View>
        </View>
      </GlassCard>

      {/* Apariencia */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <View style={styles.settingsSectionLeft}>
            <MaterialIcons name="palette" size={18} color={COLORS.secondary} />
            <Text style={[styles.settingsSectionTitle, TYPOGRAPHY.headlineSm]}>Apariencia</Text>
          </View>
          <Text style={[styles.settingsSectionRightTag, TYPOGRAPHY.labelCaps]}>TEMA DE INTERFAZ</Text>
        </View>

        <View style={styles.themeSelectorGrid}>
          <TouchableOpacity
            style={[styles.themeOptionBtn, themeMode === 'LIGHT' && styles.themeOptionActive]}
            onPress={() => {
              triggerSelection();
              setThemeMode('LIGHT');
            }}
          >
            <MaterialIcons name="light-mode" size={20} color={COLORS.onSurfaceVariant} />
            <Text style={[styles.themeOptionLabel, TYPOGRAPHY.bodySm]}>Claro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOptionBtn, themeMode === 'DARK' && styles.themeOptionActive]}
            onPress={() => {
              triggerSelection();
              setThemeMode('DARK');
            }}
          >
            <MaterialIcons name="dark-mode" size={20} color={COLORS.primary} />
            <Text style={[styles.themeOptionLabel, TYPOGRAPHY.bodySm, { color: COLORS.primary }]}>
              Oscuro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOptionBtn, themeMode === 'SYSTEM' && styles.themeOptionActive]}
            onPress={() => {
              triggerSelection();
              setThemeMode('SYSTEM');
            }}
          >
            <MaterialIcons name="hdr-auto" size={20} color={COLORS.onSurfaceVariant} />
            <Text style={[styles.themeOptionLabel, TYPOGRAPHY.bodySm]}>Sistema</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Moneda y Formato */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <View style={styles.settingsSectionLeft}>
            <MaterialIcons name="payments" size={18} color={COLORS.primary} />
            <Text style={[styles.settingsSectionTitle, TYPOGRAPHY.headlineSm]}>Moneda y Formato</Text>
          </View>
          <Text style={[styles.settingsSectionRightTag, TYPOGRAPHY.labelCaps]}>CONTABILIDAD</Text>
        </View>

        <GlassCard style={styles.settingsGroup}>
          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconBox}>
                <MaterialIcons name="euro-symbol" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, TYPOGRAPHY.bodyMd]}>Moneda base</Text>
                <Text style={[styles.settingItemSubtitle, TYPOGRAPHY.bodySm]}>
                  UYU ($) • Peso Uruguayo
                </Text>
              </View>
            </View>
            <View style={styles.settingValuePill}>
              <Text style={[styles.settingValueText, TYPOGRAPHY.labelCaps]}>UYU</Text>
            </View>
          </View>

          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconBox}>
                <MaterialIcons name="pin" size={18} color={COLORS.secondary} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, TYPOGRAPHY.bodyMd]}>Separadores numéricos</Text>
                <Text style={[styles.settingItemSubtitle, TYPOGRAPHY.numericTable]}>
                  142.850,00
                </Text>
              </View>
            </View>
            <View style={styles.settingValuePill}>
              <Text style={[styles.settingValueText, TYPOGRAPHY.labelCaps]}>1.000,00</Text>
            </View>
          </View>

          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconBox}>
                <MaterialIcons name="visibility-off" size={18} color={COLORS.cashflowIncome} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingItemTitle, TYPOGRAPHY.bodyMd]}>
                  Bloqueo de Bóveda al Iniciar
                </Text>
                <Text style={[styles.settingItemSubtitle, TYPOGRAPHY.bodySm]}>
                  Solicitar PIN de seguridad al abrir la app
                </Text>
              </View>
            </View>
            <Switch
              value={security.requirePinOnStartup}
              onValueChange={handleToggleStartupPin}
              trackColor={{ false: COLORS.surfaceContainerHighest, true: COLORS.primaryContainer }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </View>

      {/* Seguridad y Acceso */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <View style={styles.settingsSectionLeft}>
            <MaterialIcons name="shield" size={18} color={COLORS.secondary} />
            <Text style={[styles.settingsSectionTitle, TYPOGRAPHY.headlineSm]}>Seguridad y Acceso</Text>
          </View>
          <Text style={[styles.settingsSectionRightTag, TYPOGRAPHY.labelCaps]}>PROTECCIÓN FÍSICA</Text>
        </View>

        <GlassCard style={styles.settingsGroup}>
          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconBox}>
                <MaterialIcons name="pin-drop" size={18} color={COLORS.onSurface} />
              </View>
              <View>
                <Text style={[styles.settingItemTitle, TYPOGRAPHY.bodyMd]}>Código PIN Local</Text>
                <Text style={[styles.settingItemSubtitle, TYPOGRAPHY.bodySm]}>
                  {security.hasPin ? 'Configurado (4 dígitos)' : 'Sin PIN establecido'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.smallOutlineBtn}
              onPress={() => {
                triggerSelection();
                onOpenPinModal();
              }}
            >
              <Text style={[styles.smallOutlineBtnText, TYPOGRAPHY.labelCaps]}>
                {security.hasPin ? 'Cambiar' : 'Activar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={styles.settingIconBox}>
                <MaterialIcons name="fingerprint" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingItemTitle, TYPOGRAPHY.bodyMd]}>
                  Face ID / Huella
                </Text>
                <Text style={[styles.settingItemSubtitle, TYPOGRAPHY.bodySm]}>
                  Desbloqueo biométrico rápido
                </Text>
              </View>
            </View>
            <Switch
              value={security.biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: COLORS.surfaceContainerHighest, true: COLORS.primaryContainer }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </View>

      {/* Gestión de Datos Locales (Backups & Restores) */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsSectionHeader}>
          <View style={styles.settingsSectionLeft}>
            <MaterialIcons name="save" size={18} color={COLORS.cashflowIncome} />
            <Text style={[styles.settingsSectionTitle, TYPOGRAPHY.headlineSm]}>
              Gestión de Datos Locales
            </Text>
          </View>
          <Text style={[styles.settingsSectionRightTag, TYPOGRAPHY.labelCaps]}>RESPALDO</Text>
        </View>

        <GlassCard style={styles.backupCard}>
          <View style={styles.backupCardTop}>
            <View style={styles.backupIconBox}>
              <MaterialIcons name="folder-zip" size={24} color={COLORS.tertiary} />
            </View>
            <View style={styles.backupTitles}>
              <Text style={[styles.backupMainTitle, TYPOGRAPHY.bodyLg]}>
                Copias y Portabilidad
              </Text>
              <Text style={[styles.backupSubtitle, TYPOGRAPHY.bodySm]}>
                Archivos autónomos bajo tu custodia
              </Text>
            </View>
          </View>

          {/* 2 Big Action Buttons */}
          <View style={styles.backupGridBtns}>
            <TouchableOpacity
              style={styles.backupBtn}
              onPress={handleExportBackup}
              activeOpacity={0.8}
            >
              <MaterialIcons name="file-download" size={22} color={COLORS.primary} />
              <View>
                <Text style={[styles.backupBtnTitle, TYPOGRAPHY.bodySm]}>Crear Respaldo</Text>
                <Text style={[styles.backupBtnSub, TYPOGRAPHY.labelCaps]}>.kyrarabez</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backupBtn}
              onPress={() => {
                triggerSelection();
                onOpenRestoreModal();
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="file-upload" size={22} color={COLORS.secondary} />
              <View>
                <Text style={[styles.backupBtnTitle, TYPOGRAPHY.bodySm]}>Restaurar</Text>
                <Text style={[styles.backupBtnSub, TYPOGRAPHY.labelCaps]}>Cargar copia</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Free Formats Sub-Panel */}
          <View style={styles.freeExportSubPanel}>
            <Text style={[styles.freeExportLabel, TYPOGRAPHY.labelCaps]}>
              FORMATOS DE EXPORTACIÓN LIBRE
            </Text>
            <View style={styles.freeExportRow}>
              <TouchableOpacity
                style={styles.freeExportBtn}
                onPress={handleExportCsv}
              >
                <MaterialIcons name="table-view" size={16} color={COLORS.cashflowIncome} />
                <Text style={[styles.freeExportBtnText, TYPOGRAPHY.bodySm]}>CSV / Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.freeExportBtn}
                onPress={handleExportBackup}
              >
                <MaterialIcons name="data-object" size={16} color={COLORS.primary} />
                <Text style={[styles.freeExportBtnText, TYPOGRAPHY.bodySm]}>JSON Estructurado</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.backupInfoRow}>
            <MaterialIcons name="info" size={16} color={COLORS.secondary} />
            <Text style={[styles.backupInfoText, TYPOGRAPHY.bodySm]}>
              Las copias se procesan localmente sin intermediarios.
            </Text>
          </View>
        </GlassCard>
      </View>

      {/* Danger Zone: Reset Button */}
      <View style={styles.dangerZone}>
        <TouchableOpacity
          style={styles.dangerResetBtn}
          onPress={handleResetData}
          activeOpacity={0.8}
        >
          <MaterialIcons name="delete-forever" size={20} color={COLORS.cashflowExpense} />
          <Text style={[styles.dangerResetText, TYPOGRAPHY.bodyMd]}>
            Restablecer base de datos local
          </Text>
        </TouchableOpacity>
        <Text style={[styles.dangerResetSubtitle, TYPOGRAPHY.labelCaps]}>
          Esta acción solo afecta el almacenamiento local de este teléfono
        </Text>
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
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  offlineText: {
    color: COLORS.tertiary,
  },
  vaultBanner: {
    padding: 18,
    borderRadius: 20,
    gap: 12,
  },
  vaultBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vaultShieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultBannerTitles: {
    flex: 1,
  },
  vaultCaps: {
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  vaultHeadline: {
    color: COLORS.onSurface,
    marginTop: 2,
  },
  vaultDescription: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  vaultBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  safePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  safePillText: {
    color: COLORS.cashflowIncome,
  },
  cipherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  cipherPillText: {
    color: COLORS.onSurfaceVariant,
  },
  settingsSection: {
    gap: 10,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsSectionTitle: {
    color: COLORS.onSurface,
  },
  settingsSectionRightTag: {
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  themeSelectorGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 4,
    borderRadius: 16,
    gap: 6,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  themeOptionActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  themeOptionLabel: {
    color: COLORS.onSurfaceVariant,
  },
  settingsGroup: {
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
  },
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemTitle: {
    color: COLORS.onSurface,
  },
  settingItemSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  settingValuePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  settingValueText: {
    color: COLORS.onSurface,
  },
  smallOutlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  smallOutlineBtnText: {
    color: COLORS.onSurface,
  },
  backupCard: {
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  backupCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backupIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupTitles: {
    flex: 1,
  },
  backupMainTitle: {
    color: COLORS.onSurface,
  },
  backupSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  backupGridBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  backupBtnTitle: {
    color: COLORS.onSurface,
  },
  backupBtnSub: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  freeExportSubPanel: {
    gap: 8,
    paddingTop: 4,
  },
  freeExportLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 9,
  },
  freeExportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freeExportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  freeExportBtnText: {
    color: COLORS.onSurface,
  },
  backupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backupInfoText: {
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  dangerZone: {
    gap: 6,
    alignItems: 'center',
    paddingTop: 8,
  },
  dangerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 138, 158, 0.12)',
  },
  dangerResetText: {
    color: COLORS.cashflowExpense,
  },
  dangerResetSubtitle: {
    color: COLORS.outline,
    textAlign: 'center',
  },
});
