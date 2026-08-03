import path from "node:path";

// Only screenshot high-priority violations to keep report size manageable
const SCREENSHOT_SEVERITIES = new Set(["critical", "serious"]);
const MAX_SCREENSHOTS_PER_SCAN = 10;

// Serialized into browser context — must not close over module-scope variables
const injectHighlights = (selectors) => {
	let count = 0;
	for (const sel of selectors) {
		try {
			for (const el of document.querySelectorAll(sel)) {
				el.setAttribute("data-a11y-hl", "1");
				el.style.setProperty("outline", "3px solid #ef4444", "important");
				el.style.setProperty("outline-offset", "2px", "important");
				el.style.setProperty("box-shadow", "0 0 0 6px rgba(239,68,68,0.25)", "important");
				count++;
			}
		} catch {}
	}
	return count;
};

// Serialized into browser context — must not close over module-scope variables
const removeHighlights = () => {
	for (const el of document.querySelectorAll("[data-a11y-hl]")) {
		el.removeAttribute("data-a11y-hl");
		el.style.removeProperty("outline");
		el.style.removeProperty("outline-offset");
		el.style.removeProperty("box-shadow");
	}
};

/**
 * Capture a viewport screenshot per violation with affected elements highlighted in red.
 * Only processes critical/serious violations (max 10 per scan).
 * Attaches a base64 data URI to `violation._screenshot` for embedding in reports.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Array} violations axe-core violation objects (mutated in place)
 * @param {string} evidenceDir directory to write screenshot PNGs into
 */
export const captureViolationScreenshots = async (page, violations, evidenceDir) => {
	let count = 0;

	for (const violation of violations) {
		if (count >= MAX_SCREENSHOTS_PER_SCAN) break;

		const impact = String(violation?.impact || "").toLowerCase();
		if (!SCREENSHOT_SEVERITIES.has(impact)) continue;

		const nodes = Array.isArray(violation.nodes) ? violation.nodes : [];
		// Use the most-specific (last) selector in each node's target chain
		const selectors = nodes
			.map((n) => Array.isArray(n.target) && n.target.length ? n.target[n.target.length - 1] : null)
			.filter(Boolean);

		if (selectors.length === 0) continue;

		try {
			// Scroll the first affected element into view before screenshotting
			await page.evaluate((sel) => {
				try {
					const el = document.querySelector(sel);
					if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
				} catch {}
			}, selectors[0]);

			const highlighted = await page.evaluate(injectHighlights, selectors);
			if (!highlighted) continue;

			const safeId = violation.id.replace(/[^a-z0-9]/gi, "-").toLowerCase();
			const screenshotPath = path.join(evidenceDir, `violation-${safeId}-${Date.now()}.png`);
			await page.screenshot({ path: screenshotPath, fullPage: false });

		await page.evaluate(removeHighlights);

			// Store file path — resolved to base64 at report-generation time (survives JSON serialisation)
			violation._screenshotPath = screenshotPath;
			count++;
		} catch {
			// Don't let a failed screenshot abort the scan
			await page.evaluate(removeHighlights).catch(() => {});
		}
	}
};
