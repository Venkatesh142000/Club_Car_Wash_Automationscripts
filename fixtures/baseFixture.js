import {test as base} from '@playwright/test'
import LoginPage from '../pages/auth/loginPage.js';
import TopNavigation from '../pages/navigation/topNavigation.js';
import LeftNavigation from '../pages/navigation/leftNavigation.js';
import PlansPage from '../pages/catalog/plansPage.js';
import AddOnsPage from '../pages/catalog/addOnsPage.js';
import ProductsPage from '../pages/catalog/productsPage.js';    
import RetailWashPage from '../pages/catalog/retailWashPage.js';
import { GroupsPage } from '../pages/groups/groupsPage.js';
import { Sites } from '../pages/sites/sitesPage.js'
import { generateRandomData } from '../utils/fakerHelper.js';

export const test = base.extend({

    randomData : async({},use)=>{
        const randomData = generateRandomData();
        await use(randomData)
    },

    loginPage : async({page},use)=>{
        const login = new LoginPage(page)
        await login.goto()
        await login.enterUsername()
        await login.enterPassword()
        await login.handleStaySignedIn()
        await login.waitForSitesPage()
        await use(login)
    },

    topNavigation : async({page},use)=>{
        const topNav = new TopNavigation(page)
        await use(topNav)
    },

    leftNavigation : async({page},use)=>{
        const leftNav = new LeftNavigation(page)
        await use(leftNav)
    },

    plansPage : async({page},use)=>{
        const plansPage = new PlansPage(page)
        await use(plansPage)
    },

    addOnsPage : async({page},use)=>{
        const addOnsPage = new AddOnsPage(page)
        await use(addOnsPage)
    },
    productsPage : async({page},use)=>{
        const productsPage = new ProductsPage(page)
        await use(productsPage)
    },
    retailWashPage : async({page},use)=>{
        const retailWashPage = new RetailWashPage(page)
        await use(retailWashPage)
    },
    groupsPage : async({page},use)=>{
        const groupsPage = new GroupsPage(page)
        await use(groupsPage)
    },
    sitesPage : async({page},use)=>{
        await use(new Sites(page))
    }

});

export const expect = test.expect;