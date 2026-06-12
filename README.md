# DV_QA E2E Automation Suite

End-to-end test automation framework for the SauceDemo web application, built with [Playwright](https://playwright.dev/), the Page Object Model (POM), and rich Allure reporting. Supports local execution, **Sauce Labs cloud execution**, **Jenkins CI/CD**, **Microsoft Teams + Email notifications**, and **Jira Xray** result publishing.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Reporting](#reporting)
- [Framework Concepts](#framework-concepts)
  - [Fixtures & Page Objects](#fixtures--page-objects)
  - [Helper Utilities](#helper-utilities)
  - [API Layer](#api-layer)
  - [Test Data](#test-data)
  - [Credential Encryption](#credential-encryption)
- [CI/CD — Jenkins Pipeline](#cicd--jenkins-pipeline)
- [Sauce Labs Integration](#sauce-labs-integration)
- [Jira Xray Integration](#jira-xray-integration)
- [Writing a New Test](#writing-a-new-test)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Test runner | [@playwright/test](https://playwright.dev/) `^1.58` |
| Language | JavaScript (ES Modules, Node `>=18`) |
| Reporting | [allure-playwright](https://github.com/allure-framework/allure-js), JUnit XML, Playwright HTML |
| Test data | JSON fixtures + [@faker-js/faker](https://github.com/faker-js/faker) |
| HTTP | [axios](https://github.com/axios/axios) + Playwright `request` |
| Encryption | [crypto-js](https://github.com/brix/crypto-js) (AES) |
| Env config | [dotenv](https://github.com/motdotla/dotenv) |
| Cloud grid | [Sauce Labs](https://saucelabs.com/) via `saucectl` |
| CI | Jenkins (declarative pipeline) |
| Notifications | Microsoft Teams (Adaptive Cards) + Email (HTML) |
| Test mgmt | Jira Xray Cloud |

---

## Features

- ✅ **Page Object Model** with dependency-injected fixtures
- ✅ **Unified helper library** (220+ utilities — actions, assertions, API, Allure, files, retry)
- ✅ **Cross-browser** projects: Chromium, Firefox, WebKit + mobile (Android, iPhone, iPad)
- ✅ **Cloud execution** via Sauce Labs (`saucectl`)
- ✅ **Rich Allure reports** with screenshots, video, traces, severity, tags, TMS links
- ✅ **CI-ready** Jenkinsfile with Allure publishing to GitHub Pages + OneDrive archival
- ✅ **Teams + Email notifications** with QuickChart doughnut chart and pass-rate banner
- ✅ **Jira Xray** result upload via `updateTestResults.js`
- ✅ **Secret handling** via AES encryption + `.env`
- ✅ **Faker-powered** dynamic test data for forms and payloads
- ✅ **Tag-based execution** (`@smoke`, `@regression`)

---

## Project Structure

```
DV_QA_E2EAutomationSuite/
├── Api/
│   ├── BaseLayer.js              # Playwright APIRequestContext factory (auth, baseURL)
│   └── clientLayer.js            # ApiClient (get/post/put/delete wrappers)
├── fixtures/
│   └── baseFixture.js            # Custom Playwright test fixtures (POM injection)
├── pages/
│   ├── loginPage.js              # Login Page Object
│   ├── productsPage.js           # Products Page Object
│   ├── addToCartPage.js          # Cart Page Object
│   └── checkOutPage.js           # Checkout Page Object
├── tests/
│   ├── login.spec.js             # Login flow tests
│   ├── booking.spec.js           # End-to-end checkout/booking tests
│   ├── sauceLogin.spec.js        # Sauce Labs-targeted login tests
│   └── example.spec.js           # Reference test
├── utils/
│   ├── helpers.js                # 200+ shared utilities (actions, assertions, allure, api)
│   ├── fakerHelper.js            # Synthetic data generators
│   └── payLoadBuilder.js         # API request payload builder
├── .sauce/
│   └── config.yml                # Sauce Labs (saucectl) configuration
├── .github/                      # GitHub workflows (if present)
├── allure-results/               # Raw Allure result JSONs (generated)
├── playwright-report/            # Playwright HTML report (generated)
├── test-results/                 # Screenshots, videos, traces (generated)
├── cryptoHelper.js               # AES encrypt/decrypt class
├── encrypt_creds.js              # CLI script: print encrypted creds
├── updateTestResults.js          # Upload JUnit results to Jira Xray
├── xrayGlobalTeardown.js         # Playwright global teardown for Xray
├── Jenkinsfile                   # Declarative Jenkins pipeline
├── playwright.config.js          # Playwright config (projects, reporters, timeouts)
├── testData.json                 # Static test data (users, expected messages)
├── results.xml                   # JUnit output (generated)
├── package.json                  # Scripts + dependencies
└── README.md                     # ← you are here
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Node.js** | `>= 18` | https://nodejs.org/ |
| **npm** | `>= 9` | bundled with Node |
| **Java JRE** | `>= 8` | required by Allure CLI |
| **Allure CLI** | latest | `brew install allure` (macOS) / `scoop install allure` (Windows) |
| **Git** | latest | https://git-scm.com/ |

Optional (CI / cloud):

- **`saucectl`** for Sauce Labs runs — `curl -L https://saucelabs.github.io/saucectl/install \| bash`
- **Jenkins** with `NodeJS`, `Allure`, `Email Extension`, `Credentials Binding`, `Pipeline: Utility Steps` plugins

---

## Installation

```bash
# 1. Clone
git clone https://github.com/tejavardhangoud/DV_QA_E2EAutomationSuite.git
cd DV_QA_E2EAutomationSuite

# 2. Install dependencies
npm ci          # or: npm install

# 3. Install Playwright browsers (Chromium, Firefox, WebKit)
npx playwright install
# (Linux/CI needs system deps too)
# npx playwright install --with-deps

# 4. Create a local .env (see next section)
cp .env.example .env   # if an example exists, else create one manually
```

---

## Environment Variables

Create a `.env` file at the project root. `.env` is gitignored (`.gitignore` → `.env`).

```env
# ─── Required for all UI runs ──────────────────────────────
BASE_URL=https://www.saucedemo.com/

# ─── Optional: Playwright behavior ─────────────────────────
RETRY=0                  # number of test retries (default 0)
CI=                      # leave empty locally; set to "true" in CI

# ─── Sauce Labs (only for `test:sauce`) ────────────────────
SAUCE_USERNAME=
SAUCE_ACCESS_KEY=
SAUCE_REGION=eu-central-1

# ─── Encrypted credentials (optional) ──────────────────────
SECRET_KEY=your-strong-secret
ENCRYPTED_USERNAME=
ENCRYPTED_PASSWORD=

# ─── API tests (Api/BaseLayer.js) ──────────────────────────
# Preferred (uppercase) env names shown; lowercase variants are also accepted.
API_BASE_URL=
API_USERNAME=
API_PASSWORD=

# ─── Jira Xray (updateTestResults.js) ──────────────────────
XRAY_CLIENT_ID=
XRAY_CLIENT_SECRET=
XRAY_BASE_URL=
XRAY_REGION=
XRAY_TEST_EXEC_KEY=
```

> In Jenkins these values come from the pipeline `environment { … }` block and Jenkins **Credentials** — do not commit secrets.

---

## Running Tests

All commands are defined as npm scripts in [package.json](package.json).

### Most common

```bash
npm test                                    # run everything
npm run test:chromium                       # one browser
npx playwright test tests/login.spec.js     # one file
npx playwright test --grep @smoke           # by tag
npm run test:headed                         # see the browser
npm run test:ui                             # Playwright UI mode (recommended for debugging)
npm run test:debug                          # step-through debugger
```

### By project (browser/device)

```bash
npm run test:chromium      npm run test:firefox     npm run test:webkit
npm run test:android       npm run test:iphone      npm run test:ipad
npm run test:mobile        # all 3 mobile projects
npm run test:cross-browser:3   # chromium + firefox + webkit
```

### Parallelization & sharding

```bash
npm run test:parallel              # workers=100%
npm run test:serial                # workers=1
npm run test:workers:4             # workers=4
npm run test:shard:1of3            # CI shard 1 of 3
```

### Tag-based

```bash
npm run test:smoke:tag             # --grep @smoke
npm run test:regression:tag        # --grep @regression
npm run test:smoke:parallel        # @smoke with workers=2
```

### Sauce Labs

```bash
npm run test:sauce                 # saucectl run --config .sauce/config.yml
```

### Re-runs & misc

```bash
npm run test:rerun-failed          # --last-failed
npm run clean:results              # delete test-results + playwright-report
```

---

## Reporting

This framework writes three reporters in parallel ([playwright.config.js](playwright.config.js)):

```javascript
reporter: [
    ["allure-playwright"],                     // → allure-results/
    ["junit", { outputFile: "results.xml" }],  // → results.xml (Jira Xray)
    ["html", { open: "never" }],               // → playwright-report/
]
```

### Allure (primary)

```bash
# Generate static HTML report
npx allure generate allure-results --clean -o allure-report

# Open in browser
npx allure open allure-report

# Or do both at once (auto-opens local server)
npx allure serve allure-results
```

The Allure report includes per-test **severity**, **tags**, **epic/feature/story**, **TMS links**, **screenshots**, **videos**, and **traces**.

### Playwright HTML report

```bash
npm run report          # alias for: npx playwright show-report
```

### JUnit XML

`results.xml` is auto-generated for Jira Xray ingestion. See [Jira Xray Integration](#jira-xray-integration).

---

## Framework Concepts

### Fixtures & Page Objects

Custom test fixtures in [fixtures/baseFixture.js](fixtures/baseFixture.js) wire every Page Object to the Playwright `test` runner. Just destructure what you need:

```javascript
import { test } from '../fixtures/baseFixture.js';

test('login flow', async ({ loginPage, productPage, addToCartPage }) => {
    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    // …
});
```

Available fixtures:

| Fixture | Type | Purpose |
|---|---|---|
| `loginPage` | `LoginPage` | Login screen |
| `productPage` | `Products` | Products listing |
| `addToCartPage` | `AddToCart` | Cart |
| `checkOutPage` | `CheckOut` | Checkout form |
| `cust_details` | object | Faker-generated checkout customer |
| `apiContext` | `APIRequestContext` | Authenticated Playwright HTTP context |
| `apiClient` | `ApiClient` | Wrapped HTTP client (get/post/put/delete) |
| `payLoader` | `PayloadBuilder` | Request body builder |

### Helper Utilities

[utils/helpers.js](utils/helpers.js) exports **220+ named helpers** used throughout the suite. Import the default object and call by name:

```javascript
import helpers from '../utils/helpers.js';

await helpers.assertVisible({ locator: page.locator('#cart') });
await helpers.assertText({ locator: errorEl, text: 'Invalid credentials' });
await helpers.allureSeverity('blocker');
await helpers.allureTag('smoke');
```

Categories:

| Group | Examples |
|---|---|
| **Waits / actions** | `waitForDisplayed`, `waitForClickable`, `sendKeys`, `pressKey`, `selectDropdown`, `setCheckbox`, `uploadFile`, `scrollIntoView` |
| **Assertions** | `assertVisible`, `assertHidden`, `assertText`, `assertContainsText`, `assertValue`, `assertAttribute`, `assertClassContains`, `assertChecked`, `assertCount`, `assertUrl`, `assertTitle`, `assertEqual`, `assertContains`, `assertTruthy`, `assertGreaterThan` |
| **API** | `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `assertStatus`, `validateGetResponseStatusCode` |
| **Allure** | `allureStep`, `allureEpicLabel`, `allureFeatureLabel`, `allureStoryLabel`, `allureSeverity`, `allureTestCase`, `allureTag`, `allureBrowser`, `attachScreenshot` |
| **Tabs / nav** | `waitAndSwitchToNewTabByTitle`, `switchToTabByTitle`, `switchToTabByUrl`, `waitForNavigationAfterAction` |
| **Files / data** | `readJsonFile`, `writeJsonFile`, `takeScreenshot`, `safeJsonParse` |
| **Flow control** | `retry`, `runStep`, `sleep` |
| **Env** | `getEnv` |

> **Convention:** every helper takes a single **named-arguments object** (e.g. `{ locator, timeout }`) — never positional args. This keeps call sites self-documenting.

### API Layer

Two-level abstraction in `Api/`:

- **`ApiBase`** ([Api/BaseLayer.js](Api/BaseLayer.js)) — creates a Playwright `APIRequestContext` using `api_BASE_URL` (or `API_BASE_URL` / `BASE_URL`) and configures Basic Auth using `api_username`/`api_password` (or `API_USERNAME`/`API_PASSWORD`). The context sets `Authorization: Basic <base64>`, `Content-Type: application/json`, and `Accept: application/json`.
- **`ApiClient`** ([Api/clientLayer.js](Api/clientLayer.js)) — typed `get`/`post`/`put`/`delete` wrappers around the context.

Use via the `apiClient` fixture:

```javascript
test('create resource', async ({ apiClient, payLoader }) => {
    const body = payLoader.buildRequest({ ostemplate: 'ubuntu', rootvolumesize: 20 });
    const res = await apiClient.post('/resources', body);
    await helpers.assertStatus({ response: res, expectedStatus: 201 });
});
```

### Test Data

- **Static**: [testData.json](testData.json) — usernames, expected messages, fixtures.
- **Dynamic**: [utils/fakerHelper.js](utils/fakerHelper.js) — `generateCheckoutCustomer()` etc., powered by `@faker-js/faker`.
- **Payloads**: [utils/payLoadBuilder.js](utils/payLoadBuilder.js) — builds parameterized API request bodies.

### Credential Encryption

For secrets that must live in `.env` but not in plain text:

1. Set a strong `SECRET_KEY` in your shell:

   ```bash
   export SECRET_KEY="some-long-random-string"
   ```

2. Edit [encrypt_creds.js](encrypt_creds.js) with the plaintext values, then run:

   ```bash
   node encrypt_creds.js
   ```

3. Copy the printed `ENCRYPTED_USERNAME` / `ENCRYPTED_PASSWORD` into `.env`.

4. In your test, decrypt at runtime:

   ```javascript
   import CommonUtils from '../cryptoHelper.js';
   const crypto = new CommonUtils();
   const username = crypto.decryptKey(process.env.ENCRYPTED_USERNAME);
   ```

> ⚠️ Never commit `SECRET_KEY` or the plaintext values.

---

## CI/CD — Jenkins Pipeline

The [Jenkinsfile](Jenkinsfile) is a fully-featured declarative pipeline that runs on every build:

### Pipeline stages

1. **Checkout** — Git checkout
2. **Clean Old Allure Results** — wipe previous run artifacts
3. **Install Dependencies** — `npm ci`
4. **Install Playwright Browsers** — `npx playwright install chromium`
5. **Run Playwright Tests** — `npm run ${PLAYWRIGHT_SCRIPT}` (default `test:jenkins`, or `test:sauce` for cloud)
6. **Debug Verify Allure Results** — sanity-check `allure-results/`
7. **Generate Allure HTML Report** — `allure generate`
8. **Extract Test Statistics** — parse `widgets/summary.json` (passed/failed/broken/skipped/duration)
9. **Zip Allure Report** — for email attachment
10. **Save Allure Report to OneDrive** — archive last 30 builds
11. **Publish Report to GitHub Pages** — `gh-pages` branch on `AutomationReport` repo
12. **Publish Allure Report in Jenkins** — Allure plugin
13. **Post — Notifications** — sends Teams Adaptive Card + branded HTML email

### Result banner logic

The pipeline classifies the build using passed/failed/broken counts (in order, first match wins):

| # | Condition | Banner | Color |
|---|---|---|---|
| 1 | `passed > 0 && (failed > 0 \|\| broken > 0)` | ⚠️ PARTIALLY PASSED | Orange |
| 2 | `broken > 0 && failed == 0 && passed == 0` | 💥 BROKEN | Orange |
| 3 | All non-skipped passed | ✅ SUCCESS | Green |
| 4 | Jenkins `currentBuild.result == 'FAILURE'` | ❌ FAILURE | Red |

> **Failed vs Broken**: A **Failed** test ran an assertion that returned false → product bug. A **Broken** test threw an unexpected error (timeout, selector not found) → test/env issue.

### Required Jenkins credentials

| ID | Type | Used by |
|---|---|---|
| `saucelabcred` | Username/password | Sauce Labs runs |
| `AutomationReport` | Username/password (GitHub PAT) | GitHub Pages publish |
| `teams-webhook-id` | Secret text | Teams notification |

### Required Jenkins environment

The pipeline sets these in its `environment` block — adjust to your infra:

```groovy
BASE_URL          = 'https://www.saucedemo.com/'
PLAYWRIGHT_SCRIPT = 'test:jenkins'    // or test:sauce
ONEDRIVE_FOLDER   = '/path/to/OneDrive/uiAutomationReport'
GITHUB_USER       = 'your-gh-user'
GITHUB_REPO       = 'AutomationReport'
```

---

## Sauce Labs Integration

Cloud runs use [`saucectl`](https://docs.saucelabs.com/dev/cli/saucectl/) configured by [.sauce/config.yml](.sauce/config.yml).

```bash
export SAUCE_USERNAME=<your-user>
export SAUCE_ACCESS_KEY=<your-key>
npm run test:sauce
```

In Jenkins this is automatic via the `saucelabcred` credential.

---

## Jira Xray Integration

[updateTestResults.js](updateTestResults.js) ingests `results.xml` into a Jira Xray Test Execution.

```bash
node updateTestResults.js
```

Reads env vars:

```env
XRAY_CLIENT_ID=...
XRAY_CLIENT_SECRET=...
XRAY_BASE_URL=...           # or set XRAY_REGION (e.g. "us")
XRAY_TEST_EXEC_KEY=ABC-123  # the Test Execution issue key
```

To run automatically after every Playwright execution, uncomment in [playwright.config.js](playwright.config.js):

```javascript
globalTeardown: "./updateTestResults.js"
```

---

## Writing a New Test

### 1. Add a Page Object (optional)

```javascript
// pages/cartPage.js
export default class CartPage {
    constructor(page, isMobile = false) {
        this.page = page;
        this.checkoutBtn = page.locator('#checkout');
    }
    async clickCheckout() { await this.checkoutBtn.click(); }
}
```

### 2. Register it as a fixture

```javascript
// fixtures/baseFixture.js
import CartPage from '../pages/cartPage.js';

cartPage: async ({ page, isMobile }, use) => {
    await use(new CartPage(page, isMobile));
},
```

### 3. Write the spec

```javascript
// tests/cart.spec.js
import { test } from '../fixtures/baseFixture.js';
import helpers from '../utils/helpers.js';
import testData from '../testData.json' with { type: 'json' };

test.describe('Cart', () => {
    test.beforeEach(async () => {
        await helpers.allureEpicLabel('Cart Module');
        await helpers.allureFeatureLabel('Checkout');
        await helpers.allureSeverity('critical');
        await helpers.allureTag('regression');
    });

    test('user can proceed to checkout @regression', async ({ loginPage, cartPage }) => {
        await helpers.allureBrowser(test.info().project.name);
        await loginPage.goto();
        await loginPage.login(testData.users.standard.username, testData.users.standard.password);
        await cartPage.clickCheckout();
        await helpers.assertUrl({ page: cartPage.page, url: /checkout/ });
    });
});
```

### 4. Run

```bash
npx playwright test tests/cart.spec.js --project=chromium --headed
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Error: BASE_URL is not set` | `.env` missing or empty | Create `.env` with `BASE_URL=https://www.saucedemo.com/` |
| `No report found at ".../playwright-report"` | HTML reporter not enabled OR tests never ran | Ensure `["html", …]` in `reporter`, then run tests before `show-report` |
| `injected env (0) from .env` | shell already has the var; dotenv won't overwrite | Harmless — it's working |
| `Step failed: …` from helpers | Wrapped error from `runStep` | Check the underlying message after the period |
| Sauce: `SAUCE_USERNAME missing` | Credentials not exported | `export SAUCE_USERNAME=… SAUCE_ACCESS_KEY=…` or use Jenkins credential |
| Allure `command not found` | CLI not installed | `brew install allure` (macOS) / `scoop install allure` (Windows) |
| `npm run test:jenkins` runs only `login.spec.js` | The script is hardcoded to a single file | Edit `"test:jenkins"` in [package.json](package.json#L9) to broaden scope |
| Tests "pass" but never assert | Assertion method exists but isn't called | Call the page object's validation method explicitly in the spec |

---

## Contributing

1. Branch from `main`: `git checkout -b feature/<short-name>`
2. Add/edit tests under `tests/` and Page Objects under `pages/`
3. Register any new Page Object as a fixture in [fixtures/baseFixture.js](fixtures/baseFixture.js)
4. Run locally and confirm green:
   ```bash
   npm run test:chromium
   ```
5. Open a Pull Request against `main`

### Coding conventions

- **ES Modules** (`import` / `export`, `"type": "module"` in package.json)
- **Named-argument helpers** (`{ locator, timeout }`) — never positional
- **Page Objects** expose **methods**, never raw locators in tests
- **Allure metadata** (`epic`, `feature`, `story`, `severity`, `tag`) in `beforeEach`
- **No secrets in commits** — use `.env` (gitignored) or Jenkins credentials


