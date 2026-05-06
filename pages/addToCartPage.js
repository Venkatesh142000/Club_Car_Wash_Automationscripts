export default class AddToCart{

    constructor(page){
        this.page = page;
        this.removeBackPack = page.locator('button[name="remove-sauce-labs-backpack"]');
        this.removeBikeLight = page.locator('button[name="remove-sauce-labs-bike-light"]');
        this.removeBoltTshirt = page.locator('button[name="remove-sauce-labs-bolt-t-shirt"]');
        this.removeFleeceJacket = page.locator('button[name="remove-sauce-labs-fleece-jacket"]');
        this.removeOnesie = page.locator('button[name="remove-sauce-labs-onesie"]');
        this.removeRedTshirt = page.locator('button[name="remove-test.allthethings()-t-shirt-(red)"]');

        this.continueShopping = page.getByRole('button',{name:'Go back Continue Shopping'});
        this.checkout = page.getByRole('button',{name:'Checkout'});
    }

    async removeProductBackPack(){
        await this.removeBackPack.click();
    }

    async removeProductBikeLight(){
        await this.removeBikeLight.click();
    }

    async removeProductBoltTshirt(){
        await this.removeboltTshirt.click();
    }

    async removeProductFleeceJacket(){
        await this.removefleeceJacket.click();
    }

    async removeProductOnesie(){
        await this.removeOnesie.click();
    }

    async removeProductBoltTshirt(){
        await this.removeboltTshirt.click();
    }

    async clickContinue(){
        await this.continueShopping.click();
    }

    async clickCheckout(){
        await this.checkout.click();
    }
}