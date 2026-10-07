# Smart Expense Tracker (Frontend)

A responsive personal-finance web app for logging income and expenses, setting category budgets, and understanding spending patterns. Includes **Fina**, a built-in chat assistant that answers questions about your money and can add transactions from plain text (e.g. *"Add 500 for coffee"*).

## Features

- **Dashboard** - monthly overview, cash-flow chart, category breakdown and spending insights
- **Transactions** - search, filter, delete (with undo) and CSV export
- **Add transaction** - validated form with a live preview card
- **Budget** - monthly limits per category with progress against the day of the month
- **Reports** - spending trends over time and CSV export
- **Fina chatbot** - rule-based assistant for spending, budgets and savings questions
- **Authentication** - login, sign up, forgot password, 6-digit OTP verification and reset password, with protected routes and a no-account guest mode (mock backend for now, see below)
- **Profile** - click your avatar for the account menu (Profile, Sign out); edit your display name, reset demo data
- **Light / dark theme**
- Data persists in the browser (`localStorage`), separately for each account; demo data can be reset

## Tech stack

React 19, Vite 6, Tailwind CSS 4, React Router 6, Recharts, Framer Motion, Heroicons and React Toastify. Axios, Tesseract.js and Firebase 11 are installed for upcoming work (real API, receipt scanning, Firebase) but not used yet.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Authentication (mock)

Auth currently runs on a **mock backend stored in `localStorage`** ([`src/utils/mockAuth.js`](src/utils/mockAuth.js)), so everything works offline with no setup.

- **Demo account:** `demo@example.com` / `demo1234`
- **Guest mode:** "Continue as guest" on the login page skips the account.
- **Sign up** creates an unverified account, then asks for a 6-digit OTP. The app stays locked until the email is verified.
- **Forgot password:** enter email -> verify OTP -> set a new password -> back to login.
- **No email is sent.** The OTP is shown in a banner on the verify screen (and logged to the browser console). Codes expire after 10 minutes; resend is available after 30 seconds.
- Each account's transactions and budgets are stored separately in the browser.

| Route | Screen |
| --- | --- |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request a reset code |
| `/verify-otp` | Enter the 6-digit code (signup or reset) |
| `/reset-password` | Choose a new password |
| `/profile` | Edit name, reset demo data, sign out (requires login) |

All other routes (`/`, `/transactions`, `/add-expense`, `/reports`, `/budget`, `/profile`) require login or guest mode.

> Passwords are stored in plain text in `localStorage`. This is for demos only - never use real passwords.

To move to a real backend, replace the functions exported from `mockAuth.js` (`signIn`, `signUp`, `sendOtp`, `verifyOtp`, `resetPassword`, ...) with API calls; the rest of the app only uses that module and `AuthContext`.

### Firebase (optional, not used yet)

[`src/firebase.js`](src/firebase.js) is ready for a future move to Firebase. Copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values from the Firebase Console. `.env` files, private keys and Firebase/Google credentials are in `.gitignore` - **never commit them**, and never put an Admin SDK service-account key in this frontend.

## Project structure

```
src/
  components/   Layout, Navbar, Sidebar, Chatbot, charts, shared UI,
                auth pieces (AuthShell, OtpInput, Avatar, ProtectedRoute)
  context/      AuthContext (session), ExpenseContext (data + persistence), ThemeContext
  data/         Categories and mock transaction data
  pages/        Dashboard, Transactions, AddExpense, Budget, Reports, Profile,
                Login, Signup, ForgotPassword, VerifyOtp, ResetPassword
  utils/        Analytics, chat engine, formatting, mockAuth (mock backend)
  firebase.js   Firebase initialisation (unused for now)
```
