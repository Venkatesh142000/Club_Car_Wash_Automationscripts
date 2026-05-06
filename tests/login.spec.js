import {test} from '../fixtures/baseFixture.js';
import  helpers from '../utils/helpers.js';
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

test("Validate login functionality with valid credentials",async({isMobile,loginPage})=>{
    
    await loginPage.goto();
    await loginPage.login(process.env.username,process.env.password);


})

})