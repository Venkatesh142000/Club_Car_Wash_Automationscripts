import { getText, click, setCheckbox, clearAndType, scrollIntoView } from '../../utils/helpers.js';

export default class PlansListPage {

    constructor(page) {
        this.page = page;

        //Page Headers
        this.title = page.locator("div[title='Plans']");
        this.showInactiveCheckbox = page.getByRole('checkbox',{name:'Show Inactive'});
        this.searchInput = this.page.getByRole('textbox', {name: 'Search',exact: true});        
        this.newPlanButton = page.getByRole('button', { name: 'New Plan' });

        //Table Headers and Rows
        this.planNameHeader = page.getByRole('columnheader', { name: 'Plan Name' });
        this.plantypeHeader = page.getByRole('columnheader', { name: 'Plan Type' });
        this.reloadTypeHeader = page.getByRole('columnheader', { name: 'Reload Type' });
        this.periodHeader = page.getByRole('columnheader', { name: 'Period' });
        this.unitQuantityHeader = page.getByRole('columnheader', { name: 'Unit Quantity' });
        this.statusTableHeader = page.getByRole('columnheader', { name: 'Status' });

        //Create Plan , Plan Details
        this.planNameInput = page.getByPlaceholder('Plan Name');
        this.planTypeDropdown = page.locator("//label[@for='planType']/following::button[@role='combobox'][1]");
        this.washTypeDropdown = page.locator("//label[@for='washTypeUuid']/following::button[@role='combobox'][1]");
        this.signatureTypeDropdown = page.locator("//label[@for='signatureRequired']/following::button[@role='combobox'][1]");
        this.statusHeader = page.locator("//label[@for='skuStatus']/following::button[@role='combobox'][1]");

        //Plan Structure for Time Based Types
        this.planPeriodInput = page.locator('input[name="numberOfPeriods"]');
        this.autoRechargeDropdown = page.locator("//label[normalize-space()='Auto Recharge']/following::button[@role='combobox'][1]");
        this.washLimitPeriodDropdown = page.locator("//label[normalize-space()='Wash Limit Period']/following::button[@role='combobox'][1]");
        this.washPerLimitInput = page.locator("input[name='washLimitPerWashPeriod']");

        //Plan Structure for Unit Based Types
        this.unitQuantityHeader = page.locator('#numberOfWashes');

        //Pricing details
        this.priceInput = page.getByPlaceholder('Price');
        this.taxableDropdown = page.locator('#taxable');

        //Terms and Conditions
        this.termsandConditionsInput = page.locator(".lexical-paragraph");

        //Create Plan Button
        this.createPlanButton = page.getByRole('button', { name: 'Create Plan' });

        //Create and Update Success Message
        this.successMessage = page.getByTestId('message-component');

        //Back to allPlans list
        this.allPlans = page.getByRole('button',{name:'All Plans'});
        this.deletePlanButton = page.getByRole('button',{name:'Delete Plan'});
        this.confirmDeleteButton = page.getByRole('button',{name:'Delete Plan SKU'});
        this.cancelDeleteButton = page.getByRole('button',{name:'Cancel'});

        //Edit Plan
        this.editPlanDetailsButton = page.getByTestId('plan-details-card');
        this.saveChangesButton = page.getByRole('button',{name:'Save'});
    }

    // Page Header Methods
    async verifyPageTitle() {
        return await this.title.isVisible();
    }

    async toggleShowInactive() {
        await scrollIntoView({locator:this.showInactiveCheckbox});
        await click({locator:this.showInactiveCheckbox});
    }

    async searchPlan(planName) {
        await clearAndType({locator:this.searchInput, value:planName});
    }

    async clickNewPlanButton() {
        await click({locator:this.newPlanButton});
    }

    // Table Header Methods
    async verifyTableHeaders() {
        const headers = [
            this.planNameHeader,
            this.plantypeHeader,
            this.reloadTypeHeader,
            this.periodHeader,
            this.unitQuantityHeader,
            this.statusTableHeader
        ];
        
        for (const header of headers) {
            if (!await header.isVisible()) {
                return false;
            }
        }
        return true;
    }

