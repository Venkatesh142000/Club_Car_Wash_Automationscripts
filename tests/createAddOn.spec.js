import {test,expect} from '../fixtures/baseFixture.js'

test('Verify Add-Ons page components are displayed @smoke', async ({loginPage,topNavigation,leftNavigation,addOnsPage }) => {

    // Login happens fixture

    // Navigate to Add-Ons page
    await topNavigation.openCatalog();
    await leftNavigation.openAddOns();

    // Page Header
    await expect(addOnsPage.pageTitle).toBeVisible();

    // Search Section
    await expect(addOnsPage.showInactiveCheckbox).toBeVisible();
    await expect(addOnsPage.searchInput).toBeVisible();
    await expect(addOnsPage.searchInput).toBeEnabled();

    // Action Buttons
    await expect(addOnsPage.newAddonButton).toBeVisible();

    // Table Headers
    await expect(addOnsPage.addonNameHeader).toBeVisible();
    await expect(addOnsPage.priceHeader).toBeVisible();
    await expect(addOnsPage.statusHeader).toBeVisible();

    // Verify at least one row exists (optional)
    await expect(addOnsPage.componentHeader.first()).toBeVisible();
});


test('Verify New Add-On form opens@smoke', async ({ loginPage,topNavigation,leftNavigation,addOnsPage}) => {

    await topNavigation.openCatalog();
    await leftNavigation.openAddOns();

    await addOnsPage.clickNewAddonButton();

    await expect(addOnsPage.addonNameInput).toBeVisible();
    await expect(addOnsPage.addonComponentDropdown).toBeVisible();
    await expect(addOnsPage.priceInput).toBeVisible();
    await expect(addOnsPage.taxabledropdown).toBeVisible();
    await expect(addOnsPage.createAddonButton).toBeVisible();
});

test('Verify Add-On table is displayed@smoke', async ({ loginPage,topNavigation,leftNavigation,addOnsPage }) => {

    await topNavigation.openCatalog();
    await leftNavigation.openAddOns();

    const rowCount = await addOnsPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
});


test.only('Login + Create Add-On',async({loginPage,topNavigation,leftNavigation,addOnsPage,randomData})=>{
  
    await topNavigation.openCatalog()
    await leftNavigation.openAddOns()
    await addOnsPage.clickNewAddonButton()
    
    const addonName = `E2E Addon ${randomData.randomName} ${Date.now()}`;
    await addOnsPage.fillAddonName(addonName);
    await addOnsPage.selectAddonComponent(randomData.randomAddonComponent);
    await addOnsPage.fillPrice(randomData.randomNumber);
    await addOnsPage.clickCreateAddonButton();
    await addOnsPage.page.waitForLoadState('networkidle');
    await expect(addOnsPage.successMessage).toContainText('Add-On Wash SKU successfully created');
    await addOnsPage.clickAllAddOnsList();
});

test('Login + Create Add-On with Schedule Price',async({loginPage,topNavigation,leftNavigation,addOnsPage ,randomData})=>{
  
    await topNavigation.openCatalog()
    await leftNavigation.openAddOns()
    await addOnsPage.clickNewAddonButton()
    
    const addonName = `E2E Addon ${randomData.randomName} ${Date.now()}`;
    await addOnsPage.fillAddonName(addonName)
    await addOnsPage.selectAddonComponent(randomData.randomAddonComponent);
    await addOnsPage.fillPrice(randomData.randomNumber);
    await addOnsPage.toggleSchedulePrice();
    await addOnsPage.fillScheduledPrice(randomData.randomNumber)
    await addOnsPage.clickCreateAddonButton()
    await expect(addOnsPage.successMessage).toContainText('Add-On Wash SKU successfully created');
});

