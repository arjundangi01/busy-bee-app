# Code Rules — Mobile (Expo / React Native)

Conventions and architecture for the `mobile` app. This mirrors the shape of the web app's
`code-practice-fe.md` at the project root, but the two are **not interchangeable** — that doc
describes the Next.js web client; this one describes this Expo Router / React Native client.
Where a pattern below doesn't exist yet in the codebase, it says so explicitly rather than
inventing one — don't copy a web-app pattern over just because the equivalent doc has it.

## Commands

```bash
npx expo start        # start the dev server, then press i / a / w, or scan with Expo Go
npm run ios            # start with the iOS simulator
npm run android        # start with the Android emulator
npm run web             # start in a browser
npm run lint             # eslint (eslint-config-expo)
npx tsc --noEmit        # typecheck
```

There is no test runner, no build script, and no pre-commit hook (husky/lint-staged/commitlint)
configured yet — unlike the web app. Don't assume any of these exist; if the user asks to add
them, that's new setup, not "run the existing thing."

## Architecture

Expo Router (file-based routing) on React Native 0.86 / React 19, TypeScript, `expo-router`.

### Routing vs. feature code split

Same split as the web app, adapted to Expo Router's file conventions:

- `src/app/**` contains only route files and is organized into route groups: `(auth)` (sign-in/sign-up), `(onboarding)` (the onboarding survey flow), `(tabs)` (the main tab bar — home/missions/focus), plus a dynamic route `mission/[id].tsx`. `_layout.tsx` files configure `Stack`/`Tabs` navigators and shared providers — see `src/app/_layout.tsx` (root: wraps the whole app in `QueryClientProvider` → `AuthProvider` → `OnboardingAnswersProvider` → `Stack`) and `src/app/(tabs)/_layout.tsx` (the `Tabs` navigator). A route file does little beyond rendering its module's template, e.g.:
  ```tsx
  export default function SignIn() {
    return <SignInTemplate />;
  }
  ```
- All real feature logic lives in `src/module/<feature>/`, organized the same way as the web app: a subset of `components/`, `templates/` (the top-level screen), `hooks/` (React Query hooks), `context/`, `utils/`. Look at an existing module (e.g. `src/module/missions/`) as the template for a new one.
- `src/config/routes.ts` is the single source of truth for route paths — a plain object of path builders (`routes.tabs.home()`, `routes.mission(id)`) — used with `router.push()`/`router.replace()` from `expo-router` instead of hardcoding path strings.

### Auth & session

- There is no middleware/route-gating layer (React Native has no server to intercept requests). Instead, `src/app/_layout.tsx` wraps the app in `AuthProvider` and the root `index.tsx` / individual templates read auth state to decide where to route. If unauthenticated-route protection becomes a real need, build it as a check in the relevant `_layout.tsx` (Expo Router supports conditional `<Stack.Screen redirect />` / early-return patterns there) rather than inventing a Next.js-style middleware file — there's no equivalent to port.
- Client-side current user/session comes from a **React Context**, not zustand: `useAuthStore` (`src/store/auth-store.tsx`), a `createContext` + `useState` provider (see `AuthProvider`), memoized with `useMemo`. This is a deliberate difference from the web app (which uses zustand) — don't introduce zustand here for a single global store; follow the existing Context pattern. It exposes `user`, `hasProfile`, `isBootstrapping`, `setSession`, `markProfileComplete`, `signOut`.
- The session token itself is persisted via `AsyncStorage`, not cookies — see `src/lib/utils/session.ts` (`getStoredToken`/`setStoredToken`/`clearStoredToken`, with an in-memory cache to avoid redundant `AsyncStorage` reads).

### Data fetching

