import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import AxeBuilder from "@axe-core/playwright";
import { getAxeTags, loadAccessibilityConfig } from "./accessibilityAuditConfig.js";

/**
 * Pause execution for a fixed duration.
 * @param {object} [params]
 * @param {number} [params.ms=1000] Delay in milliseconds.
 */
export const sleep = async ({ ms = 1000 } = {}) => {
	await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Read an environment variable value with fallback support.
 * @param {object} params
 * @param {string} params.key Environment variable key.
 * @param {string} [params.fallback=""] Returned when key is not set.
 */
export const getEnv = ({ key, fallback = "" }) => {
	const value = process.env[key];
	return value === undefined || value === null || value === ""
		? fallback
		: value;
};

/**
 * Generate a random integer between min and max (inclusive).
 * @param {object} [params]
 * @param {number} [params.min=1000] Minimum value.
 * @param {number} [params.max=9999] Maximum value.
 */
export const generateRandomNumber = ({ min = 1000, max = 9999 } = {}) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random alphanumeric string.
 * @param {object} [params]
 * @param {number} [params.length=8] Output length.
 */
export const generateRandomString = ({ length = 8 } = {}) => {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from({ length }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length)),
	).join("");
};

/**
 * Generate a unique identifier using prefix, timestamp, and random suffix.
 * @param {object} [params]
 * @param {string} [params.prefix="id"] Prefix for generated id.
 */
export const generateUniqueId = ({ prefix = "id" } = {}) => {
	return `${prefix}-${Date.now()}-${generateRandomNumber({ min: 100, max: 999 })}`;
};

/**
 * Generate a unique test email address.
 * @param {object} [params]
 * @param {string} [params.prefix="testuser"] Local-part prefix.
 * @param {string} [params.domain="yopmail.com"] Email domain.
 */
export const generateRandomEmail = ({
	prefix = "testuser",
	domain = "yopmail.com",
} = {}) => {
	return `${prefix}+${generateUniqueId({ prefix: "mail" })}@${domain}`;
};

/**
 * Format a date using locale and Intl options.
 * @param {object} [params]
 * @param {Date} [params.date=new Date()] Input date.
 * @param {string} [params.locale="en-US"] Locale code.
 * @param {Intl.DateTimeFormatOptions} [params.options={}] Intl formatting options.
 */
export const formatDate = ({
	date = new Date(),
	locale = "en-US",
	options = {},
} = {}) => {
	return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Get a date string in YYYY-MM-DD format.
 * @param {object} [params]
 * @param {Date} [params.date=new Date()] Date value to format.
 */
export const getCurrentDate = ({ date = new Date() } = {}) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * Navigate to a URL.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string} params.url URL/path to navigate.
 * @param {"load"|"domcontentloaded"|"networkidle"|"commit"} [params.waitUntil="domcontentloaded"] Load state to wait for.
 */
export const navigateTo = async ({
	page,
	url,
	waitUntil = "domcontentloaded",
}) => {
	await page.goto(url, { waitUntil });
};

/**
 * Wait until page is ready for interaction.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {number} [params.timeout=30000] Timeout for each wait.
 * @param {boolean} [params.waitForNetworkIdle=true] Also wait for network idle state.
 */
export const waitForPageReady = async ({
	page,
	timeout = 30000,
	waitForNetworkIdle = true,
}) => {
	await page.waitForLoadState("domcontentloaded", { timeout });
	if (waitForNetworkIdle) {
		await page.waitForLoadState("networkidle", { timeout });
	}
};

/**
 * Wait until current URL contains text (regex-compatible).
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string} params.text Text/regex fragment expected in URL.
 * @param {number} [params.timeout=30000] Wait timeout.
 */
export const waitForUrlContains = async ({ page, text, timeout = 30000 }) => {
	await page.waitForURL(new RegExp(text), { timeout });
};

/**
 * Click a locator after visibility check.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 * @param {import('@playwright/test').LocatorClickOptions} [params.clickOptions={}] Click behavior options.
 */
export const click = async ({
	locator,
	timeout = 30000,
	clickOptions = {},
}) => {
	await locator.waitFor({ state: "visible", timeout });
	await locator.click(clickOptions);
};

/**
 * Clear an input and type a value.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target input locator.
 * @param {string|number} params.value Value to enter.
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 */
export const clearAndType = async ({ locator, value, timeout = 30000 }) => {
	await locator.waitFor({ state: "visible", timeout });
	await locator.fill("");
	await locator.fill(String(value));
};

/**
 * Type text into an input with configurable behavior.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target input locator.
 * @param {string|number} params.value Value to type.
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 * @param {boolean} [params.clearFirst=true] Clear field before typing.
 * @param {number} [params.delay=0] Delay between key presses in ms.
 */
export const typeText = async ({
	locator,
	value,
	timeout = 30000,
	clearFirst = true,
	delay = 0,
}) => {
	await locator.waitFor({ state: "visible", timeout });
	if (clearFirst) {
		await locator.fill("");
	}
	await locator.type(String(value), { delay });
};

/**
 * Press a keyboard key on a locator.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {string} params.key Key name (for example: Enter, Tab).
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 */
export const pressKey = async ({ locator, key, timeout = 30000 }) => {
	await locator.waitFor({ state: "visible", timeout });
	await locator.press(key);
};

