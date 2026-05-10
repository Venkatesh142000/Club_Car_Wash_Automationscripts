import { click } from "../utils/helpers";

export default class Products{

    constructor(page){
        this.page = page;
        this.backup = page.getByRole('link',{name:'Sauce Labs Backpack'});
        this.backup_atc = page.locator("button[name='add-to-cart-sauce-labs-backpack']");
        this.boltTshirt = page.getByRole('link',{name:'Sauce Labs Bolt T-Shirt'});
        this.boltTshirt_atc = page.locator("button[name='add-to-cart-sauce-labs-bolt-t-shirt']");
        this.oneSie = page.getByRole('link',{name:'Sauce Labs Onesie'});
        this.oneSie_atc = page.locator("button[name='add-to-cart-sauce-labs-onesie']");
        this.bikeLight = page.getByRole('link',{name:'Sauce Labs Bike Light'});
        this.bikeLight_atc = page.locator("button[name='add-to-cart-sauce-labs-bike-light']");
        this.fleeceJacket = page.getByRole('link',{name:'Sauce Labs Fleece Jacket'});
        this.fleeceJacket_atc = page.locator("button[name='add-to-cart-sauce-labs-fleece-jacket']");
        this.redTShirt = page.getByRole('link',{name:'Test.allTheThings() T-Shirt (Red)'});
        this.redTShirt_atc = page.locator("button[name='add-to-cart-test.allthethings()-t-shirt-(red)']");

        this.shopping_cart = page.locator('.shopping_cart_link');
        this.checkOut = page.getByRole('button',{name:'Checkout'});

        this.pdp_atc = page.locator('#add-to-cart');
    }

    async openBackPackProduct(){
        await click({
            locator: this.backup
        });
    }

    async openBoltTshirtProduct(){
        await click({
            locator: this.boltTshirt
        });
    }

    async openOnesieProduct(){
        await click({
            locator: this.oneSie
        });
    }
    async openBikeLightProduct(){
        await click({
            locator: this.bikeLight
        });
    }
    async openFleeceJacketProduct(){
        await click({
            locator: this.fleeceJacket
        });
    }
    async openRedTshirtProduct(){
        await click({
            locator: this.redTShirt
        });
    }
    
    async clickPdpAddToCart(){
        await click({
            locator: this.pdp_atc
        });
    }

    async addBackPackToCart(){
        await click({
            locator: this.backup_atc
        });
    }

    async addBoltTshirtToCart(){
        await click({
            locator: this.boltTshirt_atc
        });
    }

    async addOnesieToCart(){
        await click({
            locator: this.oneSie_atc
        });
    }

    async addFleeceJacketToCart(){
        await click({
            locator: this.fleeceJacket_atc
        });
    }

    async addBikeLightToCart(){
        await click({
            locator: this.bikeLight_atc
        });
    }

    async addRedTshirtToCart(){
        await click({
            locator: this.redTShirt_atc
        });
    }

    async clickCartIcon(){
        await click({
            locator: this.shopping_cart
        });
    }

}