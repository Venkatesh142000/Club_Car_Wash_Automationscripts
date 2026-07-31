import { faker } from '@faker-js/faker';

export class CreateAccountPayloadBuilder {
  
  /**
   * Build create account payload with form data
   * @param {Object} overrides - Optional field overrides
   * @returns {Object} Formatted payload for create account endpoint
   */
  buildCreateAccount(overrides = {}) {
    const defaultData = {
      name: overrides.name || faker.person.fullName(),
      email: overrides.email || `${faker.internet.username()}${Date.now()}@example.com`,
      password: overrides.password || 'Test@123',
      title: overrides.title || 'Mr',
      birth_date: overrides.birth_date || '15',
      birth_month: overrides.birth_month || '05',
      birth_year: overrides.birth_year || '1998',
      firstname: overrides.firstname || faker.person.firstName(),
      lastname: overrides.lastname || faker.person.lastName(),
      company: overrides.company || faker.company.name(),
      address1: overrides.address1 || faker.location.streetAddress(),
      address2: overrides.address2 || faker.location.secondaryAddress(),
      country: overrides.country || 'India',
      zipcode: overrides.zipcode || faker.location.zipCode(),
      state: overrides.state || 'Telangana',
      city: overrides.city || faker.location.city(),
      mobile_number: overrides.mobile_number || faker.phone.number('98########')
    };

    return defaultData;
  }

  /**
   * Build payload with static test data
   * @param {Object} overrides - Optional field overrides
   * @returns {Object} Formatted payload with static data
   */
  buildCreateAccountStatic(overrides = {}) {
    const defaultData = {
      name: overrides.name || 'Teja Kumar',
      email: overrides.email || `teja${Date.now()}@example.com`,
      password: overrides.password || 'Test@123',
      title: overrides.title || 'Mr',
      birth_date: overrides.birth_date || '15',
      birth_month: overrides.birth_month || '05',
      birth_year: overrides.birth_year || '1998',
      firstname: overrides.firstname || 'Teja',
      lastname: overrides.lastname || 'Kumar',
      company: overrides.company || 'ABC Technologies',
      address1: overrides.address1 || '123 MG Road',
      address2: overrides.address2 || 'Near City Mall',
      country: overrides.country || 'India',
      zipcode: overrides.zipcode || '500001',
      state: overrides.state || 'Telangana',
      city: overrides.city || 'Hyderabad',
      mobile_number: overrides.mobile_number || '9876543210'
    };

    return defaultData;
  }

  /**
   * Validate payload has required fields
   * @param {Object} payload - Payload to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validate(payload = {}) {
    const requiredFields = ['email', 'password', 'firstname', 'lastname', 'country'];
    const errors = [];

    requiredFields.forEach(field => {
      if (!payload[field]) {
        errors.push(`Required field missing: ${field}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Export pre-built payloads for direct use
const payloadBuilder = new CreateAccountPayloadBuilder();

export const createAccountPayloads = {
  // Generate unique data with Faker
  fakerData: () => payloadBuilder.buildCreateAccount(),
  
  // Generate unique data with Faker + optional overrides
  withOverrides: (overrides) => payloadBuilder.buildCreateAccount(overrides),
  
  // Static test data (Teja Kumar)
  staticData: () => payloadBuilder.buildCreateAccountStatic()
};

export const validatePayload = (payload) => payloadBuilder.validate(payload);
