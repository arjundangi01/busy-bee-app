import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { getStoredThemePreference, setStoredThemePreference, ThemePreference } from "@/theme/themeStorage";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedScheme: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    getStoredThemePreference().then((stored) => {
      if (stored) setPreferenceState(stored);
    });
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    setStoredThemePreference(next);
  };

  const resolvedScheme: "light" | "dark" =
    preference === "system" ? (systemScheme === "light" ? "light" : "dark") : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedScheme, setPreference }),
    [preference, resolvedScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemePreference must be used within a ThemeProvider");
  }
  return context;
}
