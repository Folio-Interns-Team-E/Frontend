# E2E-to-Jira demo

The demo runner executes one Playwright test twice, classifies reproducible
failures, writes a local Jira Bug draft, searches the `SCRUM` project for an
existing Bug, and optionally creates a new Bug.

## Safe demo

```powershell
npm run test:e2e:jira-demo
```

The default case is `APP-06`. Because its known defect is already represented in
Jira, the expected demonstration outcome is a duplicate match rather than an
unnecessary new issue.

Choose another case:

```powershell
npm run test:e2e:jira-demo -- --test AUTH-09
```

## Jira connection

Set credentials in the current terminal only. Never add them to `.env` or Git.

```powershell
$env:JIRA_BASE_URL = "https://folio-team-e.atlassian.net"
$env:JIRA_EMAIL = "your-atlassian-email@example.com"
$env:JIRA_API_TOKEN = "your-api-token"
$env:JIRA_PROJECT_KEY = "SCRUM"
```

To allow creation after two matching failures and a clean duplicate search:

```powershell
npm run test:e2e:jira-demo -- --test AUTH-09 --create-jira
```

New cases must first be added to `e2e-jira-demo-cases.json`. This prevents an
unknown or unreviewed Playwright failure from being filed automatically.
