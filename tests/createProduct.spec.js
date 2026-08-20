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

    await productsPage.clickNewProductButton();

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



test.only('Login + Create Gift Card Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage , randomData}) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for this test
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await productsPage.clickNewProduct();
    await productsPage.fillProductName('Smoke Product');
    await productsPage.selectProductType('Gift Card');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.fillFixedPrice('Yes');
    await productsPage.fillGiftCardPrice(randomData.randomWholeNumber);
    await productsPage.fillGiftCardMaxValue(randomData.randomWholeNumber);
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await productsPage.clickAllProducts();
});

test.only('Login + Create Prepaid Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for this test
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await productsPage.clickNewProduct();
    await productsPage.fillProductName('Smoke Prepaid Product');
    await productsPage.selectProductType('Prepaid');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.selectRetailWashType('ROOKIE');
    await productsPage.selectFixedQuantity('No');
   // await productsPage.selectTaxableOption('Yes');
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await productsPage.clickAllProducts();
});

test.only('Login + Create Merchandise Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage , randomData }) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for this test
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await productsPage.clickNewProduct();
    await productsPage.fillProductName('Smoke Merchandise Product');
    await productsPage.selectProductType('Merchandise');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.fillMerchandisePrice(randomData.randomWholeNumber);
   // await productsPage.selectMerchandiseTaxable('Yes');
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await productsPage.clickAllProducts();
});

test.only('Login + Create Tip Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for this test
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await productsPage.clickNewProduct();
    await productsPage.fillProductName('Smoke Tip Product');
    await productsPage.selectProductType('Tip');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await productsPage.clickAllProducts();
});

test.only('Login + Create Donation Product @smoke', async ({ loginPage, topNavigation, leftNavigation, productsPage }) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for this test
    await topNavigation.openCatalog();
    await leftNavigation.openProducts();

    await productsPage.clickNewProduct();
    await productsPage.fillProductName('Smoke Donation Product');
    await productsPage.selectProductType('Donation');
   // await productsPage.selectProductStatus('Active'); //bydefault it is active
    await productsPage.clickCreateProductButton();

    await productsPage.page.waitForLoadState('networkidle');
    await productsPage.clickAllProducts();
});
