export class ApiClient {

  constructor(apiContext) {
    this.apiContext = apiContext;
  }

  async get(endpoint) {
    return await this.apiContext.get(endpoint);
  }



  async post(endpoint, data, isFormEncoded = false) {
    if (isFormEncoded) {
      return await this.apiContext.post(endpoint, {
        form: data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }

    return await this.apiContext.post(endpoint, {
      data: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  
  async delete(endpoint, data, isFormEncoded = false) {
    if (isFormEncoded) {
      return await this.apiContext.delete(endpoint, {
        form: data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }

    return await this.apiContext.delete(endpoint, {
      data: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
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