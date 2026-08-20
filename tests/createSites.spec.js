import {test,expect} from '../fixtures/baseFixture.js'

test('Site Creation',async({loginPage,topNavigation,sitesPage,randomData})=>{

    await topNavigation.openSites();
    await sitesPage.clickNewSiteButton();
    await sitesPage.enterSiteId(randomData.randomAlphaNumericName);
    await sitesPage.enterSiteName(randomData.randomName);
    await sitesPage.selectSiteType('Test');
    await sitesPage.enterAddress1(randomData.randomAddress);
    await sitesPage.enterAddress2(randomData.randomAddress);
    await sitesPage.enterCity(randomData.randomCity);
    await sitesPage.selectState('Alabama');
    await sitesPage.enterZipCode(randomData.randomZipCode);
    await sitesPage.clickCreateSiteButton();
    await expect(sitesPage.successMessage).toContainText('Site successfully created.');
})

test('Create Site Details', async({loginPage,topNavigation,sitesPage , randomData})=>{

    await topNavigation.openSites();
    await sitesPage.clickNewSiteButton();
    
    // Enter site details
    await sitesPage.enterSiteId(randomData.randomAlphaNumericName);
    await sitesPage.enterSiteName(randomData.randomName);
    await sitesPage.selectSiteType('Test');
    await sitesPage.enterAddress1(randomData.randomAddress);
    await sitesPage.enterAddress2(randomData.randomAddress);
    await sitesPage.enterCity(randomData.randomCity);
    await sitesPage.selectState('New York');
    await sitesPage.enterZipCode(randomData.randomZipCode);
    
    // Optional: Enter payment details if needed
    await sitesPage.enterMerchantId(randomData.randomAlphaNumericName);
    await sitesPage.enterMerchantUsername(randomData.randomName);
    
    // Create the site
    await sitesPage.clickCreateSiteButton();
    await expect(sitesPage.successMessage).toContainText('Site successfully created.');
})

test('Update Site Details', async({loginPage,topNavigation,sitesPage , randomData})=>{

    // First, create a site
    await topNavigation.openSites();
    await sitesPage.clickNewSiteButton();
    
    const sitename = randomData.randomName;
    await sitesPage.enterSiteId(randomData.randomAlphaNumericName);
    await sitesPage.enterSiteName(sitename);
    await sitesPage.selectSiteType('Test');
    await sitesPage.enterAddress1(randomData.randomAddress);
    await sitesPage.enterAddress2(randomData.randomAddress);
    await sitesPage.enterCity(randomData.randomCity);
    await sitesPage.selectState('Massachusetts');
    await sitesPage.enterZipCode(randomData.randomZipCode);
    await sitesPage.clickCreateSiteButton();
    await expect(sitesPage.successMessage).toContainText('Site successfully created.');

    // Click on the site to open details
    await sitesPage.clickEditSiteDetailsSection();
    
    // Update site details
    await sitesPage.enterSiteName(`Updated ${sitename}`);
    await sitesPage.enterAddress1(randomData.randomAddress);
    await sitesPage.enterCity(randomData.randomCity);
    await sitesPage.enterZipCode(randomData.randomZipCode);
    
    // Save changes by clicking create/update button
    await sitesPage.saveEditSiteDetails();
    await expect(sitesPage.successMessage).toContainText('Site successfully updated.');
})

test('Delete Site', async({loginPage,topNavigation,sitesPage , randomData})=>{

    // First, create a site to delete
    await topNavigation.openSites();
    await sitesPage.clickNewSiteButton();
    
    const sitename = randomData.randomName;
    await sitesPage.enterSiteId(randomData.randomAlphaNumericName);
    await sitesPage.enterSiteName(sitename);
    await sitesPage.selectSiteType('Test');
    await sitesPage.enterAddress1(randomData.randomAddress);
    await sitesPage.enterAddress2(randomData.randomAddress);
    await sitesPage.enterCity(randomData.randomCity);
    await sitesPage.selectState('California');
    await sitesPage.enterZipCode(randomData.randomZipCode);
    await sitesPage.clickCreateSiteButton();
    await expect(sitesPage.successMessage).toContainText('Site successfully created.');
    
    // Delete the site
    await sitesPage.deleteCreatedSite();
    await expect(sitesPage.successMessage).toContainText('Site successfully deleted.');
})