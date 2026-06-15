import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import { colorizeOutput } from "./utils/colorize";
import StatsCards from "./components/StatsCards";
import CodeMirrorEditor from "./components/CodeMirrorEditor";

function extractPageImports(content) {
  const imports = new Set();
  const regex = /from\s+["']\.\.\/pages\/([^"']+)["']/g;
  let match = regex.exec(content);
  while (match) {
    imports.add(`pages/${match[1]}`);
    match = regex.exec(content);
  }
  return [...imports];
}

function buildDiffPreview(oldContent, newContent) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const maxLines = Math.max(oldLines.length, newLines.length);
  const result = [];

  for (let i = 0; i < maxLines; i += 1) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) continue;
    if (oldLine !== undefined) result.push(`- ${i + 1}: ${oldLine}`);
    if (newLine !== undefined) result.push(`+ ${i + 1}: ${newLine}`);
  }

  return result.length ? result.join("\n") : "No changes detected.";
}

function formatDuration(durationMs) {
  const ms = Number(durationMs || 0);
  if (!ms || ms < 1000) return `${ms} ms`;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function App() {
  const [tests, setTests] = useState([]);
  const [pages, setPages] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalCases, setTotalCases] = useState(0);
  const [pageFiles, setPageFiles] = useState(0);
  const [totalLocators, setTotalLocators] = useState(0);
  const [activeScope, setActiveScope] = useState("tests");
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedScope, setSelectedScope] = useState("tests");
  const [editorCode, setEditorCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [runOutput, setRunOutput] = useState("Run output will appear here...");
  const [activeRunId, setActiveRunId] = useState("");
  const [statusText, setStatusText] = useState("Loading tests...");
  const [isSaving, setIsSaving] = useState(false);
  const [diffPreview, setDiffPreview] = useState("");
  const [runProfiles, setRunProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("test:file");
  const [runSelectedFileOnly, setRunSelectedFileOnly] = useState(true);
  const [runGrep, setRunGrep] = useState("");
  const [runWorkers, setRunWorkers] = useState("");
  const [runRetries, setRunRetries] = useState("");
  const [runProjects, setRunProjects] = useState("");
  const [activeRightTab, setActiveRightTab] = useState("editor");
  const [reportState, setReportState] = useState({
    hasResults: false,
    hasReport: false,
    resultsCount: 0,
    summary: null,
    reportUrl: null,
  });
  const [runHistory, setRunHistory] = useState([]);
  const [runFailureDetails, setRunFailureDetails] = useState(null);
  const [selectedFailureId, setSelectedFailureId] = useState("");
  const backendBaseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

  async function refreshRunProfiles() {
    try {
      const payload = await api("/api/run/profiles");
      const profiles = payload.profiles || [];
      setRunProfiles(profiles);
      if (payload.defaultProfile) {
        setSelectedProfile(payload.defaultProfile);
      } else if (profiles.length) {
        setSelectedProfile(profiles[0].name);
      }
    } catch (error) {
      setRunOutput(`Unable to load run profiles: ${error.message}`);
    }
  }

  async function refreshTests() {
    try {
      const [testsSummary, pagesSummary] = await Promise.all([
        api("/api/files?scope=tests"),
        api("/api/files?scope=pages"),
      ]);

      setTests(testsSummary.files || []);
      setPages(pagesSummary.files || []);
      setTotalFiles(testsSummary.totalFiles || 0);
      setTotalCases(testsSummary.totalCases || 0);
      setPageFiles(pagesSummary.totalFiles || 0);
      setTotalLocators(pagesSummary.totalLocators || 0);
      setStatusText(`Auto-refreshed at ${new Date().toLocaleTimeString()}`);

      if (selectedFile) {
        const sourceFiles = activeScope === "tests" ? (testsSummary.files || []) : (pagesSummary.files || []);
        const exists = sourceFiles.some((f) => f.path === selectedFile);
        if (!exists) {
          setSelectedFile("");
          setEditorCode("");
          setRunOutput("Selected file was removed.");
        }
      }
    } catch (error) {
      setStatusText(`Failed to refresh: ${error.message}`);
    }
  }

  async function refreshAllureState() {
    try {
      const payload = await api("/api/reports/allure");
      setReportState(payload);
    } catch (error) {
      setRunOutput((prev) => `${prev}\nUnable to load Allure report state: ${error.message}`);
    }
  }

  async function refreshRunHistory() {
    try {
      const payload = await api("/api/runs/history?limit=15");
      setRunHistory(payload.runs || []);
    } catch (error) {
      setRunOutput((prev) => `${prev}\nUnable to load run history: ${error.message}`);
    }
  }

  async function clearRunHistory() {
    try {
      setRunOutput((prev) => `${prev}\nClearing run history...`);
      const payload = await api("/api/runs/history", { method: "DELETE" });
      setRunHistory([]);
      setRunFailureDetails(null);
      setSelectedFailureId("");
      setRunOutput((prev) => `${prev}\n${payload.message || "Run history cleared."}`);
    } catch (error) {
      setRunOutput((prev) => `${prev}\nFailed to clear run history: ${error.message}`);
    }
  }

  async function loadRunFailureDetails(entry) {
    if (!entry?.reportFile) {
      setRunFailureDetails(null);
      setSelectedFailureId("");
      return;
    }

    try {
      const payload = await api(`/api/runs/history/details?reportFile=${encodeURIComponent(entry.reportFile)}`);
      const details = payload.results || payload.failures || [];
      setRunFailureDetails({
        ...payload,
        results: details,
        runLabel: entry.filePath || entry.profileName || entry.reportFile,
      });
      setSelectedFailureId(details?.[0]?.id || "");
    } catch (error) {
      setRunOutput((prev) => `${prev}\nUnable to load run details: ${error.message}`);
    }
  }

  async function openFile(filePath) {
    await openFileByScope(filePath, activeScope);
  }

  async function openFileByScope(filePath, scope) {
    setSelectedFile(filePath);
    setSelectedScope(scope);
    try {
      const payload = await api(`/api/files/content?scope=${encodeURIComponent(scope)}&file=${encodeURIComponent(filePath)}`);
      setEditorCode(payload.content || "");
      setOriginalCode(payload.content || "");
      setDiffPreview("");
    } catch (error) {
      setEditorCode("");
      setOriginalCode("");
      setRunOutput(`Unable to load file: ${error.message}`);
    }
  }

  async function validateSelected() {
    if (!selectedFile) return false;

    try {
      const result = await api("/api/files/validate", {
        method: "POST",
        body: JSON.stringify({
          scope: selectedScope,
          file: selectedFile,
          content: editorCode,
        }),
      });

      if (result.ok) {
        setRunOutput(`Validation passed (${result.mode}).`);
        return true;
      }

      setRunOutput(`Validation failed:\n${result.stderr || result.stdout || "Unknown error"}`);
      return false;
    } catch (error) {
      setRunOutput(`Validation request failed: ${error.message}`);
      return false;
    }
  }

  function showDiffPreview() {
    setDiffPreview(buildDiffPreview(originalCode, editorCode));
  }

  async function saveSelected() {
    if (!selectedFile) return;
    setIsSaving(true);

    try {
      const valid = await validateSelected();
      if (!valid) return;

      await api("/api/files/save", {
        method: "POST",
        body: JSON.stringify({
          scope: selectedScope,
          file: selectedFile,
          content: editorCode,
        }),
      });
      setStatusText(`Saved ${selectedFile} at ${new Date().toLocaleTimeString()}`);
      setOriginalCode(editorCode);
      setDiffPreview("");
      await refreshTests();
    } catch (error) {
      setRunOutput(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function runSelected() {
    if (activeScope !== "tests") return;
    if (runSelectedFileOnly && (!selectedFile || !selectedFile.startsWith("tests/"))) return;

    const projects = runProjects
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setRunOutput(`Starting ${selectedProfile}...`);
    try {
      const payload = await api("/api/tests/run", {
        method: "POST",
        body: JSON.stringify({
          file: selectedFile || null,
          profileName: selectedProfile,
          runSelectedFile: runSelectedFileOnly,
          grep: runGrep,
          workers: runWorkers || undefined,
          retries: runRetries === "" ? undefined : Number(runRetries),
          projects,
        }),
      });
      setActiveRunId(payload.runId || "");
    } catch (error) {
      setRunOutput(`Failed to start run: ${error.message}`);
    }
  }

  async function generateAllureReport() {
    try {
      setRunOutput((prev) => `${prev}\nGenerating Allure report...`);
      const payload = await api("/api/reports/allure/generate", {
        method: "POST",
      });
      setReportState(payload);
      setRunOutput((prev) => `${prev}\n${payload.generation?.message || "Allure report generated."}`);
    } catch (error) {
      setRunOutput((prev) => `${prev}\nAllure generation failed: ${error.message}`);
    }
  }

  function openAllureReport() {
    if (!reportState.reportUrl) return;
    window.open(`${backendBaseUrl}${reportState.reportUrl}`, "_blank", "noopener,noreferrer");
  }
  async function clearAllureReports() {
    try {
      setRunOutput((prev) => `${prev}\nClearing Allure reports...`);
      const payload = await api("/api/reports/allure", {
        method: "DELETE",
      });
      setReportState(payload);
      setRunOutput((prev) => `${prev}\n${payload.message || "Reports cleared."}`);
    } catch (error) {
      setRunOutput((prev) => `${prev}\nFailed to clear run history: ${error.message}`);
    }
  }
  useEffect(() => {
    refreshTests();
    refreshRunProfiles();
    refreshAllureState();
    refreshRunHistory();
    const timer = setInterval(refreshTests, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeRunId) return undefined;

    const timer = setInterval(async () => {
      try {
        const run = await api(`/api/tests/run/${encodeURIComponent(activeRunId)}`);
        setRunOutput((run.logs || []).join("\n") || "No output yet...");
        if (run.status !== "running") {
          setRunOutput((prev) => `${prev}\n\nRun finished with status: ${run.status}`);
          setActiveRunId("");
          refreshTests();
          refreshAllureState();
          refreshRunHistory();
        }
      } catch (error) {
        setRunOutput((prev) => `${prev}\nPolling error: ${error.message}`);
        setActiveRunId("");
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [activeRunId]);

  const sortedTests = useMemo(
    () => [...(activeScope === "tests" ? tests : pages)].sort((a, b) => a.path.localeCompare(b.path)),
    [activeScope, tests, pages],
  );

  const canRunSelected = activeScope === "tests" && (!runSelectedFileOnly || selectedFile.startsWith("tests/"));
  const importedPageFiles = useMemo(
    () => (canRunSelected ? extractPageImports(editorCode) : []),
    [canRunSelected, editorCode],
  );
  const selectedFailure = useMemo(
    () => runFailureDetails?.results?.find((failure) => failure.id === selectedFailureId) || runFailureDetails?.results?.[0] || null,
    [runFailureDetails, selectedFailureId],
  );
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1>Ailly Test</h1>
          <p>Test Execution Platform</p>
        </div>
        <button className="btn" onClick={refreshTests}>Refresh</button>
      </header>

      <StatsCards
        totalCases={totalCases}
        totalFiles={totalFiles}
        pageFiles={pageFiles}
        totalLocators={totalLocators}
      />

      <section className="workspace-grid">
        <aside className="panel">
          <div className="panel-title-row">
            <h2>Repository Explorer</h2>
            <span className="status-note">{statusText}</span>
          </div>
          <div className="scope-switch">
            <button
              className={`btn ${activeScope === "tests" ? "primary" : ""}`}
              onClick={() => {
                setActiveScope("tests");
                setSelectedFile("");
                setSelectedScope("tests");
                setEditorCode("");
                setOriginalCode("");
                setDiffPreview("");
              }}
            >
              Tests
            </button>
            <button
              className={`btn ${activeScope === "pages" ? "primary" : ""}`}
              onClick={() => {
                setActiveScope("pages");
                setSelectedFile("");
                setSelectedScope("pages");
                setEditorCode("");
                setOriginalCode("");
                setDiffPreview("");
              }}
            >
              Pages
            </button>
          </div>
          <div className="tests-list">
            {sortedTests.length === 0 ? (
              <div className="hint">No files found in selected folder.</div>
            ) : (
              sortedTests.map((testFile) => (
                <button
                  key={testFile.path}
                  className={`test-item ${selectedFile === testFile.path ? "active" : ""}`}
                  onClick={() => openFile(testFile.path)}
                >
                  <div className="path">{testFile.path}</div>
                  <div className="meta">
                    <span>
                      {activeScope === "tests"
                        ? `${testFile.testCaseCount} testcases`
                        : `${testFile.locatorCount || 0} locators`}
                    </span>
                    <span>{new Date(testFile.updatedAt).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-title-row">
            <h2>Workspace</h2>
            <div className="tab-row" role="tablist" aria-label="Workspace tabs">
              <button
                className={`btn ${activeRightTab === "editor" ? "primary" : ""}`}
                role="tab"
                aria-selected={activeRightTab === "editor"}
                onClick={() => setActiveRightTab("editor")}
              >
                Editor & Execution
              </button>
              <button
                className={`btn ${activeRightTab === "results" ? "primary" : ""}`}
                role="tab"
                aria-selected={activeRightTab === "results"}
                onClick={() => setActiveRightTab("results")}
              >
                Test Results
              </button>
            </div>
          </div>

          {activeRightTab === "editor" && (
            <>
              <div className="action-row">
                <button className="btn primary" disabled={!selectedFile || !canRunSelected} onClick={runSelected}>
                  Run Selected
                </button>
                <button className="btn" disabled={!selectedFile} onClick={validateSelected}>
                  Validate
                </button>
                <button className="btn" disabled={!selectedFile} onClick={showDiffPreview}>
                  Preview Diff
                </button>
                <button className="btn" disabled={!selectedFile || isSaving} onClick={saveSelected}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button className="btn" onClick={() => setRunOutput("Run output will appear here...")}>Clear Output</button>
              </div>

              <div className="selected-label">{selectedFile || "No file selected"}</div>
              <div className="run-config-grid">
                <label className="config-item">
                  <span>Run Preset</span>
                  <select className="config-input" value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)}>
                    {runProfiles.map((profile) => (
                      <option key={profile.name} value={profile.name}>{profile.name}</option>
                    ))}
                  </select>
                </label>
                <label className="config-item checkbox-item-inline">
                  <input
                    type="checkbox"
                    checked={runSelectedFileOnly}
                    onChange={(e) => setRunSelectedFileOnly(e.target.checked)}
                  />
                  <span>Only run selected test file</span>
                </label>
                <label className="config-item">
                  <span>Grep</span>
                  <input className="config-input" value={runGrep} onChange={(e) => setRunGrep(e.target.value)} placeholder="@smoke or test name" />
                </label>
                <label className="config-item">
                  <span>Workers</span>
                  <input className="config-input" value={runWorkers} onChange={(e) => setRunWorkers(e.target.value)} placeholder="2 or 100%" />
                </label>
                <label className="config-item">
                  <span>Retries</span>
                  <input className="config-input" value={runRetries} onChange={(e) => setRunRetries(e.target.value)} placeholder="0,1,2" />
                </label>
                <label className="config-item">
                  <span>Browser Projects (csv)</span>
                  <input className="config-input" value={runProjects} onChange={(e) => setRunProjects(e.target.value)} placeholder="chromium,firefox" />
                </label>
              </div>
              {importedPageFiles.length > 0 && (
                <div className="linked-pages-row">
                  <span className="linked-pages-label">Imported page objects:</span>
                  {importedPageFiles.map((pageFile) => (
                    <button
                      key={pageFile}
                      className="btn"
                      onClick={() => {
                        setActiveScope("pages");
                        openFileByScope(pageFile, "pages");
                      }}
                    >
                      {pageFile}
                    </button>
                  ))}
                </div>
              )}
              <div className="code-editor-shell">
                <CodeMirrorEditor code={editorCode} onChange={setEditorCode} />
              </div>
              {diffPreview && (
                <div className="diff-preview">
                  {colorizeOutput(diffPreview).map(({ line, className, key }) => (
                    <div key={key} className={`${className} diff-line`}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
              <div className="run-output">
                {colorizeOutput(runOutput).map(({ line, className, key }) => (
                  <div key={key} className={className}>
                    {line}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeRightTab === "results" && (
            <div className="results-panel">
              <div className="panel-title-row">
                <h2>Test Results</h2>
                <div className="action-row">
                  <button className="btn" onClick={refreshAllureState}>Refresh Results</button>
                  <button className="btn" disabled={!reportState.hasResults} onClick={generateAllureReport}>
                    Generate Allure
                  </button>
                  <button className="btn primary" disabled={!reportState.hasReport} onClick={openAllureReport}>
                    Open Allure Report
                  </button>
                  <button className="btn danger" disabled={!reportState.hasResults && !reportState.hasReport} onClick={clearAllureReports}>
                    Clear Reports
                  </button>
                  <button className="btn" onClick={refreshRunHistory}>
                    Refresh History
                  </button>
                </div>
              </div>

              <div className="results-summary-grid">
                <div className="result-stat">
                  <span className="result-stat-label">Allure Results</span>
                  <strong>{reportState.hasResults ? "Available" : "Not found"}</strong>
                </div>
                <div className="result-stat">
                  <span className="result-stat-label">Result Files</span>
                  <strong>{reportState.resultsCount ?? 0}</strong>
                </div>
                <div className="result-stat">
                  <span className="result-stat-label">HTML Report</span>
                  <strong>{reportState.hasReport ? "Ready" : "Not generated"}</strong>
                </div>
              </div>

              {reportState.summary && (
                <div className="results-summary-grid compact">
                  <div className="result-chip passed">Passed: {reportState.summary.passed ?? 0}</div>
                  <div className="result-chip failed">Failed: {reportState.summary.failed ?? 0}</div>
                  <div className="result-chip broken">Broken: {reportState.summary.broken ?? 0}</div>
                  <div className="result-chip skipped">Skipped: {reportState.summary.skipped ?? 0}</div>
                  <div className="result-chip total">Total: {reportState.summary.total ?? 0}</div>
                </div>
              )}

              <div className="hint">
                After a run completes, generate/open the Allure HTML report from this section.
              </div>

              <div className="run-history-section">
                <div className="panel-title-row">
                  <h2>Run History</h2>
                  <div className="action-row">
                    <button className="btn" onClick={refreshRunHistory}>
                      Refresh
                    </button>
                    <button className="btn danger" disabled={runHistory.length === 0} onClick={clearRunHistory}>
                      Clear History
                    </button>
                  </div>
                </div>

                {runHistory.length === 0 ? (
                  <div className="hint">No run history yet. Execute a test run to start tracking.</div>
                ) : (
                  <div className="run-history-list">
                    {runHistory.map((entry) => (
                      <button
                        key={entry.reportFile || entry.id}
                        type="button"
                        className={`run-history-item is-clickable ${runFailureDetails?.reportFile === entry.reportFile ? "is-selected" : ""}`}
                        onClick={() => loadRunFailureDetails(entry)}
                      >
                        <div className="run-history-head">
                          <div>
                            <strong>{entry.profileName || "test"}</strong>
                            <div className="hint">{entry.filePath || "All tests"}</div>
                          </div>
                          <span className={`run-status-badge ${entry.status || "unknown"}`}>{entry.status || "unknown"}</span>
                        </div>

                        <div className="run-history-meta">
                          <span>{entry.startedAt ? new Date(entry.startedAt).toLocaleString() : "Unknown time"}</span>
                          <span>Duration: {formatDuration(entry.durationMs)}</span>
                        </div>

                        {entry.summary && (
                          <div className="run-history-summary">
                            <span>Total: {entry.summary.total ?? 0}</span>
                            <span>Passed: {entry.summary.passed ?? 0}</span>
                            <span>Failed: {entry.summary.failed ?? 0}</span>
                            <span>Flaky: {entry.summary.flaky ?? 0}</span>
                            <span>Skipped: {entry.summary.skipped ?? 0}</span>
                          </div>
                        )}

                        <div className="hint">Click to inspect test artifacts.</div>
                      </button>
                    ))}
                  </div>
                )}

                {runFailureDetails && runFailureDetails.results?.length > 0 && (
                  <div className="failure-detail-section">
                    <div className="panel-title-row">
                      <h2>Run Artifacts</h2>
                      <span className="status-note">{runFailureDetails.runLabel}</span>
                    </div>

                    <div className="failure-detail-layout">
                      <div className="failure-list">
                        {runFailureDetails.results.map((failure) => (
                          <button
                            key={failure.id}
                            type="button"
                            className={`failure-list-item ${selectedFailure?.id === failure.id ? "active" : ""}`}
                            onClick={() => setSelectedFailureId(failure.id)}
                          >
                            <strong>{failure.title}</strong>
                            <span>Status: {failure.status || "unknown"}</span>
                            <span>{failure.projectName}</span>
                            <span>{failure.file}{failure.line ? `:${failure.line}` : ""}</span>
                          </button>
                        ))}
                      </div>

                      {selectedFailure && (
                        <div className="failure-detail-card">
                          <div className="failure-detail-meta">
                            <strong>{selectedFailure.title}</strong>
                            <span>{selectedFailure.file}{selectedFailure.line ? `:${selectedFailure.line}` : ""}</span>
                            <span>{selectedFailure.projectName}</span>
                            <span>Duration: {formatDuration(selectedFailure.durationMs)}</span>
                          </div>

                          {selectedFailure.errorMessage && (
                            <div className="failure-detail-block">
                              <span className="result-stat-label">Error Message</span>
                              <pre className="failure-detail-code">{selectedFailure.errorMessage}</pre>
                            </div>
                          )}

                          {selectedFailure.stackTrace && (
                            <div className="failure-detail-block">
                              <span className="result-stat-label">Stack Trace</span>
                              <pre className="failure-detail-code">{selectedFailure.stackTrace}</pre>
                            </div>
                          )}

                          <div className="failure-media-grid">
                            <div className="failure-detail-block">
                              <span className="result-stat-label">Screenshot</span>
                              {selectedFailure.screenshot ? (
                                <img
                                  className="failure-screenshot"
                                  src={`${backendBaseUrl}${selectedFailure.screenshot.url}`}
                                  alt={`${selectedFailure.title} screenshot`}
                                />
                              ) : (
                                <div className="hint">No screenshot available.</div>
                              )}
                            </div>

                            <div className="failure-detail-block">
                              <span className="result-stat-label">Video</span>
                              {selectedFailure.video ? (
                                <video className="failure-video" controls src={`${backendBaseUrl}${selectedFailure.video.url}`} />
                              ) : (
                                <div className="hint">No video available.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
