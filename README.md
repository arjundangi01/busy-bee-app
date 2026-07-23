# AI Mission Control — Mobile

React Native app (Expo, TypeScript, Expo Router). Client for the AI Mission Control execution companion — see the project root's `base-idea` doc for product context.

## Setup

```bash
npm install
cp .env.example .env   # then point EXPO_PUBLIC_API_URL at the backend
```

## Run

**This app can no longer run in plain Expo Go** — `react-native-purchases` (RevenueCat SDK, for the 4.1 Paywall) has native code, so it needs a custom development build:

```bash
npx expo prebuild        # generates native ios/android projects (one-time, or after native deps change)
eas build --profile development --platform ios      # or --platform android
# install the resulting dev-client build on a simulator/device, then:
npx expo start --dev-client
```

`EXPO_PUBLIC_REVENUECAT_IOS_KEY`/`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` are optional — without them, `Purchases.configure()` is skipped (console warning) and the paywall's Upgrade button shows a friendly "not available yet" error instead of crashing. Real purchases need a RevenueCat account + App Store Connect/Google Play Console products registered first (see `design-artifacts/E-Development/DD-003-implementation-plan.md` Open Items).

## Verify

```bash
npx tsc --noEmit
```

## Structure

- `src/app/` — routes only (Expo Router file-based routing: `index.tsx`, `_layout.tsx`, etc.)
- `src/lib/api.ts` — shared axios client, reads `EXPO_PUBLIC_API_URL`. Extend this one client rather than creating a second.
- `src/module/<feature>/` — feature logic (components/hooks/templates/context/utils), one folder per feature.
- Path alias `@/*` → `src/*` is already configured in `tsconfig.json`.

See `code-practice-fe.md` in this directory for the full FE convention doc (architecture, data fetching, state, forms, etc.) — the one at the project root targets the Next.js web app, not this Expo client.
