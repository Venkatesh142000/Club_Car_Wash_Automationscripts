import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const DEFAULT_CONFIG = {
	audit: {
		wcag_version: "2.2",
		conformance_level: "AA",
		include_standards: ["best-practices"],
		exclude_rules: [],
	},
	viewports: {
		desktop: { width: 1440, height: 900, enabled: true },
		mobile: { width: 375, height: 667, enabled: false },
		tablet: { width: 768, height: 1024, enabled: false },
	},
	report: {
		formats: ["markdown", "json"],
		screenshots: true,
		include_trends: false,
		output_dir: ".github/reports/accessibility",
	},
	urls: {
		file: "accessibility/accessibility-url.txt",
		crawl: {
			enabled: false,
			max_depth: 2,
			max_pages: 50,
		},
	},
};

const deepMerge = (base, override) => {
	if (Array.isArray(base) || Array.isArray(override)) {
		return override ?? base;
	}
	if (typeof base !== "object" || base === null) {
		return override ?? base;
	}

	const merged = { ...base };
	for (const key of Object.keys(override || {})) {
		const baseValue = base[key];
		const overrideValue = override[key];
		merged[key] = deepMerge(baseValue, overrideValue);
	}
	return merged;
};

const normalizeFormats = (formats) => {
	if (!formats) {
		return [...DEFAULT_CONFIG.report.formats];
	}

	const value = Array.isArray(formats)
		? formats
		: String(formats)
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean);

	const lowered = value.map((item) => item.toLowerCase());
	if (lowered.includes("all")) {
		return ["markdown", "json", "csv", "html"];
	}

	const allowed = new Set(["markdown", "json", "csv", "html"]);
	const valid = lowered.filter((item) => allowed.has(item));
	return valid.length ? valid : [...DEFAULT_CONFIG.report.formats];
};

const resolveExistingPath = (candidatePath) => {
	const resolved = path.resolve(candidatePath);
	if (fs.existsSync(resolved)) {
		return resolved;
	}
	return null;
};

export const loadAccessibilityConfig = () => {
	const candidates = ["accessibility/info.yml", ".github/accessibility-config.yml"];
	const configPath = candidates
		.map((candidate) => resolveExistingPath(candidate))
		.find(Boolean);

	if (!configPath) {
		return {
			...DEFAULT_CONFIG,
			report: {
				...DEFAULT_CONFIG.report,
				formats: [...DEFAULT_CONFIG.report.formats],
			},
		};
	}

	let parsed = {};
	try {
		const raw = fs.readFileSync(configPath, "utf8");
		parsed = yaml.parse(raw) || {};
	} catch (error) {
		console.warn(`[A11y] Unable to parse accessibility config at ${configPath}. Using defaults.`);
	}

	let merged = deepMerge(DEFAULT_CONFIG, parsed);

	if (merged["accessibility-auditor"]?.config || merged["accessibility-auditor"]?.defaults) {
		const legacy = merged["accessibility-auditor"];
		merged = deepMerge(merged, {
			audit: {
				wcag_version: legacy?.defaults?.wcag_version,
				conformance_level: legacy?.defaults?.conformance_level,
			},
			urls: {
				file: legacy?.config?.url_file,
			},
			report: {
				output_dir: legacy?.report?.location,
				formats: legacy?.report?.formats,
			},
		});
	}

	merged.report.formats = normalizeFormats(merged.report?.formats);
	merged.report.output_dir = merged.report?.output_dir || DEFAULT_CONFIG.report.output_dir;
	merged.audit.include_standards = Array.isArray(merged.audit?.include_standards)
		? merged.audit.include_standards
		: [...DEFAULT_CONFIG.audit.include_standards];
	merged.audit.exclude_rules = Array.isArray(merged.audit?.exclude_rules)
		? merged.audit.exclude_rules
		: [];

	return merged;
};

export const loadAuditUrls = (config) => {
	const configuredPath = config?.urls?.file;
	const urlFileCandidates = [
		configuredPath,
		"accessibility/accessibility-url.txt",
		".github/accessibility-urls.txt",
	].filter(Boolean);

	const firstExisting = urlFileCandidates
		.map((candidate) => resolveExistingPath(candidate))
		.find(Boolean);

	if (!firstExisting) {
		return [];
	}

	return fs
		.readFileSync(firstExisting, "utf8")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));
};

export const getEnabledViewports = (config) => {
	const defaults = [{ name: "desktop", width: 1440, height: 900 }];
	const viewports = config?.viewports || {};

	const enabled = Object.entries(viewports)
		.filter(([, vp]) => vp?.enabled)
		.map(([name, vp]) => ({
			name,
			width: Number(vp.width),
			height: Number(vp.height),
		}))
		.filter((vp) => Number.isFinite(vp.width) && Number.isFinite(vp.height));

	return enabled.length ? enabled : defaults;
};

export const getAxeTags = (config) => {
	const wcagVersion = String(config?.audit?.wcag_version || "2.2");
	const conformance = String(config?.audit?.conformance_level || "AA").toUpperCase();
	const includeStandards = (config?.audit?.include_standards || []).map((item) =>
		String(item).toLowerCase(),
	);

	const tags = new Set();
	const isAtLeast21 = wcagVersion.startsWith("2.1") || wcagVersion.startsWith("2.2");
	const isAtLeast22 = wcagVersion.startsWith("2.2");

	tags.add("wcag2a");
	if (conformance === "AA" || conformance === "AAA") {
		tags.add("wcag2aa");
	}
	if (conformance === "AAA") {
		tags.add("wcag2aaa");
	}

	if (isAtLeast21) {
		tags.add("wcag21a");
		if (conformance === "AA" || conformance === "AAA") {
			tags.add("wcag21aa");
		}
		if (conformance === "AAA") {
			tags.add("wcag21aaa");
		}
	}

	if (isAtLeast22) {
		tags.add("wcag22a");
		if (conformance === "AA" || conformance === "AAA") {
			tags.add("wcag22aa");
		}
		if (conformance === "AAA") {
			tags.add("wcag22aaa");
		}
	}

	if (includeStandards.includes("best-practices") || includeStandards.includes("best-practice")) {
		tags.add("best-practice");
	}
	if (includeStandards.includes("section508")) {
		tags.add("section508");
	}

	return [...tags];
};

export const getAuditTimestamp = () => {
	const now = new Date();
	const pad = (value) => String(value).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
};
