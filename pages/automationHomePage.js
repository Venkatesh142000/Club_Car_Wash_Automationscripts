import { expect } from "../fixtures/baseFixture.js";
import helpers from "../utils/helpers.js";
import testData from "../testData.json" with { type: "json" };


export default class AutomationExerciseHomePage{

 constructor(page, isMobile = false)
 {
     this.page=page;
     this.isMobile=isMobile;
     this.productsLink=page.locator('a[href="/products"]');

     this.productName=page.locator('.product-image-wrapper .productinfo p');

     this.productPrice=page.locator('.product-image-wrapper .productinfo h2');

     this.getAllBrandLinks=page.locator("div[class='brands-name'] ul li a")

   
 }

 async goto() {
    const baseUrl = helpers.getEnv({ key: 'BASE_URL' }).trim();
    await this.page.goto(baseUrl);
 }

 async NavigateToProductsPage()
 {
    await this.productsLink.click();
 }

 async getFirstThreeProductNames() {
    // Wait for products to be visible on page
    await this.productName.first().waitFor({ state: 'visible' });
    const names = [];
    const count = await this.productName.count();
    const limit = Math.min(count, 3);
    for (let i = 0; i < limit; i++) {
      const text = await this.productName.nth(i).innerText();
      // Normalize multiple spaces to single space
      names.push(text.trim().replace(/\s+/g, ' '));
    }
    return names;
 }

 async getFirstThreeProductPrices() {
    // Wait for prices to be visible on page
    await this.productPrice.first().waitFor({ state: 'visible' });
    const prices = [];
    const count = await this.productPrice.count();
    const limit = Math.min(count, 3);
    for (let i = 0; i < limit; i++) {
      const text = await this.productPrice.nth(i).innerText();
      prices.push(text.trim());
    }
    return prices;
 }

 async compareFirstThreeProductNames(apiNames) {
    const uiNames = await this.getFirstThreeProductNames();
    for (let i = 0; i < apiNames.length; i++) {
      expect(uiNames[i]).toBe(apiNames[i]);
    }
    return uiNames;
 }

 async compareFirstThreeProductPrices(apiPrices) {
    const uiPrices = await this.getFirstThreeProductPrices();
    for (let i = 0; i < apiPrices.length; i++) {
      expect(uiPrices[i]).toContain(apiPrices[i]);
    }
    return uiPrices;
 }

 async getFirstThreeBrands() {
    await this.getAllBrandLinks.first().waitFor({ state: 'visible' });
    const brands = [];
    const count = await this.getAllBrandLinks.count();
    const limit = Math.min(count, 3);
    for (let i = 0; i < limit; i++) {
      const text = await this.getAllBrandLinks.nth(i).innerText();
      // Strip the count prefix e.g. "(6)\nPOLO" → "POLO"
      const cleaned = text.trim()
        .replace(/^\(\d+\)\s*/m, '')  // remove leading (n)
        .replace(/\s+/g, ' ')          // normalize spaces
        .trim();
      brands.push(cleaned);
    }
    return brands;
 }

 async compareFirstThreeBrands(apiBrands) {
    const uiBrands = await this.getFirstThreeBrands();
    for (let i = 0; i < apiBrands.length; i++) {
      expect(uiBrands[i].toLowerCase()).toBe(apiBrands[i].toLowerCase());
    }
    return uiBrands;
 }


 

 



    
}