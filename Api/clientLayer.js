export class ApiClient {

  constructor(apiContext) {
    this.apiContext = apiContext;
  }

  async get(endpoint) {
    return await this.apiContext.get(endpoint);
  }

  async post(endpoint, data) {
    return await this.apiContext.post(endpoint, {
      data: JSON.stringify(data)
    });
  }

  
  async delete(endpoint) {
    return await this.apiContext.delete(endpoint);
  }

  async put(endpoint, data) {
    return await this.apiContext.put(endpoint, {
      data: JSON.stringify(data)
    });
  }

  async patch(endpoint, data) {
    return await this.apiContext.patch(endpoint, {
      data: JSON.stringify(data)
    });
  }
}