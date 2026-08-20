import { test, expect } from '../fixtures/baseFixture.js';

test('Verify Products page components are displayed @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {

    // Login happens via fixture

    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await expect(productsPage.pageTitle).toBeVisible();
    await expect(productsPage.showInactiveCheckbox).toBeVisible();
    await expect(productsPage.searchInput).toBeVisible();
    await expect(productsPage.newProductButton).toBeVisible();

    await expect(productsPage.productNameHeader).toBeVisible();
    await expect(productsPage.type).toBeVisible();
    await expect(productsPage.priceHeader).toBeVisible();
    await expect(productsPage.statusHeader).toBeVisible();

    await expect(productsPage.tableRows.first()).toBeVisible();
});

test('Verify New Product form opens @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await productsPage.clickNewProduct();

    await expect(productsPage.productNameInput).toBeVisible();
    await expect(productsPage.productTypeDropdown).toBeVisible();
    await expect(productsPage.productStatusDropdown).toBeVisible();
    await expect(productsPage.createProductButton).toBeVisible();
});

test('Verify Products table is displayed @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    const rowCount = await productsPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
});



test('Login + Create Gift Card Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage , randomData}) => {
    
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    const giftCardName = `Gift Card - ${randomData.randomName} ${Date.now()}`;

    await productsPage.clickNewProduct();
    await productsPage.fillProductName(giftCardName);
    await productsPage.selectProductType('Gift Card');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.fillFixedPrice('Yes');
    await productsPage.fillGiftCardPrice(randomData.randomWholeNumber);
    await productsPage.fillGiftCardMaxValue(randomData.randomWholeNumber);
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await expect(productsPage.successMessage).toContainText('Product SKU successfully created.');
    await productsPage.clickAllProducts();
});

test('Login + Create Prepaid Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage , randomData}) => {
    
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    const prePaidName = `Prepaid - ${randomData.randomName} ${Date.now()}`;

    await productsPage.clickNewProduct();
    await productsPage.fillProductName(prePaidName);
    await productsPage.selectProductType('Prepaid');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.selectRetailWashType('ROOKIE');
    await productsPage.selectFixedQuantity('No');
   // await productsPage.selectTaxableOption('Yes');
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await expect(productsPage.successMessage).toContainText('Product SKU successfully created.');
    await productsPage.clickAllProducts();
});

test('Login + Create Merchandise Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage , randomData }) => {
    
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    const merchandiseName = `Prepaid - ${randomData.randomName} ${Date.now()}`;
    
    await productsPage.clickNewProduct();
    await productsPage.fillProductName(merchandiseName);
    await productsPage.selectProductType('Merchandise');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.fillMerchandisePrice(randomData.randomWholeNumber);
   // await productsPage.selectMerchandiseTaxable('Yes');
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await expect(productsPage.successMessage).toContainText('Product SKU successfully created.');
    await productsPage.clickAllProducts();
});

test('Login + Create Tip Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    const tipName = `Tip - ${randomData.randomName} ${Date.now()}`;

    await productsPage.clickNewProduct();
    await productsPage.fillProductName(tipName);
    await productsPage.selectProductType('Tip');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await expect(productsPage.successMessage).toContainText('Product SKU successfully created.');
    await productsPage.clickAllProducts();
});

test('Login + Create Donation Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    const donationName = `Donation - ${randomData.randomName} ${Date.now()}`;

    await productsPage.clickNewProduct();
    await productsPage.fillProductName(donationName);
    await productsPage.selectProductType('Donation');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.clickCreateProductButton();
    await expect(productsPage.successMessage).toContainText('Product SKU successfully created.');

    await productsPage.page.waitForLoadState('networkidle');
    await productsPage.clickAllProducts();
});
