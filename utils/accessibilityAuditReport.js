import fs from "node:fs";
import path from "node:path";
import { getAuditTimestamp } from "./accessibilityAuditConfig.js";

const resolveScreenshotUri = (violation) => {
	if (violation._screenshot) return violation._screenshot;
	if (violation._screenshotPath) {
		try {
			const base64 = fs.readFileSync(violation._screenshotPath).toString("base64");
			return `data:image/png;base64,${base64}`;
		} catch {}
	}
	return null;
};

const SEVERITY_WEIGHTS = {
	critical: 10,
	serious: 5,
	moderate: 2,
	minor: 0.5,
};

const PRINCIPLE_LABELS = {
	perceivable: "Perceivable",
	operable: "Operable",
	understandable: "Understandable",
	robust: "Robust",
};

const PRINCIPLES = ["perceivable", "operable", "understandable", "robust"];

const getImpact = (violation) => String(violation?.impact || "minor").toLowerCase();

const getNodesCount = (violation) => {
	const count = Array.isArray(violation?.nodes) ? violation.nodes.length : 0;
	return count > 0 ? count : 1;
};

const getPrinciple = (violation) => {
	const tags = Array.isArray(violation?.tags) ? violation.tags : [];
	if (tags.includes("cat.perceivable")) return "perceivable";
	if (tags.includes("cat.operable")) return "operable";
	if (tags.includes("cat.understandable")) return "understandable";
	if (tags.includes("cat.robust")) return "robust";
	return "robust";
};

const getGrade = (score) => {
	if (score >= 95) return "A+";
	if (score >= 90) return "A";
	if (score >= 80) return "B";
	if (score >= 70) return "C";
	if (score >= 60) return "D";
	return "F";
};

const getComplianceStatus = (severityCounts) => {
	if ((severityCounts.critical || 0) > 0 || (severityCounts.serious || 0) > 0) {
		return "NON-CONFORMANT";
	}
	if ((severityCounts.moderate || 0) > 0 || (severityCounts.minor || 0) > 0) {
		return "PARTIALLY CONFORMANT";
	}
	return "CONFORMANT";
};

const toPercent = (value, total) => {
	if (!total) return 0;
	return Math.round((value / total) * 100);
};

const summarizeResults = (results, config) => {
	const summary = {
		auditDate: new Date().toISOString(),
		wcagVersion: config?.audit?.wcag_version || "2.2",
		conformanceLevel: config?.audit?.conformance_level || "AA",
		urlsTested: new Set(results.map((entry) => entry.url)).size,
		scansRun: results.length,
		totalPasses: 0,
		totalViolations: 0,
		totalAffectedElements: 0,
		weightedViolations: 0,
		severityCounts: {
			critical: 0,
			serious: 0,
			moderate: 0,
			minor: 0,
		},
		principleCounts: {
			perceivable: 0,
			operable: 0,
			understandable: 0,
			robust: 0,
		},
	};

	for (const result of results) {
		summary.totalPasses += Array.isArray(result.passes) ? result.passes.length : 0;
		const violations = Array.isArray(result.violations) ? result.violations : [];
		for (const violation of violations) {
			const impact = getImpact(violation);
			const nodesCount = getNodesCount(violation);
			summary.totalViolations += 1;
			summary.totalAffectedElements += nodesCount;
			summary.severityCounts[impact] = (summary.severityCounts[impact] || 0) + 1;
			summary.weightedViolations += (SEVERITY_WEIGHTS[impact] || 1);
			const principle = getPrinciple(violation);
			summary.principleCounts[principle] += 1;
		}
	}

	const rawScore = 100 - summary.weightedViolations;
	summary.score = Math.max(0, Math.min(100, Math.round(rawScore)));
	summary.grade = getGrade(summary.score);
	summary.complianceStatus = getComplianceStatus(summary.severityCounts);
	return summary;
};

const escapeHtml = (value) =>
	String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const readLogoSvg = () => {
	const candidates = [
		path.resolve("accessibility/assets/cdw-logo-no-tag.svg"),
		path.resolve("accessibility/cdw-logo-no-tag.svg"),
		path.resolve("cdw-logo-no-tag.svg"),
	];

	const logoPath = candidates.find((candidate) => fs.existsSync(candidate));
	if (!logoPath) {
		return "";
	}

	return fs.readFileSync(logoPath, "utf8");
};

