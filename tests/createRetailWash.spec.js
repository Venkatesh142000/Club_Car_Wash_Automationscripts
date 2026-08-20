import {test, expect} from '../fixtures/baseFixture.js';

test('Verify Retail Washes page components are displayed', async ({loginPage,topNavigation,leftNavigation,retailWashPage }) => {

    // Login through fixture

    // Navigate
    await topNavigation.openCatalog();
    await leftNavigation.openRetailWashes();

    // Page Header
    await expect(retailWashPage.title).toBeVisible();

    // Search Components
    await expect(retailWashPage.showInactiveCheckbox).toBeVisible();
    await expect(retailWashPage.searchInput).toBeVisible();
    await expect(retailWashPage.searchButton).toBeVisible();

    // Action Button
    await expect(retailWashPage.newRetailWashButton).toBeVisible();
});

test('Login + Create Retail Wash and Delete Retail Wash', async ({loginPage, topNavigation, leftNavigation, retailWashPage, randomData}) => {

   // Login through fixture

    await topNavigation.openCatalog();
    await leftNavigation.openRetailWashes();

    await retailWashPage.clickNewRetailWashButton();

    const retailWashName = `E2E RetailWash ${randomData.randomGroupName} ${Date.now()}`;

    await retailWashPage.fillRetailWashName(retailWashName);
    await retailWashPage.selectWashType(randomData.randomWashType);
    await retailWashPage.selectStatus('Active');
    await retailWashPage.fillPrice(randomData.randomNumber);
    await retailWashPage.selectTaxableOption('Yes');
    await retailWashPage.fillTermsAndConditions('These are the terms and conditions for the Test Retail Wash.');

    expect(await retailWashPage.isCreateButtonEnabled()).toBeTruthy();
    await retailWashPage.clickCreateRetailWashButton();    
    await retailWashPage.page.waitForLoadState('networkidle');
    await expect(retailWashPage.successMessage).toContainText('Retail Wash SKU successfully created');
    await retailWashPage.clickAllRetailWashesList();

    // Find and open created retail wash
    await retailWashPage.clearSearch();
    await retailWashPage.searchRetailWash(retailWashName);
    await retailWashPage.page.waitForTimeout(1000);
    const createdRow = retailWashPage.page.locator('table tbody tr').filter({ hasText: retailWashName }).first();
    await expect(createdRow).toBeVisible();
    await createdRow.click();

    // Delete and verify
    await retailWashPage.deleteRetailWash();
    await expect(retailWashPage.successMessage).toContainText('Retail Wash SKU successfully deleted.');

    await retailWashPage.clearSearch();
    await retailWashPage.searchRetailWash(retailWashName);
    await retailWashPage.page.waitForTimeout(1000);
    const postDeleteRow = retailWashPage.page.locator('table tbody tr').filter({ hasText: retailWashName });
    await expect(postDeleteRow).toHaveCount(0);

});

test.skip('Login + Create 500 Retail Washes', async ({ loginPage, topNavigation, leftNavigation, retailWashPage }) => {
    test.setTimeout(0);

    await topNavigation.openCatalog();
    await leftNavigation.openRetailWashes();

    const washTypes = ['ROOKIE', 'VIP', 'ELITE', 'MVP'];

    for (let i = 0; i <= 500; i++) {

        await retailWashPage.clickNewRetailWashButton();

        // Unique Retail Wash Name
        const retailWashName = `AVR ${i}`;

        // Rotate through wash types
        const washType = washTypes[(i - 1) % washTypes.length];

        // Price: 1.00 to 500.00
        const price = i.toFixed(2);

        await retailWashPage.fillRetailWashName(retailWashName);
        await retailWashPage.selectWashType(washType);
        await retailWashPage.selectStatus('Active');
        await retailWashPage.fillPrice(price);
        await retailWashPage.selectTaxableOption('Yes');
        await retailWashPage.fillTermsAndConditions(
            `These are the terms and conditions for ${retailWashName}.`
        );

        await retailWashPage.clickCreateRetailWashButton();

        // Wait for creation to complete before creating the next record
        await retailWashPage.page.waitForLoadState('networkidle');

        await retailWashPage.clickAllRetailWashesList();
    }
});
