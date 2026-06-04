import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const validateApiKeyTool = tool(
  async ({ api_key }: { api_key: string }) => {
    const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';

    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/validate`, {
        method: 'POST',
        headers: {
          'X-Api-Key': api_key,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      return JSON.stringify({
        valid: false,
        reason: `Failed to reach validation service: ${(err as Error).message}`,
      });
    }

    const body = await response.json() as Record<string, unknown>;

    if (response.ok) {
      return JSON.stringify({
        valid: true,
        key_id: body['key_id'],
        user_id: body['user_id'],
      });
    }

    return JSON.stringify({
      valid: false,
      reason: (body['error'] as string) ?? 'Invalid API key',
    });
  },
  {
    name: 'validate_api_key',
    description:
      'Validates an API key against the authentication service. ' +
      'Returns { valid: true, key_id, user_id } on success or ' +
      '{ valid: false, reason } on failure.',
    schema: z.object({
      api_key: z.string().describe('The API key to validate (format: mcp_sk_...)'),
    }),
  }
);
