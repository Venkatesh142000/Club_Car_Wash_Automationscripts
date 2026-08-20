import { getText, click, setCheckbox, clearAndType, scrollIntoView } from '../../utils/helpers.js';

export default class ProductsPage {

    constructor(page) {
        this.page = page;

        //Page Headers
        this.pageTitle = page.locator("h1[title='Products']");
        this.showInactiveCheckbox = page.getByRole('checkbox',{name:'Show Inactive'});
        this.searchInput = page.getByPlaceholder('Search');        
        this.newProductButton = page.getByRole('button', { name: 'New Product' });

        //Table Headers and Rows
        this.productNameHeader = page.getByText('Product Name');
        this.type = page.getByText('Type',{ exact: true }); //page.locator('th').filter({ hasText: 'Type' });
        this.priceHeader = page.getByText('Price',{ exact: true }); //page.locator('th').filter({ hasText: 'Price' });
        this.statusHeader = page.getByText('Status');
        this.tableRows = page.locator('table tbody tr');

        //Create New Product    
        this.clickNewProductButton = page.getByRole('button', { name: 'New Product' });

        //Create Product
        this.productNameInput = page.getByPlaceholder('Product Name');
        this.productTypeDropdown = page.getByRole('combobox', { name: 'Type' });
        this.productStatusDropdown = page.getByRole('combobox', { name: 'Status' });

        //If the product type is "Gift Card", additional fields will be displayed
        this.fixedPriceInput = page.getByRole('combobox', { name: 'Fixed Price' });
        //If fixedPrice = No, then 'giftCardMaxPriceInput' is visible otherwise the following fields will be displayed
        this.price = page.getByRole('textbox', { name: 'Price' });
        this.giftCardMaxPriceInput = page.getByRole('textbox', { name: 'Gift Card Max Value' });
        this.overrideLoadedValueCheckbox = page.getByRole('checkbox', { name: 'Override Loaded Value' });
        //if overrideLoadedValue = Yes, then the following field will be displayed
        this.overrideLoadedValueInput = page.getByRole('textbox', { name: 'Loaded Value' });
        

        //If the product type is "Prepaid", additional fields will be displayed
        this.retailWashTypeDropdown = page.getByRole('combobox', { name: 'Retail Wash Type' });
        this.fixedQuantityDropdown = page.getByRole('combobox', { name: 'Fixed Quantity' });
        this.taxableDropdown = page.getByLabel('Taxable');

        //if the product type is "Merchandise", then the following field will be displayed
        this.merchandisePrice = page.getByRole('textbox', { name: 'Price' });
        this.merchandiseTaxableDropdown = page.getByLabel('Taxable');

        //if the product type is "Tip" or "Donation", then there will be no pricing section
        
        this.createProductButton = page.getByRole('button', { name: 'Create Product' });

        //Back to product list
        this.allProducts = page.getByRole('button',{name:'All Products'});

        //Create and Update Success Message
        this.successMessage = page.getByTestId('message-component');
    }

    // Page Header Methods
    async getPageTitle() {
        return await getText({ locator: this.pageTitle });
    }

    async toggleShowInactive() {
        await click({ locator: this.showInactiveCheckbox });
    }

    async setShowInactive(checked = true) {
        await setCheckbox({ locator: this.showInactiveCheckbox, checked });
    }

    async isShowInactiveChecked() {
        return await this.showInactiveCheckbox.isChecked();
    }

    // Search Methods
    async searchProduct(searchText) {
        await clearAndType({ locator: this.searchInput, value: searchText });
    }

    async clearSearchInput() {
        await this.searchInput.fill('');
    }

    async clickNewProduct() {
        await click({ locator: this.clickNewProductButton });
    }

    // Table Methods
    async getTableRowCount() {
        return await this.tableRows.count();
    }

    async getTableRows() {
        return await this.tableRows.all();
    }

    // Create Product Form Methods
    async fillProductName(name) {
        await clearAndType({ locator: this.productNameInput, value: name });
    }

    async getProductNameValue() {
        return await this.productNameInput.inputValue();
    }

    async selectProductType(type) {
        await click({ locator: this.productTypeDropdown });
        await click({ locator: this.page.getByRole('option', { name: type }) });
    }

    async getProductTypeValue() {
        return await this.productTypeDropdown.inputValue();
    }

