#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import authenticate from "./tools/authentication.js";

const server = new McpServer({
  name: "token-authentication",
  version: "0.1.0",
  description: "MCP server for token authentication",
})

await authenticate(server);

const transport = new StdioServerTransport();
server.connect(transport);