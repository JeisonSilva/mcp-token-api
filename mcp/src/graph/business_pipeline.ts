import dotenv from "dotenv";
dotenv.config();
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
    apiKey: Annotation<string>(),
    isValid: Annotation<boolean>({
        default: () => false,
        reducer: (_, y) => y,
    }),
    message: Annotation<string>(),
    response: Annotation<string>({
        default: () => "",
        reducer: (_, y) => y,
    }),
});

type PipelineState = typeof StateAnnotation.State;

const BUSINESS_SYSTEM_PROMPT = `Você é um agente de negócios especializado em criação de ideias de produtos inovadores.
Ao receber um tema ou pedido, gere ideias criativas e detalhadas de produtos. Para cada ideia apresente:
- **Nome do produto**
- **Descrição** (o que é e como funciona)
- **Público-alvo**
- **Diferenciais competitivos**
- **Próximos passos para validação**

Seja objetivo, criativo e orientado a resultados de negócio.`;

async function validateApiKey(state: PipelineState): Promise<Partial<PipelineState>> {
    const baseUrl = process.env.API_BASE_URL ?? "http://localhost";
    try {
        const response = await fetch(`${baseUrl}/validate`, {
            method: "POST",
            headers: { "X-Api-Key": state.apiKey },
        });
        return { isValid: response.ok };
    } catch {
        return { isValid: false };
    }
}

async function runBusinessAgent(state: PipelineState): Promise<Partial<PipelineState>> {
    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.8,
        configuration: {
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: process.env.OPENROUTER_SITE_URL,
        },
    });

    const result = await llm.invoke([
        new SystemMessage(BUSINESS_SYSTEM_PROMPT),
        new HumanMessage(state.message),
    ]);

    return { response: result.content as string };
}

function reject(_state: PipelineState): Partial<PipelineState> {
    return { response: "Chave de API inválida! Acesso negado." };
}

function routeAfterValidation(state: PipelineState): "runBusinessAgent" | "reject" {
    return state.isValid ? "runBusinessAgent" : "reject";
}

const graph = new StateGraph(StateAnnotation)
    .addNode("validateApiKey", validateApiKey)
    .addNode("runBusinessAgent", runBusinessAgent)
    .addNode("reject", reject)
    .addEdge(START, "validateApiKey")
    .addConditionalEdges("validateApiKey", routeAfterValidation)
    .addEdge("runBusinessAgent", END)
    .addEdge("reject", END);

export const businessPipeline = graph.compile();
