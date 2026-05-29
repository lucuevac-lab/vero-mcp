import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "http";

const mcpServer = new McpServer({
  name: "vero-test-mcp",
  version: "1.0.0",
});

mcpServer.tool(
  "saludar",
  {
    nombre: z.string().describe("Nombre de la persona a saludar"),
  },
  async ({ nombre }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hola, ${nombre}. El servidor MCP funciona.`,
        },
      ],
    };
  }
);

const httpServer = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/mcp") {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
