/**
 * Test Analysis Handler
 */

import type { Prompt, LLMResponse } from "../../types.js";
import type { Env, CorsHeaders } from "../types.js";

export class TestHandler {
  async handleTestAnalyze(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        brandName: string;
        domain?: string;
        question: string;
        answer: string; // GPT-Antwort
        citations?: Array<{
          url: string;
          title?: string;
          snippet?: string;
        }>;
      };

      if (!body.brandName || !body.question || !body.answer) {
        return new Response(
          JSON.stringify({ error: "brandName, question, and answer are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create prompt object
      const prompt: Prompt = {
        id: `test_${Date.now()}`,
        categoryId: "test",
        question: body.question,
        language: "de",
        country: "CH",
        intent: "high",
        createdAt: new Date().toISOString(),
      };

      // Create LLMResponse object
      const response: LLMResponse = {
        promptId: prompt.id,
        outputText: body.answer,
        citations: body.citations || [],
        timestamp: new Date().toISOString(),
        model: "test",
      };

      // Perform analysis
      const { AnalysisEngine } = await import("../../analysis/index.js");
      const analysisEngine = new AnalysisEngine(body.brandName, 0.7);
      const analysis = analysisEngine.analyzeResponses([prompt], [response])[0];

      // Return detailed results
      return new Response(
        JSON.stringify({
          prompt: {
            id: prompt.id,
            question: prompt.question,
          },
          response: {
            outputText: response.outputText,
            citations: response.citations,
            timestamp: response.timestamp,
          },
          analysis: {
            // Brand Mentions
            brandMentions: {
              exact: analysis.brandMentions.exact,
              fuzzy: analysis.brandMentions.fuzzy,
              total: analysis.brandMentions.exact + analysis.brandMentions.fuzzy,
              contexts: analysis.brandMentions.contexts,
            },
            // Citations
            citations: {
              total: analysis.citationCount,
              urls: analysis.citationUrls,
              brandCitations: analysis.brandCitations,
              allCitations: response.citations,
            },
            // Competitors
            competitors: analysis.competitors.map(c => ({
              name: c.name,
              count: c.count,
              contexts: c.contexts,
              citationUrls: c.citations,
            })),
            // Sentiment
            sentiment: {
              tone: analysis.sentiment.tone,
              confidence: analysis.sentiment.confidence,
              keywords: analysis.sentiment.keywords,
            },
            // Structured Answers
            isMentioned: analysis.isMentioned,
            mentionCount: analysis.mentionCount,
            isCited: analysis.isCited,
            citationDetails: analysis.citationDetails,
            competitorDetails: analysis.competitorDetails,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleTestAnalyze:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          details: error instanceof Error ? error.stack : undefined,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
}

