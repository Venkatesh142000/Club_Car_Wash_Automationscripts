import { faker } from "@faker-js/faker";

export const generateCheckoutCustomer = () => ({
	firstName: faker.person.firstName(),
	lastName: faker.person.lastName(),
	postalCode: faker.location.zipCode("#####"),
});