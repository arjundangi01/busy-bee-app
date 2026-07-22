export type IColorTokens = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  invertFill: string;
  invertText: string;
  accent: string;
  accentGradient: readonly [string, string, string];
  accentGlow: string;
  danger: string;
};

// "Premium Black & White" theme — see design-artifacts/D-Design-System/00-design-system.md#colors.
// color-accent is permitted in exactly three places: the wordmark's "bee", the
// Companion presence element, and the streak-count stat value. Nowhere else.
const dark: IColorTokens = {
  bg: "#000000",
  surface: "#0c0c0c",
  surfaceAlt: "#141414",
  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.08)",
  text: "#ffffff",
  textSecondary: "#8a8a8a",
  textMuted: "#6b6b6b",
  textFaint: "#4a4a4a",
  invertFill: "#ffffff",
  invertText: "#000000",
  accent: "#d4a943",
  accentGradient: ["#f0cb7a", "#d4a943", "#a67b1f"],
  accentGlow: "rgba(212,169,67,0.5)",
  danger: "#FF7A7A",
};

const light: IColorTokens = {
  bg: "#ffffff",
  surface: "#f7f7f7",
  surfaceAlt: "#f2f2f2",
  border: "rgba(0,0,0,0.08)",
  borderSubtle: "rgba(0,0,0,0.08)",
  text: "#000000",
  textSecondary: "#6b6b6b",
  textMuted: "#9a9a9a",
  textFaint: "#c0c0c0",
  invertFill: "#000000",
  invertText: "#ffffff",
  accent: "#a67b1f",
  accentGradient: ["#f0cb7a", "#d4a943", "#a67b1f"],
  accentGlow: "rgba(212,169,67,0.35)",
  danger: "#C23B3B",
};

export const themes = { dark, light } as const;

// Static default for screens not yet migrated to useColors() (e.g. the
// out-of-scope Missions tab) — preserves current (dark) appearance.
export const colors = dark;
