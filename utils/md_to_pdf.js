import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { marked } from "marked";

const REPORTS_DIR = ".github/reports/accessibility";

const extractStat = (markdown, regex, fallback = "0") => {
	const match = markdown.match(regex);
	return match ? match[1].trim() : fallback;
};

const getFirstMatch = (markdown, patterns) => {
	for (const pattern of patterns) {
		const match = markdown.match(pattern);
		if (match) return match[1].trim();
	}
	return null;
};

const getCount = (markdown, patterns) => {
	for (const pattern of patterns) {
		const match = markdown.match(pattern);
		if (match) return parseInt(match[1], 10);
	}
	return 0;
};

const resolveLogoSvg = () => {
	const candidates = [
		path.resolve("accessibility/assets/cdw-logo-no-tag.svg"),
		path.resolve("accessibility/cdw-logo-no-tag.svg"),
		path.resolve("cdw-logo-no-tag.svg"),
	];

	const found = candidates.find((candidate) => fs.existsSync(candidate));
	return found ? fs.readFileSync(found, "utf-8") : "";
};

export const buildTemplateHtmlFromMarkdown = async (markdown) => {
	const overallScore = getFirstMatch(markdown, [
		/Score:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i,
		/Overall Score:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i,
		/Final Score:\s*(\d+(?:\.\d+)?)\s*\/\s*100/i,
	]) || extractStat(markdown, /\*\*Overall Score:\s*([^\s*|]+)/, "N/A");

	const gradeMatch = markdown.match(/Grade\s*([A-F][+-]?)/);
	const grade = gradeMatch ? gradeMatch[1] : extractStat(markdown, /\*\*Grade:\s*([^\s*|]+)/, "N/A");

	const criticalIssues = getCount(markdown, [/Critical Issues:\s*\*?(\d+)/, /Critical\s*\*?(\d+)/]);
	const highIssues = getCount(markdown, [
		/High Issues:\s*\*?(\d+)/,
		/Serious Issues:\s*\*?(\d+)/,
		/Serious\s*\*?(\d+)/,
		/High\s*\*?(\d+)/,
	]);
	const mediumIssues = getCount(markdown, [
		/Medium Issues:\s*\*?(\d+)/,
		/Moderate Issues:\s*\*?(\d+)/,
		/Moderate\s*\*?(\d+)/,
		/Medium\s*\*?(\d+)/,
	]);
	const minorIssues = getCount(markdown, [/Minor Issues:\s*\*?(\d+)/, /Minor\s*\*?(\d+)/]);

	const totalIssues = criticalIssues + highIssues + mediumIssues + minorIssues;
	const dashIssuesMatch = markdown.match(/Issues Found:\s*\*?(\d+)/);
	const finalTotal = dashIssuesMatch ? dashIssuesMatch[1] : totalIssues.toString();

	const statusConformant = markdown.includes("✓ CONFORMANT") || markdown.includes("✓ PASS");
	const statusWarn = markdown.includes("⚠ WARN") || markdown.includes("PARTIALLY CONFORMANT");
	const statusClass = statusWarn
		? "status-warn"
		: statusConformant
			? "status-conformant"
			: "status-fail";

	const logoSvg = resolveLogoSvg();
	let htmlContent = await marked.parse(markdown);

	const severities = ["Critical", "Serious", "Moderate", "Minor"];
	severities.forEach((sev) => {
		const regex = new RegExp(`\\b${sev}\\b`, "g");
		htmlContent = htmlContent.replace(
			regex,
			`<span class="severity-badge ${sev.toLowerCase()}">${sev}</span>`,
		);
	});

	return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
body {
  font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, oxygen, ubuntu, cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 40px;
  color: #1f2937;
  line-height: 1.6;
  max-width: 1000px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #111827;
  padding-bottom: 20px;
  margin-bottom: 30px;
}
.logo-container svg {
  height: 55px;
  width: auto;
  display: block;
}
h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  border: none;
  padding: 0;
  text-transform: uppercase;
  letter-spacing: -0.025em;
}
h2 {
  font-size: 1.5rem;
  margin-top: 2.5rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  color: #111827;
  page-break-after: avoid;
}
h3 { font-size: 1.25rem; margin-top: 1.5rem; color: #374151; }
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin: 2rem 0;
}
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
.card-title {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.card-value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0.25rem 0;
  line-height: 1;
}
.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  margin-top: 0.5rem;
}
.status-conformant { background: #d1fae5; color: #065f46; }
.status-warn { background: #fef3c7; color: #92400e; }
.status-fail { background: #fee2e2; color: #991b1b; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  page-break-inside: avoid;
}
th, td {
  border: 1px solid #e5e7eb;
  padding: 12px 16px;
  text-align: left;
}
th {
  background: #f9fafb;
  font-weight: 700;
  color: #111827;
  font-size: 0.875rem;
}
tr:nth-child(even) { background: #f9fafb; }
img {
  max-width: 100%;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #e5e7eb;
}
hr { border: 0; border-top: 2px solid #e5e7eb; margin: 3rem 0; }
.severity-badge {
  font-weight: 700;
  border-radius: 4px;
	padding: 3px 9px;
  font-size: 0.85em;
  text-transform: uppercase;
}
.critical { color: #7f1d1d; background: #fee2e2; border: 1px solid #fecaca; }
.serious { color: #9a3412; background: #ffedd5; border: 1px solid #fed7aa; }
.moderate { color: #92400e; background: #fef3c7; border: 1px solid #fde68a; }
.minor { color: #334155; background: #f1f5f9; border: 1px solid #cbd5e1; }

h4 {
	background: #f8fafc;
	border-left: 4px solid #cbd5e1;
	border-radius: 6px;
	padding: 8px 12px;
	margin-top: 18px;
	margin-bottom: 10px;
}

pre {
	background: #0f172a;
	color: #e2e8f0;
	padding: 12px;
	border-radius: 8px;
	overflow-x: auto;
	border: 1px solid #334155;
}

code {
	font-family: ui-monospace, sfmono-regular, menlo, consolas, "Liberation Mono", monospace;
}

ul {
	padding-left: 1.2rem;
}

li {
	margin: 4px 0;
}
@media print {
  .card { break-inside: avoid; }
  h2, h3 { break-after: avoid; }
}
</style>
</head>
<body>
<div class="header">
  <div class="logo-container">
    ${logoSvg}
  </div>
  <h1>Accessibility Report</h1>
</div>
<div class="dashboard">
  <div class="card">
    <div class="card-title">Overall Score</div>
    <div class="card-value">${overallScore}</div>
    <div class="badge-wrapper">
      <span class="status-badge ${statusClass}">Grade ${grade}</span>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Total Issues</div>
    <div class="card-value">${finalTotal}</div>
  </div>
  <div class="card">
    <div class="card-title">Priority (C/S)</div>
    <div class="card-value">${criticalIssues}/${highIssues}</div>
  </div>
  <div class="card">
    <div class="card-title">Standard (M/m)</div>
    <div class="card-value">${mediumIssues}/${minorIssues}</div>
  </div>
</div>
${htmlContent}
</body>
</html>
`;
};

export const generatePdfFromMarkdown = async ({ markdown, outputPath, canonicalPdfPath }) => {
	if (!outputPath) {
		throw new Error("outputPath is required to generate PDF");
	}

	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	const html = await buildTemplateHtmlFromMarkdown(markdown);
	const htmlPath = path.join(os.tmpdir(), `a11y-template-${Date.now()}.html`);
	fs.writeFileSync(htmlPath, html, "utf-8");

	const browser = await chromium.launch({ headless: true });
	try {
		const page = await browser.newPage();
		await page.goto("file://" + path.resolve(htmlPath));
		await page.pdf({
			path: outputPath,
			format: "A4",
			printBackground: true,
			margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
		});
	} finally {
		await browser.close();
		if (fs.existsSync(htmlPath)) {
			fs.unlinkSync(htmlPath);
		}
	}

	if (canonicalPdfPath && path.resolve(outputPath) !== path.resolve(canonicalPdfPath)) {
		fs.copyFileSync(outputPath, canonicalPdfPath);
	}

	console.log("Premium PDF generated successfully:", outputPath);
	if (canonicalPdfPath) {
		console.log("Canonical PDF updated:", canonicalPdfPath);
	}

	return outputPath;
};

const findLatestMarkdown = () => {
	if (!fs.existsSync(REPORTS_DIR)) {
		return null;
	}

	const files = fs
		.readdirSync(REPORTS_DIR)
		.filter((name) => name.endsWith(".md") && !name.startsWith("remediation"))
		.map((name) => ({ name, time: fs.statSync(path.join(REPORTS_DIR, name)).mtime.getTime() }))
		.sort((a, b) => b.time - a.time);

	if (files.length === 0) {
		return null;
	}

	return path.join(REPORTS_DIR, files[0].name);
};

const runCli = async () => {
	let mdPath = process.argv[2];
	if (!mdPath) {
		mdPath = findLatestMarkdown();
		if (mdPath) {
			console.log(`No input file specified. Using latest report: ${mdPath}`);
		}
	}

	if (!mdPath || !fs.existsSync(mdPath)) {
		console.error(`Error: Input markdown file not found: ${mdPath || "N/A"}`);
			console.log("Usage: node utils/md_to_pdf.js [path/to/report.md]");
		process.exit(1);
	}

	const markdown = fs.readFileSync(mdPath, "utf-8");
	const markdownFileName = path.basename(mdPath, ".md");
	const pdfPath = `./${markdownFileName}.pdf`;
	const canonicalPdfPath = "./accessibility-report.pdf";

	await generatePdfFromMarkdown({
		markdown,
		outputPath: pdfPath,
		canonicalPdfPath,
	});
};

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
	runCli().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
