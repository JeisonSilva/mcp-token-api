import { ChatAnthropic } from '@langchain/anthropic';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';
import { getApiKeyTool } from '../tools/getApiKey';
import { validateApiKeyTool } from '../tools/validateApiKey';
import { PipelineStateType } from '../state';

const TOOLS: StructuredTool[] = [getApiKeyTool, validateApiKeyTool];

const GUARDIAN_SYSTEM_PROMPT = `You are a security guardian agent. Your sole responsibility is to \
retrieve and validate the configured API key before allowing any request through the pipeline.

You MUST follow these steps in order — no exceptions:
1. Call get_api_key to retrieve the API key from the environment.
2. If get_api_key returns found=false, immediately respond:
   UNAUTHORIZED: Access denied. No API key is configured in the environment.
3. Call validate_api_key with the api_key value returned in step 1.
4. After receiving the validation result, respond with exactly one of:
   - AUTHORIZED: API key is valid. Access granted.
   - UNAUTHORIZED: Access denied. Reason: <reason from validation>.

Never approve access without completing both tool calls successfully.
Never fabricate or assume the validity of a key.`;

function buildLLM() {
  return new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    temperature: 0,
    maxTokens: 512,
  }).bindTools(TOOLS);
}

export async function apiKeyGuardNode(
  state: PipelineStateType
): Promise<Partial<PipelineStateType>> {
  const llm = buildLLM();

  const conversationMessages: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(GUARDIAN_SYSTEM_PROMPT),
    new HumanMessage('Retrieve the API key from the environment and validate it. Grant or deny access based on the result.'),
  ];

  // Agentic loop: iterate until the LLM produces a final text verdict
  while (true) {
    const response = await llm.invoke(conversationMessages) as AIMessage;
    conversationMessages.push(response);

    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const content = typeof response.content === 'string' ? response.content : '';
      const isAuthorized =
        content.toUpperCase().startsWith('AUTHORIZED') &&
        !content.toUpperCase().startsWith('UNAUTHORIZED');

      return {
        messages: conversationMessages,
        isAuthorized,
        finalResult: isAuthorized
          ? 'API key validated successfully. Access granted.'
          : `Unauthorized. ${content}`,
      };
    }

    // Execute each tool call and feed results back
    for (const toolCall of toolCalls) {
      const toolFn = TOOLS.find((t) => t.name === toolCall.name);
      const result = toolFn
        ? await toolFn.invoke(toolCall.args as Record<string, unknown>)
        : JSON.stringify({ error: `Unknown tool: ${toolCall.name}` });

      conversationMessages.push(
        new ToolMessage({
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: toolCall.id ?? '',
        })
      );
    }
  }
}
