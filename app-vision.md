# App Vision: Screen Time Projector

## 1. Project Overview

A web application designed to help users track, manage, and project their screen time. The app allows users to upload daily screenshots of their device's screen time usage, extracts the data via an external OCR/vision API, and stores it in Firebase. Using historical data, the app calculates and displays projections for future screen time usage by category (e.g., Entertainment, Social, Productivity).

## 2. Tech Stack & Environment strictly required

The project MUST adhere to the following exact versions and technologies:

- **Runtime:** Node.js `22+`
- **Package Manager:** npm `10+`
- **Frontend Framework:** React `19.2.x`
- **Language:** TypeScript `5.9.x` (Strict mode enabled)
- **Build Tool:** Vite `8.0.x`
- **Linting:** ESLint `9.39.x`
- **Testing:** Vitest `4.1.x`
- **Backend & Hosting:** Firebase (Authentication, Firestore database, Firebase Hosting)

## 3. Core Workflows & User Journey

### A. Authentication

- Users must be able to sign up, log in, and log out using Firebase Authentication (Email/Password or Google Auth).
- All data must be strictly tied to the authenticated user's ID (`uid`). Unauthenticated users should be redirected to the login screen.

### B. Screenshot Upload & Data Extraction

- **UI:** A dedicated upload component allowing users to drag-and-drop or select a screenshot image of their daily screen time.
- **Processing:**
  1. The image is temporarily held in state.
  2. The app calls a designated external API (e.g., OpenAI Vision, Google Cloud Vision) to extract category names and duration (in minutes) from the screenshot.
  3. The extracted data is parsed into a structured JSON format.
- **Storage:** The structured data is saved to Firestore under the user's specific document structure, tagged with the current date.

### C. Dashboard & Projections

- **Data Retrieval:** Fetch the user's screen time data for the current week and previous weeks from Firestore.
- **Projection Logic:** Calculate a simple moving average or trendline based on the past 14-21 days of category-specific data to project expected screen time for the end of the current week.
- **Visualization:** Display the current usage vs. projected usage in a clear, comparative UI (e.g., bar charts or progress rings).

## 4. Data Architecture (Firestore)

The database should follow a subcollection structure to ensure efficient querying and strict data isolation per user.

**Collection:** `users`

- `documentId`: `{firebase_auth_uid}`
  - `email`: string
  - `createdAt`: timestamp
  - **Subcollection:** `daily_logs`
    - `documentId`: `YYYY-MM-DD`
    - `date`: timestamp
    - `totalMinutes`: number
    - `categories`: Array of Objects
      - `name`: string (e.g., "Entertainment")
      - `minutesSpent`: number

## 5. Agent Directives & Coding Standards

When generating code for this project, the agent MUST obey the following rules:

1.  **TypeScript First:** Explicitly define interfaces/types for all API responses, component props, and Firestore documents. Avoid `any`.
2.  **Functional Components:** Use modern React functional components with hooks. Do not use class components.
3.  **Firebase Security:** Assume Firestore Security Rules will be implemented; ensure all client-side queries include the user's `uid` to prevent unauthorized access.
4.  **Testing:** Write unit tests for all utility functions (especially the projection math logic) and core UI components using Vitest.
5.  **Modular Architecture:** Separate Firebase logic (services/API calls) from UI components. Keep components pure where possible.
6.  **Error Handling:** Implement robust `try/catch` blocks for the external API calls and Firebase operations, rendering user-friendly error states in the UI if extraction or network requests fail.
