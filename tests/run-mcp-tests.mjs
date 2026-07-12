import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";

const BASE_URL = "http://127.0.0.1:8787/mcp";

const server = spawn("npx", ["wrangler", "dev", "--ip", "127.0.0.1", "--port", "8787"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: process.platform === "win32",
});

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

try {
  await waitForServer();

  const initialize = await postMcp({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  });
  assert.equal(initialize.result.serverInfo.name, "delivery-report-extractor");

  const list = await postMcp({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });
  assert.equal(list.result.tools[0].name, "extract_delivery_report");

  const test1 = await callTool({
    report_text:
      "Summary:\nBuilt payment validation module.\n\nModified Files:\nsrc/payment.ts\n\nImplemented:\nAdded validation rules.\n\nTests:\nUnit tests passed.",
  });
  assert.equal(test1.status, "success");
  assert.equal(test1.summary, "Built payment validation module.");
  assert.deepEqual(test1.changed_files, ["src/payment.ts"]);
  assert.deepEqual(test1.implemented_items, ["Added validation rules."]);
  assert.deepEqual(test1.tests, ["Unit tests passed."]);

  const test2 = await callTool({
    report_text: "Summary:\nFixed login issue.",
  });
  assert.equal(test2.status, "success");
  assert.equal(test2.summary, "Fixed login issue.");
  assert.deepEqual(test2.changed_files, []);
  assert.deepEqual(test2.implemented_items, []);
  assert.deepEqual(test2.fixed_items, []);
  assert.deepEqual(test2.tests, []);
  assert.deepEqual(test2.notes, []);

  const test3 = await callTool({
    report_text: "",
  });
  assert.equal(test3.status, "error");
  assert.equal(test3.errors[0].code, "empty_input");

  console.log("Test 1: PASS");
  console.log("Test 2: PASS");
  console.log("Test 3: PASS");
  console.log("MCP lifecycle: PASS");
} finally {
  stopServer();
}

async function callTool(args) {
  const response = await postMcp({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "extract_delivery_report",
      arguments: args,
    },
  });

  return response.result.structuredContent;
}

async function postMcp(body) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 200);
  return response.json();
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "health",
          method: "initialize",
          params: {},
        }),
      });

      if (response.status === 200) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Server did not start. Output:\n${output}`);
}

function stopServer() {
  if (!server.pid) {
    return;
  }

  if (process.platform === "win32") {
    execFileSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  server.kill("SIGTERM");
}
