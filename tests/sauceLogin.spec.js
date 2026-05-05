import { test, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

test("KAN-2 - Verify that the user is able to login with valid credentials", async ({
	authenticatedPage: page,
	isMobile,
}) => {
	const loginPage = new LoginPage(page);
	await loginPage.login(process.env.username, process.env.password);
	await expect(page).toHaveURL(/inventory/);
});
