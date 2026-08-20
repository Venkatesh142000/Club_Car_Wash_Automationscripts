export default class TopNavigation {

    constructor(page) {

        this.page = page;
        this.sitesMenu = page.getByRole('link', { name: 'Sites' });
        this.customersMenu = page.getByRole('link', { name: 'Customers' });
        this.catalogMenu = page.getByRole('link', { name: 'Catalog' });
        this.promotionsMenu = page.getByRole('link', { name: 'Promotions' });
        this.employeesMenu = page.getByRole('link', { name: 'Employees' });
        this.businessMenu = page.getByRole('link', { name: 'Business' });
        this.groupsMenu = page.getByRole('link', { name: 'Groups' });
        this.adminMenu = page.getByRole('link', { name: 'Admin' });
    }

    async openSites() {
        await this.sitesMenu.click();
    }

    async openCustomers() {
        await this.customersMenu.click();
    }

    async openCatalog() {
        await this.catalogMenu.click();
    }

    async openPromotions() {
        await this.promotionsMenu.click();
    }

    async openEmployees() {
        await this.employeesMenu.click();
    }

    async openBusiness() {
        await this.businessMenu.click();
    }

    async openGroups() {
        await this.groupsMenu.click();
    }

    async openAdmin() {
        await this.adminMenu.click();
    }
}