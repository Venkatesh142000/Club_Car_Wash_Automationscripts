import fs from 'node:fs';
import path from 'node:path';
import { accessibilityResults } from '../utils/helpers.js';
import { generateAccessibilityPDF } from '../utils/accessibilityReporter.js';

const getNextReportPath = (reportsDir, datePart) => {
  let index = 1;

  while (true) {
    const candidatePath = path.join(reportsDir, `accessibility-report-${datePart} (${index}).pdf`);
    if (!fs.existsSync(candidatePath)) {
      return candidatePath;
    }
    index += 1;
  }
};

export default async function globalTeardown() {
  const reportDir = path.resolve('accessibility-reports');
  const currentRunId = process.env.A11Y_RUN_ID;
  const persistedFiles = fs.existsSync(reportDir)
    ? fs.readdirSync(reportDir)
        .filter((name) => name.startsWith('a11y-') && name.endsWith('.json'))
        .filter((name) => !currentRunId || name.startsWith(`a11y-${currentRunId}-`))
        .sort()
        .map((name) => path.join(reportDir, name))
    : [];

  const persistedResults = persistedFiles
    .map((filePath) => {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (currentRunId && parsed?.runId && parsed.runId !== currentRunId) {
          return null;
        }
        return parsed;
      } catch (error) {
        console.warn(`[A11y] Unable to read persisted accessibility result: ${filePath}`);
        return null;
      }
    })
    .filter(Boolean);

  // Prefer current-run in-memory results to avoid mixing in historical scans.
  // Persisted results are only used as a fallback for manual/standalone teardown runs.
  const allResults = accessibilityResults.length > 0
    ? accessibilityResults
    : persistedResults;

  if (allResults.length === 0) {
    console.log('[A11y] No accessibility scans were run — skipping PDF generation.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const outputPath = getNextReportPath(reportDir, today);

  await generateAccessibilityPDF(allResults, outputPath);

  console.log('[A11y] Accessibility audit artifacts generated:');
  console.log(` - ${outputPath}`);
}