    async selectProductStatus(status) {
        await click({ locator: this.productStatusDropdown });
        await click({ locator: this.page.getByRole('option', { name: status }) });
    }


    // Gift Card Section Methods
    async fillFixedPrice(value) {
        await click({ locator: this.fixedPriceInput });
        await click({ locator: this.page.getByRole('option', { name: value }) });
    } 

    async fillGiftCardPrice(value) {
        await clearAndType({ locator: this.price, value });
    }

    async fillGiftCardMaxValue(value) {
        await clearAndType({ locator: this.giftCardMaxPriceInput, value });
    }



    async toggleOverrideLoadedValue(checked = true) {
        await setCheckbox({ locator: this.overrideLoadedValueCheckbox, checked });
    }

    async isOverrideLoadedValueChecked() {
        return await this.overrideLoadedValueCheckbox.isChecked();
    }

    async fillOverrideLoadedValue(value) {
        await clearAndType({ locator: this.overrideLoadedValueInput, value });
    }

    async getOverrideLoadedValue() {
        return await this.overrideLoadedValueInput.inputValue();
    }

    // Prepaid Section Methods
    async selectRetailWashType(type) {
        await click({ locator: this.retailWashTypeDropdown });
        await click({ locator: this.page.getByRole('option', { name: type }) });
    }

    async getRetailWashTypeValue() {
        return await this.retailWashTypeDropdown.inputValue();
    }

    async selectFixedQuantity(quantity) {
        await click({ locator: this.fixedQuantityDropdown });
        await click({ locator: this.page.getByRole('option', { name: quantity }) });
    }

    async getFixedQuantityValue() {
        return await this.fixedQuantityDropdown.inputValue();
    }

    async selectTaxableOption(option) {
        await click({ locator: this.taxableDropdown });
        await click({ locator: this.page.getByRole('option', { name: option }) });
    }

    async getTaxableValue() {
        return await this.taxableDropdown.inputValue();
    }

    // Merchandise Section Methods
    async fillMerchandisePrice(value) {
        await clearAndType({ locator: this.merchandisePrice, value });
    }

    async getMerchandisePriceValue() {
        return await this.merchandisePrice.inputValue();
    }

    async selectMerchandiseTaxable(option) {
        await click({ locator: this.merchandiseTaxableDropdown });
        await click({ locator: this.page.getByRole('option', { name: option }) });
    }

    async getMerchandiseTaxableValue() {
        return await this.merchandiseTaxableDropdown.inputValue();
    }

    async fillProductForm(product) {
        await this.fillProductName(product.name);
        await this.selectProductType(product.type);
        await this.selectProductStatus(product.status ?? 'Active');

        switch (product.type) {
            case 'Gift Card':
                if (product.fixedPrice !== undefined) {
                    await this.fillFixedPrice(product.fixedPrice);
                }
                if (product.giftCardMaxValue !== undefined) {
                    await this.fillGiftCardMaxValue(product.giftCardMaxValue);
                }
                if (product.overrideLoadedValue !== undefined) {
                    await this.toggleOverrideLoadedValue(product.overrideLoadedValue);
                    if (product.loadedValue !== undefined) {
                        await this.fillOverrideLoadedValue(product.loadedValue);
                    }
                }
                break;
            case 'Prepaid':
                if (product.retailWashType) {
                    await this.selectRetailWashType(product.retailWashType);
                }
                if (product.fixedQuantity) {
                    await this.selectFixedQuantity(product.fixedQuantity);
                }
                if (product.taxable) {
                    await this.selectTaxableOption(product.taxable);
                }
                break;
            case 'Merchandise':
                if (product.merchandisePrice !== undefined) {
                    await this.fillMerchandisePrice(product.merchandisePrice);
                }
                if (product.merchandiseTaxable) {
                    await this.selectMerchandiseTaxable(product.merchandiseTaxable);
                }
                break;
            case 'Tip':
            case 'Donation':
                // No additional pricing fields expected for Tip or Donation types
                break;
            default:
                break;
        }
    }

    async createProduct(product) {
        await this.fillProductForm(product);
        await this.clickCreateProductButton();
    }

    async clickCreateProductButton() {
        await scrollIntoView({ locator: this.createProductButton });
        await click({ locator: this.createProductButton });
    }

    async clickAllProducts() {
        await click({ locator: this.allProducts });
    }
}