/**
 * Select value(s) in a dropdown/select element.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Select locator.
 * @param {string|{value?:string,label?:string,index?:number}|Array<string|{value?:string,label?:string,index?:number}>} params.value Option selector(s).
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 */
export const selectDropdown = async ({ locator, value, timeout = 30000 }) => {
	await locator.waitFor({ state: "visible", timeout });
	await locator.selectOption(value);
};

/**
 * Set checkbox state.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Checkbox locator.
 * @param {boolean} [params.checked=true] True to check, false to uncheck.
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 */
export const setCheckbox = async ({
	locator,
	checked = true,
	timeout = 30000,
}) => {
	await locator.waitFor({ state: "visible", timeout });
	if (checked) {
		await locator.check();
		return;
	}
	await locator.uncheck();
};

/**
 * Check whether locator is visible within timeout.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=5000] Visibility timeout.
 */
export const isVisible = async ({ locator, timeout = 5000 }) => {
	try {
		await locator.waitFor({ state: "visible", timeout });
		return true;
	} catch {
		return false;
	}
};

/**
 * Wait until locator is visible and enabled (clickable), then return it.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Maximum wait time in ms.
 */
export const waitForClickable = async ({ locator, timeout = 30000 }) => {
	await locator.waitFor({ state: "attached", timeout });
	await locator.waitFor({ state: "visible", timeout });
	await expect(locator).toBeEnabled({ timeout });
	return locator;
};

/**
 * Wait until element is interactable (attached, visible, enabled), then return locator.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Maximum wait time in ms.
 */
export const waitForElementInteractable = async ({
	locator,
	timeout = 30000,
}) => {
	await locator.waitFor({ state: "attached", timeout });
	await locator.waitFor({ state: "visible", timeout });
	await locator.waitFor({ state: "enabled", timeout });
	return locator;
};

/**
 * Wait until locator is displayed (visible), then return it.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Maximum wait time in ms.
 */
export const waitForDisplayed = async ({ locator, timeout = 50000 }) => {
	await locator.waitFor({ state: "visible", timeout });
	return locator;
};

/**
 * Get text content from a visible locator.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Visibility wait timeout.
 * @param {boolean} [params.trim=true] Trim whitespace before returning.
 */
export const getText = async ({ locator, timeout = 30000, trim = true }) => {
	await locator.waitFor({ state: "visible", timeout });
	const text = (await locator.textContent()) ?? "";
	return trim ? text.trim() : text;
};

/**
 * Scroll locator into viewport if needed.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 */
export const scrollIntoView = async ({ locator }) => {
	await locator.scrollIntoViewIfNeeded();
};

/**
 * Scroll the page to bottom.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 */
export const scrollToBottom = async ({ page }) => {
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
};

/**
 * Upload a file through an input element.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator File input locator.
 * @param {string|string[]} params.filePath Absolute/relative path(s) to file(s).
 */
export const uploadFile = async ({ locator, filePath }) => {
	await locator.setInputFiles(filePath);
};

/**
 * Convert relative path to absolute path.
 * @param {object} params
 * @param {string} params.targetPath Target path.
 */
export const toAbsolutePath = ({ targetPath }) => {
	return path.isAbsolute(targetPath)
		? targetPath
		: path.resolve(process.cwd(), targetPath);
};

/**
 * Read and parse a JSON file.
 * @param {object} params
 * @param {string} params.filePath JSON file path.
 * @param {BufferEncoding} [params.encoding="utf-8"] File encoding.
 */
export const readJsonFile = async ({ filePath, encoding = "utf-8" }) => {
	const absolutePath = toAbsolutePath({ targetPath: filePath });
	const content = await fs.promises.readFile(absolutePath, encoding);
	return JSON.parse(content);
};

/**
 * Write data as JSON, creating parent directories when needed.
 * @param {object} params
 * @param {string} params.filePath Output file path.
 * @param {unknown} params.data Data to serialize.
 * @param {BufferEncoding} [params.encoding="utf-8"] File encoding.
 * @param {number} [params.indent=2] JSON indentation spaces.
 */
export const writeJsonFile = async ({
	filePath,
	data,
	encoding = "utf-8",
	indent = 2,
}) => {
	const absolutePath = toAbsolutePath({ targetPath: filePath });
	const directory = path.dirname(absolutePath);
	await fs.promises.mkdir(directory, { recursive: true });
	await fs.promises.writeFile(
		absolutePath,
		JSON.stringify(data, null, indent),
		encoding,
	);
};

/**
 * Capture and save a screenshot.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string} [params.name="screenshot"] File name prefix.
 * @param {string} [params.directory="test-results/screenshots"] Output directory.
 * @param {boolean} [params.fullPage=true] Capture full page.
 */
export const takeScreenshot = async ({
	page,
	name = "screenshot",
	directory = "test-results/screenshots",
	fullPage = true,
}) => {
	const absoluteDirectory = toAbsolutePath({ targetPath: directory });
	await fs.promises.mkdir(absoluteDirectory, { recursive: true });
	const filePath = path.join(absoluteDirectory, `${name}-${Date.now()}.png`);
	await page.screenshot({ path: filePath, fullPage });
	return filePath;
};

/**
 * Wait for a matching request while executing an action.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string|RegExp|function(import('@playwright/test').Request):boolean} params.urlOrPredicate Request matcher.
 * @param {() => Promise<unknown>} params.action Action that triggers request.
 * @param {number} [params.timeout=30000] Request wait timeout.
 */
export const waitForRequest = async ({
	page,
	urlOrPredicate,
	action,
	timeout = 30000,
}) => {
	const requestPromise = page.waitForRequest(urlOrPredicate, { timeout });
	await action();
	return requestPromise;
};

