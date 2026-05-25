import { test as base } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";
import AddToCart from "../pages/addToCartPage.js";
import CheckOut from "../pages/checkOutPage.js"
import Products from "../pages/productsPage.js"
import {generateCheckoutCustomer} from "../utils/fakerHelper.js";

export const test = base.extend({
	

	
	loginPage:async({page,isMobile},use)=>{

		const loginpage=new LoginPage(page, isMobile)
		await use(loginpage)
	},

	addToCartPage:async({page,isMobile},use)=>{


		const addtoCartPage=new AddToCart(page,isMobile)
		await use(addtoCartPage);


	},
	checkOutPage:async({page,isMobile},use)=>{

		const checkoutPage=new CheckOut(page,isMobile)
		await use(checkoutPage);
	},
	productPage:async({page,isMobile},use)=>{

		const productPage=new Products(page,isMobile)
		await use(productPage)
	},

	cust_details : async({page,isMobile},use)=>{
		const cust_details = generateCheckoutCustomer()
		await use(cust_details)
	}
	
});

export const expect = test.expect;
