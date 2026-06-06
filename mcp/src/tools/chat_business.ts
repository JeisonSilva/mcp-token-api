import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { businessPipeline } from "../graph/business_pipeline.ts";

export default async function chatBusiness(server: McpServer) {
    server.registerTool("chat_business", {
        title: "Chat Business",
        description: "Agente de negócios para criação de ideias de produtos",
        inputSchema: {
            message: z.string().describe("Mensagem ou tema para geração de ideias de produtos"),
        },
    },
    async ({ message }) => {
        const result = await businessPipeline.invoke({
            apiKey: process.env.API_KEY ?? "",
            message,
        });

        return {
            content: [{ type: "text", text: result.response }]
        };
    });
}
