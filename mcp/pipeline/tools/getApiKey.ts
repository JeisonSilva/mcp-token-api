import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const getApiKeyTool = tool(
  async () => {
    const apiKey = process.env.MCP_API_KEY;

    if (!apiKey) {
      return JSON.stringify({
        found: false,
        reason: 'MCP_API_KEY is not set in the environment.',
      });
    }

    return JSON.stringify({ found: true, api_key: apiKey });
  },
  {
    name: 'get_api_key',
    description:
      'Retrieves the API key configured in the MCP server environment variable MCP_API_KEY. ' +
      'Returns { found: true, api_key } on success or { found: false, reason } if not configured.',
    schema: z.object({}),
  }
);
