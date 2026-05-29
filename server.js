import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "http";

function createServer() {
  const server = new McpServer({
    name: "vero-test-mcp",
    version: "1.0.0",
  });

  server.tool(
    "saludar",
    {
      nombre: z.string().describe("Nombre de la persona a saludar"),
    },
    async ({ nombre }) => ({
      content: [
        {
          type: "text",
          text: `Hola, ${nombre}. El servidor MCP funciona.`,
        },
      ],
    })
  );

  return server;
}

const httpServer = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/mcp") {
    const server = createServer();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);

      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          })
        );
      }
    }
  } else if (req.method === "GET" && req.url === "/mcp") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      })
    );
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