    // Plan Details Methods
    async enterPlanName(planName) {
        await clearAndType({locator:this.planNameInput, value:planName});
    }

    async selectPlanType(planType) {
        await click({locator:this.planTypeDropdown});
        await click({locator:this.page.getByRole('option', { name: planType })});
    }

    async selectWashType(washType) {
        await click({locator:this.washTypeDropdown}); // Close the dropdown after selection
        await click({locator:this.page.getByRole('option', { name: washType })});
    }

    async selectSignatureType(signatureType) {
        await click({locator:this.signatureTypeDropdown});
        await click({locator:this.page.getByRole('option', { name: signatureType })});
    }

    async selectStatus(status) {
        await click({locator:this.statusHeader});
        await click({locator:this.page.getByRole('option', { name: status , exact : true })});
    }

    // Plan Structure Methods
    async enterPlanPeriod(period) {
        await scrollIntoView({locator:this.planPeriodInput});
        await clearAndType({locator:this.planPeriodInput, value:period});
    }

    async selectAutoRecharge(rechargeOption) {
        await scrollIntoView({locator:this.autoRechargeDropdown});
        await click({locator:this.autoRechargeDropdown});
        await click({locator:this.page.getByRole('option', { name: rechargeOption })});
    }

    async selectWashLimitPeriod(timeLimitType) {
        await scrollIntoView({locator:this.washLimitPeriodDropdown});
        await click({locator:this.washLimitPeriodDropdown});
        await click({locator:this.page.getByRole('option', { name: timeLimitType })});
    }

    async enterWashPerLimit(washLimit) {
        await scrollIntoView({locator:this.washPerLimitInput});
        await clearAndType({locator:this.washPerLimitInput, value:washLimit});
    }

    // Pricing Methods
    async enterPrice(price) {
        await scrollIntoView({locator:this.priceInput});
        await clearAndType({locator:this.priceInput, value:price});

        
    }

    async enterUnitQuantity(quantity) {
        await scrollIntoView({locator:this.unitQuantityHeader});
        await clearAndType({locator:this.unitQuantityHeader, value:quantity});
    }

    async selectTaxable(taxableOption) {
        await scrollIntoView({locator:this.taxableDropdown});
        await click({locator:this.taxableDropdown});
        await click({locator:this.page.getByRole('option', { name: taxableOption })});
    }

    // Terms and Conditions Methods
    async enterTermsAndConditions(termsText) {
        await scrollIntoView({locator:this.termsandConditionsInput});
        await click({locator:this.termsandConditionsInput});
        await clearAndType({locator:this.termsandConditionsInput, value:termsText});
    }

    // Create Plan Methods
    async clickCreatePlanButton() {
        await scrollIntoView({locator:this.createPlanButton});
        await click({locator:this.createPlanButton});
    }

    async clickEditPlanDetails() {
        await click({locator:this.editPlanDetailsButton});
    }

    async saveEditChanges() {
        await click({locator:this.saveChangesButton});
    }

    async deletePlan() {
        await click({locator:this.deletePlanButton});
        await click({locator:this.confirmDeleteButton});
    }

    async createPlan(planData) {
        await this.enterPlanName(planData.planName);
        await this.selectPlanType(planData.planType);
        await this.selectWashType(planData.washType);
        await this.selectSignatureType(planData.signatureType);
        await this.selectStatus(planData.status);
        await this.enterPlanPeriod(planData.planPeriod);
        await this.selectWashLimitPeriod(planData.washLimitPeriod);
        await this.enterWashPerLimit(planData.washLimit);
        await this.enterPrice(planData.price);
        await this.selectTaxable(planData.taxable);
        await this.enterTermsAndConditions(planData.termsAndConditions);
        await this.clickCreatePlanButton();
    }

    async clickAllPlansList(){
        await click({locator:this.allPlans});
    }
    
}