// @ts-check
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
// dotenv.config();
dotenv.config({ quiet: true });
const DESKTOP_VIEWPORT = { width: 1728, height: 972 };
const RETRY = Number.parseInt(process.env.RETRY ?? "0", 10);
const RETRIES = Number.isInteger(RETRY) && RETRY >= 0 ? RETRY : 0;
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests",
	timeout: 500000,
	// globalTeardown: "./updateTestResults.js",
	/* Run tests in files in parallel */
	// fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry count for both local and CI (value read from RETRY in .env) */
	retries: RETRIES,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
		reporter: [
		["allure-playwright"],
		["junit", { outputFile: "results.xml" }],
		["html", { open: "never" }],
	],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('')`. */
		baseURL: process.env.BASE_URL,
		// HTTP Basic auth credentials for the test environment (avoid embedding in URL)
		// httpCredentials: {
		// 	username: process.env.username,
		// 	password: process.env.password
		// },
		headless: !!process.env.CI,
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: {
				browserName: "chromium",
				viewport: null,
				launchOptions: {
					args: ["--start-maximized"],
				},
			},
		},

		{
			name: "firefox",
			use: {
				browserName: "firefox",
				viewport: DESKTOP_VIEWPORT,
			},
		},

		{
			name: "webkit",
			use: {
				browserName: "webkit",
				viewport: DESKTOP_VIEWPORT,
			},
		},

		{
			name: "android",
			use: {
				...devices["Pixel 5"],
			},
		},

		{
			name: "iphone",
			use: {
				...devices["iPhone 13"],
			},
		},

		{
			name: "ipad",
			use: {
				...devices["iPad (gen 11)"],
			},
		},

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		// 	name: "Mobile Safari",
		// 	use: { ...devices["iPhone 12"] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	// webServer: {
	//   command: 'npm run start',
	//   url: 'http://localhost:3000',
	//   reuseExistingServer: !process.env.CI,
	// },
});
