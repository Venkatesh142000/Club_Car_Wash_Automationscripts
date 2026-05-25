import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const {
  XRAY_CLIENT_ID,
  XRAY_CLIENT_SECRET,
  XRAY_BASE_URL,
  XRAY_REGION,
  XRAY_TEST_EXEC_KEY
} = process.env;

const RESULTS_FILE = "results.xml";
const CLIENT_ID = XRAY_CLIENT_ID?.trim();
const CLIENT_SECRET = XRAY_CLIENT_SECRET?.trim();
const TEST_EXEC_KEY = XRAY_TEST_EXEC_KEY?.trim();
const REGION = XRAY_REGION?.trim();
const BASE_URL = XRAY_BASE_URL?.trim() || `https://${REGION ? `${REGION}.` : ""}xray.cloud.getxray.app/api/v2`;

// 🔹 Validate config
function validateConfig() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("XRAY_CLIENT_ID and XRAY_CLIENT_SECRET are required");
  }
  if (!BASE_URL) {
    throw new Error("XRAY_BASE_URL or XRAY_REGION is required");
  }
  if (!TEST_EXEC_KEY) {
    throw new Error("XRAY_TEST_EXEC_KEY is required");
  }
}

// 🔹 Get auth token
async function getAuthToken() {
  const res = await axios.post(`${BASE_URL}/authenticate`, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  return res.data.replace(/"/g, "");
}

// 🔹 Determine status from XML
function getStatus(body) {
  if (/<failure\b|<error\b/.test(body)) return "FAILED";
  if (/<skipped\b/.test(body)) return "TODO";
  return "PASSED";
}

function statusPriority(status) {
  if (status === "FAILED") return 3;
  if (status === "TODO") return 2;
  return 1;
}

// 🔹 Parse JUnit XML
function parseJUnit(xml) {
  const regex =
    /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>|<testcase\b([^>]*)\/>/g;

  const nameRegex = /name="([^"]+)"/;
  const keyRegex = /\b([A-Z][A-Z0-9]+-\d+)\b/;

  const tests = [];
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const attrs = match[1] || match[3] || "";
    const body = match[2] || "";

    const name = attrs.match(nameRegex)?.[1];
    const key = name?.match(keyRegex)?.[1];

    if (!name || !key) continue;

    tests.push({
      testKey: key,
      status: getStatus(body),
      comment: name
    });
  }

  const mergedByKey = new Map();
  for (const test of tests) {
    const existing = mergedByKey.get(test.testKey);
    if (!existing) {
      mergedByKey.set(test.testKey, test);
      continue;
    }

    if (statusPriority(test.status) > statusPriority(existing.status)) {
      existing.status = test.status;
    }
  }

  return Array.from(mergedByKey.values());
}

// 🔹 Upload results to Xray
async function uploadResults(token, tests) {
  const payload = {
    testExecutionKey: TEST_EXEC_KEY,
    tests
  };

  const res = await axios.post(
    `${BASE_URL}/import/execution`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data;
}

// 🔹 Global teardown entry
export default async () => {
  try {
    console.log("🚀 Global teardown: Uploading results to Xray...");
    console.log("Xray endpoint:", BASE_URL);

    validateConfig();

    // 1. Get token
    const token = await getAuthToken();

    // 2. Read results
    if (!fs.existsSync(RESULTS_FILE)) {
      throw new Error("results.xml not found");
    }

    const xml = fs.readFileSync(RESULTS_FILE, "utf8");

    // 3. Parse tests
    const tests = parseJUnit(xml);

    if (!tests.length) {
      throw new Error(
        "No Jira test keys found. Use format: KAN-2 - Test name"
      );
    }

    // 4. Upload
    const result = await uploadResults(token, tests);

    console.log("✅ Xray updated successfully");
    console.log("Execution:", result?.key || TEST_EXEC_KEY);
    console.log("Updated Tests:", tests.map(t => t.testKey));

  } catch (err) {
    if (err.response) {
    console.error("Status:", err.response.status);
    console.error("Headers:", err.response.headers);
    console.error("Data:", JSON.stringify(err.response.data, null, 2));
  } else {
    console.error("Error:", err.message);
  }
  }
};