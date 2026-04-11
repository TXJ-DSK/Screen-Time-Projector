# Screen Time Projector

Screen Time Projector is a React + TypeScript web app that lets users:

- authenticate with Firebase
- upload daily screen-time screenshots
- extract category usage through an external OCR/vision API
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
- VITE_VISION_API_URL
- VITE_VISION_API_KEY (optional)

The app will display a setup screen if required Firebase variables are missing.

## Vision API Contract

The upload workflow POSTs JSON to VITE_VISION_API_URL with:

- imageBase64
- mimeType
- fileName

Expected response shape (flexible parser):

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

- src/services: Firebase auth, Firestore persistence, vision API extraction
- src/utils: date helpers, duration parsing, projection calculations
- src/components: auth, upload, and dashboard UI panels
- src/types: shared domain interfaces

## Security Notes

- Do not commit real .env credentials.
- Add Firestore Security Rules to enforce user-level access (request.auth.uid == user document id).
- If your OCR endpoint is private, use VITE_VISION_API_KEY or proxy through a secured backend/function.
