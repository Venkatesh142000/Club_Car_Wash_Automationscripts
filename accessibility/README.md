# Accessibility Auditor — README

This folder contains the Accessibility Auditor specification and the Accessibility Instructions pattern library used to scan web applications for WCAG compliance and to generate remediation guidance.

Files

- `accessibility-auditor.md` — Agent specification: configuration, three-phase workflow (Configure → Scan → Fix), scoring, reporting formats, safety rules, and Playwright MCP usage.
- `accessibility-instructions.md` — Pattern library: WCAG 2.2 AA guidance, component vs. layout rules, code patterns, keyboard/ARIA/visual guidance used to produce fix suggestions.

Quick Overview

- Purpose: Automate accessibility scans (read-only), produce enterprise-grade compliance reports, and provide remediation guidance on request.
- Primary tools: Playwright MCP (browser orchestration), axe-core (automated checks). The agent is designed to orchestrate additional tools (Lighthouse, pa11y, validators) for broader coverage.
- Output: Multi-format reports (Markdown, JSON, CSV, HTML) saved by default to `.github/reports/accessibility/`.

## Quick Start (5 minutes)

### Step 1: Create URL File

```bash
cat > accessibility/accessibility-url.txt << 'EOF'
# Accessibility Audit URLs
https://example.com
https://example.com/about
https://example.com/contact
EOF
```

### Step 2: Run the Audit (via MCP)

```
Run accessibility audit
```

The agent will scan all URLs, test mobile/tablet/desktop viewports, and generate a report.

### Step 3: Review the Report

Open the generated report:

```
.github/reports/accessibility/accessibility-report-{date}-{time}.md
```

### Step 4: Get Fixes (Optional)

```
Suggest fixes
```

The agent generates remediation guidance with code examples. Review, test, and apply manually.

---

- Primary config file: `accessibility/info.yml` (YAML). Configure WCAG version, conformance level, viewports, excluded rules, and report options.
- URLs to scan: `accessibility/accessibility-url.txt` (one URL per line; `#` for comments).
- Defaults: WCAG 2.2 (AA), desktop viewport (1440×900), Markdown output, screenshots enabled.

## How It Works (3-Phase Workflow)

### Phase 1: Configuration & Discovery

The agent reads your configuration and URL list, validates that URLs are reachable, and reports the audit settings back to you.

**You do**: Update `accessibility/accessibility-url.txt` (required) and optionally `accessibility/info.yml`.  
**Agent does**: Loads config, validates URLs, reports ready state.

### Phase 2: Scan & Report

The agent navigates to each URL using Playwright MCP, tests multiple viewports (mobile, tablet, desktop), injects axe-core to run automated accessibility checks, captures screenshots as evidence, and compiles a professional compliance report.

**You do**: Trigger the audit (via MCP or CLI).  
**Agent does**: Tests each URL, computes scores and grades, generates reports (Markdown/JSON/HTML/CSV), saves to `.github/reports/accessibility/`.

### Phase 3: Fix Suggestions (On Request)

The agent analyzes detected issues, auto-detects your tech stack, and provides code examples and testing steps for remediation using patterns from `accessibility-instructions.md`.

**You do**: Ask "Suggest fixes" after reviewing the report.  
**Agent does**: Generates remediation guide with framework-specific code examples. **Never auto-applies changes** — you review and test everything first.

Report Contents

- Executive summary with overall score and grade
- Compliance dashboard (per WCAG principle and criterion)
- Issue list with severity, WCAG mapping, affected pages, and instances
- Priority remediation roadmap (PRIORITY 1/2/3)
- Detailed per-page findings with evidence screenshots
- Manual testing checklist and appendix (tools, timestamps)

Scoring & Prioritization

- Score calculated using a weighted violations formula (weights for Critical, High, Medium, Low).
- Grade bands (A+ to F) and compliance statuses (CONFORMANT / PARTIALLY CONFORMANT / NON-CONFORMANT).

Safety & Operational Rules

- Read-only mode: The auditor must not submit forms, authenticate with production credentials, click destructive actions, or perform state-changing operations.
- Fix suggestions are examples only; never auto-apply code changes without explicit permission.
- Respect `robots.txt` and rate limits when crawling or scanning sites.

Extending the Auditor

- Add additional automated checks (Lighthouse, pa11y, HTML validator) to increase coverage and incorporate their results into the unified report.
- Add unit/component tests using `jest-axe` or `@axe-core/playwright` for CI-level checks.
- Store historical reports to enable trend analysis and dashboards.

Manual Testing Guidance
Include the manual checklist from `accessibility-auditor.md` when validating fixes: keyboard navigation, screen reader verification (NVDA/VoiceOver/JAWS), zoom and visual checks, and cognitive accessibility review.

## Configuration & Setup

### 1. Create URL Configuration File

Update `accessibility/accessibility-url.txt` in your repository:

```text
# Accessibility Audit URLs
# Add one URL per line (http:// or https://)
# Lines starting with # are comments

# Homepage
https://example.com

# Core pages
https://example.com/about
https://example.com/contact
https://example.com/products

# User flows
https://example.com/checkout
https://example.com/login
```

### 2. Create Audit Configuration File (Optional)

Update `accessibility/info.yml` to customize the audit:

