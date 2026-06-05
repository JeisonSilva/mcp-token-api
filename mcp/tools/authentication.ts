import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

export default async function authenticate(server: McpServer){
    server.registerTool("authenticate-mcp",{
        title: "Auntenticação MCP",
        description: "Autentica mcp pela api-key",
        inputSchema:{
            key: z.string().describe("API Key para autenticação")
        },
        
    },
    async ({key}) => {
        const apiAutenticacao = new ApiAuthentication();
        const isValid = await apiAutenticacao.validateApiKey(key);
        if(!isValid){
            return {
                content: [{type: "text", text: "Chave de API inválida!"}]
            }
        }

        return {
            content: [{type: "text", text: "Autenticação bem-sucedida!"}]
        }        
    })
}


class ApiAuthentication {
    private readonly baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

    async validateApiKey(key: string): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}/validate`, {
            method: "POST",
            headers: { "X-Api-Key": key },
        });
        return response.ok;
    }
}