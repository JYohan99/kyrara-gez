import * as Haptics from 'expo-haptics';

export async function vibracionLigera(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // No fatal
  }
}

export async function vibracionMedia(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // No fatal
  }
}

export async function vibracionFuerte(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // No fatal
  }
}

export async function vibracionExito(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // No fatal
  }
}

export async function vibracionAdvertencia(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // No fatal
  }
}

export async function vibracionError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // No fatal
  }
}

export async function vibracionSeleccion(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // No fatal
  }
}

// Alias compatibles
export const triggerImpactLight = vibracionLigera;
export const triggerImpactMedium = vibracionMedia;
export const triggerImpactHeavy = vibracionFuerte;
export const triggerSuccess = vibracionExito;
export const triggerWarning = vibracionAdvertencia;
export const triggerError = vibracionError;
export const triggerSelection = vibracionSeleccion;

export const gatillarImpactoLigero = vibracionLigera;
export const gatillarImpactoMedio = vibracionMedia;
export const gatillarImpactoFuerte = vibracionFuerte;
export const gatillarExito = vibracionExito;
export const gatillarAdvertencia = vibracionAdvertencia;
export const gatillarError = vibracionError;
export const gatillarSeleccion = vibracionSeleccion;

