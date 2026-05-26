import { request } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export class ApiBase {

  static async createAPIContext() {

    const tokenValue = process.env.TOKEN_VALUE;
    const baseUrl = process.env.BASE_URL;

    if (!baseUrl) {
      throw new Error('Environment variable BASE_URL is required for API context creation.');
    }

    if (!tokenValue) {
      throw new Error('Environment variable TOKEN_VALUE is required for API context creation.');
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