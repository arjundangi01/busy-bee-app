import { IColorTokens, themes } from "@/theme/colors";
import { useThemePreference } from "@/theme/ThemeContext";

export function useColors(): IColorTokens {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme === "light" ? themes.light : themes.dark;
}
