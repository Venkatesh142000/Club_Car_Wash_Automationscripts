import { test, expect } from '../fixtures/baseFixture.js';
import helpers from '../utils/helpers.js';
import { createAccountPayloads, validatePayload } from '../utils/createAccountPayloadBuilder.js';

// Creates an account through the API, validates UI login for the new user,
// then deletes the account and confirms the user can no longer log in.
test('Create account with custom data', async ({ page, apiClient, automationLoginPage }) => {

    await helpers.allureFeatureLabel('Automation Exercise - API + UI');
    await helpers.allureStoryLabel('Create account, login validation, and cleanup');
    await helpers.allureSeverity('critical');
    await helpers.allureDescription('Creates a user via API, validates UI login, deletes user via API, and verifies login failure after deletion.');

    try {
        await helpers.allureStep('Generate dynamic account payload');

        const payload = createAccountPayloads.fakerData();

        const response = await apiClient.post('createAccount', payload, true);

        await helpers.allureStep('Validate create-account API status code');
        await helpers.validatePostResponseStatusCode(response.status(), page);
        await automationLoginPage.goto();
        await helpers.runAccessibilityScan(page);
        await helpers.allureStep('Login with newly created account');
        await automationLoginPage.fillLoginForm(payload.email, payload.password);
        await automationLoginPage.validateSuccessfulLogin();
        const deleteAccount = await apiClient.delete('deleteAccount', { email: payload.email, password: payload.password }, true);

        await helpers.allureStep('Validate delete-account API status code');
        await helpers.validateDeleteResponseStatusCode(deleteAccount.status(), page);

        await automationLoginPage.goto();
        await helpers.allureStep('Validate deleted account can no longer log in');
        await automationLoginPage.fillLoginForm(payload.email, payload.password);
        await automationLoginPage.validateErrorMessage();
        await helpers.allureScreenshot({ page }, 'Account lifecycle validation snapshot');
    } catch (error) {
        await helpers.allureScreenshot({ page }, 'Failure - Create account with custom data');
        throw error;
    }



})

// Compares product data returned by the API with the first three products shown in the UI
// to verify product names and prices stay consistent across both layers.
test('Validate the Get All Product List', async ({ page, apiClient, automationLoginPage, automationHomePage }) => {

    await helpers.allureFeatureLabel('Automation Exercise - API + UI');
    await helpers.allureStoryLabel('Validate products API against UI');
    await helpers.allureSeverity('normal');
    await helpers.allureDescription('Fetches products from API and validates the first three product names and prices against the UI.');

    try {
        await helpers.allureStep('Fetch products from API');


        const response = await apiClient.get('productsList');
        await helpers.validateGetResponseStatusCode(response.status(), page);

        const responseBody = await response.json();


        const apiProducts = responseBody.products.slice(0, 3);
        const apiNames = apiProducts.map(p => p.name);
        const apiPrices = apiProducts.map(p => String(p.price));

    await automationHomePage.goto();
    await automationHomePage.NavigateToProductsPage();
    await helpers.runAccessibilityScan(page);

        const uiNames = await automationHomePage.compareFirstThreeProductNames(apiNames);
        const uiPrices = await automationHomePage.compareFirstThreeProductPrices(apiPrices);
        await helpers.allureScreenshot({ page }, 'Products list comparison snapshot');
    } catch (error) {
        await helpers.allureScreenshot({ page }, 'Failure - Validate the Get All Product List');
        throw error;
    }

})

// Verifies the brand list returned by the API matches the first three brand names
// displayed on the Products page in the UI.
test('Validate the Get All The Brands', async ({ page, apiClient, automationHomePage }) => {

    await helpers.allureFeatureLabel('Automation Exercise - API + UI');
    await helpers.allureStoryLabel('Validate brands API against UI');
    await helpers.allureSeverity('normal');
    await helpers.allureDescription('Fetches brands from API and validates the first three brands against the UI brand list.');

    try {
        await helpers.allureStep('Fetch brands from API');

        const response = await apiClient.get('brandsList');
        await helpers.validateGetResponseStatusCode(response.status(), page);
        const responseBody = await response.json();

    const apiBrands = responseBody.brands.slice(0, 3).map(b => b.brand);
    console.log('API - First 3 Brands:', apiBrands);

    await automationHomePage.goto();
    await automationHomePage.NavigateToProductsPage();
    await helpers.runAccessibilityScan(page);

    const uiBrands = await automationHomePage.compareFirstThreeBrands(apiBrands);
    console.log('UI - First 3 Brands:', uiBrands);

})



