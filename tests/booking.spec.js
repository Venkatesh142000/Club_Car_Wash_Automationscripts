import { test ,expect} from '../fixtures/baseFixture.js';

test('Booking Flow',async({loginPage,productPage,addToCartPage,checkOutPage,cust_details})=>{
    
    await loginPage.goto()
    await loginPage.login(process.env.username, process.env.password);

    await productPage.addBackPackToCart();
    await productPage.addOnesieToCart();
    await productPage.addFleeceJacketToCart();
    await productPage.clickCartIcon();

    await addToCartPage.removeProductOnesie();
    await addToCartPage.clickCheckout();

    await checkOutPage.enterformDetails(cust_details.firstName,cust_details.lastName,cust_details.postalCode);
    await checkOutPage.clickContinue();
    await checkOutPage.clickFinish();
    const isOrderSuccess = await checkOutPage.orderSuccessPage();
    expect(isOrderSuccess).toBe(true);
    
})