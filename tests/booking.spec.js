import { test } from '../fixtures/baseFixture.js';
import LoginPage from "../pages/loginPage.js";
import ProductsPage from "../pages/productsPage.js";
import AddToCartPage from "../pages/addToCartPage.js";
import CheckOutPage from "../pages/checkOutPage.js";

test('Booking Flow',async({page})=>{
     test.setTimeout(60000);
    const loginPage = new LoginPage(page);
    await loginPage.goto()
	await loginPage.login(process.env.username, process.env.password);

    const plp = new ProductsPage(page);
    await plp.addBackPackToCart();
    await plp.addOnesieToCart();
    await plp.addFleeceJacketToCart();
    await plp.clickCartIcon();

    const cart = new AddToCartPage(page);
    await cart.removeProductOnesie();
    await cart.clickCheckout();

    const checkout = new CheckOutPage(page);
    await checkout.enterformDetails('Test','T','345433');
    await checkout.clickContinue();
    await checkout.clickFinish();
    await checkout.orderSuccessPage();
    
})