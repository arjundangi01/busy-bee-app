import { useColorScheme } from "react-native";
import { IColorTokens, themes } from "@/theme/colors";

export function useColors(): IColorTokens {
  const scheme = useColorScheme();
  return scheme === "light" ? themes.light : themes.dark;
}
