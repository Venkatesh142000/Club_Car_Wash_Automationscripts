import { click, clearAndType, selectDropdown, setCheckbox, scrollIntoView, waitForDisplayed } from '../../utils/helpers.js';

export class Sites {
    constructor(page) {
        this.page = page;

        // View Sites
        this.title = page.getByRole('heading', { name: 'Sites' });
        this.showInactiveCheckbox = page.getByRole('checkbox', { name: 'Show Inactive' });
        this.searchInput = page.getByPlaceholder('Search name, site code, or location');
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.columnSiteName = page.getByRole('columnheader', { name: 'Site Name' });
        this.columnSiteId = page.getByRole('columnheader', { name: 'Site ID' });
        this.columnLocation = page.getByRole('columnheader', { name: 'Location' });
        this.columnStatus = page.getByRole('columnheader', { name: 'Status' });
        this.tableRows = page.locator('table tbody tr');

        // New Site Creation
        this.newSiteButton = page.getByRole('button', { name: 'New Site' });
        this.siteIdInput = page.getByLabel('Site ID');
        this.siteNameInput = page.getByLabel('Site Name');
        this.siteTypeDropdown = page.getByLabel('Site Type');
        this.addressInput1 = page.locator('#street1');
        this.addressInput2 = page.locator('#street2');
        this.cityInput = page.locator('#city');
        this.stateDropdown = page.locator('#region');
        this.zipCodeInput = page.locator('#postalCode');
        this.merchantIdInput = page.locator('#paymentMerchantId');
        this.merchantUsernameInput = page.locator('#paymentMerchantUsername');

        this.createSiteButton = page.getByRole('button', { name: 'Create Site' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });

        //Create and Update Success Message
        this.successMessage = page.getByTestId('message-component');

        //Delete Site
        this.deleteActionDropdown = page.getByRole('button',{name:'Action'});
        this.deleteSiteOption = page.getByRole('menuitem',{name:'Delete Site'});
        this.confirmDeleteSite = page.getByRole('Button',{name:'Delete Site'});
        this.cancelConfirmDelete = page.getByRole('button',{name:'Cancel'});

        //Edit
        this.editSiteDetails = page.getByTestId('site-details-card');
        this.saveEditDetails = page.getByTestId('save-button');
        this.editPayments = page.getByTestId('site-payments-card');
    }

    async isTitleVisible() {
        return await this.title.isVisible();
    }

    async toggleShowInactive(checked = true) {
        await setCheckbox({ locator: this.showInactiveCheckbox, checked });
    }

    async searchSite(searchText) {
        await clearAndType({ locator: this.searchInput, value: searchText });
        await click({ locator: this.searchButton });
    }

    async getSiteRowCount() {
        return await this.tableRows.count();
    }

    async clickNewSiteButton() {
        await click({ locator: this.newSiteButton });
    }

    async enterSiteId(value) {
        await clearAndType({ locator: this.siteIdInput, value });
    }

    async enterSiteName(value) {
        await clearAndType({ locator: this.siteNameInput, value });
    }

    async selectSiteType(type) {
        await click({ locator: this.siteTypeDropdown });
        await click({ locator: this.page.getByRole('option', { name: type }) });
    }

    async enterAddress1(value) {
        await clearAndType({ locator: this.addressInput1, value });
    }

    async enterAddress2(value) {
        await clearAndType({ locator: this.addressInput2, value });
    }

    async enterCity(value) {
        await clearAndType({ locator: this.cityInput, value });
    }

    async selectState(state) {
        await click({ locator: this.stateDropdown });
        await click({ locator: this.page.getByRole('option', { name: state }) });
    }

    async enterZipCode(value) {
        await clearAndType({ locator: this.zipCodeInput, value });
    }

    async enterMerchantId(value) {
        await clearAndType({ locator: this.merchantIdInput, value });
    }

    async enterMerchantUsername(value) {
        await clearAndType({ locator: this.merchantUsernameInput, value });
    }

    async clickCreateSiteButton() {
        await scrollIntoView({ locator: this.createSiteButton });
        await click({ locator: this.createSiteButton });
    }

    async clickCancelButton() {
        await click({ locator: this.cancelButton });
    }

    async deleteCreatedSite(){
        await click({locator:this.deleteActionDropdown});
        await click({locator:this.deleteSiteOption});
        await click({locator:this.confirmDeleteSite});
    }

    async clickEditSiteDetailsSection(){
        await click({locator:this.editSiteDetails});
    }

    async clickEditSitePaymentsSection(){
        await click({locator:this.editPayments});
    }
    async saveEditSiteDetails(){
        await click({locator:this.saveEditDetails})
    }
}