const buildMarkdownReport = (summary, results) => {
	const totalIssueCount = Object.values(summary.severityCounts).reduce((sum, count) => sum + count, 0);
	const totalChecks = summary.totalPasses + summary.totalViolations;
	const uniqueViewportLabels = [
		...new Set(
			results
				.map((entry) => {
					const viewportName = entry?.viewport ? String(entry.viewport) : "viewport";
					const viewportSize = entry?.viewportSize ? String(entry.viewportSize) : "";
					return viewportSize ? `${viewportName} ${viewportSize}` : viewportName;
				})
				.filter(Boolean),
		),
	];

	const viewportSummary = uniqueViewportLabels.length > 0
		? uniqueViewportLabels.map((label) => label.charAt(0).toUpperCase() + label.slice(1)).join(", ")
		: "N/A";

	const scannedUrls = [...new Set(results.map((entry) => String(entry?.url || "").trim()).filter(Boolean))];
	const scannedUrlsHtml = scannedUrls.length
		? scannedUrls.map((url) => `<li>${escapeHtml(url)}</li>`).join("")
		: "<li>N/A</li>";

	const nonZeroSeverityEntries = Object.entries(summary.severityCounts)
		.filter(([, count]) => count > 0)
		.map(([severity, count]) => ({ severity, count }));

	let issueSummaryText = "no issues";
	if (nonZeroSeverityEntries.length === 1) {
		const { severity, count } = nonZeroSeverityEntries[0];
		issueSummaryText = `${count} ${severity} issue${count === 1 ? "" : "s"}`;
	} else if (totalIssueCount > 0) {
		issueSummaryText = `${totalIssueCount} issues`;
	}

	const urlLabel = summary.urlsTested === 1 ? "URL" : "URLs";
	const viewportLabel = uniqueViewportLabels.length === 1 ? "viewport" : "viewports";
	const checkLabel = totalChecks === 1 ? "check" : "checks";
	const executionLabel = summary.scansRun === 1 ? "execution" : "executions";
	const scansByUrl = new Map();
	for (const result of results) {
		if (!scansByUrl.has(result.url)) {
			scansByUrl.set(result.url, []);
		}
		scansByUrl.get(result.url).push(result);
	}

	const principleRows = PRINCIPLES.map((key) => {
		const count = summary.principleCounts[key] || 0;
		const percent = totalIssueCount ? Math.max(0, 100 - toPercent(count, totalIssueCount)) : 100;
		const status = count === 0 ? "PASS" : count <= 3 ? "PARTIAL" : "FAIL";
		return `| ${PRINCIPLE_LABELS[key]} | ${status} | ${percent}% | ${count} |`;
	}).join("\n");

	const issueSections = ["critical", "serious", "moderate", "minor"]
		.map((severity) => {
			const findings = [...scansByUrl.entries()].flatMap(([url, scans]) => {
				const latest = scans[scans.length - 1];
				return (latest.violations || [])
					.filter((violation) => getImpact(violation) === severity)
					.map((violation) => ({ url, latest, violation }));
			});

			if (findings.length === 0) {
				return "";
			}

			const title = severity.charAt(0).toUpperCase() + severity.slice(1);
			const items = findings.slice(0, 20).map(({ url, violation }, index) => {
				const wcagCriterion = (violation.tags || [])
					.filter((tag) => /^wcag\d/.test(tag))
					.slice(0, 1)
					.join(", ") || "N/A";
				const firstNode = (violation.nodes || [])[0] || {};
				const affectedSelector = Array.isArray(firstNode.target) && firstNode.target.length
					? firstNode.target.join(" | ")
					: "N/A";
				const recommendation = violation.helpUrl
					? `Refer ${violation.helpUrl} for remediation guidance.`
					: "Review and remediate based on WCAG guidance.";

				const screenshotUri = resolveScreenshotUri(violation);
				const screenshotLines = screenshotUri
					? ["", `![Highlighted violation — ${violation.id}](${screenshotUri})`, ""]
					: [];

				return [
					`#### ${index + 1}. ${violation.help || violation.id || "Issue"}`,
					`- **WCAG Criterion:** ${wcagCriterion}`,
					`- **Severity:** ${title}`,
					`- **Type:** ${violation.id || "N/A"}`,
					`- **Affected Pages:** ${url}`,
					`- **Description:** ${violation.description || "N/A"}`,
					`- **Recommendation:** ${recommendation}`,
					"",
					"Affected element:",
					"```css",
					affectedSelector,
					"```",
					...screenshotLines,
				].join("\n");
			}).join("\n\n");

			return [
				`### ${title} Issues (${findings.length})`,
				"",
				items,
			].join("\n");
		})
		.filter(Boolean)
		.join("\n\n");

	const pageDetails = [...scansByUrl.entries()]
		.map(([url, scans]) => {
			const latest = scans[scans.length - 1];
			const pageTitle = latest.pageTitle || url;
			const issues = latest.violations || [];
			const viewport = latest.viewportSize || latest.viewport || "N/A";

			const notable = issues.slice(0, 4)
				.map((violation) => `- ${violation.help || violation.id || "Issue"}`)
				.join("\n") || "- No notable issues";

			return [
				`### ${url}`,
				`**Page Title:** ${pageTitle}`,
				"",
				"#### Structure Analysis",
				`- **Viewport:** ${viewport}`,
				`- **Issues Found:** ${issues.length}`,
				`- **Passes:** ${Array.isArray(latest.passes) ? latest.passes.length : 0}`,
				"",
				"#### Notable Findings",
				notable,
			].join("\n");
		})
		.join("\n\n");

	const roadmapLines = [];
	if (summary.severityCounts.critical === 0) {
		roadmapLines.push("None detected. PASS");
	} else {
		roadmapLines.push(`Address ${summary.severityCounts.critical} critical issue(s) immediately.`);
	}

	const highLine = summary.severityCounts.serious === 0
		? "None detected. PASS"
		: `Address ${summary.severityCounts.serious} serious-severity issue(s) in the next sprint.`;

	const lowCount = summary.severityCounts.moderate + summary.severityCounts.minor;
	const lowLine = lowCount === 0
		? "None detected. PASS"
		: `Plan remediation for ${lowCount} medium/minor issue(s).`;

	return [
		"# Accessibility Compliance Report",
		"",
		`## Overall Accessibility Score`,
		`Score: ${summary.score}/100 — Grade ${summary.grade}`,
		`Overall Score: ${summary.score}/100`,
		"",
		`Conformance Status: ${summary.complianceStatus} with WCAG ${summary.wcagVersion} Level ${summary.conformanceLevel}`,
		"",
		"## Executive Summary",
		"",
		`<p><strong>Overall Score: ${summary.score}/100</strong> | <strong>Grade: ${summary.grade}</strong><br><strong>Compliance Status:</strong> ${summary.complianceStatus} (WCAG ${summary.wcagVersion} Level ${summary.conformanceLevel})</p>`,
		`<p>This audit scanned <strong>${summary.urlsTested} ${urlLabel}</strong> across <strong>${uniqueViewportLabels.length || 0} ${viewportLabel}</strong> (${viewportSummary}) in <strong>${summary.scansRun} ${executionLabel}</strong>, and detected <strong>${issueSummaryText}</strong> out of <strong>${totalChecks} automated ${checkLabel}</strong> performed.</p>`,
		`<p><strong>Scanned URL${scannedUrls.length === 1 ? "" : "s"}:</strong></p>`,
		`<ul>${scannedUrlsHtml}</ul>`,
		"<hr>",
		"",
		"| Metric | Value |",
		"|---|---|",
		`| Audit Date | ${new Date(summary.auditDate).toLocaleString()} |`,
		`| WCAG Version | ${summary.wcagVersion} Level ${summary.conformanceLevel} |`,
		`| URLs Tested | ${summary.urlsTested} |`,
		`| Scan Executions | ${summary.scansRun} |`,
		`| Total Testable Rules | ${summary.totalPasses + summary.totalViolations} |`,
		`| Affected Elements (instances) | ${summary.totalAffectedElements} |`,
		`| Issues Found | ${totalIssueCount} |`,
		"",
		"## Compliance Overview",
		"",
		"| Principle | Status | Score | Issues |",
		"|---|---|---|---|",
		principleRows,
		"",
		"## Issue Breakdown",
		"",
		"| Severity | Count | % of Total |",
		"|---|---|---|",
		`| CRITICAL | ${summary.severityCounts.critical} | ${toPercent(summary.severityCounts.critical, totalIssueCount)}% |`,
		`| SERIOUS | ${summary.severityCounts.serious} | ${toPercent(summary.severityCounts.serious, totalIssueCount)}% |`,
		`| MEDIUM | ${summary.severityCounts.moderate} | ${toPercent(summary.severityCounts.moderate, totalIssueCount)}% |`,
		`| MINOR | ${summary.severityCounts.minor} | ${toPercent(summary.severityCounts.minor, totalIssueCount)}% |`,
		"",
		"## Issues Detected",
		"",
		issueSections || "No violations detected.",
		"",
		"## Page Details",
		"",
		pageDetails,
		"",
		"## Scoring Methodology",
		"",
		"**Score Formula:**",
		"Score = 100 - (Critical x 10 + Serious x 5 + Medium x 2 + Minor x 0.5)",
		"",
		"**This Audit:**",
		`- Critical Issues: ${summary.severityCounts.critical}`,
		`- Serious Issues: ${summary.severityCounts.serious}`,
		`- Medium Issues: ${summary.severityCounts.moderate}`,
		`- Minor Issues: ${summary.severityCounts.minor}`,
		`- **Final Score:** ${summary.score}/100`,
		"",
		"## Priority Remediation Roadmap",
		"",
		"### PRIORITY 1 (Critical)",
		roadmapLines.join("\n"),
		"",
		"### PRIORITY 2 (Serious)",
		highLine,
		"",
		"### PRIORITY 3 (Moderate/Minor)",
		lowLine,
		"",
		"## Manual Testing Checklist",
		"",
		"- [ ] Keyboard Navigation",
		"- [ ] Screen Reader (NVDA/VoiceOver)",
		"- [ ] Zoom and Text Scaling",
		"- [ ] Color Contrast",
		"- [ ] Mobile Responsiveness",
		"",
		"## Appendix",
		"",
		"### Tools and Versions Used",
		"- Playwright",
		"- axe-core",
		`- WCAG Standard: ${summary.wcagVersion}`,
		`- Report Generated: ${summary.auditDate}`,
		"",
		"### Resources",
		"- https://www.w3.org/WAI/WCAG22/quickref/",
		"- https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md",
		"",
		"**Next Steps:**",
		"1. Review the findings above",
		"2. Apply remediations in development",
		"3. Rerun the audit",
		"",
		"_Report generated by Accessibility Auditor | Read-only mode | No changes applied to your application_",
	].join("\n");
};

