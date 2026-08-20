import { getText, click, setCheckbox, clearAndType, scrollIntoView } from '../../utils/helpers.js';

export default class AddonsListPage {

    constructor(page) {

        this.page = page;

        //Page Headers
        this.pageTitle = page.locator("h1[title='Add-ons']");
        this.showInactiveCheckbox = page.getByRole('checkbox',{name:'Show Inactive'});
        this.searchInput = this.page.getByRole('textbox', {name: 'Search',exact: true});
        this.newAddonButton = page.getByRole('button', { name: 'New Add-on' });

        //Table Headers and Rows
        this.addonNameHeader = page.getByText('Add-On Name');
        this.priceHeader = page.getByText('Price',{ exact: true }); //page.locator('th').filter({ hasText: 'Price' });
        this.statusHeader = page.getByText('Status');
        this.componentHeader = page.locator('table tbody tr');

        //Create Add On
        this.addonNameInput = page.getByPlaceholder('Add-On Name');
        this.addonComponentDropdown = page.getByRole('combobox', { name: 'Component *' });
        this.addonStatusDropdown = page.getByRole('combobox', { name: 'Status' });
        
        this.priceInput = page.getByRole('textbox', { name: 'Price' });
        this.taxabledropdown = page.getByRole('combobox', { name: 'Taxable *' });
        this.schedulePriceCheckbox = page.getByRole('checkbox', { name: 'Schedule Price Change' });
        this.schedulePriceInput = page.getByRole('textbox', { name: 'Scheduled Price' });
        this.effectiveDateInput = page.getByRole('button', { name: 'Effective Date' });
        this.createAddonButton = page.getByRole('button', { name: 'Create Add-on' });
        
        //Create and Update Success Message
        this.successMessage = page.getByTestId('message-component');

        //Back to addon list
        this.allAddOns = page.getByRole('button',{name:'All Add-ons'});
        this.deleteAddonButton = page.getByRole('button',{name:'Delete Add-on'});
        this.confirmDeleteButton = page.getByRole('button',{name:'Delete Add-on SKU'});
        this.cancelDeleteButton = page.getByRole('button',{name:'Cancel'});

        //Edit Add-on
        this.editAddonDetailsButton = page.getByTestId('add-on-details-card');
        this.editAddonPricingButton = page.getByTestId('add-on-pricing-card');
        this.saveChangesButton = page.getByRole('button',{name:'Save'});
    }

    // Page Header Methods
    async getPageTitle() {
        return await getText({locator:this.pageTitle});
    }

    async toggleShowInactive() {
        await click({locator:this.showInactiveCheckbox});
    }

    async isShowInactiveChecked() {
        return await setCheckbox({locator:this.showInactiveCheckbox, checked:true});
        
    }

    // Search Methods
    async searchAddon(searchText) {
        await clearAndType({locator:this.searchInput, value:searchText});
    }

    async searchAndFilterAddon(searchText) {
        await this.searchAddon(searchText);
        await this.clickSearchButton();
    }

    async clearSearchInput() {
        await this.searchInput.clear();
    }

    // New Add-on Button
    async clickNewAddonButton() {
        await click({locator:this.newAddonButton});
    }

    // Table Header Methods
    async getAddonNameHeaderText() {
        return await this.addonNameHeader.textContent();
    }

    async getPriceHeaderText() {
        return await this.priceHeader.textContent();
    }

    async getStatusHeaderText() {
        return await this.statusHeader.textContent();
    }

    // Table Row Methods
    async getTableRowCount() {
        return await this.componentHeader.count();
    }

    async getTableRows() {
        return await this.componentHeader.all();
    }

    // Create Add-on Form Methods
    async fillAddonName(name) {
        await clearAndType({locator:this.addonNameInput, value:name});
    }

    async getAddonNameValue() {
        return await this.addonNameInput.inputValue();
    }

    async selectAddonComponent(componentName) {
        await click({locator:this.addonComponentDropdown});
        await click({locator:this.page.getByRole('option', { name: componentName })});
    }

