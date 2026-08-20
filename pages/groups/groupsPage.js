import { click, clearAndType, scrollIntoView } from '../../utils/helpers.js';

export class GroupsPage {
    constructor(page) {
        this.page = page;
        this.groupsHeader = page.getByRole('heading', { name: 'Groups' });
        this.newGroupButton = page.getByRole('button', { name: 'New Group' });
        this.searchInput = page.getByRole('textbox', { name: 'Search name or group code' });
        this.tableRows = page.locator('table tbody tr');

        //New Group Creation
        this.groupNameInput = page.getByRole('textbox', { name: 'Group Name' });
        this.groupTypeDropdown = page.getByRole('combobox', { name: 'Group Type' });
        this.taxRateInput = page.getByRole('textbox', { name: 'Tax Rate *' });

        //Create Group Button
        this.createGroupButton = page.getByRole('button', { name: 'Create Group' });

        //Navigate back to Groups List
        this.allGroupsButton = page.getByRole('button', { name: 'All Groups' });

        //Delete Group
        this.deleteGroupButton = page.getByRole('button', { name: 'Delete Group' });
        this.confirmDeleteButton = page.getByRole('button', { name: /^Delete/ });
        this.cancelDeleteButton = page.getByRole('button', { name: 'Cancel' });
    }

    async isGroupsHeaderVisible() {
        return await this.groupsHeader.isVisible();
    }

    async searchGroup(searchText) {
        await clearAndType({ locator: this.searchInput, value: searchText });
    }

    async getGroupRowCount() {
        return await this.tableRows.count();
    }

    async clickNewGroupButton() {
        await click({ locator: this.newGroupButton });
    }

    async enterNewGroupname(groupName) {
        await clearAndType({ locator: this.groupNameInput, value: groupName });
    }

    async selectGroupType(type) {
        await click({ locator: this.groupTypeDropdown });
        await click({ locator: this.page.getByRole('option', { name: type }) });
    }

    async enterTaxRate(taxRate) {
        await clearAndType({ locator: this.taxRateInput, value: taxRate });
    }

    async clickCreateGroupButton() {
        await scrollIntoView({ locator: this.createGroupButton });
        await click({ locator: this.createGroupButton });
    }

    async clickAllGroupsButton() {
        await click({ locator: this.allGroupsButton });
    }

    async clickDeleteGroupButton() {
        await click({ locator: this.deleteGroupButton });
    }

    async clickConfirmDeleteButton() {
        await click({ locator: this.confirmDeleteButton });
    }

    async clickCancelDeleteButton() {
        await click({ locator: this.cancelDeleteButton });
    }
}
