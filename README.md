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

### Google sign-in setup

Also needs a real Firebase project (a native dependency of `@react-native-firebase/*`, so it's part of the same dev-client build above, not optional at the JS level like the RevenueCat keys):

1. Place `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) at this directory's root — `app.json`'s `android.googleServicesFile`/`ios.googleServicesFile` already point here
2. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` — the **Web client ID** (not the iOS/Android one) from Firebase Console → Authentication → Sign-in method → Google
3. Re-run `npx expo prebuild` and the `eas build` step above so the native config files are picked up
4. The backend also needs `FIREBASE_SERVICE_ACCOUNT_JSON` set — see `backend/README.md`

Without step 2, `GoogleSignin.configure()` is skipped (console warning) and "Continue with Google" shows a friendly error instead of crashing.

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

Build
npx expo-doctor -> check 15 checks \_ delete android folder
npx expo prebuild
npx eas build --platform android --profile development
cd android

./gradlew assembleRelease
Error -> When run ./gradlew commands -> SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable or by setting the sdk.dir path in your project's local properties file at

Solution

Open or create this file: /intellectica-mobile-v2/android/local.properties

Add this line -> sdk.dir=/Users/apple/Library/Android/sdk

method one - ./gradlew signingReport to get SHA1 method two - i. run eas credentials ii. select platform then select profile -> development -> you will see SHA1

The Swift pod FirebaseAuth depends upon FirebaseAuthInterop, FirebaseAppCheckInterop, FirebaseCore, FirebaseCoreExtension, GoogleUtilities, and RecaptchaInterop, which do not define modules. To opt into those targets generating module maps (which is necessary to import them from Swift when building as static libraries), you may set use_modular_headers! globally in your Podfile, or specify :modular_headers => true for particular dependencies.

Solution

add line -> use_modular_headers! in /ios/profile after line -> platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'