    async selectAddonStatus(status) {
        await click({locator:this.addonStatusDropdown});
        await click({locator:this.page.getByRole('option', { name: status })});
    }

    async getAddonStatusValue() {
        return await this.addonStatusDropdown.inputValue();
    }

    // Price Methods
    async fillPrice(price) {
        await clearAndType({locator:this.priceInput, value:price});
    }

    async getPriceValue() {
        return await this.priceInput.inputValue();
    }

    // Taxable Methods
    async selectTaxable(taxableOption) {
        await click({locator:this.taxabledropdown});
        await click({locator:this.page.getByRole('option', { name: taxableOption })});
    }

    async getTaxableValue() {
        return await this.taxabledropdown.inputValue();
    }

    // Schedule Price Methods
    async toggleSchedulePrice() {
        await click({locator:this.schedulePriceCheckbox});
    }

    async isSchedulePriceChecked() {
        return await this.schedulePriceCheckbox.isChecked();
    }

    async fillScheduledPrice(price) {
        await clearAndType({locator:this.schedulePriceInput, value:price});
    }

    async getScheduledPriceValue() {
        return await this.schedulePriceInput.inputValue();
    }

    // Effective Date Methods
    async clickEffectiveDate() {
        await click({locator:this.effectiveDateInput});
    }

    async setEffectiveDate(date) {
        await click({locator:this.effectiveDateInput});
        await clearAndType({locator:this.effectiveDateInput, value:date});
        // Note: Date picker interaction may need adjustment based on actual picker UI
    }

    // Complete Form Submission Methods
    async fillAddonForm(addonData) {
        await this.fillAddonName(addonData.name);
        await this.selectAddonComponent(addonData.component);
        await this.fillPrice(addonData.price);
        await this.selectTaxable(addonData.taxable);
        if (addonData.status) {
            await this.selectAddonStatus(addonData.status);
        }
    }

    async fillAddonFormWithScheduledPrice(addonData) {
        await this.fillAddonForm(addonData);
        await this.toggleSchedulePrice();
        if (addonData.scheduledPrice) {
            await this.fillScheduledPrice(addonData.scheduledPrice);
        }
        if (addonData.effectiveDate) {
            await this.setEffectiveDate(addonData.effectiveDate);
        }
    }

    async clickCreateAddonButton() {
       await scrollIntoView({locator:this.createAddonButton});
       await click({locator:this.createAddonButton});
    }

    async clickAllAddOnsList(){
        await click({locator:this.allAddOns});
    }

    async clickDeleteAddonButton(){
        await click({locator:this.deleteAddonButton});
    }

    async clickConfirmDeleteButton(){
        await click({locator:this.confirmDeleteButton});
    }   

    async clickCancelDeleteButton(){
        await click({locator:this.cancelDeleteButton});
    }

    async clickEditAddonDetailsButton(){
        await click({locator:this.editAddonDetailsButton});

    }

    async clickEditAddonPricingButton(){
        await click({locator:this.editAddonPricingButton});
    }

    async clickSaveChangesButton(){
        await click({locator:this.saveChangesButton});
    }

    // New explicit Edit mode methods
    async openEditAddonDetails(){
        await click({locator:this.editAddonDetailsButton});
    }

    async updateAddonName(name){
        await clearAndType({locator:this.addonNameInput, value:name});
    }

    async updateAddonPrice(price){
        await clearAndType({locator:this.priceInput, value:price});
    }

    async saveEditChanges(){
        await click({locator:this.saveChangesButton});
    }

    async cancelEditChanges(){
        await click({locator:this.cancelDeleteButton});
    }

    // New explicit Delete mode methods (wrappers around existing actions)
    async openDeleteConfirmation(){
        await click({locator:this.deleteAddonButton});
    }

    async confirmDelete(){
        await click({locator:this.confirmDeleteButton});
    }

    async cancelDelete(){
        await click({locator:this.cancelDeleteButton});
    }

    async isSuccessMessageVisible() {
        return await this.successMessage.isVisible();
    }
}