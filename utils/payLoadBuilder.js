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
}