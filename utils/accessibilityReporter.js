import { buildAccessibilityMarkdownReport } from "./accessibilityAuditReport.js";
import { loadAccessibilityConfig } from "./accessibilityAuditConfig.js";
import { generatePdfFromMarkdown } from "./md_to_pdf.js";

/**
 * Generate an accessibility PDF report using the md_to_pdf HTML template.
 * @param {Array} scanResults
 * @param {string} outputPath
 * @returns {Promise<string>}
 */
export async function generateAccessibilityPDF(scanResults, outputPath = "accessibility-report.pdf") {
	const config = loadAccessibilityConfig();
	const markdown = buildAccessibilityMarkdownReport(scanResults, config);
	const generatedPath = await generatePdfFromMarkdown({
		markdown,
		outputPath,
	});

	console.log(`\n[A11y] report saved in : ${generatedPath}\n`);
	return generatedPath;
}
