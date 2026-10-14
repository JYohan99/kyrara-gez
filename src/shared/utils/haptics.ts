import * as Haptics from 'expo-haptics';

export async function triggerImpactLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Non-fatal if unsupported (e.g. web or simulator)
  }
}

export async function triggerImpactMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Non-fatal
  }
}

export async function triggerImpactHeavy(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Non-fatal
  }
}

export async function triggerSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Non-fatal
  }
}

export async function triggerWarning(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Non-fatal
  }
}

export async function triggerError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Non-fatal
  }
}

export async function triggerSelection(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Non-fatal
  }
}
