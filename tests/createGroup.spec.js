import { test, expect } from '../fixtures/baseFixture.js';

test.describe('Groups - Create', () => {
    test('smoke: should create a group and see it in list', async ({ loginPage, topNavigation, leftNavigation, groupsPage, randomData }) => {
        await topNavigation.openGroups();
        await leftNavigation.openAllGroups();

        await groupsPage.clickNewGroupButton();
        await groupsPage.enterNewGroupname(randomData.randomGroupName);
        await groupsPage.selectGroupType(randomData.randomGroupType);
        await groupsPage.clickCreateGroupButton();

        await groupsPage.clickAllGroupsButton();
        await groupsPage.searchGroup(randomData.randomGroupName);
        const rowCount = await groupsPage.getGroupRowCount();
        expect(rowCount).toBeGreaterThan(0);
    });

    test('regression: create a group then delete it', async ({ loginPage, topNavigation, leftNavigation, groupsPage, randomData }) => {
        await topNavigation.openGroups();
        await leftNavigation.openAllGroups();

        // Create group
        await groupsPage.clickNewGroupButton();
        await groupsPage.enterNewGroupname(randomData.randomGroupName);
        await groupsPage.selectGroupType(randomData.randomGroupType);
        await groupsPage.clickCreateGroupButton();

        await groupsPage.clickAllGroupsButton();
        await groupsPage.searchGroup(randomData.randomGroupName);

        // Ensure the created row exists
        const targetRow = groupsPage.page.locator('table tbody tr', { hasText: randomData.randomGroupName }).first();
        await expect(targetRow).toBeVisible();

        // Click delete within the row (assumes a delete button exists in the row)
        const deleteBtn = targetRow.getByRole('button', { name: 'Delete' });
        await deleteBtn.click();

        // Confirm deletion
        await groupsPage.clickConfirmDeleteButton();

        // Verify deletion
        await groupsPage.searchGroup(randomData.randomGroupName);
        const remaining = await groupsPage.getGroupRowCount();
        expect(remaining).toBe(0);
    });

});