/**
 * Wait for a matching response while executing an action.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string|RegExp|function(import('@playwright/test').Response):boolean} params.urlOrPredicate Response matcher.
 * @param {() => Promise<unknown>} params.action Action that triggers response.
 * @param {number} [params.timeout=30000] Response wait timeout.
 */
export const waitForResponse = async ({
	page,
	urlOrPredicate,
	action,
	timeout = 30000,
}) => {
	const responsePromise = page.waitForResponse(urlOrPredicate, { timeout });
	await action();
	return responsePromise;
};

/**
 * Execute an action and wait for navigation to complete.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {() => Promise<unknown>} params.action Action that triggers navigation.
 * @param {string|RegExp|((url: URL) => boolean)} [params.url] Optional URL matcher for target page.
 * @param {"load"|"domcontentloaded"|"networkidle"|"commit"} [params.waitUntil="load"] Navigation load state.
 * @param {number} [params.timeout=30000] Navigation wait timeout.
 */
export const waitForNavigationAfterAction = async ({
	page,
	action,
	url,
	waitUntil = "load",
	timeout = 30000,
}) => {
	const previousUrl = page.url();
	const urlMatcher = url ?? ((nextUrl) => nextUrl.toString() !== previousUrl);

	await Promise.all([
		page.waitForURL(urlMatcher, { waitUntil, timeout }),
		action(),
	]);
};

/**
 * Assert response status code.
 * @param {object} params
 * @param {import('@playwright/test').APIResponse|import('@playwright/test').Response} params.response Response object.
 * @param {number} [params.expectedStatus=200] Expected HTTP status code.
 * @param {boolean} [params.includeBodyOnError=true] Include response body in error output.
 */
export const assertStatus = async ({
	response,
	expectedStatus = 200,
	includeBodyOnError = true,
}) => {
	const status = response.status();
	if (status !== expectedStatus) {
		let responseBody = "";
		if (includeBodyOnError) {
			try {
				responseBody = await response.text();
			} catch {
				responseBody = "<response body unavailable>";
			}
		}
		const bodyPart = includeBodyOnError ? ` Response: ${responseBody}` : "";
		throw new Error(
			`Expected status ${expectedStatus}, but got ${status}.${bodyPart}`,
		);
	}
};

/**
 * Assert locator visibility.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertVisible = async ({ locator, timeout = 30000 }) => {
	await expect(locator).toBeVisible({ timeout });
};

/**
 * Assert locator is hidden.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertHidden = async ({ locator, timeout = 30000 }) => {
	await expect(locator).toBeHidden({ timeout });
};

/**
 * Assert locator is enabled.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertEnabled = async ({ locator, timeout = 30000 }) => {
	await expect(locator).toBeEnabled({ timeout });
};

/**
 * Assert locator is disabled.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertDisabled = async ({ locator, timeout = 30000 }) => {
	await expect(locator).toBeDisabled({ timeout });
};

/**
 * Assert locator has exact text.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {string|RegExp} params.text Expected text.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertText = async ({ locator, text, timeout = 30000 }) => {
	await expect(locator).toHaveText(text, { timeout });
};

/**
 * Assert locator contains partial text.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {string|RegExp} params.text Expected partial text.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertContainsText = async ({
	locator,
	text,
	timeout = 30000,
}) => {
	await expect(locator).toContainText(text, { timeout });
};

/**
 * Assert input value.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target input locator.
 * @param {string|RegExp} params.value Expected value.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertValue = async ({ locator, value, timeout = 30000 }) => {
	await expect(locator).toHaveValue(value, { timeout });
};

/**
 * Assert locator has attribute with value.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {string} params.name Attribute name.
 * @param {string|RegExp} params.value Expected attribute value.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertAttribute = async ({
	locator,
	name,
	value,
	timeout = 30000,
}) => {
	await expect(locator).toHaveAttribute(name, value, { timeout });
};

/**
 * Assert locator class contains token/regex.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {string|RegExp} params.className Expected class token/regex.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertClassContains = async ({
	locator,
	className,
	timeout = 30000,
}) => {
	await expect(locator).toHaveClass(className, { timeout });
};

/**
 * Assert checkbox/radio state is checked.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertChecked = async ({ locator, timeout = 30000 }) => {
	await expect(locator).toBeChecked({ timeout });
};

/**
 * Assert checkbox/radio state is unchecked.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertUnchecked = async ({ locator, timeout = 30000 }) => {
	await expect(locator).not.toBeChecked({ timeout });
};

/**
 * Assert number of matching elements.
 * @param {object} params
 * @param {import('@playwright/test').Locator} params.locator Target locator.
 * @param {number} params.count Expected count.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertCount = async ({ locator, count, timeout = 30000 }) => {
	await expect(locator).toHaveCount(count, { timeout });
};

/**
 * Assert page URL.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string|RegExp|((url: URL) => boolean)} params.url Expected URL matcher.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertUrl = async ({ page, url, timeout = 30000 }) => {
	await expect(page).toHaveURL(url, { timeout });
};

/**
 * Assert page title.
 * @param {object} params
 * @param {import('@playwright/test').Page} params.page Playwright page.
 * @param {string|RegExp} params.title Expected title.
 * @param {number} [params.timeout=30000] Assertion timeout.
 */
