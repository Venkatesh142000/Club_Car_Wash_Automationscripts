import { faker } from "@faker-js/faker";

const addonComponents = [
    'Tire Shine On',
    'Tire Shine Off',
    'Tire Brush Retract',
    'Top Brush Retract',
    'Full Grill Retract',
    'Full Retract',
    'Hitch Retract',
    'Open Bed',
    'Sienna van'
];

const planWashTypes = [
    'ROOKIE',
    'VIP',
    'ELITE',
    'MVP'
];

export const generateRandomData = () => ({
	randomName: faker.person.fullName(),
    randomAlphaNumericName : faker.string.alphanumeric(6),
    randomAddress: faker.location.streetAddress(),
    randomCity: faker.location.city(),
    randomState: faker.location.state(),
    randomZipCode: faker.location.zipCode(),
    randomCountry: faker.location.country(),
	randomNumber : faker.number.float({min:0,max:500,fractionDigits:2}),
    randomWholeNumber : faker.number.int({min:0,max:500}),
    randomCard: faker.finance.creditCardNumber(),
    randomMonth: faker.date.month(),
    randomYear: faker.date.future().getFullYear().toString(),
    randomCVV: faker.finance.creditCardCVV(),
    randomEmail: faker.internet.email(),
    randomPassword: faker.internet.password(),
	randomPhoneNumber: faker.phone.number(),
	randomGroupName: faker.company.name(),
	randomGroupType: faker.helpers.arrayElement(["Catalog", "Reporting", "Tax"]),
	randomAddonComponent : faker.helpers.arrayElement(addonComponents),
    randomWashType : faker.helpers.arrayElement(planWashTypes),

});