import { test, expect } from '../fixtures/baseFixture.js';
import helpers from '../utils/helpers.js';
import { createAccountPayloads, validatePayload } from '../utils/createAccountPayloadBuilder.js';




test('Create account with custom data', async({page, apiClient, automationLoginPage})=>{

    const payload = createAccountPayloads.fakerData();
    
    const response = await apiClient.post('createAccount', payload, true);

   await helpers.validatePostResponseStatusCode(response.status());
   await automationLoginPage.goto();
    await helpers.runAccessibilityAuditorScan(page);
   await automationLoginPage.fillLoginForm(payload.email, payload.password);
   await automationLoginPage.validateSuccessfulLogin();
   const deleteAccount = await apiClient.delete('deleteAccount', { email: payload.email, password: payload.password }, true);

   await helpers.validateDeleteResponseStatusCode(deleteAccount.status());

  await automationLoginPage.goto();
   await automationLoginPage.fillLoginForm(payload.email, payload.password);
    await automationLoginPage.validateErrorMessage();
   


})

test('Validate the Get All Product List',async({page, apiClient, automationLoginPage, automationHomePage})=>{

   
    const response = await apiClient.get('productsList');
    await helpers.validateGetResponseStatusCode(response.status());

    const responseBody = await response.json();

    
    const apiProducts = responseBody.products.slice(0, 3);
    const apiNames = apiProducts.map(p => p.name);
    const apiPrices = apiProducts.map(p => String(p.price));

    await automationHomePage.goto();
    await automationHomePage.NavigateToProductsPage();
    await helpers.runAccessibilityAuditorScan(page);

    const uiNames = await automationHomePage.compareFirstThreeProductNames(apiNames);
    const uiPrices = await automationHomePage.compareFirstThreeProductPrices(apiPrices);

})

test('Validate the Get All The Brands',async({page, apiClient, automationHomePage})=>{

    const response = await apiClient.get('brandsList');
    await helpers.validateGetResponseStatusCode(response.status());
    const responseBody = await response.json();

    const apiBrands = responseBody.brands.slice(0, 3).map(b => b.brand);
    console.log('API - First 3 Brands:', apiBrands);

    await automationHomePage.goto();
    await automationHomePage.NavigateToProductsPage();
    await helpers.runAccessibilityAuditorScan(page);

    const uiBrands = await automationHomePage.compareFirstThreeBrands(apiBrands);
    console.log('UI - First 3 Brands:', uiBrands);

})



