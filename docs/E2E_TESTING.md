# End-to-end testing

SalesSync uses Playwright to protect its public sign-in journey and authentication boundary. The default suite is intentionally non-destructive: it runs against the local frontend and mocks only the authentication responses needed to verify browser behavior.

## Run locally

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Use `npm run test:e2e:headed` while developing and `npm run test:e2e:report` to open the latest HTML report. Failure traces, screenshots, and videos are written under `test-results/`; the HTML report is written to `playwright-report/`.

## Run against a deployed environment

Set `PLAYWRIGHT_BASE_URL` to an isolated staging frontend before running the same suite:

```bash
PLAYWRIGHT_BASE_URL=https://staging.example.com npm run test:e2e
```

Do not add tests that create users, leads, meetings, sequences, or emails against production. Those workflows require a dedicated staging database, test-only accounts, seeded fixtures, and cleanup scoped to those fixtures. CI currently runs only the safe smoke suite and retains diagnostics for seven days.

## CI behavior

Pull requests and pushes to `main` run Chromium after type-checking and building the application. CI retries failures twice, uses one worker for deterministic results, and uploads the report and diagnostics even when the suite fails.
