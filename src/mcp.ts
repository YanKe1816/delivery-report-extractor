import {
  DELIVERY_REPORT_OUTPUT_SCHEMA,
  EXTRACT_DELIVERY_REPORT_INPUT_SCHEMA,
} from "./schemas/delivery_report_schema";
import { extractDeliveryReport } from "./tools/extract_delivery_report";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
};

type ToolsCallParams = {
  name?: string;
  arguments?: Record<string, unknown>;
};

const SERVER_INFO = {
  name: "delivery-report-extractor",
  version: "1.0.0",
};

export async function handleMcpRequest(request: Request): Promise<Response> {
  let payload: JsonRpcRequest;

  try {
    payload = (await request.json()) as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  if (payload.jsonrpc !== "2.0" || typeof payload.method !== "string") {
    return jsonRpcError(payload.id ?? null, -32600, "Invalid Request");
  }

  switch (payload.method) {
    case "initialize":
      return jsonRpcResult(payload.id ?? null, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: SERVER_INFO,
      });

    case "tools/list":
      return jsonRpcResult(payload.id ?? null, {
        tools: [
          {
            name: "extract_delivery_report",
            description:
              "Extract structured information from AI development delivery reports.",
            inputSchema: EXTRACT_DELIVERY_REPORT_INPUT_SCHEMA,
            outputSchema: DELIVERY_REPORT_OUTPUT_SCHEMA,
            annotations: {
              readOnlyHint: true,
              openWorldHint: false,
              destructiveHint: false,
            },
          },
        ],
      });

    case "tools/call":
      return handleToolsCall(payload.id ?? null, payload.params);

    default:
      return jsonRpcError(payload.id ?? null, -32601, "Method not found");
  }
}

function handleToolsCall(id: string | number | null, params: unknown): Response {
  const callParams = params as ToolsCallParams;

  if (!callParams || callParams.name !== "extract_delivery_report") {
    return jsonRpcError(id, -32602, "Unknown tool");
  }

  const args = callParams.arguments ?? {};
  const result = extractDeliveryReport({
    report_text: typeof args.report_text === "string" ? args.report_text : "",
    source_label:
      typeof args.source_label === "string" ? args.source_label : undefined,
  });

  return jsonRpcResult(id, {
    content: [
      {
        type: "text",
        text: JSON.stringify(result),
      },
    ],
    structuredContent: result,
  });
}

function jsonRpcResult(id: string | number | null, result: unknown): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      result,
    }),
    {
      headers: { "content-type": "application/json" },
    },
  );
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
      },
    }),
    {
      status: code === -32700 ? 400 : 200,
      headers: { "content-type": "application/json" },
    },
  );
}
