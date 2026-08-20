export default class LeftNavigation {

    constructor(page) {
        this.page = page;
        //Catalog Navigation
        this.plans = page.getByRole('button', { name: 'Plans' });
        this.retailWashes = page.getByRole('button', { name: 'Retail Washes' });
        this.products = page.getByRole('button', { name: 'Products' });
        this.addOns = page.getByRole('button', { name: 'Add-ons' });

        //Groups Navigation
        this.allGroups = page.getByRole('button', { name: 'All' });
        this.catalogGroups = page.getByRole('button', { name: 'Catalog' });
        this.repotingGroups = page.getByRole('button', { name: 'Reporting' });
        this.taxGroups = page.getByRole('button', { name: 'Tax' });

    }

    async openPlans() {
        await this.plans.click();
    }

    async openRetailWashes() {
        await this.retailWashes.click();
    }

    async openProducts() {
        await this.products.click();
    }

    async openAddOns() {
        await this.addOns.click();
    }

    async openAllGroups() {
        await this.allGroups.click();
    }

    async openCatalogGroups() {
        await this.catalogGroups.click();
    }

    async openReportingGroups() {
        await this.repotingGroups.click();
    }

    async openTaxGroups() {
        await this.taxGroups.click();
    }
}