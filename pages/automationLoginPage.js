import helpers from "../utils/helpers.js";
import testData from "../fixtures/data/testData.json" with { type: "json" };


export default class AutomationExerciseLoginPage{

 constructor(page, isMobile = false)
 {
    this.page = page;
    this.isMobile = isMobile;
    this.loginLink=page.locator('a[href="/login"]');
    this.emailInput=page.locator('input[data-qa="login-email"]');
    this.passwordInput=page.locator('input[data-qa="login-password"]');

    this.loginButton=page.locator('button[data-qa="login-button"]');

    this.user=page.locator("i[class*='fa fa-user']");

    this.message=page.locator("input[type='password']+p");
   
 }


 async goto() {
		const baseUrl = helpers.getEnv({ key: "BASE_URL" }).trim();
		if (!baseUrl) {
			throw new Error("BASE_URL is not set. Configure it in Jenkins or your local environment before running tests.");
		}

		await this.page.goto(baseUrl);
	}

    async fillLoginForm(email,password)
    {

    
      await this.loginLink.click();
      await  this.emailInput.fill(email);
      await  this.passwordInput.fill(password);
      
      await this.loginButton.click();

    

    }

    async validateSuccessfulLogin()

    {

         await helpers.assertVisible({ locator: this.user });

    }

    async validateErrorMessage()
    {

        await helpers.assertText({ locator: this.message, text: "Your email or password is incorrect!" });
    }




}