```yaml
# Accessibility Audit Configuration
audit:
  wcag_version: "2.2"        # WCAG version: "2.0" | "2.1" | "2.2"
  conformance_level: "AA"    # Conformance level: "A" | "AA" | "AAA"
  include_standards:
    - best-practices
    - section508
  exclude_rules: []          # Exclude specific axe-core rules (optional)

# Multi-viewport testing (mobile, tablet, desktop)
viewports:
  mobile:
    width: 375
    height: 667
    enabled: true
  tablet:
    width: 768
    height: 1024
    enabled: true
  desktop:
    width: 1440
    height: 900
    enabled: true

# Report output settings
report:
  formats: [markdown, json, html]  # Output formats
  screenshots: true                # Include page evidence
  include_trends: true             # Compare with previous audits
  output_dir: ".github/reports/accessibility"

# URL source
urls:
  file: "accessibility/accessibility-url.txt"
  crawl:
    enabled: false
    max_depth: 2
    max_pages: 50
```

If no config file is found, these defaults apply:

- WCAG 2.2 Level AA
- Desktop viewport only (1440×900)
- Markdown output with screenshots
- Reports saved to `.github/reports/accessibility/`

## Running an Audit via MCP

### Primary Approach: Use Playwright MCP

The auditor is designed to work with **Playwright MCP** — no package installation required. Configure your MCP server with Playwright support (consult your MCP client/server documentation).

**Example with MCP Client (Claude, Copilot, or similar):**

1. Ensure Playwright MCP is enabled in your `.mcp.json` or MCP configuration.
2. Invoke the auditor agent:

```
Run accessibility audit

or

Run accessibility audit on the URLs in accessibility/accessibility-url.txt
```

The agent will:

- Load `accessibility/info.yml` (or use defaults)
- Navigate to each URL using Playwright MCP
- Inject axe-core for automated checks
- Test each configured viewport
- Generate and save reports to `.github/reports/accessibility/`

### Expected Output

After running:

```
[INFO] Loading configuration...
Configuration:
• WCAG Version: 2.2 Level AA
• Viewports: Mobile, Tablet, Desktop
• Output: Markdown, JSON

[INFO] Starting accessibility scan...

Testing with Playwright MCP...
├─ COMPLETE: https://example.com (Score: 82)
├─ COMPLETE: https://example.com/about (Score: 88)
└─ COMPLETE: https://example.com/contact (Score: 75)

[REPORT GENERATED]

=== Audit Complete ===
• Overall Score: 82/100 (Grade B)
• Status: PARTIALLY CONFORMANT
• Issues: 24 total (2 critical, 6 high)

Report saved to: .github/reports/accessibility/accessibility-report-2026-02-10-14-30.md
Report saved to: .github/reports/accessibility/accessibility-report-2026-02-10-14-30.json

Type "suggest fixes" for remediation guidance.
```

### Requesting Fix Suggestions

After the report is generated, ask:

```
Suggest fixes

or

provide remediation guidance for the critical issues
```

The agent will:

- Analyze each issue against `accessibility-instructions.md`
- Auto-detect the tech stack (React, Vue, Angular, etc.)
- Generate code examples tailored to your framework
- Produce remediation guide with testing steps

Example output:

```
[INFO] Generating remediation guide...

Analyzing 24 issues across 3 pages...
Detected technology: React

[REMEDIATION GUIDE GENERATED]

=== Remediation Guide Complete ===

Reports saved:
• .github/reports/accessibility/remediation-guide-2026-02-10-14-30.md

[Important] These are suggestions only. Review and test before applying.
Would you like me to explain any specific fix?
```

## Alternative: Local/CI Implementation

If you prefer a local Node.js runner or CI integration instead of MCP:

```bash
# Install dependencies
npm install playwright @axe-core/playwright

# Run auditor script (you must implement this runner)
node ./scripts/run-accessibility-audit.js
```

Example `scripts/run-accessibility-audit.js` (you modify to suit your needs):

```javascript
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { chromium } = require('playwright');

(async () => {
  // Load config
  const configPath = 'accessibility/info.yml';
  const config = fs.existsSync(configPath) 
    ? yaml.load(fs.readFileSync(configPath, 'utf8'))
    : { /* defaults */ };

  // Load URLs
  const urlFile = 'accessibility/accessibility-url.txt';
  const urls = fs.readFileSync(urlFile, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // For each URL, navigate and inject axe-core
  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle' });
    const results = await page.evaluate(() => {
      // axe-core injection and execution (pseudocode)
      return axe.run(document, { /* axe config */ });
    });
    // Process and save results...
  }

  await browser.close();
  console.log('Audit complete. Reports saved.');
})();
```

Contributing

- Update `accessibility-instructions.md` for new patterns or platform guidance.
- Update `accessibility-auditor.md` when changing workflow, scoring, or report formats.
- Add integration examples in a `scripts/` directory if you implement a concrete runner.

Support & Next Steps

- Implement a Playwright MCP runner that follows the agent spec to produce the reports.
- Integrate additional tools (Lighthouse, pa11y) for more complete automated coverage.
- Add CI hooks and a sample run script for reproducible audits.

License & Notes

- This project provides documentation and guidance. Always review and test remediation suggestions in a development environment before applying to production.
