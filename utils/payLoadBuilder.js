import { faker } from '@faker-js/faker';


const PAYLOAD_SCHEMA = {
    properties: [
        { name: 'os_template',      value: null },  
        { name: 'tfcEnclaveId',     value: '' },
        { name: 'name',             value: null },  
        { name: 'service_name',     value: '' },
        { name: 'node_num_cpus',    value: null },  
        { name: 'node_memory',      value: null },  
        { name: 'root_volume_size', value: null }, 
        { name: 'blob_url',         value: null }   
    ]
};

export class PayloadBuilder {
   
    buildRequest(row) {
        const name        = faker.internet.username();
        const title       = faker.lorem.words(1);
        const numCpus     = parseFloat(faker.number.float({ min: 2, max: 4, fractionDigits: 2 }).toFixed(2));
        const nodeMemory  = parseFloat(faker.number.float({ min: 1, max: 4, fractionDigits: 2 }).toFixed(2));

        const properties = PAYLOAD_SCHEMA.properties.map((prop) => {
            if (prop.name === 'name')             return { ...prop, value: name };
            if (prop.name === 'node_num_cpus')    return { ...prop, value: numCpus };
            if (prop.name === 'node_memory')      return { ...prop, value: nodeMemory };
            if (prop.name === 'os_template')      return { ...prop, value: row.ostemplate };
            if (prop.name === 'root_volume_size') return { ...prop, value: row.rootvolumesize };
            if (prop.name === 'blob_url')         return { ...prop, value: row.bloburl };
            return { ...prop };
        });

        return {
            projectId:       row.projectid,
            serviceConfigId: row.serviceconfigid,
            title,
            properties
        };
    }

    /**
     * Build a full booking payload for POST /booking.
     * All fields use faker so every call produces unique data.
     * @param {object} [overrides={}] Optional field overrides.
     */
    buildBooking(overrides = {}) {
        const checkin  = faker.date.soon({ days: 30 }).toISOString().split('T')[0];
        const checkout = faker.date.soon({ days: 5, refDate: checkin }).toISOString().split('T')[0];

        return {
            firstname:       faker.person.firstName(),
            lastname:        faker.person.lastName(),
            totalprice:      faker.number.int({ min: 100, max: 5000 }),
            depositpaid:     faker.datatype.boolean(),
            bookingdates: {
                checkin,
                checkout
            },
            additionalneeds: faker.helpers.arrayElement(['Breakfast', 'Lunch', 'Dinner', 'Airport transfer', 'None']),
            ...overrides
        };
    }

    /**
     * Build an update payload for PUT /booking.
     * Starts from a fresh buildBooking() and merges any provided overrides,
     * so callers can patch only the fields they care about.
     * @param {object} [overrides={}] Fields to override in the update payload.
     */
    buildBookingUpdate(overrides = {}) {
        return {
            ...this.buildBooking(),
            ...overrides
        };
    }
}