# Qualitara Playwright Assessment

[![Playwright Tests](https://github.com/krsk9999/qualitara-playwright-assessment/actions/workflows/tests.yml/badge.svg)](https://github.com/krsk9999/qualitara-playwright-assessment/actions/workflows/tests.yml)

End-to-end test suite in **Playwright + TypeScript** for the public demo app
[the-internet.herokuapp.com](https://the-internet.herokuapp.com). It has a GitHub Actions pipeline that
caches dependencies and browsers, caps parallelism at 3 workers, and uploads reports and traces when a
run fails.

| Scenario | Page | What is verified |
|---|---|---|
| Login (data-driven) | `/login` | One valid and two invalid credential sets from a single typed dataset. Checks the outcome, flash message and resulting page for each. |
| Dynamic content | `/dynamic_loading` → `/dynamic_loading/1` | Opening "Example 1" from the index page leads to `/dynamic_loading/1`. There, the hidden `Hello World!` element becomes **visible** after clicking Start. It is already in the DOM (but hidden) from the start. |
| Form inputs | `/checkboxes` | Initial state, `check()`/`uncheck()`, and `click()` toggling in both directions. |

---

## Contents

- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Initialization](#initialization)
- [Configuration](#configuration)
- [Running the tests](#running-the-tests)
- [Reports, screenshots and traces](#reports-screenshots-and-traces)
- [Continuous integration](#continuous-integration)
- [Design decisions and trade-offs](#design-decisions-and-trade-offs)
- [Known issue: demo host instability](#known-issue-demo-host-instability)
- [How AI was used](#how-ai-was-used)

---

## Project structure

```text
.
├── .github/workflows/tests.yml     # CI: push / PR / manual, ≤3 workers, caches, failure artifacts
├── .claude/agents/                 # AI agent definition used during implementation (see "How AI was used")
├── ai-sessions/                    # Exported AI conversation logs
├── pages/                          # Page objects: locators + actions only, no assertions
│   ├── login.page.ts
│   ├── secure-area.page.ts
│   ├── dynamic-loading.page.ts
│   └── checkboxes.page.ts
├── test-data/
│   ├── env.ts                      # requireEnv(): fail fast on missing variables
│   └── login.data.ts               # Typed login cases (values from env, expectations in code)
├── tests/                          # One spec per feature; all assertions live here
│   ├── login.spec.ts
│   ├── dynamic-loading.spec.ts
│   └── checkboxes.spec.ts
├── .env.example                    # Template for the local .env (committed)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

- **Node.js 24** (LTS). The exact major is pinned in [`.nvmrc`](.nvmrc), so `nvm use` picks it up.
- **npm** (comes with Node).
- **Git**.

The Chromium browser is installed by Playwright during initialization. No global installs are needed.

---

## Initialization

```bash
git clone https://github.com/krsk9999/qualitara-playwright-assessment.git
cd qualitara-playwright-assessment

nvm use                         # optional: switch to the Node version in .nvmrc
npm ci                          # install exact versions from package-lock.json
npx playwright install chromium # download the browser (add --with-deps on a fresh Linux machine)

cp .env.example .env            # create your local environment file
```

You can now run `npm test`.

---

## Configuration

### Environment variables (`.env`)

Login credentials are not hard-coded. They are read from environment variables. Locally they come
from a `.env` file, which is gitignored. [`playwright.config.ts`](playwright.config.ts) loads it with
Node's built-in `process.loadEnvFile()`, so no `dotenv` dependency is needed. In CI the same variables
come from repository secrets.

| Variable | Required | Purpose | Example value |
|---|---|---|---|
| `LOGIN_USERNAME` | yes | Valid username | `tomsmith` |
| `LOGIN_PASSWORD` | yes | Valid password | `SuperSecretPassword!` |
| `LOGIN_INVALID_USERNAME` | yes | Username that must be rejected | `invalidUser` |
| `LOGIN_INVALID_PASSWORD` | yes | Password that must be rejected | `WrongPassword!` |
| `BASE_URL` | no | Target another deployment of the app | defaults to `https://the-internet.herokuapp.com` |

If a required variable is missing, the run stops before any test starts, with this message:

```text
Error: Missing environment variable LOGIN_USERNAME. Copy .env.example to .env and fill it in.
```

> The demo credentials are published on the app's own login page, so they aren't really secret. The
> `.env` and secrets setup shows how real credentials would be handled.

### Playwright configuration (`playwright.config.ts`)

| Setting | Value | Why |
|---|---|---|
| `testDir` | `./tests` | Specs live in one place |
| `fullyParallel` | `true` | Every test is independent, so tests within a file run in parallel too |
| `workers` | `3` in CI, Playwright default locally | Challenge limit: no more than 3 parallel workers in CI |
| `retries` | `2` in CI, `0` locally | Local failures show up immediately. CI absorbs transient host failures and records them as *flaky* |
| `forbidOnly` | `true` in CI | A forgotten `test.only` can't silently shrink the CI run |
| `reporter` | `github` + `html` + `list` in CI, `html` + `list` locally | Inline annotations on PRs, plus a full HTML report |
| `use.baseURL` | `BASE_URL` or the public demo | Specs navigate with relative paths (`/login`) |
| `use.screenshot` | `only-on-failure` | **Required:** automatic screenshot when a test fails |
| `use.trace` | `retain-on-failure` | A full trace (DOM snapshots, network, console) is kept for failed tests |
| `use.video` | `off` | Traces already cover debugging, and videos would make artifacts much bigger |
| Projects | `chromium` (Desktop Chrome) | Focused scope. Adding Firefox/WebKit is a one-line change per project |

Default timeouts are kept: 30s per test and 5s per assertion. The only override is on the single
dynamic-loading assertion. See [Design decisions](#design-decisions-and-trade-offs) for why.

### TypeScript (`tsconfig.json`)

Strict mode, plus `noUncheckedIndexedAccess` and `noImplicitOverride`, on TypeScript 7 with `NodeNext`
module resolution. The project is type-checked separately with `npm run typecheck`. Playwright's own
loader only transpiles and doesn't type-check, so the separate check catches type errors before they
become runtime failures.

---

## Running the tests

| Command | What it does |
|---|---|
| `npm test` | Run the full suite headless (6 tests) |
| `npx playwright test tests/login.spec.ts` | Run one spec file |
| `npx playwright test -g "wrong password"` | Run tests whose title matches a pattern |
| `npm run test:headed` | Run with a visible browser window |
| `npm run test:ui` | Open Playwright UI mode (watch, time-travel, pick tests) |
| `npx playwright test --debug` | Step through with the Playwright Inspector |
| `npx playwright test --list` | List discovered tests without running them |
| `npx playwright test --repeat-each=5` | Stability check: run every test 5 times |
| `npx playwright test --workers=3` | Run with the same parallelism as CI |
| `CI=1 npx playwright test` | Run with the CI settings (retries, reporters, worker cap) |
| `npm run typecheck` | Type-check the project (`tsc --noEmit`) |

---

## Reports, screenshots and traces

After every run, the **HTML report** is written to `playwright-report/`:

```bash
npm run report                  # = npx playwright show-report
```

For each **failed** test, `test-results/<test-name>/` contains:

- `test-failed-1.png`: the automatic failure screenshot (also embedded in the HTML report)
- `trace.zip`: the full Playwright trace

Open a trace with:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

You can also click the trace icon in the HTML report, or drop the zip on
[trace.playwright.dev](https://trace.playwright.dev). In the trace viewer you can see every action,
the DOM before and after each one, the network and the console.

Retried attempts get their own `-retry1`/`-retry2` folders, so you can compare a failed attempt with
the one that passed.

---

## Continuous integration

The workflow is [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

**Triggers:** `push` (any branch), `pull_request`, and manual `workflow_dispatch`.

**Pipeline:**

```text
checkout → setup Node (.nvmrc) → restore node_modules cache → npm ci (on cache miss only)
→ restore Playwright browser cache → install browser (on miss) / OS deps (on hit)
→ typecheck → playwright test --workers=3 → upload report + traces (on failure)
```

**Parallelism:**

- There is a single job and no browser or shard matrix. GitHub Actions runs matrix jobs in
  parallel, and each job starts its own Playwright workers. Three jobs × three workers would mean nine
  browsers at once, breaking the "no more than 3 in parallel" rule.
- One job with `--workers=3` keeps total concurrency at 3. The limit is set in both
  `playwright.config.ts` and on the command line, so it holds even if one of them changes.
- **`concurrency`** groups runs per branch. A newer push cancels the run already in progress on feature
  branches and PRs. On `main` every commit keeps its own result.

**Caching:**

| Cache | Path | Key | Notes |
|---|---|---|---|
| `node_modules` | `node_modules/` | OS + resolved Node version + `package-lock.json` hash | `npm ci` is skipped on a hit, because `npm ci` deletes `node_modules` first and would throw the cache away. No `restore-keys`, so a partial match never restores a stale tree. |
| Playwright browsers | `~/.cache/ms-playwright` | OS + installed `@playwright/test` version | On a hit only the OS libraries are installed (`install-deps`), since the cache holds browser binaries but not system packages. |

`setup-node`'s own npm download cache is turned off. Caching `node_modules` directly is what the
challenge asks for, and stacking both caches would be redundant.

**Artifacts (uploaded only when the job fails, kept 14 days):**

- `playwright-report`: the HTML report
- `playwright-traces`: the `test-results/` folder with traces and failure screenshots

**Secrets:** `LOGIN_USERNAME`, `LOGIN_PASSWORD`, `LOGIN_INVALID_USERNAME` and `LOGIN_INVALID_PASSWORD`
are repository secrets, passed to the test step as environment variables.

**Other hardening:** `permissions: contents: read`, the runner image is pinned to `ubuntu-24.04` so
cache keys stay stable, and the job has a 20-minute timeout.

---

## Design decisions and trade-offs

**A light Page Object Model.**
- Each page has a small class holding its locators (`$`-prefixed, `readonly`, created in the
  constructor) and its actions. All assertions stay in the specs, so a reader sees what is verified
  without opening the page objects.
- There's no `BasePage` and there are no custom fixtures. With four small pages they would add
  structure without removing duplication. The suite still extends easily: a new page is one class, and
  a new scenario is one spec.

**Data-driven login: values in env, expectations in code.**
- One typed `LoginCase[]` and one `for … of` loop produce three independently reported tests with
  descriptive titles. There's no copy-pasted flow.
- The credential values are environment configuration. The expected outcome and message for each
  combination is test design, so it stays in version control.
- The test branches on `expected: 'success' | 'failure'` instead of duplicating the flow.

**Locators follow the accessibility tree first.**
- `getByLabel('Username')` and `getByRole('button', { name: 'Login' })`.
- IDs are used only where the app gives nothing better: the `#flash` banner, `#loading` and `#finish`
  have no role or accessible name.
- The checkboxes have no labels, so they are scoped to `form#checkboxes` and identified by position.
- Every locator was checked for uniqueness (`.count()`) against the live page before it was used.

**Scenario 2: wait for visible, not for present.**
- `#finish` is in the DOM from page load with `display:none`. Waiting for the element to *exist*
  passes immediately and then the text check fails, which is the classic CI trap on this page.
- The test opens the example the way a user would: from the `/dynamic_loading` index, it clicks the
  "Example 1: Element on page that is hidden" link and asserts the URL is `/dynamic_loading/1`.
- It then asserts `toBeHidden()`, clicks Start, checks the loading indicator appears (this
  proves the click handler ran), then waits for `toBeVisible()` and checks the exact text.
- The reveal comes from a fixed client-side `setTimeout(…, 5000)`, measured at 5.4s from click to
  visible. That's longer than the 5s default assertion timeout, so **that one assertion** gets 10s.
  The global timeouts are unchanged, and there is no `waitForTimeout` anywhere in the suite.

**Flash messages are checked with `toContainText`.** The banner renders as `<message>\n×` (the × is a
close link). `toContainText` checks the meaningful text literally, without tying the test to the
close-link markup.

**`check()`/`uncheck()` and `click()` are both tested.** `check()` is idempotent and verifies itself.
`click()` shows real toggling in both directions. Each test starts from a fresh page, so the two stay
independent.

**Chromium only, and no Allure, ESLint or Docker.** These were left out to keep the scope focused.
Each would be a straightforward addition.

---

## Known issue: demo host instability

The suite's reliability is limited by the target site, not the tests.

**What was observed during development (October 2026):**
- `the-internet.herokuapp.com` intermittently stalled individual requests for about 30s, then
  answered with HTTP 503. Sometimes it was the HTML document, sometimes jQuery, `app.css` or another
  render-blocking asset.
- A single stall uses up the whole 30s test timeout.
- In one local stability run (every test 5 times, `--retries=2`), all 66 failed attempts traced back to
  stalled host requests. None were selector or assertion failures, and every test passed when the host
  responded.

**How it is handled:**
- No client-side workaround (request blocking, HTTP/2 flags, inflated global timeouts) is baked into
  the suite. Tried experimentally, they only partly helped, and they would hide real problems.
- In CI, `retries: 2` absorbs occasional stalls and reports them as **flaky** rather than hiding them.
- If stalls stay frequent, raising the per-test timeout above the host's 30s stall is the next option,
  so one slow asset doesn't fail a whole attempt.

---

## How AI was used

AI tools were used throughout, with every output reviewed and verified by a person before it was
committed. The full conversation logs are in [`ai-sessions/`](ai-sessions/).

**Tools:**
- **Claude Code** (Anthropic, Claude Opus) was the orchestrating session. It reviewed the plan against
  the challenge brief, broke it into tasks, reviewed every delegated result, and handled git, GitHub
  and CI.
- **"James – Test Automation Engineer"** is a custom agent definition
  ([`.claude/agents/playwright-test-engineer.md`](.claude/agents/playwright-test-engineer.md)). It was
  adapted from one used on other Playwright projects: project-specific rules were stripped and the
  reliability rules kept. These include verifying selector uniqueness against the live page, asserting
  visibility before acting, using `toBeHidden()` instead of `not.toBeVisible()`, no hard waits, and
  never inventing expected data. Implementation tasks were delegated to it one scoped task at a time.

**Workflow:**
1. **Plan.** An execution plan was written before any code. The agent was audited first: the
   original definition conflicted with the plan (mandatory config loaders, Allure, auth fixtures), so
   it was rewritten for this project.
2. **Delegate scoped tasks**, each with explicit acceptance criteria:
   - project setup and config
   - the three scenarios
   - the CI workflow
3. **Verify, don't trust.** Each result was re-checked before committing: type-check, test discovery,
   reading every file, and re-running tests. Examples of what verification caught or decided:
   - The agent measured the dynamic-loading delay (5.4s, longer than the 5s default) instead of
     guessing, which justified the scoped timeout.
   - The agent checked current GitHub Action major versions with `gh api` rather than relying on
     memory.
   - When the suite failed locally, the failures were traced to the demo host (503s after about 30s
     stalls in the trace network logs) instead of being "fixed" with arbitrary waits.
   - An IDE folder (`.idea/`) that slipped into a commit was caught in review and removed before
     anything was pushed.
4. **Human decisions.** These choices were made by me, not the AI:
   - the light POM over no POM
   - credentials in `.env` and secrets
   - keeping the config free of host workarounds
   - repository visibility and naming

**Where AI helped most:** turning the plan into small, verifiable tasks, investigating live-page
behaviour (selector counts, exact flash texts, timing), and diagnosing the host instability from trace
network logs.

**Where it needed steering:**
- The original agent definition carried rules from another project that would have over-engineered
  this suite.
- The agent's first instinct for the host problem was to propose client-side workarounds. The decision
  was to measure in CI first and keep the config clean.
