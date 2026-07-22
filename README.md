# AI Mission Control — Mobile

React Native app (Expo, TypeScript, Expo Router). Client for the AI Mission Control execution companion — see the project root's `base-idea` doc for product context.

## Setup

```bash
npm install
cp .env.example .env   # then point EXPO_PUBLIC_API_URL at the backend
```

## Run

```bash
npx expo start     # then press i / a / w, or scan with Expo Go
npm run ios
npm run android
npm run web
```

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
