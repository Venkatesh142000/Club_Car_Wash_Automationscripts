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
        await  this.backup.click();
    }

    async openBoltTshirtProduct(){
        await  this.boltTshirt.click();
    }

    async openOnesieProduct(){
        await  this.oneSie.click();
    }
    async openBikeLightProduct(){
        await  this.bikeLight.click();
    }
    async openFleeceJacketProduct(){
        await  this.fleeceJacket.click();
    }
    async openRedTshirtProduct(){
        await  this.redTShirt.click();
    }
    
    async clickPdpAddToCart(){
        await this.pdp_atc.click();
    }

    async addBackPackToCart(){
        await this.backup_atc.click();
    }

    async addBoltTshirtToCart(){
        await this.boltTshirt_atc.click();
    }

    async addOnesieToCart(){
        await this.oneSie_atc.click();
    }

    async addFleeceJacketToCart(){
        await this.fleeceJacket_atc.click();
    }

    async addBikeLightToCart(){
        await this.bikeLight_atc.click();
    }

    async addRedTshirtToCart(){
        await this.redTShirt_atc.click();
    }

    async clickCartIcon(){
        await this.shopping_cart.click();
    }

}