export const assertTitle = async ({ page, title, timeout = 30000 }) => {
	await expect(page).toHaveTitle(title, { timeout });
};

/**
 * Assert two primitive values are equal.
 * @param {object} params
 * @param {unknown} params.actual Actual value.
 * @param {unknown} params.expected Expected value.
 */
export const assertEqual = ({ actual, expected }) => {
	expect(actual).toEqual(expected);
};

/**
 * Assert two primitive values are not equal.
 * @param {object} params
 * @param {unknown} params.actual Actual value.
 * @param {unknown} params.expected Expected value.
 */
export const assertNotEqual = ({ actual, expected }) => {
	expect(actual).not.toEqual(expected);
};

/**
 * Assert value contains another value.
 * @param {object} params
 * @param {string|Array<unknown>} params.actual Actual collection/string.
 * @param {unknown} params.expectedPart Expected subset or substring.
 */
export const assertContains = ({ actual, expectedPart }) => {
	expect(actual).toContain(expectedPart);
};

/**
 * Assert value is truthy.
 * @param {object} params
 * @param {unknown} params.value Value under test.
 */
export const assertTruthy = ({ value }) => {
	expect.soft(value).toBeTruthy();
};

/**
 * Assert value is falsy.
 * @param {object} params
 * @param {unknown} params.value Value under test.
 */
export const assertFalsy = ({ value }) => {
	expect(value).toBeFalsy();
};

/**
 * Assert actual number is greater than expected number.
 * @param {object} params
 * @param {number} params.actual Actual number.
 * @param {number} params.expected Expected lower bound.
 */
export const assertGreaterThan = ({ actual, expected }) => {
	expect(actual).toBeGreaterThan(expected);
};

/**
 * Assert actual number is less than expected number.
 * @param {object} params
 * @param {number} params.actual Actual number.
 * @param {number} params.expected Expected upper bound.
 */
export const assertLessThan = ({ actual, expected }) => {
	expect(actual).toBeLessThan(expected);
};

/**
 * Send an HTTP GET request.
 * @param {object} params
 * @param {import('@playwright/test').APIRequestContext} params.request Playwright request context.
 * @param {string} params.url URL/path.
 * @param {object} [params.options={}] Request options.
 */
export const apiGet = async ({ request, url, options = {} }) => {
	return request.get(url, options);
};

/**
 * Send an HTTP POST request.
 * @param {object} params
 * @param {import('@playwright/test').APIRequestContext} params.request Playwright request context.
 * @param {string} params.url URL/path.
 * @param {unknown} [params.payload={}] Request payload (sent as data).
 * @param {object} [params.options={}] Additional request options.
 */
export const apiPost = async ({ request, url, payload = {}, options = {} }) => {
	return request.post(url, { data: payload, ...options });
};

/**
 * Send an HTTP PUT request.
 * @param {object} params
 * @param {import('@playwright/test').APIRequestContext} params.request Playwright request context.
 * @param {string} params.url URL/path.
 * @param {unknown} [params.payload={}] Request payload (sent as data).
 * @param {object} [params.options={}] Additional request options.
 */
export const apiPut = async ({ request, url, payload = {}, options = {} }) => {
	return request.put(url, { data: payload, ...options });
};

/**
 * Send an HTTP DELETE request.
 * @param {object} params
 * @param {import('@playwright/test').APIRequestContext} params.request Playwright request context.
 * @param {string} params.url URL/path.
 * @param {object} [params.options={}] Request options.
 */
export const apiDelete = async ({ request, url, options = {} }) => {
	return request.delete(url, options);
};

/**
 * Parse JSON safely with fallback value.
 * @param {object} params
 * @param {string} params.value JSON string.
 * @param {unknown} [params.fallback=null] Fallback returned when parsing fails.
 */
