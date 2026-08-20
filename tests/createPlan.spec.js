import {test,expect} from '../fixtures/baseFixture.js';

test('Verify Plans page components are displayed', async ({ loginPage,topNavigation,leftNavigation,plansPage}) => {

    // Login through fixture

    // Navigate
    await topNavigation.openCatalog();
    await leftNavigation.openPlans();

    // Page Header
    await expect(plansPage.title).toBeVisible();

    // Search Section
    await expect(plansPage.showInactiveCheckbox).toBeVisible();
    await expect(plansPage.searchInput).toBeVisible();
    await expect(plansPage.searchButton).toBeVisible();

    // Action Button
    await expect(plansPage.newPlanButton).toBeVisible();

    // Table Headers
    await expect(plansPage.planNameHeader).toBeVisible();
    await expect(plansPage.plantypeHeader).toBeVisible();
    await expect(plansPage.reloadTypeHeader).toBeVisible();
    await expect(plansPage.periodHeader).toBeVisible();
    await expect(plansPage.unitQuantityHeader).toBeVisible();

    
});

test('Login + Create Time-Based Plan',async({loginPage,topNavigation,leftNavigation,plansPage,randomData})=>{
  
    //Login happens through Fixture

    await topNavigation.openCatalog();
    await leftNavigation.openPlans();
    await plansPage.clickNewPlanButton();

    const planName = `E2E Plan ${randomData.randomName} ${Date.now()}`;
    const price = randomData.randomNumber;

    await plansPage.enterPlanName(planName);
    await plansPage.selectPlanType('Time-Based');
    await plansPage.selectWashType(randomData.randomWashType);
    await plansPage.selectSignatureType('Yes');
    await plansPage.selectStatus('Active');
    await plansPage.enterPlanPeriod(randomData.randomWholeNumber);
   // await plansPage.selectAutoRecharge('Yes')  
   // await plansPage.selectWashLimitPeriod('Plan Duration')   
    await plansPage.enterWashPerLimit(randomData.randomWholeNumber);
    await plansPage.enterPrice(price);
   // await plansPage.selectTaxable('Yes')
    await plansPage.enterTermsAndConditions('These are the terms and conditions for the Test Plan.');
    await plansPage.clickCreatePlanButton();
    await expect(plansPage.successMessage).toContainText('Plan SKU successfully created');
});

test('Create Time-Based Plan + Edit Plan', async ({ loginPage, topNavigation, leftNavigation, plansPage, randomData }) => {

    test.setTimeout(0); // Disable timeout for this test
    await topNavigation.openCatalog();
    await leftNavigation.openPlans();

    // Create
    await plansPage.clickNewPlanButton();
    const planName = `E2E Plan ${randomData.randomName} ${Date.now()}`;
    const price = randomData.randomNumber;

    await plansPage.enterPlanName(planName);
    await plansPage.selectPlanType('Time-Based');
    await plansPage.selectWashType(randomData.randomWashType);
    await plansPage.selectSignatureType('Yes');
    await plansPage.selectStatus('Active');
    await plansPage.enterPlanPeriod(randomData.randomWholeNumber);
    // await plansPage.selectAutoRecharge('Yes');
    // await plansPage.selectWashLimitPeriod('Plan Duration');
    await plansPage.enterWashPerLimit(randomData.randomWholeNumber);
    await plansPage.enterPrice(price);
    // await plansPage.selectTaxable('Yes');
    await plansPage.enterTermsAndConditions('Terms for E2E plan.');
    await plansPage.clickCreatePlanButton();
    await plansPage.page.waitForLoadState('networkidle');
    await expect(plansPage.successMessage).toContainText('Plan SKU successfully created');
    await plansPage.clickAllPlansList();

    // Open created plan
    await plansPage.searchPlan(planName);
    await plansPage.page.waitForTimeout(1000);
    const createdRow = plansPage.page.locator('table tbody tr').filter({ hasText: planName }).first();
    await expect(createdRow).toBeVisible();
    await createdRow.click();

    // Edit
    const editedName = planName + ' - Edited';
    const editedPrice = randomData.randomNumber;
    await plansPage.clickEditPlanDetails();
    await plansPage.enterPlanName(editedName);
    await plansPage.saveEditChanges();
    await expect(plansPage.successMessage).toContainText('Plan SKU successfully updated.');

    // Verify edit
    await plansPage.searchPlan(editedName);
    await plansPage.page.waitForTimeout(1000);
    const editedRow = plansPage.page.locator('table tbody tr').filter({ hasText: editedName }).first();
    await expect(editedRow).toBeVisible();

});

