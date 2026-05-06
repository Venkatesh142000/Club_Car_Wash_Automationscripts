import { execFileSync } from "node:child_process";

export default async function globalTeardown(fullResult) {
  const runStatus = fullResult?.status || "unknown";

  try {
    console.log(`[Xray] Playwright run finished with status: ${runStatus}. Uploading results to Xray...`);
    execFileSync("node", ["updateTestResults.js"], {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env
    });
  } catch (error) {
    console.error("[Xray] Upload step failed.");
    console.error(error.message || error);
  }
}
