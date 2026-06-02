import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createPipeline } from './pipeline/graph';

const pipeline = createPipeline();

const server = new McpServer({
  name: 'mcp-langgraph-apikey',
  version: '1.0.0',
});

server.tool(
  'execute_pipeline',
  {
    api_key: z
      .string()
      .describe('API key to validate before executing the pipeline (format: mcp_sk_...)'),
  },
  async ({ api_key }) => {
    const result = await pipeline.invoke({
      apiKey: api_key,
      messages: [],
      isAuthorized: null,
      finalResult: '',
    });

    const authorized: boolean = result.isAuthorized === true;
    const message: string = result.finalResult;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ authorized, message }, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
