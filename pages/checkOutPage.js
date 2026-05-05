import { expect } from '@playwright/test';

export default class CheckOut{

    constructor(page){
        this.page = page;
        this.firstname = page.locator('#first-name');
        this.lastname = page.locator('#last-name');
        this.zipcode = page.locator('#postal-code');
        this.cancel = page.getByRole('button',{name:'Go back Cancel'});
        this.continue = page.getByRole('button',{name:'Continue'});

        this.finish = page.getByRole('button',{name:'Finish'});
        this.backHome = page.getByRole('button',{name:'Back Home'});
    }

    async enterformDetails(first_name,last_name,zip_code){
       await this.firstname.fill(first_name);
       await this.lastname.fill(last_name);
       await this.zipcode.fill(zip_code);
    }

    async clickCancel(){
       await this.cancel.click();
    }

    async clickContinue(){
       await this.continue.click();
    }

    async clickFinish(){
        await this.finish.click();
    }

    async orderSuccessPage(){
        await expect(this.backHome).toBeVisible();
    }
}