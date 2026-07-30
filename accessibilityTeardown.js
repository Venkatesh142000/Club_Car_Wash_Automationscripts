import fs from 'node:fs';
import path from 'node:path';
import { accessibilityResults } from './utils/helpers.js';
import { generateAccessibilityPDF } from './utils/accessibilityReporter.js';

export default async function globalTeardown() {
  const reportDir = path.resolve('accessibility-reports');
  const persistedFiles = fs.existsSync(reportDir)
    ? fs.readdirSync(reportDir)
        .filter((name) => name.startsWith('a11y-') && name.endsWith('.json'))
        .sort()
        .map((name) => path.join(reportDir, name))
    : [];

  const persistedResults = persistedFiles
    .map((filePath) => {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        console.warn(`[A11y] Unable to read persisted accessibility result: ${filePath}`);
        return null;
      }
    })
    .filter(Boolean);

  const allResults = [...accessibilityResults, ...persistedResults];

  if (allResults.length === 0) {
    console.log('[A11y] No accessibility scans were run — skipping PDF generation.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = path.resolve('accessibility-reports', `a11y-report-${timestamp}.pdf`);

  await generateAccessibilityPDF(allResults, outputPath);
}
