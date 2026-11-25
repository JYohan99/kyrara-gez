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
import { OrbeGlossy } from '@/compartido/componentes/OrbeGlossy';
import { useSeguridadBoveda as useVaultSecurity, useCategoriasBoveda } from '@/datos/hooks';
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
  onOpenCategoriesModal?: () => void;
}

export const PestanaAjustes: React.FC<PropiedadesPestanaAjustes> = ({
  onOpenPinModal,
  onOpenRestoreModal,
  onShowBackupContent,
  onOpenCategoriesModal,
}) => {
  const { security } = useVaultSecurity();
  const { allCategories } = useCategoriasBoveda();
  const activasCount = allCategories.filter(c => c.isActive !== false).length;
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

      {/* Mis Categorías */}
      <View style={styles.settingsSection}>
        <GlassCard style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingItemRow}
            onPress={() => {
              triggerSelection();
              if (onOpenCategoriesModal) onOpenCategoriesModal();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(87, 245, 171, 0.12)' }]}>
                <MaterialIcons name="category" size={18} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingItemTitle, TYPOGRAPHY.bodyMd]}>
                  Gestionar Categorías
                </Text>
                <Text style={[styles.settingItemSubtitle, TYPOGRAPHY.bodySm]}>
                  {activasCount} de {allCategories.length} categorías activas
                </Text>
              </View>
            </View>

          </TouchableOpacity>
        </GlassCard>
      </View>

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
              <OrbeGlossy tamano={38} tono="obsidiana">
                <MaterialIcons name="visibility-off" size={18} color={COLORS.cashflowIncome} />
              </OrbeGlossy>
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
              <OrbeGlossy tamano={38} tono="obsidiana">
                <MaterialIcons name="pin-drop" size={18} color={COLORS.onSurface} />
              </OrbeGlossy>
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
              <OrbeGlossy tamano={38} tono="obsidiana">
                <MaterialIcons name="fingerprint" size={18} color={COLORS.primary} />
              </OrbeGlossy>
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
        <GlassCard style={styles.backupCard}>
          <View style={styles.backupCardTop}>
            <OrbeGlossy tamano={44} tono="cian">
              <MaterialIcons name="folder-zip" size={22} color="#FFFFFF" />
            </OrbeGlossy>
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
              <OrbeGlossy tamano={40} tono="ingreso">
                <MaterialIcons name="table-view" size={20} color="#FFFFFF" />
              </OrbeGlossy>
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

const styles = StyleSheet.create({
  container: {
    gap: 18,
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
  backupTitles: {
    flex: 1,
  },
  backupMainTitle: {
    color: COLORS.onSurface,
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
  excelBtnTitle: {
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  excelBtnSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
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
