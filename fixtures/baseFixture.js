import { test as base } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";

export const test = base.extend({
	

	
	loginPage:async({page,isMobile},use)=>{

		const loginpage=new LoginPage(page, isMobile)
		await use(loginpage)
	},

	
});

export const expect = test.expect;
