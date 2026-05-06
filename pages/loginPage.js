import { expect } from "../fixtures/baseFixture.js";
import { assertText, click, getEnv, waitForNavigationAfterAction } from "../utils/helpers.js";
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
	}

	async goto() {

    	console.log(getEnv({ key: "BASE_URL" }))
		await this.page.goto(getEnv({ key: "BASE_URL" }));
	}

	async login(username, password) {
		await this.usernameInput.fill(username);
		await this.passwordInput.fill(password);
		await this.loginButton.click();
	}
}