export const safeJsonParse = ({ value, fallback = null }) => {
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

/**
 * Retry an async task with optional backoff.
 * @param {object} params
 * @param {(attempt:number) => Promise<unknown>} params.task Async task to run.
 * @param {number} [params.retries=3] Total attempts.
 * @param {number} [params.delayMs=1000] Initial delay in ms.
 * @param {number} [params.backoffFactor=1] Delay multiplier per retry.
 */
export const retry = async ({
	task,
	retries = 3,
	delayMs = 1000,
	backoffFactor = 1,
}) => {
	let lastError;
	for (let attempt = 1; attempt <= retries; attempt += 1) {
		try {
			return await task(attempt);
		} catch (error) {
			lastError = error;
			if (attempt < retries) {
				const waitTime = Math.round(delayMs * backoffFactor ** (attempt - 1));
				await sleep({ ms: waitTime });
			}
		}
	}
	throw lastError;
};

/**
 * Run a named step and throw a contextual error on failure.
 * @param {object} params
 * @param {string} params.stepName Step name used in error context.
 * @param {() => Promise<unknown>} params.action Async action to execute.
 */
export const runStep = async ({ stepName, action }) => {
	try {
		return await action();
	} catch (error) {
		throw new Error(`Step failed: ${stepName}. ${error.message}`);
	}
};

export const waitForInvisible = async ({ locator, timeout = 30000 }) => {
	await locator.waitFor({ state: "hidden", timeout });
};

export const sendKeys = async ({ locator, text, timeout = 30000 }) => {
	await locator.waitFor({ state: "visible", timeout });
	await locator.fill(text);
};

export const waitAndSwitchToNewTabByTitle = async ({
	context,
	action,
	expectedTitle,
}) => {
	const [newPage] = await Promise.all([context.waitForEvent("page"), action()]);

	await newPage.waitForLoadState();

	if ((await newPage.title()).includes(expectedTitle)) {
		await newPage.bringToFront();
		return newPage;
	}

	throw new Error("New tab title did not match");
};

export const switchToTabByTitle = async (context, expectedTitle) => {
	for (const page of context.pages()) {
		const title = await page.title();
		if (title.includes(expectedTitle)) {
			await page.bringToFront();
			console.log("switched to " + expectedTitle + " page");
			return page;
		}
	}
	throw new Error(`No tab found with title: ${expectedTitle}`);
};

export const switchToTabByUrl = async (context, expectedUrl) => {
	for (const page of context.pages()) {
		try {
			const title = await page.title().catch(() => "N/A");
			console.log(`Checking page: ${title}`);
			await page
				.waitForLoadState("domcontentloaded", { timeout: 5000 })
				.catch(() => {});
			const url = page.url();
			console.log(`URL: ${url}`);
			if (url.includes(expectedUrl)) {
				await page.bringToFront();
				return page;
			}
		} catch (e) {
			console.log(`Skipping page due to error: ${e.message}`);
		}
	}
	throw new Error(`No tab found with URL: ${expectedUrl}`);
};

export const attachScreenshot = async ({ page }) => {
	const screenshot = await page.screenshot();
	await allure.attachment("Screenshot", screenshot, "image/png");
};


//adding step to allure
export const allureStep = async (step) => {
	await allure.step(step, async () => {});
};

//adding allure label
export const allureEpicLabel = async (value) => {
	await allure.label("epic", "Epic:-" + value);
};

//adding feature label
export const allureFeatureLabel = async (value) => {
	await allure.label("feature", "Feature:-" + value);
};

//allure display name
export const allureDisplayName = async (value) => {
	await allure.displayName(value);
};

//adding story label
export const allureStoryLabel = async (value) => {
	await allure.label("story", "Story:-" + value);
};

//adding severity
export const allureSeverity = async (severityLevel) => {
	
	await allure.severity(severityLevel);
};

//adding test case
export const allureTestCase = async (testCaseId, testcase) => {
	await allure.link(testCaseId, testcase, "tms");
};

//allure description
export const allureDescription = async (description) => {
	await allure.description(description);
};

//allure screenshot
export const allureScreenshot = async ({ page }, name) => {
	await allure.attachment(name, await page.screenshot(), "image/png");
};

//allure tag
export const allureTag = async (tag) => {
	await allure.label("tag", tag);
};

//allure browser parameter
export const allureBrowser = async (browserName) => {
	await allure.parameter("Browser", browserName);
};

export const validateResponseBodyValue = async (expectedValue, actualValue) => {
	const result = expectedValue === actualValue;

	if (result) {
		await allureStep(`Validating response body value pass->: Expected ${expectedValue} == Actual ${actualValue}`);
	} else {
		await allureStep(`Validating response body value fail->: Expected ${expectedValue} != Actual ${actualValue}`);
	}

	return result;
};

export const validateGetResponseStatusCode = async (getStatusCode) => {
	const result = getStatusCode === 200;

	if (result) {
		await allureStep(`Validating GET response status code pass->: Expected 200 == Actual ${getStatusCode}`);
	} else {
		await allureStep(`Validating GET response status code fail->: Expected 200 != Actual ${getStatusCode}`);
	}

	return result;
};

export const validatePostResponseStatusCode = async (postStatusCode) => {
	const result = postStatusCode === 200 || postStatusCode === 201;

	if (result) {
		await allureStep(`Validating POST response status code pass->: Expected 200 or 201 == Actual ${postStatusCode}`);
	} else {
		await allureStep(`Validating POST response status code fail->: Expected 200 or 201 != Actual ${postStatusCode}`);
	}

	return result;
};

export const validateDeleteResponseStatusCode = async (deleteStatusCode) => {
	// Some servers return 201 on successful delete operations, accept it as well
	const result = deleteStatusCode === 200 || deleteStatusCode === 201 || deleteStatusCode === 204;

	if (result) {
		await allureStep(`Validating DELETE response status code pass->: Expected 200, 201 or 204 == Actual ${deleteStatusCode}`);
	} else {
		await allureStep(`Validating DELETE response status code fail->: Expected 200, 201 or 204 != Actual ${deleteStatusCode}`);
	}

	return result;
};

// Shared store: accessibility results collected across tests
export const accessibilityResults = [];

const ACCESSIBILITY_REPORT_DIR = path.resolve(process.cwd(), "accessibility-reports");
const A11Y_RUN_ID = process.env.A11Y_RUN_ID || "manual-run";

const persistAccessibilityResult = (entry) => {
  if (!entry) return null;

  fs.mkdirSync(ACCESSIBILITY_REPORT_DIR, { recursive: true });

  const safeTitle = (entry.pageTitle || entry.url || "page")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "page";

	const fileName = `a11y-${A11Y_RUN_ID}-${safeTitle}-${Date.now()}.json`;
  const filePath = path.join(ACCESSIBILITY_REPORT_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), "utf8");
  return filePath;
};

/**
 * Run an axe-core accessibility scan on the current page (or a given URL).
 * Results are pushed into `accessibilityResults` for PDF generation at teardown.
 * @param {import('@playwright/test').Page} page
 * @param {string} [url] Optional URL to navigate to before scanning
 * @param {object} [options]
 * @param {string[]} [options.tags]  axe rule tags e.g. ['wcag2a','wcag2aa']
 * @param {string[]} [options.disableRules]  rule IDs to disable
 * @param {Record<string, unknown>} [options.metadata] Additional audit metadata to persist.
 */
