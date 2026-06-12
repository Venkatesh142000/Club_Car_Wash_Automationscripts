import { request } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export class ApiBase {
  static async createAPIContext() {

    const baseUrl = process.env.api_BASE_URL;
    const username = process.env.api_username;
    const password = process.env.api_password;

    if (!baseUrl) {
      throw new Error(
        "Environment variable api_BASE_URL is required for API context creation."
      );
    }

    if (!username || !password) {
      throw new Error(
        "Environment variables API_USERNAME and API_PASSWORD are required for API context creation."
      );
    }


    const auth = Buffer.from(`${username}:${password}`).toString("base64");

const apiContext = await request.newContext({
  baseURL: baseUrl,
  extraHTTPHeaders: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

   /* const apiContext = await request.newContext({
      baseURL: baseUrl,
      httpCredentials: {
        username,
        password,
      },
      extraHTTPHeaders: {
        "Content-Type": "application/json",
      },
    });*/

    return apiContext;
  }
}