import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";

const THEME_PREFERENCE_KEY = "busy-bee/theme-preference";

export const getStoredThemePreference = async (): Promise<ThemePreference | null> => {
  const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : null;
};

export const setStoredThemePreference = async (preference: ThemePreference): Promise<void> => {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
};
