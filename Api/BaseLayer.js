import { request } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export class ApiBase {

  static async createAPIContext() {

    const tokenValue = process.env.tokenValue;
    const baseUrl = process.env.baseUrl;

    if (!baseUrl) {
      throw new Error('Environment variable baseUrl is required for API context creation.');
    }

    if (!tokenValue) {
      throw new Error('Environment variable tokenValue is required for API context creation.');
    }

    const apiContext = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders: {
        Authorization: `Bearer ${tokenValue}`,
        "Content-Type": "application/json"
      }
    });

    return apiContext;
  }
}