const buildCsvReport = (results) => {
	const header = ["url", "pageTitle", "viewport", "severity", "ruleId", "instances", "helpUrl"];
	const lines = [header.join(",")];

	for (const result of results) {
		const violations = Array.isArray(result.violations) ? result.violations : [];
		if (violations.length === 0) {
			lines.push([
				JSON.stringify(result.url || ""),
				JSON.stringify(result.pageTitle || ""),
				JSON.stringify(result.viewport || ""),
				"PASS",
				"",
				"0",
				"",
			].join(","));
			continue;
		}

		for (const violation of violations) {
			lines.push([
				JSON.stringify(result.url || ""),
				JSON.stringify(result.pageTitle || ""),
				JSON.stringify(result.viewport || ""),
				JSON.stringify(getImpact(violation)),
				JSON.stringify(violation.id || ""),
				String(getNodesCount(violation)),
				JSON.stringify(violation.helpUrl || ""),
			].join(","));
		}
	}

	return lines.join("\n");
};

const buildHtmlReport = (summary, results) => {
	const totalIssues = Object.values(summary.severityCounts).reduce((sum, count) => sum + count, 0);
	const statusClass = summary.complianceStatus === "CONFORMANT"
		? "status-conformant"
		: summary.complianceStatus === "PARTIALLY CONFORMANT"
			? "status-warn"
			: "status-fail";
	const logoSvg = readLogoSvg();
	const auditDate = new Date(summary.auditDate);
	const principleRows = PRINCIPLES.map((principle) => {
		const issueCount = summary.principleCounts[principle] || 0;
		const status = issueCount === 0 ? "PASS" : issueCount <= 3 ? "PARTIAL" : "FAIL";
		const details = issueCount === 0
			? "No issues detected"
			: `${issueCount} issue${issueCount === 1 ? "" : "s"} mapped to this principle`;
		return `<tr><td><strong>${escapeHtml(PRINCIPLE_LABELS[principle])}</strong></td><td>${escapeHtml(status)}</td><td>${escapeHtml(details)}</td></tr>`;
	}).join("");

	const issueSections = ["critical", "serious", "moderate", "minor"]
		.map((severity) => {
			const findings = results.flatMap((result) =>
				(result.violations || [])
					.filter((violation) => getImpact(violation) === severity)
					.map((violation) => ({ result, violation })),
			);

			if (findings.length === 0) {
				return "";
			}

			const title = severity.charAt(0).toUpperCase() + severity.slice(1);
			const items = findings.slice(0, 10).map(({ result, violation }, index) => {
				const ruleTags = (violation.tags || [])
					.filter((tag) => /^wcag\d/.test(tag))
					.slice(0, 3)
					.join(", ") || "N/A";
				return `<h4>${index + 1}. ${escapeHtml(violation.help || violation.id || "Issue")}</h4>
<ul>
<li><strong>WCAG Tags:</strong> ${escapeHtml(ruleTags)}</li>
<li><strong>Severity:</strong> <span class="severity-badge ${escapeHtml(severity)}">${escapeHtml(title)}</span></li>
<li><strong>Affected Page:</strong> <a href="${escapeHtml(result.url || "#")}">${escapeHtml(result.url || "")}</a></li>
<li><strong>Instances:</strong> ${getNodesCount(violation)}</li>
<li><strong>Description:</strong> ${escapeHtml(violation.description || "")}</li>
<li><strong>Reference:</strong> <a href="${escapeHtml(violation.helpUrl || "#")}">${escapeHtml(violation.helpUrl || "")}</a></li>
</ul>`;
			}).join("\n<hr>\n");

			return `<h3><span class="severity-badge ${escapeHtml(severity)}">${escapeHtml(title)}</span> Issues (${findings.length})</h3>${items}`;
		})
		.filter(Boolean)
		.join("\n<hr>\n");

	const pageSections = results.map((result) => {
		const viewport = result.viewportSize || result.viewport || "N/A";
		const pageIssues = (result.violations || []).length;
		const pageStatus = pageIssues === 0 ? "CONFORMANT" : pageIssues <= 3 ? "PARTIAL" : "NON-CONFORMANT";
		return `<h3><a href="${escapeHtml(result.url || "#")}">${escapeHtml(result.url || "")}</a></h3>
<p><strong>Page Title:</strong> ${escapeHtml(result.pageTitle || result.url || "Untitled")}</p>
<ul>
<li><strong>Viewport:</strong> ${escapeHtml(viewport)}</li>
<li><strong>Status:</strong> ${escapeHtml(pageStatus)}</li>
<li><strong>Issues Found:</strong> ${pageIssues}</li>
<li><strong>Passes:</strong> ${Array.isArray(result.passes) ? result.passes.length : 0}</li>
</ul>`;
	}).join("\n<hr>\n");

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Accessibility Report</title>
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
hr { border: 0; border-top: 2px solid #e5e7eb; margin: 3rem 0; }
.severity-badge {
	font-weight: 700;
	border-radius: 4px;
	padding: 2px 8px;
	font-size: 0.85em;
	text-transform: uppercase;
}
.critical { color: #dc2626; background: #fee2e2; }
.serious { color: #ea580c; background: #ffedd5; }
.moderate { color: #d97706; background: #fef3c7; }
.minor { color: #4b5563; background: #f3f4f6; }
@media print {
	.card { break-inside: avoid; }
	h2, h3 { break-after: avoid; }
}
</style>
</head>
<body>
<div class="header">
	<div class="logo-container">${logoSvg}</div>
	<h1>Accessibility Report</h1>
</div>
<div class="dashboard">
	<div class="card">
		<div class="card-title">Overall Score</div>
		<div class="card-value">${summary.score}/100</div>
		<div class="badge-wrapper">
			<span class="status-badge ${statusClass}">Grade ${escapeHtml(summary.grade)}</span>
		</div>
	</div>
	<div class="card">
		<div class="card-title">Total Issues</div>
		<div class="card-value">${totalIssues}</div>
	</div>
	<div class="card">
		<div class="card-title">Priority (C/S)</div>
		<div class="card-value">${summary.severityCounts.critical}/${summary.severityCounts.serious}</div>
	</div>
	<div class="card">
		<div class="card-title">Standard (M/m)</div>
		<div class="card-value">${summary.severityCounts.moderate}/${summary.severityCounts.minor}</div>
	</div>
</div>
<h1>Accessibility Audit Report</h1>
<p><strong>Date:</strong> ${escapeHtml(auditDate.toLocaleDateString())}<br><strong>Time:</strong> ${escapeHtml(auditDate.toLocaleTimeString())}<br><strong>Status:</strong> ${escapeHtml(summary.complianceStatus)}</p>
<hr>
<h2>Executive Summary</h2>
<p><strong>Overall Score: ${summary.score}/100</strong> | <strong>Grade: ${escapeHtml(summary.grade)}</strong><br><strong>Compliance Status:</strong> ${escapeHtml(summary.complianceStatus)} (WCAG ${escapeHtml(summary.wcagVersion)} Level ${escapeHtml(summary.conformanceLevel)})</p>
<p>This audit scanned <strong>${summary.urlsTested} URL${summary.urlsTested === 1 ? "" : "s"}</strong> across <strong>${summary.scansRun} run${summary.scansRun === 1 ? "" : "s"}</strong> and detected <strong>${totalIssues} issue${totalIssues === 1 ? "" : "s"}</strong>.</p>
<hr>
<h2>Audit Configuration</h2>
<table>
<thead><tr><th>Setting</th><th>Value</th></tr></thead>
<tbody>
<tr><td><strong>WCAG Version</strong></td><td>${escapeHtml(summary.wcagVersion)}</td></tr>
<tr><td><strong>Conformance Level</strong></td><td>${escapeHtml(summary.conformanceLevel)}</td></tr>
<tr><td><strong>URLs Tested</strong></td><td>${summary.urlsTested}</td></tr>
<tr><td><strong>Scan Executions</strong></td><td>${summary.scansRun}</td></tr>
<tr><td><strong>Testing Tool</strong></td><td>Playwright + axe-core</td></tr>
</tbody>
</table>
<hr>
<h2>Compliance Dashboard</h2>
<table>
<thead><tr><th>Principle</th><th>Status</th><th>Details</th></tr></thead>
<tbody>${principleRows}</tbody>
</table>
<hr>
<h2>Issues Detected</h2>
${issueSections || "<p>No accessibility violations detected.</p>"}
<hr>
<h2>Page Details</h2>
${pageSections}
</body>
</html>`;
};

export const writeAccessibilityAuditReports = (results, config) => {
	const outputDir = path.resolve(config?.report?.output_dir || ".github/reports/accessibility");
	fs.mkdirSync(outputDir, { recursive: true });

	const summary = summarizeResults(results, config);
	const timestamp = getAuditTimestamp();
	const baseName = `accessibility-report-${timestamp}`;
	const formats = Array.isArray(config?.report?.formats) ? config.report.formats : ["markdown", "json"];

	const files = {};
	if (formats.includes("markdown")) {
		const markdownPath = path.join(outputDir, `${baseName}.md`);
		fs.writeFileSync(markdownPath, buildMarkdownReport(summary, results), "utf8");
		files.markdown = markdownPath;
	}

	if (formats.includes("json")) {
		const jsonPath = path.join(outputDir, `${baseName}.json`);
		fs.writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2), "utf8");
		files.json = jsonPath;
	}

	if (formats.includes("csv")) {
		const csvPath = path.join(outputDir, `${baseName}.csv`);
		fs.writeFileSync(csvPath, buildCsvReport(results), "utf8");
		files.csv = csvPath;
	}

	if (formats.includes("html")) {
		const htmlPath = path.join(outputDir, `${baseName}.html`);
		fs.writeFileSync(htmlPath, buildHtmlReport(summary, results), "utf8");
		files.html = htmlPath;

		const canonicalHtmlPath = path.resolve("report.html");
		fs.copyFileSync(htmlPath, canonicalHtmlPath);
		files.canonicalHtml = canonicalHtmlPath;
	}

	return { summary, files, outputDir, baseName };
};

export const buildAccessibilityMarkdownReport = (results, config = {}) => {
	const summary = summarizeResults(results, config);
	return buildMarkdownReport(summary, results);
};
