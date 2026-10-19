import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORES as COLORS, TIPOGRAFIA as TYPOGRAPHY } from '@/compartido/tema';
import { TarjetaVidrio as GlassCard } from '@/compartido/componentes/TarjetaVidrio';
import { useSeguridadBoveda as useVaultSecurity } from '@/datos/hooks';
import {
  exportarBaseDatosAJson as exportDatabaseToJson,
  exportarTransaccionesACsv as exportTransactionsToCsv,
} from '@/datos/consultas/respaldos';
import {
  restablecerBaseDatos as resetDatabase,
  establecerBiometriaHabilitada as setBiometricsEnabled,
  establecerRequerirPinAlIniciar as setRequirePinOnStartup,
} from '@/datos/consultas/seguridad';
import { gatillarSeleccion as triggerSelection } from '@/compartido/utilidades/hapticos';

export interface PropiedadesPestanaAjustes {
  onOpenPinModal: () => void;
  onOpenRestoreModal: () => void;
  onShowBackupContent: (title: string, content: string) => void;
}
export type SettingsTabProps = PropiedadesPestanaAjustes;

export const PestanaAjustes: React.FC<PropiedadesPestanaAjustes> = ({
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
    try {
      const json = exportDatabaseToJson();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `kyrara_respaldo_${dateStr}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Guardar respaldo de Kyrara Gez',
          UTI: 'public.json',
        });
      } else {
        onShowBackupContent('Respaldo JSON', json);
      }
    } catch (err: any) {
      console.error('Error al exportar respaldo JSON:', err);
      Alert.alert('Error', 'No se pudo generar el archivo de respaldo.');
    }
  };

  const handleExportCsv = async () => {
    triggerSelection();
    try {
      const csv = exportTransactionsToCsv();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `kyrara_movimientos_${dateStr}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar movimientos para Excel',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        onShowBackupContent('Exportación CSV / Excel', csv);
      }
    } catch (err: any) {
      console.error('Error al exportar archivo para Excel:', err);
      Alert.alert('Error', 'No se pudo generar el archivo para Excel.');
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
            router.replace('/(tabs)');
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
                Copias de Seguridad
              </Text>

            </View>
          </View>

          {/* 2 Big Action Buttons: Crear Respaldo y Restaurar */}
          <View style={styles.backupGridBtns}>
            <TouchableOpacity
              style={styles.backupBtn}
              onPress={handleExportBackup}
              activeOpacity={0.8}
            >
              <MaterialIcons name="file-download" size={22} color={COLORS.primary} />
              <View>
                <Text style={[styles.backupBtnTitle, TYPOGRAPHY.bodySm]}>Crear Respaldo</Text>
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
              </View>
            </TouchableOpacity>
          </View>

          {/* Botón destacado para exportar archivo de Excel */}
          <TouchableOpacity
            style={styles.excelExportCardBtn}
            onPress={handleExportCsv}
            activeOpacity={0.8}
          >
            <View style={styles.excelBtnLeft}>
              <View style={styles.excelIconBox}>
                <MaterialIcons name="table-view" size={22} color={COLORS.cashflowIncome} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.excelBtnTitle, TYPOGRAPHY.bodyMd]}>
                  Exportar archivo Excel
                </Text>
                <Text style={[styles.excelBtnSubtitle, TYPOGRAPHY.bodySm]}>
                  Planilla .csv para abrir y leer en Excel
                </Text>
              </View>
            </View>
            <MaterialIcons name="file-download" size={20} color={COLORS.cashflowIncome} />
          </TouchableOpacity>

          <View style={styles.backupInfoRow}>
            <MaterialIcons name="info" size={16} color={COLORS.secondary} />
            <Text style={[styles.backupInfoText, TYPOGRAPHY.bodySm]}>
              Los archivos se generan y guardan directamente en tu teléfono.
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

export const PestañaAjustes = PestanaAjustes;
export const SettingsTab = PestanaAjustes;

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
  excelExportCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderRadius: 14,
    padding: 12,
  },
  excelBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  excelIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  excelBtnTitle: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  excelBtnSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
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
