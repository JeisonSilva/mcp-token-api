import { ChatAnthropic } from '@langchain/anthropic';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { validateApiKeyTool } from '../tools/validateApiKey';
import { PipelineStateType } from '../state';

const GUARDIAN_SYSTEM_PROMPT = `You are a security guardian agent. Your sole responsibility is to \
validate API keys before any request is allowed through the pipeline.

Rules you must never break:
1. Always call the validate_api_key tool with the provided key — no exceptions.
2. After receiving the tool result, respond with a single decision:
   - If valid=true → reply exactly: AUTHORIZED: API key is valid. Access granted.
   - If valid=false → reply exactly: UNAUTHORIZED: Access denied. Reason: <reason from tool>.
3. Never approve access without a successful tool call.
4. Never fabricate or assume the validity of a key.`;

function buildLLM() {
  return new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
    temperature: 0,
    maxTokens: 512,
  }).bindTools([validateApiKeyTool]);
}

export async function apiKeyGuardNode(
  state: PipelineStateType
): Promise<Partial<PipelineStateType>> {
  const llm = buildLLM();

  const conversationMessages: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(GUARDIAN_SYSTEM_PROMPT),
    new HumanMessage(`Validate the following API key and grant or deny access: ${state.apiKey}`),
  ];

  // Agentic loop: let the LLM call tools until it produces a final text response
  while (true) {
    const response = await llm.invoke(conversationMessages) as AIMessage;
    conversationMessages.push(response);

    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length === 0) {
      // LLM produced its final verdict
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

    // Execute each tool call and append results
    for (const toolCall of toolCalls) {
      const result = await validateApiKeyTool.invoke(toolCall.args as { api_key: string });
      conversationMessages.push(
        new ToolMessage({
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: toolCall.id ?? '',
        })
      );
    }
  }
}
