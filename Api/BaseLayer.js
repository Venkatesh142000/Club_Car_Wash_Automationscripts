import { request } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export class ApiBase {
  static async createAPIContext() {

    // Accept either lowercase or uppercase environment variable names to avoid confusion
    const baseUrl = process.env.api_BASE_URL || process.env.API_BASE_URL || process.env.BASE_URL;
    const username = process.env.api_username || process.env.API_USERNAME;
    const password = process.env.api_password || process.env.API_PASSWORD;

    /*if (!baseUrl) {
      throw new Error(
        "Environment variable api_BASE_URL is required for API context creation."
      );
    }

    if (!username || !password) {
      throw new Error(
        "Environment variables api_username (or API_USERNAME) and api_password (or API_PASSWORD) are required for API context creation."
      );
    }*/


   
   //   const auth = Buffer.from(`${username}:${password}`).toString("base64");

const apiContext = await request.newContext({
  baseURL: baseUrl,
  extraHTTPHeaders: {
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