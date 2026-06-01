import { expect } from "../fixtures/baseFixture.js";
import helpers from "../utils/helpers.js";
import testData from "../testData.json" with { type: "json" };


export default class LoginPage {
	constructor(page, isMobile = false) {
		this.page = page;
		this.isMobile = isMobile;
		this.usernameInput = page.locator("#user-name");
		this.passwordInput = page.locator("#password");
		this.loginButton = page.locator("#login-button");
		this.signInLink = page.locator("text=Sign In | New Account");
		this.signInBtn_Mobile = page.locator("text=Sign In");
		this.hamburger = page.locator(".bm-burger-button");
		this.createAccountText = page.locator("h1:has-text('CREATE ACCOUNT')");
		this.fieldRequiredText = page.locator("text=This field is required.");
		this.messageError=page.locator("h3[data-test='error']");
	}

	async goto() {
		const baseUrl = helpers.getEnv({ key: "BASE_URL" }).trim();
		if (!baseUrl) {
			throw new Error("BASE_URL is not set. Configure it in Jenkins or your local environment before running tests.");
		}

		await this.page.goto(baseUrl);
	}

	async login(username, password) {
		await this.usernameInput.fill(username);
		await this.passwordInput.fill(password);
		await this.loginButton.click();
	}

	async validateerrorMessage()
	{

		const messageText = (await this.messageError.textContent())?.trim() ?? "";

		helpers.assertEqual({
			actual: messageText,
			expected: testData.invalidLoginMessage.message,
		});
		


	}

	
}
