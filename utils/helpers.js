import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import * as allure from "allure-js-commons";

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
	expect(value).toBeTruthy();
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
};

export default helpers;
