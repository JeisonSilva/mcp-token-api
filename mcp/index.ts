import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createPipeline } from './pipeline/graph';

const pipeline = createPipeline();

const server = new Server(
  { name: 'mcp-langgraph-apikey', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'execute_pipeline',
      description:
        'Executes the secure pipeline. The guardian agent retrieves the API key ' +
        'from the MCP_API_KEY environment variable and validates it via the authentication ' +
        'service before allowing the pipeline to proceed.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'execute_pipeline') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const result = await pipeline.invoke({
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
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
