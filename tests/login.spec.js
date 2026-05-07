import {test} from '../fixtures/baseFixture.js';
import  helpers from '../utils/helpers.js';

import testData from '../testData.json' with { type: 'json' };
test.describe("Login Functionality",()=>{

    test.beforeEach(async()=>{
        await helpers.allureEpicLabel('Login Function Sauce Labs');
        await helpers.allureFeatureLabel("Login Module");
        await helpers.allureStoryLabel("Login functionality with valid credentials");
        await helpers.allureStoryLabel("Login functionality with valid credentials");
        await helpers.allureBrowser(test.info().project.name);
        await helpers.allureTag("smoke");
        await helpers.allureTestCase("1","Login positive test case");
        await helpers.allureDisplayName("validate the test case");
        await helpers.allureSeverity("blocker");
    });

test("Validate login functionality with valid credentials @smoke",async({isMobile,loginPage})=>{
    
    await loginPage.goto();
  
    await loginPage.login(testData.users.standard.username,testData.users.standard.password);


})

test("Validate login functionality with invalid credentials @regression",async({isMobile,loginPage})=>{


    await loginPage.goto();
    const invalidUsername = testData.users.invalid.invalidUsername;
    const invalidPassword = testData.users.invalid.invalidPassword;
    await loginPage.login(invalidUsername,invalidPassword)



})

})