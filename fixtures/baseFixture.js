import { test as base } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

export const test = base.extend({
	authenticatedPage: async ({ page, isMobile }, use) => {
		const loginPage = new LoginPage(page, isMobile);

		// BEFORE TEST
		await loginPage.goto();
		// await loginPage.login();

		await use(page);

		// AFTER TEST
		console.log("Test completed");
	},
});

export const expect = test.expect;
