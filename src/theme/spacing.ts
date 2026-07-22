// Matches design-artifacts/D-Design-System/00-design-system.md#spacing-scale exactly.
// Token name mapping: xxxs=space-3xs, xxs=space-2xs, xs=space-xs, sm=space-sm,
// md=space-md (baseline), lg=space-lg, xl=space-xl, xxl=space-2xl, xxxl=space-3xl.
export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  xxxl: 56,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;