export const runAccessibilityScan = async (page, url, options = {}) => {
  if (url) {
    await page.goto(url);
  }

  const pageTitle = await page.title();
  const pageUrl   = page.url();
  const tags      = options.tags || ['wcag2a', 'wcag2aa', 'best-practice'];

  let builder = new AxeBuilder({ page }).withTags(tags);
  if (options.disableRules?.length) {
    builder = builder.disableRules(options.disableRules);
  }

  const results = await builder.analyze();

  const entry = {
    url:        pageUrl,
    pageTitle:  pageTitle || pageUrl,
    violations: results.violations,
    passes:     results.passes,
    timestamp:  new Date().toISOString(),
		runId:      A11Y_RUN_ID,
		...(options.metadata || {}),
  };

  accessibilityResults.push(entry);
  const persistedFile = persistAccessibilityResult(entry);

  await allureStep(
    `Accessibility scan: ${entry.violations.length} violation(s) on "${pageTitle}"`
  );

  console.log(`[A11y] "${pageTitle}" — violations: ${entry.violations.length}, passes: ${entry.passes.length}${persistedFile ? ` — saved to ${persistedFile}` : ""}`);

  return entry;
};

/**
 * Run accessibility scan using Accessibility Auditor configuration.
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {string} [options.url] Optional URL to navigate before scan
 * @param {Record<string, unknown>} [options.metadata] Additional metadata to attach
 * @param {string[]} [options.tags] Optional explicit axe tags override
 * @param {string[]} [options.disableRules] Optional explicit disabled rules override
 */
export const runAccessibilityAuditorScan = async (page, options = {}) => {
	const config = loadAccessibilityConfig();
	const tags = Array.isArray(options.tags) && options.tags.length
		? options.tags
		: getAxeTags(config);
	const disableRules = Array.isArray(options.disableRules)
		? options.disableRules
		: (config?.audit?.exclude_rules || []);

	const metadata = {
		auditStandard: `WCAG ${config?.audit?.wcag_version || "2.2"} ${config?.audit?.conformance_level || "AA"}`,
		...(options.metadata || {}),
	};

	return runAccessibilityScan(page, options.url, {
		tags,
		disableRules,
		metadata,
	});
};

export const getDbRowCount = async ({ dbHelper, tableName }) => {
	const rows = await dbHelper.query('SELECT COUNT(*) AS total FROM ??', [tableName]);
	return Number(rows[0]?.total ?? 0);
};

export const findNullValuesInRows = ({ rows, columns }) => {
	const nullColumns = [];
	rows.forEach((row, index) => {
		columns.forEach((column) => {
			if (row[column] === null || row[column] === undefined || row[column] === '') {
				nullColumns.push({ rowIndex: index + 1, column });
			}
		});
	});
	return nullColumns;
};

export const getNonNullRows = ({ rows, columns }) => {
	return rows.filter((row) => columns.every((column) => row[column] !== null && row[column] !== undefined && row[column] !== ''));
};

export const assertDbRowCount = async ({ dbHelper, tableName, expectedCount }) => {
	const actualCount = await getDbRowCount({ dbHelper, tableName });
	assertEqual({ actual: actualCount, expected: expectedCount });
	return actualCount;
};

export const assertNoNullValues = ({ rows, columns }) => {
	const nullValues = findNullValuesInRows({ rows, columns });
	assertEqual({ actual: nullValues.length, expected: 0 });
	return nullValues;
};

export const assertNonNullRows = ({ rows, columns }) => {
	const filteredRows = getNonNullRows({ rows, columns });
	assertGreaterThan({ actual: filteredRows.length, expected: 0 });
	return filteredRows;
};

export const findDuplicateValues = ({ rows, column }) => {
	const counts = new Map();
	const duplicates = [];
	rows.forEach((row, index) => {
		const value = row[column];
		if (!counts.has(value)) {
			counts.set(value, []);
		}
		counts.get(value).push(index + 1);
	});
	counts.forEach((positions, value) => {
		if (positions.length > 1) {
			duplicates.push({ value, positions });
		}
	});
	return duplicates;
};

export const assertUniqueColumnValues = ({ rows, column }) => {
	const duplicates = findDuplicateValues({ rows, column });
	assertEqual({ actual: duplicates.length, expected: 0 });
	return duplicates;
};

export const validateEmailFormat = ({ email }) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const assertEmailFormat = ({ rows, column }) => {
	const invalidEmails = rows.filter((row) => !validateEmailFormat({ email: row[column] }));
	assertEqual({ actual: invalidEmails.length, expected: 0 });
	return invalidEmails;
};

export const validateForeignKeyIntegrity = async ({ dbHelper, tableName, column, referencedTable, referencedColumn }) => {
	try {
		// Get all non-null foreign key values using parameterized queries (SQL injection safe)
		const rows = await dbHelper.query(
			`SELECT ?? as fk_value FROM ?? WHERE ?? IS NOT NULL`,
			[column, tableName, column]
		);
		
		// Get all referenced values
		const referencedRows = await dbHelper.query(
			`SELECT ?? FROM ??`,
			[referencedColumn, referencedTable]
		);
		
		const referencedValues = new Set(referencedRows.map((item) => item[referencedColumn]));
		
		// Find orphaned foreign keys
		const orphanedKeys = rows.filter((row) => !referencedValues.has(row.fk_value));
		
		if (orphanedKeys.length > 0) {
			console.log(`Found ${orphanedKeys.length} orphaned foreign keys in ${tableName}.${column}:`, orphanedKeys);
		}
		
		return orphanedKeys;
	} catch (error) {
		console.error('Foreign key validation failed:', error);
		throw new Error(`FK validation failed: ${error.message}`);
	}
};

