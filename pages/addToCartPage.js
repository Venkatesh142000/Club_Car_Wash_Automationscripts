import { click } from "../utils/helpers";

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
        await click({
            locator: this.removeBackPack
        });
    }

    async removeProductBikeLight(){
        await click({
            locator: this.removeBikeLight
        });
    }

    async removeProductBoltTshirt(){
        await click({
            locator: this.removeboltTshirt
        });
    }

    async removeProductFleeceJacket(){
        await click({
            locator: this.removefleeceJacket
        });
    }

    async removeProductOnesie(){
        await click({
            locator: this.removeOnesie
        });
    }

    async removeProductRedTshirt(){
        await click({
            locator: this.removeRedTshirt
        });
    }

    async clickContinue(){
        await click({
            locator: this.continueShopping
        });
    }

    async clickCheckout(){
        await click({
            locator: this.checkout
        });
    }
}