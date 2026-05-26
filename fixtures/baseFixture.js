import { test as base } from "@playwright/test";
import LoginPage from "../pages/loginPage.js";
import AddToCart from "../pages/addToCartPage.js";
import CheckOut from "../pages/checkOutPage.js"
import Products from "../pages/productsPage.js"
import {generateCheckoutCustomer} from "../utils/fakerHelper.js";
import {ApiBase} from '../Api/BaseLayer.js';
import { ApiClient } from '../Api/clientLayer.js';
import { PayloadBuilder } from '../utils/payLoadBuilder.js';

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
	},

apiContext: async (_, use) => {
		const context = await ApiBase.createAPIContext();
		try {
			await use(context);
		} finally {
			await context.dispose();
		}
	},

  apiClient: async ({ apiContext }, use) => {
    const client = new ApiClient(apiContext);
    await use(client);
  },

  payLoader: async (_, use) => {
    const payLoader = new PayloadBuilder();
    await use(payLoader);
  },

	
});

export const expect = test.expect;