export const assertOrderTotals = async ({ dbHelper }) => {
	try {
		const orders = await dbHelper.query(`
			SELECT o.order_id, o.quantity, o.total_amount, o.product_id, p.price
			FROM ?? o
			JOIN ?? p ON o.product_id = p.product_id
		`,
		['orders', 'products']
		);
		
		const mismatches = orders.filter((order) => {
			if (!order.quantity || !order.price || !order.total_amount) {
				return false; // Skip rows with null values
			}
			const expectedTotal = Number(order.quantity) * Number(order.price);
			const actualTotal = Number(order.total_amount);
			return Math.abs(actualTotal - expectedTotal) > 0.0001; // Allow small floating point errors
		});
		
		if (mismatches.length > 0) {
			console.log(`Found ${mismatches.length} order total mismatches:`, mismatches);
		}
		
		return mismatches;
	} catch (error) {
		console.error('Order total validation failed:', error);
		throw new Error(`Order validation failed: ${error.message}`);
	}
};

/**
 * COMMONLY REUSED HELPER FUNCTIONS (Cross-Project Use)
 */

/**
 * Retry an async operation with exponential backoff.
 * @param {object} params
 * @param {() => Promise<any>} params.operation Async function to retry.
 * @param {number} [params.maxRetries=3] Maximum retry attempts.
 * @param {number} [params.delayMs=1000] Initial delay in milliseconds.
 * @param {number} [params.backoffMultiplier=2] Exponential backoff multiplier.
 * @param {(error: Error) => boolean} [params.shouldRetry] Custom retry condition.
 */
