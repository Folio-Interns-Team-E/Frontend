import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const reportPath = resolve(root, "test-results", "results.json");
const metadataPath = resolve(root, "scripts", "e2e-jira-demo-cases.json");
const args = process.argv.slice(2);

function argument(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const testId = argument("--test", "APP-06");
const createJira = args.includes("--create-jira");
const skipSetup = args.includes("--skip-setup");
const projectKey = process.env.JIRA_PROJECT_KEY || "SCRUM";
const jiraBaseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, "");

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

function collectSpecs(suites, output = []) {
  for (const suite of suites || []) {
    output.push(...(suite.specs || []));
    collectSpecs(suite.suites, output);
  }
  return output;
}

function resultError(result) {
  const error = result.error?.message || result.errors?.[0]?.message || "No error message";
  return error
    .replaceAll(root, "<project>")
    .replace(/\x1b\[[0-9;]*m/g, "")
    .slice(0, 3000);
}

function likelyEnvironmentFailure(message) {
  return /(docker.*not found|cannot connect to.*docker|ECONNREFUSED|database.*unavailable|webServer.*failed|address already in use)/i.test(
    message,
  );
}

function markdownDraft(meta, spec, results, classification) {
  const evidence = results
    .flatMap((result) => result.attachments || [])
    .map((attachment) => attachment.path)
    .filter(Boolean)
    .map((path) => path.replaceAll("\\", "/").replace(`${root.replaceAll("\\", "/")}/`, ""));

  return `# ${testId} Jira Bug Draft

## Summary

\`[${meta.area}] ${meta.summary}\`

## Fields

- Project: ${projectKey}
- Issue type: Bug
- Classification: ${classification}

## Impact

${meta.impact}

## Preconditions

Isolated local E2E environment, Chromium, and synthetic test data.

## Steps to reproduce

1. Start the isolated SalesSync E2E environment.
2. Run \`npm run test:e2e:jira-demo -- --test ${testId}\`.
3. Follow the browser workflow in \`${spec.file}\`.

## Expected

${meta.expected}

## Actual

${resultError(results[0])}

## Reproducibility

${results.filter((result) => result.status !== "passed").length}/${results.length} clean executions failed.

## Evidence

- Test: \`${spec.file}\`
${evidence.length ? evidence.map((path) => `- \`${path}\``).join("\n") : "- Playwright JSON and HTML reports"}

## Acceptance criteria

- The workflow meets the expected behavior.
- Test ${testId} passes twice.
- Related authorization and error paths remain correct.
`;
}

function adfFromMarkdown(markdown) {
  return {
    type: "doc",
    version: 1,
    content: markdown
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text: text.replace(/^#+\s*/g, "").slice(0, 30000) }],
      })),
  };
}

async function jiraRequest(path, options = {}) {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!jiraBaseUrl || !email || !token) {
    throw new Error(
      "Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN to enable Jira search or creation.",
    );
  }
  const response = await fetch(`${jiraBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Jira ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  return response.status === 204 ? {} : response.json();
}

async function searchDuplicate() {
  const jql = `project = "${projectKey}" AND issuetype = Bug AND text ~ "\\"${testId}\\"" ORDER BY updated DESC`;
  const data = await jiraRequest("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql,
      maxResults: 20,
      fields: ["summary", "status", "description"],
    }),
  });
  return data.issues || [];
}

async function verifyBugType() {
  const project = await jiraRequest(`/rest/api/3/project/${encodeURIComponent(projectKey)}`);
  return project.issueTypes?.some((type) => type.name === "Bug");
}

async function createBug(meta, draft) {
  return jiraRequest("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        issuetype: { name: "Bug" },
        summary: `[E2E][${testId}] ${meta.summary}`,
        description: adfFromMarkdown(draft),
      },
    }),
  });
}

if (!skipSetup) {
  console.log("Preparing the isolated E2E database...");
  if (run("npm.cmd", ["run", "test:e2e:setup"]) !== 0) {
    console.error("Environment setup failed. No Jira issue will be created.");
    process.exit(2);
  }
}

console.log(`Running ${testId} twice in Chromium...`);
run("npx.cmd", ["playwright", "test", "--grep", `^${testId}:`, "--repeat-each=2"]);

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const spec = collectSpecs(report.suites).find((item) => item.title.startsWith(`${testId}:`));
if (!spec) {
  console.error(`No Playwright test matched ${testId}. No Jira issue was created.`);
  process.exit(2);
}

const results = (spec.tests || []).flatMap((test) => test.results || []);
const failed = results.filter((result) => !["passed", "skipped"].includes(result.status));
console.log(`Result: ${results.length - failed.length} passed, ${failed.length} failed.`);

if (failed.length === 0) {
  console.log("The test passed twice. There is no bug to report.");
  process.exit(0);
}
if (results.length < 2 || failed.length < 2) {
  console.log("The failure did not reproduce twice. Classified as flaky; no Jira issue created.");
  process.exit(1);
}

const combinedError = failed.map(resultError).join("\n");
const classification = likelyEnvironmentFailure(combinedError) ? "environment" : "product_bug";
const metadata = JSON.parse(readFileSync(metadataPath, "utf8"))[testId];
if (!metadata || classification !== "product_bug") {
  console.log(
    `Classified as ${classification}; ${metadata ? "" : "case metadata is missing; "}no Jira issue created.`,
  );
  process.exit(1);
}

const draft = markdownDraft(metadata, spec, results, classification);
const draftPath = resolve(root, "test-results", "jira-drafts", `${testId}.md`);
mkdirSync(dirname(draftPath), { recursive: true });
writeFileSync(draftPath, draft, "utf8");
console.log(`Verified bug draft: ${draftPath}`);

try {
  const duplicates = await searchDuplicate();
  if (duplicates.length) {
    console.log(
      `Duplicate found: ${duplicates[0].key} — ${duplicates[0].fields?.summary || "existing Jira Bug"}`,
    );
    console.log("No new Jira issue was created.");
    process.exit(1);
  }
  if (!createJira) {
    console.log("No duplicate found. Re-run with --create-jira to create the verified Bug.");
    process.exit(1);
  }
  if (!(await verifyBugType())) {
    console.error(`Project ${projectKey} does not expose a Bug issue type.`);
    process.exit(2);
  }
  const created = await createBug(metadata, draft);
  console.log(`Created Jira Bug: ${created.key}`);
  process.exit(1);
} catch (error) {
  console.error(error.message);
  console.log(`The local draft remains available at ${basename(draftPath)}.`);
  process.exit(1);
}