test.only('Create Time-Based Plan + Delete Plan', async ({ loginPage, topNavigation, leftNavigation, plansPage, randomData }) => {

    test.setTimeout(0);
    await topNavigation.openCatalog();
    await leftNavigation.openPlans();

    // Create
    await plansPage.clickNewPlanButton();
    const planName = `E2E Delete Plan ${randomData.randomName} ${Date.now()}`;
    await plansPage.enterPlanName(planName);
    await plansPage.selectPlanType('Time-Based');
    await plansPage.selectWashType(randomData.randomWashType);
    await plansPage.selectSignatureType('Yes');
    await plansPage.selectStatus('Active');
    await plansPage.enterPlanPeriod(randomData.randomWholeNumber);
    //await plansPage.selectAutoRecharge('Yes');
    //await plansPage.selectWashLimitPeriod('Plan Duration');
    await plansPage.enterWashPerLimit(randomData.randomWholeNumber);
    await plansPage.enterPrice(randomData.randomNumber);
    //await plansPage.selectTaxable('Yes');
    await plansPage.enterTermsAndConditions('Terms for delete test.');
    await plansPage.clickCreatePlanButton();
    await plansPage.page.waitForLoadState('networkidle');
    await expect(plansPage.successMessage).toContainText('Plan SKU successfully created');
    await plansPage.clickAllPlansList();

    // Open created plan
    await plansPage.searchPlan(planName);
    await plansPage.page.waitForTimeout(1000);
    const createdRow = plansPage.page.locator('table tbody tr').filter({ hasText: planName }).first();
    await expect(createdRow).toBeVisible();
    await createdRow.click();

    // Delete
    await plansPage.deletePlan();
    await expect(plansPage.successMessage).toContainText('Plan successfully deleted.');

    // Verify deletion
    await plansPage.searchPlan(planName);
    await plansPage.page.waitForTimeout(1000);
    const postDeleteRow = plansPage.page.locator('table tbody tr').filter({ hasText: planName });
    await expect(postDeleteRow).toHaveCount(0);

});

    test('Login + Create Unit-Based Plan',async({loginPage,topNavigation,leftNavigation,plansPage , randomData})=>{
  
    //Login happens through Fixture

    await topNavigation.openCatalog()
    await leftNavigation.openPlans()
    await plansPage.clickNewPlanButton()

    const planName = `E2E Plan ${randomData.randomName} ${Date.now()}`;

    await plansPage.enterPlanName(planName)
    await plansPage.selectPlanType('Unit Based')
    await plansPage.selectWashType(randomData.randomWashType)
    await plansPage.selectSignatureType('Yes')
    await plansPage.selectStatus('Active')
    await plansPage.enterUnitQuantity(randomData.randomWholeNumber)
   
    await plansPage.enterPrice(randomData.randomNumber)
   // await plansPage.selectTaxable('Yes')
    await plansPage.enterTermsAndConditions('These are the terms and conditions for the Test Plan.')
    await plansPage.clickCreatePlanButton()
    await expect(plansPage.successMessage).toContainText('Plan SKU successfully created');
});

test.skip('Create 500 Plans with dynamic data', async ({loginPage,topNavigation,leftNavigation,plansPage , randomData}) => {

    test.setTimeout(0);

    await topNavigation.openCatalog();
    await leftNavigation.openPlans();

    const washTypes = ['ROOKIE', 'VIP', 'ELITE', 'MVP'];

    for (let i = 307; i <= 372; i++) {

        await plansPage.clickNewPlanButton();

        // 1. Plan Name (unique each time)
        const planName = `Auto Plan ${i}`;

        // 2. Random wash type
        const washType = washTypes[Math.floor(Math.random() * washTypes.length)];

        // 3. Wash limit (2–9)
        const washLimit = Math.floor(Math.random() * 8) + 2;

        // 4. Price (1–500)
        const price = Math.floor(Math.random() * 500) + 1;

        // Fill fields
        await plansPage.enterPlanName(planName);
        await plansPage.selectPlanType('Time-Based')
        await plansPage.selectWashType(washType);
        await plansPage.selectSignatureType('Yes')
        await plansPage.selectStatus('Active')
        await plansPage.enterPlanPeriod('12')
        await plansPage.selectAutoRecharge('Yes')
        await plansPage.selectWashLimitPeriod('Plan Duration')
        await plansPage.enterWashPerLimit(washLimit);
        await plansPage.enterPrice(price);
        await plansPage.selectTaxable('Yes')
        await plansPage.enterTermsAndConditions('These are the terms and conditions for the Test Plan.')
        await plansPage.clickCreatePlanButton() 

        // Better than waitForTimeout
        await plansPage.page.waitForLoadState('networkidle');

        await plansPage.clickAllPlansList(); // Navigate back to the list of plans
    }

});