- All HTTP goes through the shared `apiClient` (axios) in `src/lib/api.ts`. Its request interceptor reads the stored token via `getStoredToken()` and attaches `Authorization: Bearer <token>`. Don't create a second axios instance — extend this one.
- **API calls go through TanStack Query (`@tanstack/react-query`) hooks colocated in each module's `hooks/` folder** — same convention as the web app, not hand-rolled `useState`/`useEffect` fetch logic. `QueryClientProvider` is set up once in `src/app/_layout.tsx` using the shared `queryClient` from `src/lib/query-client.ts`.
  - **Reads** use `useQuery` with a query key array starting with a feature-scoped string, e.g. `["dashboard"]`, `["missions"]`, `["missions", missionId]` — see `useDashboard`, `useMissions`, `useMission`.
  - **Writes** use `useMutation` with a `mutationKey`, e.g. `["auth", "sign-in"]`, `["missions", missionId, "complete-task"]` — see `useSignIn`, `useSignUp`, `useSubmitOnboarding`, and the `completeTask` mutation inside `useMission`. Use `onSuccess` to update related state (`setSession`, `markProfileComplete`) or write into the cache with `queryClient.setQueryData(...)` (see `useMission`'s `completeTask`, which patches the mission query directly instead of refetching).
  - Hooks unwrap the response and return plain data, not the raw axios/query object: `queryFn` returns `response.data.data`, and the hook returns `{ <resource>: data ?? <fallback>, isLoading, error, refresh }` (`refresh` = `refetch`). Query hooks that back pull-to-refresh UI also return `isRefetching` — use that (not `isLoading`, which is only `true` on the *first* load with no cached data) for a `RefreshControl`/`FlatList`'s `refreshing` prop; see `HomeTemplate` and `MissionsTemplate`.
  - Errors are converted to a display string with `getErrorMessage(error)` (`src/lib/utils/errors.ts`, handles `AxiosError` first, falls back to `Error`/generic) before being returned from the hook — components render `error` directly as text, never a raw `Error`/`AxiosError`.
  - Responses are typed with the single shared generic `IApiResponse<T>` (`{ success, message, data: T | null }`) from `@/types`. There's no paginated-list generic yet (`IPaginatedApiResponse`) — add one only when an endpoint actually returns paginated data.
- Env vars: Expo's built-in `EXPO_PUBLIC_*` support is used directly — `process.env.EXPO_PUBLIC_API_URL` is read once in `src/lib/api.ts` with a hardcoded local fallback (`DEFAULT_API_URL`). There's no `@t3-oss/env-nextjs`-style validation layer here (that's a Next.js-specific tool) — don't add one speculatively; if env validation becomes a real pain point, that's a separate decision to make deliberately, not a default to port from the web app.

### State

- Global/shared state uses **React Context**, not zustand — see `useAuthStore` (`src/store/auth-store.tsx`) and `useOnboardingAnswers` (`src/module/onboarding/context/OnboardingAnswersContext.tsx`). Both follow the same shape: `createContext<T | null>(null)`, a `*Provider` component holding `useState`, a memoized (`useMemo`) value, and a `use*` hook that throws if called outside its provider. Follow this shape for a new cross-screen store rather than reaching for zustand or a new pattern.
- Local component state uses `useState`/`useReducer` as normal.
- There is no URL/search-params equivalent for list/filter state (no query string on native). List/filter state (sort, selected id, etc.) is plain local `useState` in the owning template for now. Only reach for something more elaborate (e.g. persisting to `AsyncStorage`) if a real requirement needs state to survive an app restart — don't build that speculatively.

### Forms

There is no field-config-driven form system here, unlike the web app — forms are small enough so far that hand-rolled JSX is the actual convention: local `useState` per field, a `canSubmit` boolean computed inline, and `TextField`/`Chip` primitives wired directly (see `SignInTemplate`, `SignUpTemplate`, and the onboarding templates). Keep following this pattern for new forms. Only introduce a shared field-config/renderer system (mirroring the web app's `FIELD_VARIANT` approach) if forms actually grow complex enough to justify it — that's a deliberate architectural addition, not something to pre-build.

### Types

Same discipline as the web app:

- Entity types are declared once in `src/types/index.ts` and imported everywhere — `IUser`, `IAuthResult`, `IMission`, `IMissionTask`, `IDashboard`, `IOnboardingResult`, `IOnboardingInsight`, `IApiResponse<T>`. Don't redeclare a near-duplicate shape locally.
- When a variant of an existing type is needed, derive it with `Pick`/`Omit`/intersection rather than a new interface from scratch.
- Avoid `any`; use `unknown` and narrow it when a shape is genuinely unknown.
- This app hasn't hit the "entity with a nested relation" case yet (see the web doc's `IGet<Entity>` pattern) — if/when an endpoint starts returning a joined/nested object on an entity, follow that same composition pattern (base entity + separate `IGet*` composed type, optional relation fields) rather than inlining it.

### Enums

- `src/utils/enums/index.ts` holds the shared closed-vocabulary enums: `GOAL`, `USER_ROLE`, `COMMITMENT_LEVEL`, `MISSION_STATUS`, `TASK_STATUS`. Never compare against a raw string literal for one of these (`task.status === "DONE"`) — use the enum (`task.status === TASK_STATUS.DONE`).
- Same "don't stop at the obvious cases" rule as the web app: a literal reused across 2+ call sites (a `TextInput` `keyboardType`/`autoComplete` value, a route-group name, an animation key) should get a small enum/const once it's used more than once, not be retyped at each site.
- Feature-scoped enums (specific to one module, not reused elsewhere) belong in that module's own `utils/`/`types/`, not in the shared `src/utils/enums/`.

### Interaction primitives

- There's no shared modal, popover, or toast system yet — errors currently render as an inline `<Text style={styles.error}>{error}</Text>` in the template that triggered the failing call (see `SignInTemplate`, `SignUpTemplate`, `MissionDetailTemplate`). That's the current convention: display the hook's `error` string inline near the action that produced it, not a global toast.
- If a confirmation or blocking-choice UI is ever needed, don't reach for React Native's `Alert.alert` as a default — it's the RN equivalent of `window.confirm`/`window.alert` that the web app explicitly avoids, for the same reasons (can't be styled to match the app, blocks interaction awkwardly on native too). Build a themed modal primitive using the existing `theme` tokens instead, the same way `ConversationalScreen` composes `SafeAreaView`/`KeyboardAvoidingView` rather than using raw RN primitives inline.

### UI components

- `src/components/ui/*` holds small themed primitives built from scratch on top of core RN components — `TextField`, `PrimaryButton`, `Chip`, `BackButton`, `GlowOrb` — styled with `StyleSheet.create` and `theme` tokens (colors/spacing/radius), not Tailwind classes (there is no Tailwind/NativeWind in this app) and not a shadcn-equivalent component library. `react-native-reanimated` is used directly for simple press/entrance animations (see `PrimaryButton`'s scale-on-press, `FadeIn` on screen content) — there's no animation wrapper abstraction, just inline `useSharedValue`/`useAnimatedStyle`/`withTiming` at the point of use.
- `src/components/shared/*` holds cross-module composite screens/layouts — currently just `ConversationalScreen`, the shared chrome (back button, orb, keyboard-avoiding footer button) used by the onboarding/auth flow. Follow its shape (props for `footerLabel`/`onFooterPress`/`footerLoading`/`footerDisabled`, `SafeAreaView` + `KeyboardAvoidingView` at the root) for a new full-screen composite rather than rebuilding that scaffolding per screen.
- There's no datatable/table component (not a relevant UI pattern on mobile so far) — lists use `FlatList` directly (see `MissionsTemplate`), styled per-screen.
- Use the `theme` tokens (`colors`, `spacing`, `radius` from `@/theme`) for all styling instead of hardcoded hex values or magic numbers — see `src/theme/colors.ts` / `src/theme/spacing.ts`.

### Global utils

- `src/lib/utils/` holds cross-module pure-function utilities — `errors.ts` (`getErrorMessage`), `session.ts` (token persistence). Add a new generic helper here (or a new file in this folder for a new concern) instead of redefining a local one-off inside a module.

### Path aliases

`@/*` → `src/*`, `@/assets/*` → `assets/*` (defined in `tsconfig.json`).

### Testing

No test runner is configured yet (no Jest/Vitest). If tests are added later, prefer colocating unit tests next to the util they cover, matching the web app's `*.test.ts` convention — but don't scaffold a test setup speculatively; that's a deliberate addition when there's something worth testing.

## Conventions

- 2-space indentation, double quotes, semicolons, trailing commas — matches the existing files; there's no Prettier config committed yet, so match the surrounding file's formatting by eye until one exists. (Note: this differs from the web app, which uses tabs — don't copy that.)
- Mark files that need client-only React state/effects/hooks the normal way; there's no `"use client"` directive here — that's a Next.js App Router concept that doesn't apply to Expo Router/React Native. Every component in this app runs on-device, so don't add it.
- Keep files small and single-purpose — same rule as the web app. When a component grows (a list item gets a sub-row, a template accumulates unrelated sections), split into sibling components in the same module folder rather than nesting more JSX into one file.
- **Don't over-engineer.** Same rules as the web app: no speculative abstractions/config flags for a use case that doesn't exist yet; three similar lines beat a premature shared helper; don't add error handling/validation for states that can't occur; a bug fix or single new field doesn't justify refactoring the surrounding file "while we're in here."
- **Comment only when the code can't explain itself.** Default to no comments; add one only to capture a genuinely non-obvious *why*.

## AI-generated code checklist

When reviewing (or generating) a diff in this app, specifically check for:

1. New API calls go through a `useQuery`/`useMutation` hook in the module's `hooks/` folder — not a hand-rolled `useState`/`useEffect` fetch, and not an inline `apiClient` call in a component/template.
2. Query keys/mutation keys are arrays starting with a feature-scoped string, consistent with existing hooks.
3. Errors returned from a hook are already strings (via `getErrorMessage`), never a raw `Error`/`AxiosError` handed to a component.
4. Every closed-set string comparison or a literal reused 2+ times is backed by an enum/const from `src/utils/enums/` or the module's own `enums/`/`types/`, not typed inline at each site.
5. No new zustand store was added for cross-screen state — this app uses React Context (see **State** above); no `Alert.alert`/browser-only APIs that don't exist on native.
6. No entity type has a relation object redeclared/inlined on it once the `IGet<Entity>` pattern is actually needed (see **Types**).
7. Comments explain *why*, not *what* — and most lines have none.
8. No abstraction, flag, or "flexibility" was added beyond what the current task actually requires.
9. `npx tsc --noEmit` and `npm run lint` are clean before calling the change done.