export const retryWithBackoff = async ({
	operation,
	maxRetries = 3,
	delayMs = 1000,
	backoffMultiplier = 2,
	shouldRetry = () => true,
}) => {
	let lastError;
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (attempt === maxRetries || !shouldRetry(error)) {
				throw error;
			}
			const waitTime = delayMs * Math.pow(backoffMultiplier, attempt);
			console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms - ${error.message}`);
			await sleep({ ms: waitTime });
		}
	}
	throw lastError;
};

/**
 * Execute database query with retry logic and error handling.
 * @param {object} params
 * @param {object} params.dbHelper Database helper instance.
 * @param {string} params.query SQL query or operation.
 * @param {Array} [params.params=[]] Query parameters.
 * @param {boolean} [params.withRetry=true] Enable automatic retry.
 */
export const queryDbWithRetry = async ({
	dbHelper,
	query,
	params = [],
	withRetry = true,
}) => {
	if (!withRetry) {
		return await dbHelper.query(query, params);
	}

	return retryWithBackoff({
		operation: () => dbHelper.query(query, params),
		maxRetries: 3,
		delayMs: 500,
		shouldRetry: (error) => {
			// Retry on connection errors, not on data errors
			return error.code && ['PROTOCOL_CONNECTION_LOST', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code);
		},
	});
};

/**
 * Clean up test data from database with transaction support.
 * @param {object} params
 * @param {object} params.dbHelper Database helper instance.
 * @param {string} params.tableName Table to clean.
 * @param {string} [params.whereClause] WHERE clause for selective deletion.
 * @param {Array} [params.params=[]] Query parameters.
 */
export const cleanupDbData = async ({
	dbHelper,
	tableName,
	whereClause,
	params = [],
}) => {
	try {
		const sql = whereClause
			? `DELETE FROM ?? WHERE ${whereClause}`
			: `DELETE FROM ??`;
		const queryParams = whereClause ? [tableName, ...params] : [tableName];
		const result = await dbHelper.query(sql, queryParams);
		console.log(`Cleaned up ${tableName}: ${whereClause || 'all rows'}`);
		return result;
	} catch (error) {
		console.error(`Cleanup failed for ${tableName}:`, error);
		throw new Error(`Cleanup failed: ${error.message}`);
	}
};

/**
 * Insert test data into database.
 * @param {object} params
 * @param {object} params.dbHelper Database helper instance.
 * @param {string} params.tableName Table name.
 * @param {object|Array} params.data Data to insert (single object or array).
 */
export const insertTestData = async ({
	dbHelper,
	tableName,
	data,
}) => {
	try {
		const isArray = Array.isArray(data);
		const records = isArray ? data : [data];
		
		for (const record of records) {
			const columns = Object.keys(record);
			const values = Object.values(record);
			const placeholders = columns.map(() => '?').join(',');
			const columnList = columns.map(() => '??').join(',');
			
			const sql = `INSERT INTO ?? (${columnList}) VALUES (${placeholders})`;
			const params = [tableName, ...columns, ...values];
			
			await dbHelper.query(sql, params);
		}
		
		console.log(`Inserted ${records.length} record(s) into ${tableName}`);
		return records;
	} catch (error) {
		console.error(`Insert failed for ${tableName}:`, error);
		throw new Error(`Insert failed: ${error.message}`);
	}
};

/**
 * Validate phone number format (basic international format).
 */
export const validatePhoneFormat = ({ phone }) => {
	const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
	return phoneRegex.test(phone?.trim());
};

/**
 * Validate URL format.
 */
export const validateUrlFormat = ({ url }) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

/**
 * Validate date format (YYYY-MM-DD).
 */
export const validateDateFormat = ({ date, format = 'YYYY-MM-DD' }) => {
	if (format === 'YYYY-MM-DD') {
		return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
	}
	return false;
};

/**
 * Deep compare two objects for equality.
 */
export const deepEqual = ({ actual, expected }) => {
	return JSON.stringify(actual) === JSON.stringify(expected);
};

/**
 * Assert objects are deeply equal.
 */
export const assertDeepEqual = ({ actual, expected }) => {
	if (!deepEqual({ actual, expected })) {
		console.log('Expected:', expected);
		console.log('Actual:', actual);
		throw new Error('Objects are not deeply equal');
	}
};

/**
 * Filter object array by multiple conditions.
 * @param {object} params
 * @param {Array} params.data Array of objects to filter.
 * @param {object} params.conditions Key-value pairs to match.
 */
export const filterDataByConditions = ({ data, conditions }) => {
	return data.filter((item) =>
		Object.entries(conditions).every(([key, value]) => item[key] === value)
	);
};

/**
 * Group array of objects by a specific key.
 */
export const groupDataByKey = ({ data, key }) => {
	return data.reduce((acc, item) => {
		const groupKey = item[key];
		if (!acc[groupKey]) {
			acc[groupKey] = [];
		}
		acc[groupKey].push(item);
		return acc;
	}, {});
};

/**
 * Extract specific fields from array of objects.
 */
export const extractFields = ({ data, fields }) => {
	return data.map((item) =>
		fields.reduce((acc, field) => {
			acc[field] = item[field];
			return acc;
		}, {})
	);
};

/**
 * Log test step with timestamp and status.
 */
export const logTestStep = ({
	step,
	status = 'INFO',
	data = null,
}) => {
	const timestamp = new Date().toISOString();
	const message = `[${timestamp}] [${status}] ${step}`;
	console.log(message);
	if (data) {
		console.log('Data:', JSON.stringify(data, null, 2));
	}
};

/**
 * Compare two arrays ignoring order.
 */
export const compareArraysIgnoreOrder = ({ actual, expected }) => {
	if (actual.length !== expected.length) return false;
	return expected.every((item) => actual.includes(item));
};

/**
 * Assert arrays are equal ignoring order.
 */
export const assertArraysEqualIgnoreOrder = ({ actual, expected }) => {
	if (!compareArraysIgnoreOrder({ actual, expected })) {
		console.log('Expected (any order):', expected);
		console.log('Actual:', actual);
		throw new Error('Arrays are not equal (ignoring order)');
	}
};

/** Grouped default export for all helper functions. */
const helpers = {
	sleep,
	getEnv,
	generateRandomNumber,
	generateRandomString,
	generateUniqueId,
	generateRandomEmail,
	formatDate,
	getCurrentDate,
	navigateTo,
	waitForPageReady,
	waitForUrlContains,
	click,
	clearAndType,
	typeText,
	pressKey,
	selectDropdown,
	setCheckbox,
	isVisible,
	waitForClickable,
	waitForElementInteractable,
	waitForDisplayed,
	getText,
	scrollIntoView,
	scrollToBottom,
	uploadFile,
	toAbsolutePath,
	readJsonFile,
	writeJsonFile,
	takeScreenshot,
	waitForRequest,
	waitForResponse,
	waitForNavigationAfterAction,
	assertStatus,
	assertVisible,
	assertHidden,
	assertEnabled,
	assertDisabled,
	assertText,
	assertContainsText,
	assertValue,
	assertAttribute,
	assertClassContains,
	assertChecked,
	assertUnchecked,
	assertCount,
	assertUrl,
	assertTitle,
	assertEqual,
	assertNotEqual,
	assertContains,
	assertTruthy,
	assertFalsy,
	assertGreaterThan,
	assertLessThan,
	apiGet,
	apiPost,
	apiPut,
	apiDelete,
	safeJsonParse,
	retry,
	runStep,
	allureStep,
	allureEpicLabel,
	allureFeatureLabel,
	allureDisplayName,
	allureStoryLabel,
	allureSeverity,
	allureTestCase,
	allureDescription,
	allureScreenshot,
	allureTag,
	allureBrowser,
	validateResponseBodyValue,
	validateGetResponseStatusCode,
	validatePostResponseStatusCode,
	validateDeleteResponseStatusCode,
	getDbRowCount,
	findNullValuesInRows,
	getNonNullRows,
	assertDbRowCount,
	assertNoNullValues,
	assertNonNullRows,
	findDuplicateValues,
	assertUniqueColumnValues,
	validateEmailFormat,
	assertEmailFormat,
	validateForeignKeyIntegrity,
	assertOrderTotals,
	retryWithBackoff,
	queryDbWithRetry,
	cleanupDbData,
	insertTestData,
	validatePhoneFormat,
	validateUrlFormat,
	validateDateFormat,
	deepEqual,
	assertDeepEqual,
	filterDataByConditions,
	groupDataByKey,
	extractFields,
	logTestStep,
	compareArraysIgnoreOrder,
	assertArraysEqualIgnoreOrder,
	runAccessibilityScan,
	runAccessibilityAuditorScan,
	accessibilityResults,
};

export default helpers;
