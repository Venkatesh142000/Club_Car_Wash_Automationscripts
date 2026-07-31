import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import helpers from "../utils/helpers.js";
import {
	getEnabledViewports,
	loadAccessibilityConfig,
	loadAuditUrls,
} from "../utils/accessibilityAuditConfig.js";

test.describe("Accessibility Auditor Agent Integration", () => {
	test.describe.configure({ mode: "serial" });

	test("runs WCAG audit for configured URLs and viewports", async ({ page }) => {
		const isFastMode = process.env.A11Y_FAST === "1";
		const config = loadAccessibilityConfig();
		const urls = loadAuditUrls(config);
		expect(urls.length, "No accessibility URLs configured. Update accessibility/accessibility-url.txt").toBeGreaterThan(0);

		const viewports = getEnabledViewports(config);
		const captureScreenshots = isFastMode ? false : Boolean(config?.report?.screenshots);
		const waitForNetworkIdle = !isFastMode && Boolean(config?.audit?.wait_for_network_idle);
		const networkIdleTimeoutMs = Number(config?.audit?.network_idle_timeout_ms || 5000);
		const outputDir = path.resolve(config?.report?.output_dir || ".github/reports/accessibility");
		const evidenceDir = path.join(outputDir, "screenshots");

		if (captureScreenshots) {
			fs.mkdirSync(evidenceDir, { recursive: true });
		}

		for (const url of urls) {
			for (const viewport of viewports) {
				await page.setViewportSize({ width: viewport.width, height: viewport.height });
				await page.goto(url, { waitUntil: "domcontentloaded" });
				if (waitForNetworkIdle) {
					await page.waitForLoadState("networkidle", { timeout: networkIdleTimeoutMs }).catch(() => {});
				}

				if (captureScreenshots) {
					const safeUrl = url
						.replace(/^https?:\/\//i, "")
						.replace(/[^a-z0-9]+/gi, "-")
						.replace(/^-+|-+$/g, "")
						.toLowerCase();
					const screenshotName = `${Date.now()}-${safeUrl}-${viewport.name}.png`;
					await page.screenshot({
						path: path.join(evidenceDir, screenshotName),
						fullPage: true,
					});
				}

				await helpers.runAccessibilityAuditorScan(page, {
					metadata: {
						viewport: viewport.name,
						viewportSize: `${viewport.width}x${viewport.height}`,
						auditStandard: `WCAG ${config.audit.wcag_version} ${config.audit.conformance_level}`,
					},
				});
			}
		}
	});
});
