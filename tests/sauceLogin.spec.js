import { test, expect } from "../fixtures/baseFixture.js";
// import LoginPage from "../pages/loginPage.js";
test.describe("Sauce Labs Login Functionality", () => {
test("KAN-2 - Verify that the user is able to login with valid credentials", async({ page, isMobile, loginPage }) => {
	// const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.login(process.env.username, process.env.password);
	await expect(page).toHaveURL(/inventory/);
});

test("KAN-8 - Verify that the user is not able to login with invalid credentials", async({isMobile,loginPage}) => {
	// const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.login("invalid_user", "invalid_password");
	await expect(loginPage.fieldRequiredText).toBeVisible();
})
});