export default class LoginPage{
 
    constructor(page){
        this.page = page;
        this.username = page.getByRole('textbox',{name:'name@example.com'});
        this.ssobutton = page.getByRole('button',{name:'SSO'});
        this.password = page.getByPlaceholder('Password');
        this.signin = page.getByRole('button',{name:'Sign in'});
        this.yesButton = page.getByRole('button', { name: 'Yes' });

    }

    async goto(){
        await this.page.goto(process.env.BASE_URL);
    }

    async enterUsername(){
        await this.username.fill(process.env.username);
        await this.ssobutton.click();
    }

    async enterPassword(){
        await this.password.fill(process.env.password);
        await this.signin.click();
    }

    async handleStaySignedIn() {
        try {
            await this.yesButton.waitFor({ state: 'visible', timeout: 10000 });
            await this.yesButton.click();
        } catch {}
    }

    async waitForSitesPage() {
        await this.page.waitForURL('**/sites');
    }

}