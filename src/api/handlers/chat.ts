/**
 * Chat API Handler
 */

import type { Env, CorsHeaders } from "../types.js";

export class ChatHandler {
  async handleChat(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      console.log("💬 Chat endpoint called");
      console.log("💬 Request method:", request.method);
      console.log("💬 Request URL:", request.url);
      
      let body;
      try {
        body = await request.json() as { question: string };
      } catch (jsonError) {
        console.error("❌ Failed to parse request JSON:", jsonError);
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const { question } = body;

      console.log("💬 Chat request received:", question);

      if (!question || question.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Question is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check if API key is available
      if (!env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY not found in environment");
        return new Response(
          JSON.stringify({ error: "OpenAI API key not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("📦 Importing modules...");
      const { LLMExecutor } = await import("../../llm_execution/index.js");
      const { getConfig } = await import("../../config.js");
      
      console.log("⚙️ Getting config...");
      const config = getConfig(env);
      console.log("✅ Config received, model:", config.openai.model);
      
      console.log("🔧 Creating LLMExecutor...");
      const executor = new LLMExecutor(config);
      
      // Create a temporary prompt object for the chat question
      const chatPrompt = {
        id: `chat_${Date.now()}`,
        categoryId: "chat",
        question: question.trim(),
        language: "de",
        country: "CH",
        intent: "high" as const,
        createdAt: new Date().toISOString(),
      };
      
      console.log("🤖 Executing chat prompt with GPT-5 Web Search...");
      console.log("📋 Prompt:", JSON.stringify(chatPrompt, null, 2));
      
      // Execute with GPT-5 Web Search
      const response = await executor.executePrompt(chatPrompt);
      
      console.log("✅ Chat response received:");
      console.log("  - OutputText length:", response.outputText?.length || 0);
      console.log("  - Citations count:", response.citations?.length || 0);
      console.log("  - OutputText preview:", response.outputText?.substring(0, 200) || "EMPTY");
      
      if (!response.outputText || response.outputText.trim().length === 0) {
        console.warn("⚠️ Empty response from LLMExecutor!");
        return new Response(
          JSON.stringify({
            error: "Keine Antwort von GPT-5 erhalten. Bitte versuche es erneut.",
            answer: "",
            citations: response.citations || [],
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          answer: response.outputText,
          outputText: response.outputText, // Also include as outputText for compatibility
          citations: response.citations || [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ Error in chat handler:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : "Error";
      
      console.error("❌ Error name:", errorName);
      console.error("❌ Error message:", errorMessage);
      if (errorStack) {
        console.error("❌ Error stack:", errorStack);
      }
      
      // Log full error object for debugging
      console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Return user-friendly error message with details
      return new Response(
        JSON.stringify({
          error: errorMessage,
          errorName: errorName,
          details: errorStack ? errorStack.split('\n').slice(0, 5).join('\n') : undefined, // First 5 lines of stack
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
}

