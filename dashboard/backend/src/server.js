import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, "package.json");
const TESTS_DIR = path.join(REPO_ROOT, "tests");
const PAGES_DIR = path.join(REPO_ROOT, "pages");
const TEST_RESULTS_DIR = path.join(REPO_ROOT, "test-results");
const ALLURE_RESULTS_DIR = path.join(REPO_ROOT, "allure-results");
const ALLURE_REPORT_DIR = path.join(REPO_ROOT, "allure-report");
const RUN_HISTORY_DIR = path.join(REPO_ROOT, "dashboard", "run-history");
const FRONTEND_DIST_DIR = path.join(REPO_ROOT, "dashboard", "frontend", "dist");
const FRONTEND_INDEX_PATH = path.join(FRONTEND_DIST_DIR, "index.html");
const PORT = Number(process.env.DASHBOARD_BACKEND_PORT || 3001);
const runs = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function getScopeRoot(scope) {
  if (scope === "tests") return TESTS_DIR;
  if (scope === "pages") return PAGES_DIR;
  throw new Error("invalid scope");
}

function normalizeFilePath(filePath, scope = "tests") {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("file is required");
  }

  const rootDir = getScopeRoot(scope);
  const cleanPath = filePath
    .replace(/\\/g, "/")
    .replace(/^tests\//, "")
    .replace(/^pages\//, "");
  const resolved = path.resolve(rootDir, cleanPath);

  if (!resolved.startsWith(rootDir)) {
    throw new Error("invalid file path");
  }

  return {
    absolute: resolved,
    relative: `${scope}/${path.relative(rootDir, resolved).replace(/\\/g, "/")}`,
  };
}

function countTestCases(content) {
  const matcher = /(?:^|\s)(?:test|it)(?:\.(?:only|skip|fail|fixme))?\s*\(/gm;
  return (content.match(matcher) || []).length;
}

async function listTestFiles(dir = TESTS_DIR) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTestFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith(".js") || entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function countLocators(content) {
  const matcher = /(?:locator\s*\(|getBy\w+\s*\()/gm;
  return (content.match(matcher) || []).length;
}

function extractReusableFunctions(content) {
  const methods = [];
  // Match: async methodName() or methodName()
  const matcher = /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
  let match;
  while ((match = matcher.exec(content)) !== null) {
    const name = match[1];
    // Skip constructor
    if (name !== "constructor") {
      methods.push(name);
    }
  }
  return methods;
}

async function getFrameworkCompletions() {
  const completions = [];

  try {
    // Scan pages directory for Page Object classes and methods
    const pageFiles = await listTestFiles(PAGES_DIR);
    for (const filePath of pageFiles) {
      const content = await fs.readFile(filePath, "utf8");
      const fileName = path.basename(filePath, path.extname(filePath));
      
      // Extract class name and methods
      const classMatch = content.match(/export\s+default\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : fileName;
      const methods = extractReusableFunctions(content);
      
      // Add page object completions
      completions.push({
        label: className,
        type: "class",
        info: `Page Object: ${fileName}`,
        section: "Page Objects",
      });
      
      methods.forEach(method => {
        completions.push({
          label: method,
          type: "method",
          info: `${className}.${method}()`,
          section: "Page Object Methods",
        });
      });
    }

    // Scan utils directory for helper functions
    const utilFiles = await listTestFiles(path.join(REPO_ROOT, "utils"));
    for (const filePath of utilFiles) {
      const content = await fs.readFile(filePath, "utf8");
      const fileName = path.basename(filePath, path.extname(filePath));
      const functions = extractReusableFunctions(content);
      
      functions.forEach(func => {
        completions.push({
          label: func,
          type: "function",
          info: `Helper: ${fileName}.${func}()`,
          section: "Utilities",
        });
      });
    }

    // Add common Playwright matchers
    const playwrightMatchers = [
      "page", "expect", "test", "describe", "beforeEach", "afterEach",
      "locator", "fill", "click", "textContent", "getAttribute",
      "waitForSelector", "goto", "pause", "reload"
    ];
    
    playwrightMatchers.forEach(m => {
      completions.push({
        label: m,
        type: "keyword",
        info: `Playwright API: ${m}`,
        section: "Playwright",
      });
    });
  } catch (error) {
    console.error("Error scanning framework files:", error);
  }

  return completions;
}

async function listFilesByScope(scope) {
  const rootDir = getScopeRoot(scope);
  const files = await listTestFiles(rootDir);
  const details = [];
  let totalCases = 0;
  let totalLocators = 0;

  for (const filePath of files) {
    const [content, stat] = await Promise.all([
      fs.readFile(filePath, "utf8"),
      fs.stat(filePath),
    ]);

    const testCaseCount = scope === "tests" ? countTestCases(content) : 0;
    const locatorCount = scope === "pages" ? countLocators(content) : 0;
    totalCases += testCaseCount;
    totalLocators += locatorCount;

    details.push({
      name: path.basename(filePath),
      path: `${scope}/${path.relative(rootDir, filePath).replace(/\\/g, "/")}`,
      testCaseCount,
      locatorCount,
      updatedAt: stat.mtime.toISOString(),
      bytes: stat.size,
    });
  }

  details.sort((a, b) => a.path.localeCompare(b.path));
  return {
    scope,
    totalFiles: details.length,
    totalCases,
    totalLocators,
    files: details,
  };
}

async function getTestsSummary() {
  return listFilesByScope("tests");
}

function keepRecentLogs(run, rawChunk) {
  const lines = rawChunk.split(/\r?\n/).filter(Boolean);
  run.logs.push(...lines);
  if (run.logs.length > 2500) {
    run.logs.splice(0, run.logs.length - 2500);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeAllureSummary(rawSummary = {}) {
  const stats = rawSummary.statistic || rawSummary;
  return {
    passed: Number(stats.passed || 0),
    failed: Number(stats.failed || 0),
    broken: Number(stats.broken || 0),
    skipped: Number(stats.skipped || 0),
    total: Number(stats.total || 0),
  };
}

async function readAllureSummary() {
  const summaryPath = path.join(ALLURE_REPORT_DIR, "widgets", "summary.json");
  if (!(await pathExists(summaryPath))) {
    return null;
  }

  const raw = await fs.readFile(summaryPath, "utf8");
  const parsed = JSON.parse(raw);
  return normalizeAllureSummary(parsed);
}

async function getAllureReportState() {
  const hasResults = await pathExists(ALLURE_RESULTS_DIR);
  const hasReport = await pathExists(path.join(ALLURE_REPORT_DIR, "index.html"));
  let resultsCount = 0;

  if (hasResults) {
    const entries = await fs.readdir(ALLURE_RESULTS_DIR, { withFileTypes: true });
    resultsCount = entries.filter((entry) => entry.isFile()).length;
  }

  const summary = hasReport ? await readAllureSummary() : null;

  return {
    hasResults,
    hasReport,
    resultsCount,
    summary,
    reportUrl: hasReport ? "/allure-report/index.html" : null,
  };
}

async function generateAllureReport() {
  if (!(await pathExists(ALLURE_RESULTS_DIR))) {
    throw new Error("allure-results folder not found. Run tests first.");
  }

  await fs.rm(ALLURE_REPORT_DIR, { recursive: true, force: true });

  const commandAttempts = [
    ["allure-commandline", "generate", "allure-results", "--output", "allure-report"],
    ["allure", "generate", "allure-results", "--output", "allure-report"],
  ];

  let output = null;
  let lastError = "";

  for (const args of commandAttempts) {
    try {
      output = await new Promise((resolve, reject) => {
        const child = spawn("npx", args, {
          cwd: REPO_ROOT,
          env: process.env,
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => {
          stdout += String(chunk);
        });
        child.stderr.on("data", (chunk) => {
          stderr += String(chunk);
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve({ stdout, stderr, command: `npx ${args.join(" ")}` });
            return;
          }
          reject(new Error(stderr || stdout || `Failed command: npx ${args.join(" ")}`));
        });

        child.on("error", (error) => {
          reject(new Error(`Unable to run command npx ${args.join(" ")}: ${error.message}`));
        });
      });
      break;
    } catch (error) {
      lastError = error.message;
    }
  }

  if (!output) {
    throw new Error(lastError || "Unable to generate Allure report.");
  }

  const state = await getAllureReportState();
  return {
    ...state,
    generation: {
      message: "Allure report generated successfully.",
      command: output.command,
      stdout: output.stdout,
      stderr: output.stderr,
    },
  };
}

async function serveAllureReportAsset(req, res, pathname) {
  const reportPath = pathname === "/allure-report" || pathname === "/allure-report/"
    ? "/allure-report/index.html"
    : pathname;
  const relativePath = reportPath.replace(/^\/allure-report\/?/, "");
  const normalizedPath = path.normalize(relativePath);
  const absolutePath = path.resolve(ALLURE_REPORT_DIR, normalizedPath);

  if (!absolutePath.startsWith(ALLURE_REPORT_DIR)) {
    sendJson(res, 400, { error: "invalid report path" });
    return;
  }

  if (!(await pathExists(absolutePath))) {
    sendJson(res, 404, { error: "report asset not found" });
    return;
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const fileBuffer = await fs.readFile(absolutePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(fileBuffer);
}

async function loadRunProfiles() {
  const raw = await fs.readFile(PACKAGE_JSON_PATH, "utf8");
  const pkg = JSON.parse(raw);
  const scripts = pkg.scripts || {};

  const profiles = Object.entries(scripts)
    .filter(([name]) => /^test(?::|$)/.test(name))
    .map(([name, command]) => ({ name, command }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    defaultProfile: profiles.some((p) => p.name === "test:file") ? "test:file" : (profiles[0]?.name || "test"),
    profiles,
  };
}

function safeFileNameSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "run";
}

async function writeRunHistoryMeta(metaPath, run) {
  const payload = {
    id: run.id,
    filePath: run.filePath,
    profileName: run.profileName,
    status: run.status,
    exitCode: run.exitCode,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    reportFile: path.basename(run.jsonReportPath),
  };
  await fs.writeFile(metaPath, JSON.stringify(payload, null, 2), "utf8");
}

function summarizePlaywrightJsonReport(report = {}) {
  const stats = report.stats || {};
  const expected = Number(stats.expected || 0);
  const unexpected = Number(stats.unexpected || 0);
  const flaky = Number(stats.flaky || 0);
  const skipped = Number(stats.skipped || 0);
  const timedOut = Number(stats.timedOut || 0);
  const interrupted = Number(stats.interrupted || 0);
  const total = expected + unexpected + flaky + skipped + timedOut + interrupted;

  const specTitles = [];
  const stack = Array.isArray(report.suites) ? [...report.suites] : [];
  while (stack.length && specTitles.length < 6) {
    const suite = stack.pop();
    if (!suite) continue;
    const specs = Array.isArray(suite.specs) ? suite.specs : [];
    for (const spec of specs) {
      if (!spec?.title) continue;
      specTitles.push(spec.title);
      if (specTitles.length >= 6) break;
    }
    const nested = Array.isArray(suite.suites) ? suite.suites : [];
    stack.push(...nested);
  }

  return {
    total,
    passed: expected,
    failed: unexpected + timedOut,
    flaky,
    skipped,
    interrupted,
    durationMs: Number(stats.duration || 0),
    startedAt: stats.startTime || null,
    specTitles,
  };
}

async function getRunHistory(limit = 20) {
  if (!(await pathExists(RUN_HISTORY_DIR))) {
    return { runs: [] };
  }

  const entries = await fs.readdir(RUN_HISTORY_DIR, { withFileTypes: true });
  const metaFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".meta.json"))
    .map((entry) => entry.name);

  const parsed = await Promise.all(metaFiles.map(async (name) => {
    const metaPath = path.join(RUN_HISTORY_DIR, name);
    try {
      const metaRaw = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(metaRaw);
      const reportFileName = typeof meta.reportFile === "string"
        ? path.basename(meta.reportFile)
        : (typeof meta.reportPath === "string" ? path.basename(meta.reportPath) : null);
      const reportPath = reportFileName ? path.join(RUN_HISTORY_DIR, reportFileName) : null;
      const hasReport = Boolean(reportPath) && (await pathExists(reportPath));
      let summary = null;

      if (hasReport) {
        try {
          const reportRaw = await fs.readFile(reportPath, "utf8");
          summary = summarizePlaywrightJsonReport(JSON.parse(reportRaw));
        } catch {
          summary = null;
        }
      }

      const finishedAt = meta.finishedAt || null;
      const startedAt = meta.startedAt || null;
      const durationMs = summary?.durationMs || (
        startedAt && finishedAt ? Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime()) : 0
      );

      return {
        id: meta.id,
        filePath: meta.filePath,
        profileName: meta.profileName,
        status: meta.status,
        exitCode: meta.exitCode,
        startedAt,
        finishedAt,
        durationMs,
        hasJsonReport: hasReport,
        reportFile: hasReport ? reportFileName : null,
        summary,
      };
    } catch {
      return null;
    }
  }));

  const runsList = parsed
    .filter(Boolean)
    .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())
    .slice(0, limit);

  return { runs: runsList };
}

function getSafeHistoryReportPath(reportFile) {
  if (!reportFile || typeof reportFile !== "string") {
    throw new Error("reportFile is required");
  }

  const safeName = path.basename(reportFile);
  const reportPath = path.join(RUN_HISTORY_DIR, safeName);
  if (!reportPath.startsWith(RUN_HISTORY_DIR)) {
    throw new Error("invalid report file");
  }
  return reportPath;
}

function normalizeAttachmentPath(attachmentPath) {
  if (!attachmentPath || typeof attachmentPath !== "string") {
    return null;
  }

  const absolutePath = path.isAbsolute(attachmentPath)
    ? path.resolve(attachmentPath)
    : path.resolve(REPO_ROOT, attachmentPath);
  if (!absolutePath.startsWith(TEST_RESULTS_DIR)) {
    return null;
  }

  const relativePath = path.relative(TEST_RESULTS_DIR, absolutePath).replace(/\\/g, "/");
  return {
    relativePath,
    url: `/api/test-results/asset?path=${encodeURIComponent(relativePath)}`,
  };
}

function summarizeTestResult(spec, testCase, result, index) {
  const errors = Array.isArray(result.errors) ? result.errors.filter(Boolean) : [];
  const primaryError = errors[0] || null;
  const attachments = Array.isArray(result.attachments) ? result.attachments : [];
  const normalizedAttachments = attachments
    .map((attachment) => {
      const normalized = normalizeAttachmentPath(attachment.path);
      if (!normalized) return null;
      return {
        name: attachment.name || "attachment",
        contentType: attachment.contentType || "application/octet-stream",
        relativePath: normalized.relativePath,
        url: normalized.url,
      };
    })
    .filter(Boolean);

  const screenshot = normalizedAttachments.find((attachment) => attachment.contentType.startsWith("image/") || /screenshot/i.test(attachment.name)) || null;
  const video = normalizedAttachments.find((attachment) => attachment.contentType.startsWith("video/") || /video/i.test(attachment.name)) || null;

  return {
    id: `${spec.id || spec.title}-${testCase.projectName || "project"}-${index}`,
    title: spec.title,
    file: spec.file,
    line: spec.line || null,
    projectName: testCase.projectName || "unknown",
    status: result.status || testCase.status || "unknown",
    durationMs: Number(result.duration || 0),
    errorMessage: primaryError?.message || null,
    stackTrace: primaryError?.stack || primaryError?.message || null,
    screenshot,
    video,
    attachments: normalizedAttachments,
  };
}

function collectTestResultsFromSuites(suites = [], results = []) {
  for (const suite of suites) {
    const specs = Array.isArray(suite.specs) ? suite.specs : [];
    for (const spec of specs) {
      const tests = Array.isArray(spec.tests) ? spec.tests : [];
      for (const testCase of tests) {
        const testResults = Array.isArray(testCase.results) ? testCase.results : [];
        const visibleResults = testResults.filter((result) => result && result.status && result.status !== "skipped");
        visibleResults.forEach((result, index) => {
          results.push(summarizeTestResult(spec, testCase, result, index));
        });
      }
    }

    if (Array.isArray(suite.suites) && suite.suites.length) {
      collectTestResultsFromSuites(suite.suites, results);
    }
  }

  return results;
}

async function getRunDetails(reportFile) {
  const reportPath = getSafeHistoryReportPath(reportFile);
  if (!(await pathExists(reportPath))) {
    throw new Error("run history report not found");
  }

  const reportRaw = await fs.readFile(reportPath, "utf8");
  const report = JSON.parse(reportRaw);
  const results = collectTestResultsFromSuites(report.suites || []);
  const failures = results.filter((item) => item.status !== "passed");

  return {
    reportFile: path.basename(reportPath),
    results,
    failures,
  };
}

async function serveTestResultAsset(res, relativePath) {
  const normalizedPath = path.normalize(relativePath || "");
  const absolutePath = path.resolve(TEST_RESULTS_DIR, normalizedPath);

  if (!absolutePath.startsWith(TEST_RESULTS_DIR)) {
    sendJson(res, 400, { error: "invalid test result asset path" });
    return;
  }

  if (!(await pathExists(absolutePath))) {
    sendJson(res, 404, { error: "test result asset not found" });
    return;
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const fileBuffer = await fs.readFile(absolutePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(fileBuffer);
}

async function serveFrontendApp(res, pathname) {
  const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const normalizedPath = path.normalize(requestedPath);
  const absolutePath = path.resolve(FRONTEND_DIST_DIR, normalizedPath);

  if (!absolutePath.startsWith(FRONTEND_DIST_DIR)) {
    sendJson(res, 400, { error: "invalid frontend asset path" });
    return;
  }

  if (await pathExists(absolutePath)) {
    const stat = await fs.stat(absolutePath);
    if (stat.isFile()) {
      const extension = path.extname(absolutePath).toLowerCase();
      const contentType = MIME_TYPES[extension] || "application/octet-stream";
      const fileBuffer = await fs.readFile(absolutePath);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      });
      res.end(fileBuffer);
      return;
    }
  }

  if (!(await pathExists(FRONTEND_INDEX_PATH))) {
    sendJson(res, 404, {
      error: "frontend build not found",
      hint: "Run npm run build:app from repo root.",
    });
    return;
  }

  const indexHtml = await fs.readFile(FRONTEND_INDEX_PATH);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(indexHtml);
}

function buildRunCommand({ profileName, filePath, runSelectedFile, grep, workers, retries, projects }) {
  const args = ["run", profileName];
  const extraArgs = [];

  if (runSelectedFile !== false && filePath) {
    extraArgs.push(filePath);
  }
  if (grep) {
    extraArgs.push("--grep", grep);
  }
  if (workers) {
    extraArgs.push(`--workers=${workers}`);
  }
  if (Number.isInteger(retries) && retries >= 0) {
    extraArgs.push(`--retries=${retries}`);
  }
  if (Array.isArray(projects) && projects.length) {
    for (const project of projects) {
      extraArgs.push(`--project=${project}`);
    }
  }

  if (extraArgs.length) {
    args.push("--", ...extraArgs);
  }

  return {
    command: "npm",
    args,
    display: `npm ${args.join(" ")}`,
  };
}

async function createRun(runConfig) {
  const {
    filePath,
    profileName,
    runSelectedFile = true,
    grep,
    workers,
    retries,
    projects,
  } = runConfig;

  const cmd = buildRunCommand({
    profileName,
    filePath,
    runSelectedFile,
    grep,
    workers,
    retries,
    projects,
  });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const safeProfile = safeFileNameSegment(profileName);
  const historyBaseName = `${Date.now()}-${id}-${safeProfile}`;
  const jsonReportPath = path.join(RUN_HISTORY_DIR, `${historyBaseName}.json`);
  const metaPath = path.join(RUN_HISTORY_DIR, `${historyBaseName}.meta.json`);
  const run = {
    id,
    filePath,
    profileName,
    status: "running",
    exitCode: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    jsonReportPath,
    logs: [`Running ${cmd.display}`],
  };

  await fs.mkdir(RUN_HISTORY_DIR, { recursive: true });
  await writeRunHistoryMeta(metaPath, run);

  const child = spawn(cmd.command, cmd.args, {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_REPORT_PATH: jsonReportPath,
      DASHBOARD_CAPTURE_ALL_ARTIFACTS: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => keepRecentLogs(run, String(chunk)));
  child.stderr.on("data", (chunk) => keepRecentLogs(run, String(chunk)));

  child.on("close", (exitCode) => {
    run.status = exitCode === 0 ? "passed" : "failed";
    run.exitCode = exitCode;
    run.finishedAt = new Date().toISOString();
    writeRunHistoryMeta(metaPath, run).catch((error) => {
      run.logs.push(`Run history write warning: ${error.message}`);
    });
  });

  child.on("error", (error) => {
    run.status = "failed";
    run.exitCode = -1;
    run.finishedAt = new Date().toISOString();
    run.logs.push(`Unable to start command: ${error.message}`);
    writeRunHistoryMeta(metaPath, run).catch(() => {});
  });

  runs.set(id, run);
  return run;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function validateJavaScriptContent(content) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dv-qa-validate-"));
  const tmpFile = path.join(tmpDir, "validate.mjs");

  try {
    await fs.writeFile(tmpFile, content, "utf8");

    const result = await new Promise((resolve) => {
      const child = spawn("node", ["--check", tmpFile], {
        cwd: REPO_ROOT,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });

      child.on("close", (exitCode) => {
        resolve({ ok: exitCode === 0, stdout, stderr });
      });

      child.on("error", (error) => {
        resolve({ ok: false, stdout: "", stderr: error.message });
      });
    });

    return result;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

createServer(async (req, res) => {
  const origin = `http://${req.headers.host || `localhost:${PORT}`}`;
  const url = new URL(req.url || "/", origin);

  try {
    if (req.method === "OPTIONS") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/tests") {
      const summary = await getTestsSummary();
      return sendJson(res, 200, summary);
    }

    if (req.method === "GET" && url.pathname === "/api/tests/content") {
      const selected = normalizeFilePath(url.searchParams.get("file"), "tests");
      const content = await fs.readFile(selected.absolute, "utf8");
      return sendJson(res, 200, { path: selected.relative, content });
    }

    if (req.method === "POST" && url.pathname === "/api/tests/run") {
      const body = await readBody(req);
      const profileCatalog = await loadRunProfiles();
      const profileName = body.profileName || profileCatalog.defaultProfile;
      const validProfile = profileCatalog.profiles.some((profile) => profile.name === profileName);

      if (!validProfile) {
        return sendJson(res, 400, { error: `Invalid run profile: ${profileName}` });
      }

      const selected = body.file ? normalizeFilePath(body.file, "tests") : null;
      const run = await createRun({
        filePath: selected?.relative || null,
        profileName,
        runSelectedFile: body.runSelectedFile !== false,
        grep: typeof body.grep === "string" ? body.grep.trim() : "",
        workers: body.workers,
        retries: Number.isInteger(body.retries) ? body.retries : undefined,
        projects: Array.isArray(body.projects) ? body.projects.filter(Boolean) : [],
      });
      return sendJson(res, 200, { runId: run.id, status: run.status });
    }

    if (req.method === "GET" && url.pathname === "/api/run/profiles") {
      const profiles = await loadRunProfiles();
      return sendJson(res, 200, profiles);
    }

    if (req.method === "GET" && url.pathname === "/api/runs/history") {
      const limit = Number(url.searchParams.get("limit") || 20);
      const history = await getRunHistory(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20);
      return sendJson(res, 200, history);
    }

    if (req.method === "DELETE" && url.pathname === "/api/runs/history") {
      if (await pathExists(RUN_HISTORY_DIR)) {
        await fs.rm(RUN_HISTORY_DIR, { recursive: true, force: true });
      }
      return sendJson(res, 200, { message: "Run history cleared.", runs: [] });
    }

    if (req.method === "GET" && url.pathname === "/api/runs/history/details") {
      const reportFile = url.searchParams.get("reportFile");
      const details = await getRunDetails(reportFile);
      return sendJson(res, 200, details);
    }

    if (req.method === "GET" && url.pathname === "/api/test-results/asset") {
      await serveTestResultAsset(res, url.searchParams.get("path"));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/files") {
      const scope = url.searchParams.get("scope") || "tests";
      const summary = await listFilesByScope(scope);
      return sendJson(res, 200, summary);
    }

    if (req.method === "GET" && url.pathname === "/api/files/content") {
      const scope = url.searchParams.get("scope") || "tests";
      const selected = normalizeFilePath(url.searchParams.get("file"), scope);
      const content = await fs.readFile(selected.absolute, "utf8");
      return sendJson(res, 200, { path: selected.relative, scope, content });
    }

    if (req.method === "POST" && url.pathname === "/api/files/save") {
      const body = await readBody(req);
      const scope = body.scope || "tests";
      const selected = normalizeFilePath(body.file, scope);

      if (typeof body.content !== "string") {
        return sendJson(res, 400, { error: "content is required" });
      }

      await fs.writeFile(selected.absolute, body.content, "utf8");
      return sendJson(res, 200, { ok: true, path: selected.relative, scope });
    }

    if (req.method === "POST" && url.pathname === "/api/files/validate") {
      const body = await readBody(req);
      const scope = body.scope || "tests";
      const selected = normalizeFilePath(body.file, scope);

      if (typeof body.content !== "string") {
        return sendJson(res, 400, { error: "content is required" });
      }

      const extension = path.extname(selected.absolute).toLowerCase();
      if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
        const result = await validateJavaScriptContent(body.content);
        return sendJson(res, 200, {
          ok: result.ok,
          stdout: result.stdout,
          stderr: result.stderr,
          mode: "node-check",
        });
      }

      return sendJson(res, 200, {
        ok: true,
        stdout: "",
        stderr: "Syntax validation skipped for non-JS file.",
        mode: "skip",
      });
    }

    if (req.method === "GET" && url.pathname === "/api/completions") {
      const completions = await getFrameworkCompletions();
      return sendJson(res, 200, { completions });
    }

    if (req.method === "GET" && url.pathname === "/api/reports/allure") {
      const state = await getAllureReportState();
      return sendJson(res, 200, state);
    }

    if (req.method === "POST" && url.pathname === "/api/reports/allure/generate") {
      const generated = await generateAllureReport();
      return sendJson(res, 200, generated);
    }

    if (req.method === "DELETE" && url.pathname === "/api/reports/allure") {
      await fs.rm(ALLURE_RESULTS_DIR, { recursive: true, force: true });
      await fs.rm(ALLURE_REPORT_DIR, { recursive: true, force: true });
      const state = await getAllureReportState();
      return sendJson(res, 200, { ...state, message: "Reports cleared successfully." });
    }

    if (req.method === "GET" && url.pathname.startsWith("/allure-report")) {
      await serveAllureReportAsset(req, res, url.pathname);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/tests/run/")) {
      const runId = url.pathname.replace("/api/tests/run/", "");
      const run = runs.get(runId);
      if (!run) {
        return sendJson(res, 404, { error: "run not found" });
      }
      return sendJson(res, 200, run);
    }

    if (req.method === "GET") {
      await serveFrontendApp(res, url.pathname);
      return;
    }

    return sendJson(res, 404, { error: "route not found" });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "server error" });
  }
}).listen(PORT, () => {
  console.log(`Dashboard backend running on http://localhost:${PORT}`);
});
