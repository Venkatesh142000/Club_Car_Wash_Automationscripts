import { test ,expect} from '../fixtures/baseFixture.js';
import LoginPage from "../pages/loginPage.js";
import ProductsPage from "../pages/productsPage.js";
import AddToCartPage from "../pages/addToCartPage.js";
import CheckOutPage from "../pages/checkOutPage.js";

test('Booking Flow',async({loginPage,productPage,addToCartPage,checkOutPage,cust_deatils})=>{
    
    await loginPage.goto()
	await loginPage.login(process.env.username, process.env.password);

    await productPage.addBackPackToCart();
    await productPage.addOnesieToCart();
    await productPage.addFleeceJacketToCart();
    await productPage.clickCartIcon();

    await addToCartPage.removeProductOnesie();
    await addToCartPage.clickCheckout();

    await checkOutPage.enterformDetails(cust_deatils.firstName,cust_deatils.lastName,cust_deatils.postalCode);
    await checkOutPage.clickContinue();
    await checkOutPage.clickFinish();
    const isOrderSuccess = await checkOutPage.orderSuccessPage();
    expect(isOrderSuccess).toBe(true);
    
})