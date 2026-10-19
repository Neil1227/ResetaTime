# Testing Guide - ResetaTime PH

This project uses [Playwright](https://playwright.dev/) for cross-browser End-to-End (E2E) testing across Chromium, Firefox, and WebKit against your local Vite development server.

---

## Quick Reference Commands

### NPM Convenience Scripts
```bash
# Run all tests headlessly across all browsers
npm test

# Open interactive Playwright UI mode (time-travel debugging, locator picker)
npm run test:ui

# Run tests with visible browser windows
npm run test:headed

# Open the latest HTML test execution report
npm run test:report
```

---

## Detailed Playwright Commands

| Task | Command |
| :--- | :--- |
| **Run all tests** | `npx playwright test` |
| **Target a specific browser** | `npx playwright test --project=chromium` *(or `firefox`, `webkit`)* |
| **Run a specific spec file** | `npx playwright test e2e/prescriptions.spec.ts` |
| **Run a single test scenario** | `npx playwright test -g "Scenario 3"` |
| **Headed Mode (watch browsers)** | `npx playwright test --headed` |
| **Interactive UI Mode** | `npx playwright test --ui` |
| **Interactive Debugger** | `npx playwright test --debug` |
| **Show HTML Report** | `npx playwright show-report` |
| **Show Report on Custom Port** | `npx playwright show-report --port 9325` |

---

## Test Suites Overview

- **`e2e/prescriptions.spec.ts`**:
  - **Scenario 1**: App Branding, Header, Default Profile, and Today's Plan banner.
  - **Scenario 2**: User Identity & Family Profile Management (Add member "Lola Remedios", assign role, switch active profile).
  - **Scenario 3**: Primary Form Submission (Prescription Translator, FDA search, dosage chips, TID frequency, PC meal rule, schedule preview, and toast verification).
  - **Scenario 4**: Routine Form Submission (Updating meal anchors like breakfast to `08:00` and asserting schedule adaptation).
  - **Scenario 5**: ResetaDrop P2P Modal (PIN pairing display, QR code canvas, switching to Receive mode).

---

## Local Dev Server Integration

Configured in `playwright.config.ts`:
- **`baseURL`**: `http://localhost:5173`
- **`webServer`**: Automatically checks for an active Vite server. With `reuseExistingServer: true`, Playwright reuses your running `npm run dev` terminal without port conflicts.
