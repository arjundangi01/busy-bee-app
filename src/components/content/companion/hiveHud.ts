// Fixed, non-theme-reactive HUD chrome for the illustrated hive-workshop
// visual language — shared by FocusSessionTemplate (full-screen scene) and
// BeesHiveTemplate (the Bee's Hive tab's own illustrated redesign). Same
// bounded DS-004 exception reasoning in both places: a translucent dark
// card reads consistently over the warm illustration regardless of the
// device's light/dark theme setting.
export const HIVE_HUD = {
  pageBg: "#4a3018",
  pillBg: "rgba(20,14,8,0.62)",
  pillBorder: "rgba(255,255,255,0.14)",
  text: "#fff6de",
  textSecondary: "#e6d9bd",
  signBg: "#8a6238",
  signBorder: "#6b4a29",
  barTrack: "rgba(0,0,0,0.28)",
  barFill: "#f0a83f",
  warning: "#ffcf8a",
};
