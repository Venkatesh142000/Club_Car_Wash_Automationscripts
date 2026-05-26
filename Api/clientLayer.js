export class ApiClient {

  constructor(apiContext) {
    this.apiContext = apiContext;
  }

  async get(endpoint) {
    return await this.apiContext.get(endpoint);
  }

  async post(endpoint, data) {
    return await this.apiContext.post(endpoint, {
      json: data
    });
  }

  
  async delete(endpoint) {
    return this.deleteResource(endpoint);
  }

  async put(endpoint, data) {
    return await this.apiContext.put(endpoint, {
      json: data
    });
  }
}