import { handleMcpRequest } from "./mcp";
import homeHtml from "./pages/home.html";
import privacyHtml from "./pages/privacy.html";
import supportHtml from "./pages/support.html";
import termsHtml from "./pages/terms.html";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return handlePageRequest(url);
    }

    if (url.pathname !== "/mcp") {
      return jsonResponse({ error: "not_found" }, 404);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    return handleMcpRequest(request);
  },
};

function handlePageRequest(url: URL): Response {
  switch (url.pathname) {
    case "/":
      return htmlResponse(
        homeHtml.replace("{{MCP_ENDPOINT}}", `${url.origin}/mcp`),
      );
    case "/privacy":
      return htmlResponse(privacyHtml);
    case "/terms":
      return htmlResponse(termsHtml);
    case "/support":
      return htmlResponse(supportHtml);
    default:
      return jsonResponse({ error: "not_found" }, 404);
  }
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
