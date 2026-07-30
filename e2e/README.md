# Playwright suite structure

Browser tests are grouped by user-facing feature:

- `core/` — application shell and authentication flows
- `billing/` — checkout and billing navigation
- `chat/` — chat rendering and browser-side security
- `email/` — composer and history flows

The Docker Compose and backend startup helpers remain in this directory because
they support the complete Playwright suite.