test('Create + Edit Add-On', async ({ loginPage, topNavigation, leftNavigation, addOnsPage, randomData }) => {

    await topNavigation.openCatalog();
    await leftNavigation.openAddOns();

    // Create
    await addOnsPage.clickNewAddonButton();
    const addonName = `E2E Addon ${randomData.randomName} ${Date.now()}`;
    await addOnsPage.fillAddonName(addonName);
    await addOnsPage.selectAddonComponent(randomData.randomAddonComponent);
    await addOnsPage.fillPrice(randomData.randomNumber);
    await addOnsPage.clickCreateAddonButton();
    await addOnsPage.page.waitForLoadState('networkidle');
    await expect(addOnsPage.successMessage).toContainText('Add-On Wash SKU successfully created');
    await addOnsPage.clickAllAddOnsList();

    // Open created add-on
    await addOnsPage.clearSearchInput();
    await addOnsPage.searchAddon(addonName);
    await addOnsPage.page.waitForTimeout(1000);
    const createdRow = addOnsPage.page.locator('table tbody tr').filter({ hasText: addonName }).first();
    await expect(createdRow).toBeVisible();
    await createdRow.click();

    // Edit details using page object methods
    const editedName = addonName + ' - Edited';
    const editedPrice = randomData.randomNumber;
    await addOnsPage.openEditAddonDetails();
    await addOnsPage.updateAddonName(editedName);
    await addOnsPage.saveEditChanges();
    await expect(addOnsPage.successMessage).toContainText('Add-On Wash SKU successfully updated.');

    // Verify edit persisted
    await addOnsPage.searchAddon(editedName);
    await addOnsPage.page.waitForTimeout(1000);
    const editedRow = addOnsPage.page.locator('table tbody tr').filter({ hasText: editedName }).first();
    await expect(editedRow).toBeVisible();

});

test('Create + Delete Add-On', async ({ loginPage, topNavigation, leftNavigation, addOnsPage, randomData }) => {

    await topNavigation.openCatalog();
    await leftNavigation.openAddOns();

    // Create
    await addOnsPage.clickNewAddonButton();
    const addonName = `E2E Delete Addon ${randomData.randomName} ${Date.now()}`;
    await addOnsPage.fillAddonName(addonName);
    await addOnsPage.selectAddonComponent(randomData.randomAddonComponent);
    await addOnsPage.fillPrice(randomData.randomNumber);
    await addOnsPage.clickCreateAddonButton();
    await addOnsPage.page.waitForLoadState('networkidle');
    await expect(addOnsPage.successMessage).toContainText('Add-On Wash SKU successfully created');
    await addOnsPage.clickAllAddOnsList();

    // Open created add-on
    await addOnsPage.clearSearchInput();
    await addOnsPage.searchAddon(addonName);
    await addOnsPage.page.waitForTimeout(1000);
    const createdRow = addOnsPage.page.locator('table tbody tr').filter({ hasText: addonName }).first();
    await expect(createdRow).toBeVisible();
    await createdRow.click();

    // Delete using page object methods
    await addOnsPage.openDeleteConfirmation();
    await addOnsPage.confirmDelete();
    await addOnsPage.page.waitForTimeout(2000);

    // Verify deletion
    await addOnsPage.clearSearchInput();
    await addOnsPage.searchAddon(addonName);
    await addOnsPage.page.waitForTimeout(1000);
    const postDeleteRow = addOnsPage.page.locator('table tbody tr').filter({ hasText: addonName });
    await expect(postDeleteRow).toHaveCount(0);

});

test.skip('Login + Create 500 Add-Ons', async ({loginPage,topNavigation,leftNavigation,addOnsPage}) => {
    test.setTimeout(0);

    await topNavigation.openCatalog();
    await leftNavigation.openAddOns();

    const addonComponents = [
        'Tire Shine',
        'Extra Roller',
        'Top Brush',
        'Tire Brush',
        'Full Grill Retract',
        'Full Retract',
        'Hitch Retract',
        'Open Bed',
        'Sienna van'
    ];


    for (let i = 97; i <= 350; i++) {

        await addOnsPage.clickNewAddonButton();

        const addonName = `Test Add-On ${i}`;
        const component = addonComponents[(i - 1) % addonComponents.length];
        const price = i.toFixed(2); // 1.00, 2.00, 3.00 ... 500.00

        await addOnsPage.fillAddonName(addonName);
        await addOnsPage.selectAddonComponent(component);
        await addOnsPage.fillPrice(price);

        await addOnsPage.clickCreateAddonButton();
        await addOnsPage.page.waitForLoadState('networkidle');
        await addOnsPage.clickAllAddOnsList();

    
    }
});