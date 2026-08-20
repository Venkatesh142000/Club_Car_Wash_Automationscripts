import { getText, click, setCheckbox, clearAndType, scrollIntoView,isVisible } from '../../utils/helpers.js';

export default class RetailWashPage {

    constructor(page) {
        this.page = page;
        
        //Page Headers
        this.title = page.locator("div[title='Retail Washes']");
        this.showInactiveCheckbox = page.getByRole('checkbox',{name:'Show Inactive'});
        this.searchInput = this.page.getByRole('textbox', {name: 'Search',exact: true});        
        this.newRetailWashButton = page.getByRole('button', { name: 'New Retail Wash' });

        //Retail Wash Details
        this.retailWashNameInput = page.getByRole('textbox', { name: 'Retail Wash Name' });
        this.WashTypeDropdown = page.locator("//label[@for='washTypeUuid']/following::button[@role='combobox'][1]");
        this.statusDropdown = page.locator("//label[@for='skuStatus']/following::button[@role='combobox'][1]");

        //Pricing details
        this.priceInput = page.getByPlaceholder('Price');
        this.taxableDropdown = page.locator('#taxable');

        //Terms and Conditions
        this.termsandConditionsInput = page.locator(".lexical-paragraph");
        
        //Create Retail Wash Button
        this.createRetailWashButton = page.getByRole('button', { name: 'Create Retail Wash' });

        //Create and Update Success Message
        this.successMessage = page.getByTestId('message-component');

        //Retail Washes List
        this.allRetailWashlist = page.getByRole('button', { name: 'All Retail Washes' });
        this.deleteRetailWashButton = page.getByRole('button', {name : 'Delete Retail Wash'});
        this.confirmDeleteRetailWashButton = page.getByRole('button',{name : 'Delete Retail Wash SKU'});

    }

    // Page Header Methods
    async verifyPageTitle() {
        await isVisible({locator:this.title});
    }

    async toggleShowInactiveCheckbox() {
        await scrollIntoView({locator:this.showInactiveCheckbox});
        await click({locator:this.showInactiveCheckbox});
    }

    async isShowInactiveChecked() {
        return await this.showInactiveCheckbox.isChecked();
    }

    async searchRetailWash(searchText) {
        await clearAndType({locator:this.searchInput, value:searchText});
    }

    async clearSearch() {
        await this.searchInput.clear();
    }

    async clickNewRetailWashButton() {
        await click({locator:this.newRetailWashButton}); // Wait for the Retail Wash Name input to be visible
    }

    // Retail Wash Details Methods
    async fillRetailWashName(name) {
        await clearAndType({locator:this.retailWashNameInput, value:name});
    }

    async fillRetailWashType(washname) {
        await click({locator:this.retailWashNameInput});
        await click({locator:this.page.getByRole('option', { name: washname, exact: true })});
    }

    async selectWashType(washType) {
        await click({locator:this.WashTypeDropdown}); // Close the dropdown after selection
        await click({locator:this.page.getByRole('option', {name: washType,exact: true})});
    }

    async selectStatus(status) {
        await click({locator:this.statusDropdown}); // Close the dropdown after selection
        await click({locator:this.page.getByRole('option', {name: status,exact: true})});
    }

    // Pricing Details Methods
    async fillPrice(price) {
        await clearAndType({locator:this.priceInput, value:price});
    }

    async selectTaxableOption(option) {
        await click({locator:this.taxableDropdown}); // Close the dropdown after selection
        await click({locator:this.page.getByRole('option', {name: option,exact: true})})
    }

    // Terms and Conditions Methods
    async fillTermsAndConditions(text) {
        await this.termsandConditionsInput.fill(text);
    }

    async getTermsAndConditions() {
        return await this.termsandConditionsInput.textContent();
    }

    async deleteRetailWash(){
        await click({locator:this.deleteRetailWashButton});
        await click({locator:this.confirmDeleteRetailWashButton});
    }

    // Create Retail Wash Methods
    async clickCreateRetailWashButton() {
        await click({locator:this.createRetailWashButton}); // Wait for the Retail Wash Name input to be visible
    }

    async isCreateButtonEnabled() {
        return await this.createRetailWashButton.isEnabled();
    }

    // Complete Retail Wash Creation
    async createRetailWash(retailWashData) {
        await this.fillRetailWashName(retailWashData.name);
        await this.selectWashType(retailWashData.washType);
        await this.selectStatus(retailWashData.status);
        await this.fillPrice(retailWashData.price);
        await this.selectTaxableOption(retailWashData.taxable);
        if (retailWashData.termsAndConditions) {
            await this.fillTermsAndConditions(retailWashData.termsAndConditions);
        }
        await this.clickCreateRetailWashButton();
    }

    async clickAllRetailWashesList(){
        await click({locator:this.allRetailWashlist});
    }
}
