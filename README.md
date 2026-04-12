# Screen Time Projector

Screen Time Projector is a React + TypeScript web app that lets users:

- authenticate with Firebase
- upload daily screen-time screenshots
- extract category usage directly with Gemini multimodal models
- store daily logs in Firestore under each authenticated user
- compute and visualize weekly projections using a 14-21 day moving average

## Required Stack

- Node.js 22+
- npm 10+
- React 19.2.x
- TypeScript 5.9.x (strict mode)
- Vite 8.0.x
- ESLint 9.39.x
- Vitest 4.1.x
- Firebase Authentication + Firestore + Hosting

## Quick Start

1. Install dependencies.
2. Create local env variables from .env.example.
3. Start the app.

Commands:

- npm install
- npm run dev

## Environment Variables

Copy .env.example to .env and populate:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_GEMINI_API_KEY
- VITE_GEMINI_MODEL (optional, default: gemini-2.5-flash)
- VITE_GEMINI_BASE_URL (optional, default: https://generativelanguage.googleapis.com/v1beta)

The app will display a setup screen if required Firebase or Gemini variables are missing.

## Gemini Extraction Contract

The upload workflow sends screenshot + prompt to:

- https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

Authentication:

- API key in query parameter using VITE_GEMINI_API_KEY

Request includes:

- prompt instructions asking Gemini to return strict JSON
- inline image bytes (base64 + mime type)

Expected model JSON shape (the parser is tolerant):

- categories: array of objects containing name and either minutesSpent, minutes, or duration
- totalMinutes (optional)
- extractedText or text (optional fallback parsing)

## Firestore Structure

- users/{uid}
  - email
  - createdAt
- users/{uid}/daily_logs/{YYYY-MM-DD}
  - date (timestamp)
  - totalMinutes (number)
  - categories (array of { name, minutesSpent })

All reads and writes are scoped to the authenticated uid.

## Scripts

- npm run dev: start development server
- npm run build: type-check and production build
- npm run serve: preview production build
- npm test: run Vitest in watch mode
- npm run test:coverage: run coverage report
- npm run lint: run Prettier + ESLint

## Testing Coverage Added

- Projection math utility tests: src/utils/projection.test.ts
- Parsing/sanitizing utility tests: src/utils/parsing.test.ts
- Dashboard component render test: src/components/ProjectionDashboard.test.tsx
- App setup-state test: src/app.test.tsx

## Project Structure

- src/services: Firebase auth, Firestore persistence, Gemini image extraction
- src/utils: date helpers, duration parsing, projection calculations
- src/components: auth, upload, and dashboard UI panels
- src/types: shared domain interfaces

## Security Notes

- Do not commit real .env credentials.
- Add Firestore Security Rules to enforce user-level access (request.auth.uid == user document id).
- Browser-side Gemini keys are visible to clients; restrict the key by HTTP referrer and API scope.
- For stronger security, proxy Gemini calls through a backend or Firebase Cloud Function.
