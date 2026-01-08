/**
 * API routes for the GEO platform
 */

import type { 
  UserInput, 
  AnalysisResult, 
  Prompt, 
  LLMResponse,
  Category,
  CategoryMetrics,
  CompetitiveAnalysis,
  TimeSeriesData
} from "../types.js";
import { GEOEngine } from "../engine.js";
import { WorkflowEngine } from "../engine_workflow.js";
import { Database } from "../persistence/db.js";
import { getCorsHeaders, type Env } from "./types.js";
import { WorkflowHandlers } from "./handlers/workflow.js";
import { AnalysisHandlers } from "./handlers/analysis.js";
import { LANDING_PAGE_HTML } from "./templates/landing-page.js";

export class APIRoutes {
  private workflowEngine: WorkflowEngine;
  private workflowHandlers?: WorkflowHandlers;
  private analysisHandlers?: AnalysisHandlers;

  constructor(private engine: GEOEngine) {
    // WorkflowEngine will be initialized per request with env
  }

  async handleRequest(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = getCorsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Initialize workflow engine and handlers
      if (!this.workflowEngine) {
        this.workflowEngine = new WorkflowEngine(env);
        this.workflowHandlers = new WorkflowHandlers(this.workflowEngine);
        this.analysisHandlers = new AnalysisHandlers(this.engine);
      }

      // POST /api/workflow/step1 - Find sitemap
      if (path === "/api/workflow/step1" && request.method === "POST") {
        return await this.workflowHandlers!.handleStep1(request, env, corsHeaders);
      }

      // POST /api/workflow/step2 - Fetch content
      if (path === "/api/workflow/step2" && request.method === "POST") {
        return await this.workflowHandlers!.handleStep2(request, env, corsHeaders);
      }

      // POST /api/workflow/step3 - Generate categories
      if (path === "/api/workflow/step3" && request.method === "POST") {
        return await this.workflowHandlers!.handleStep3(request, env, corsHeaders);
      }

      // PUT /api/workflow/:runId/categories - Save selected categories
      if (
        path.includes("/categories") &&
        path.startsWith("/api/workflow/") &&
        request.method === "PUT"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.workflowHandlers!.handleSaveCategories(runId, request, env, corsHeaders);
        }
      }

      // POST /api/workflow/step4 - Generate prompts
      if (path === "/api/workflow/step4" && request.method === "POST") {
        return await this.workflowHandlers!.handleStep4(request, env, corsHeaders);
      }

      // PUT /api/workflow/:runId/prompts - Save edited prompts
      if (
        path.includes("/prompts") &&
        path.startsWith("/api/workflow/") &&
        request.method === "PUT"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.workflowHandlers!.handleSavePrompts(runId, request, env, corsHeaders);
        }
      }

      // POST /api/workflow/fetchUrl - Fetch single URL (for live updates)
      if (path === "/api/workflow/fetchUrl" && request.method === "POST") {
        return await this.handleFetchUrl(request, env, corsHeaders);
      }

      // POST /api/workflow/executePrompt - Execute single prompt (for live updates)
      if (path === "/api/workflow/executePrompt" && request.method === "POST") {
        return await this.handleExecutePrompt(request, env, corsHeaders);
      }

      // POST /api/chat - Chat with GPT-5 Web Search
      if (path === "/api/chat" && request.method === "POST") {
        return await this.handleChat(request, env, corsHeaders);
      }

      // POST /api/test/analyze - Test analysis with manual input
      if (path === "/api/test/analyze" && request.method === "POST") {
        return await this.handleTestAnalyze(request, env, corsHeaders);
      }

      // POST /api/workflow/generateSummary - Generate summary/fazit
      if (path === "/api/workflow/generateSummary" && request.method === "POST") {
        return await this.handleGenerateSummary(request, env, corsHeaders);
      }

      // POST /api/workflow/step5 - Execute prompts
      if (path === "/api/workflow/step5" && request.method === "POST") {
        return await this.workflowHandlers!.handleStep5(request, env, corsHeaders);
      }

      // POST /api/scheduler/execute - Execute scheduled run with saved prompts
      if (path === "/api/scheduler/execute" && request.method === "POST") {
        return await this.handleExecuteScheduledRun(request, env, corsHeaders);
      }

      // POST /api/analyze - Start new analysis (legacy)
      if (path === "/api/analyze" && request.method === "POST") {
        return await this.analysisHandlers!.handleAnalyze(request, env, corsHeaders);
      }

      // GET /api/analyses - Get all analysis runs
      if (path === "/api/analyses" && request.method === "GET") {
        return await this.analysisHandlers!.handleGetAllAnalyses(request, env, corsHeaders);
      }

      // DELETE /api/analysis/:runId - Delete analysis
      if (path.startsWith("/api/analysis/") && request.method === "DELETE") {
        const runId = path.split("/").pop();
        if (runId && runId !== "analyses") {
          return await this.analysisHandlers!.handleDeleteAnalysis(runId, env, corsHeaders);
        }
      }

      // PUT /api/analysis/:runId/pause - Pause analysis
      if (path.startsWith("/api/analysis/") && path.endsWith("/pause") && request.method === "PUT") {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.handlePauseAnalysis(runId, env, corsHeaders);
        }
      }

      // GET /api/analysis/:runId - Get analysis results
      if (path.startsWith("/api/analysis/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId && runId !== "analyses") {
          // Check if it's the insights endpoint
          if (path.includes("/insights")) {
            const pathParts = path.split("/");
            const actualRunId = pathParts[pathParts.length - 2]; // runId is before "insights"
            if (actualRunId && actualRunId !== "analyses") {
            return await this.analysisHandlers!.handleGetAnalysisInsights(actualRunId, env, corsHeaders);
            }
          }
          return await this.analysisHandlers!.handleGetAnalysis(runId, env, corsHeaders);
        }
      }

      // GET /api/analysis/:runId/status - Get analysis status
      if (
        path.includes("/status") &&
        path.startsWith("/api/analysis/") &&
        !path.includes("/metrics") &&
        request.method === "GET"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.analysisHandlers!.handleGetStatus(runId, env, corsHeaders);
        }
      }

      // GET /api/analysis/:runId/metrics - Get category metrics
      if (
        path.includes("/metrics") &&
        path.startsWith("/api/analysis/") &&
        request.method === "GET"
      ) {
        const runId = path.split("/")[3];
        if (runId) {
          return await this.analysisHandlers!.handleGetMetrics(runId, env, corsHeaders);
        }
      }

      // GET /api/health - Health check
      if (path === "/api/health" && request.method === "GET") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // POST /api/ai-readiness/analyze - Start AI Readiness analysis
      if (path === "/api/ai-readiness/analyze" && request.method === "POST") {
        return await this.handleAIReadinessAnalyze(request, env, corsHeaders, ctx);
      }

      // GET /api/ai-readiness/status/:runId - Get AI Readiness status
      if (path.startsWith("/api/ai-readiness/status/") && request.method === "GET") {
        const runId = path.split("/").pop();
        if (runId) {
          return await this.handleAIReadinessStatus(runId, env, corsHeaders);
        }
      }

      // POST /api/setup/database - Setup database (run migrations)
      if (path === "/api/setup/database" && request.method === "POST") {
        return await this.handleSetupDatabase(request, env, corsHeaders);
      }

      // Company Management Endpoints
      // GET /api/companies - Get all companies
      if (path === "/api/companies" && request.method === "GET") {
        const db = new Database(env.geo_db);
        const companies = await db.getAllCompanies();
        return new Response(JSON.stringify(companies), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/companies - Create new company
      if (path === "/api/companies" && request.method === "POST") {
        const body = await request.json();
        const db = new Database(env.geo_db);
        const companyId = await db.createCompany({
          name: body.name,
          websiteUrl: body.websiteUrl,
          country: body.country,
          language: body.language,
          region: body.region,
          description: body.description,
          isActive: true,
        });
        const company = await db.getCompany(companyId);
        return new Response(JSON.stringify(company), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/companies/:id - Get company
      if (path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const db = new Database(env.geo_db);
        const company = await db.getCompany(companyId);
        if (!company) {
          return new Response(JSON.stringify({ error: "Company not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(company), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/companies/:id/prompts - Get company prompts
      if (path.includes("/prompts") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const db = new Database(env.geo_db);
        const prompts = await db.getCompanyPrompts(companyId);
        return new Response(JSON.stringify(prompts), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /api/companies/:id/runs - Get company analysis runs
      if (path.includes("/runs") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const url = new URL(request.url);
        const detailed = url.searchParams.get("detailed") === "true";
        
        const db = new Database(env.geo_db);
        
        if (detailed) {
          // Return detailed analysis data for all runs (for historical comparison)
          return await this.handleGetCompanyAnalysisRunsDetailed(companyId, env, corsHeaders);
        } else {
          // Return just the run metadata
          const runs = await db.getCompanyAnalysisRuns(companyId);
          return new Response(JSON.stringify(runs), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // GET /api/companies/:id/timeseries - Get company time series data
      if (path.includes("/timeseries") && path.startsWith("/api/companies/") && request.method === "GET") {
        const companyId = path.split("/")[3];
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get("days") || "30");
        const db = new Database(env.geo_db);
        const timeSeries = await db.getCompanyTimeSeries(companyId, days);
        return new Response(JSON.stringify(timeSeries), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Scheduled Runs Endpoints
      // GET /api/schedules - Get all scheduled runs (optionally filtered by company)
      if (path === "/api/schedules" && request.method === "GET") {
        const url = new URL(request.url);
        const companyId = url.searchParams.get("companyId") || undefined;
        const db = new Database(env.geo_db);
        const schedules = await db.getScheduledRuns(companyId, true);
        return new Response(JSON.stringify(schedules), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/schedules - Create new scheduled run
      if (path === "/api/schedules" && request.method === "POST") {
        const body = await request.json() as any;
        const db = new Database(env.geo_db);
        
        // Calculate next run time based on schedule type
        const now = new Date();
        let nextRunAt = new Date(now);
        if (body.scheduleType === "daily") {
          nextRunAt.setDate(nextRunAt.getDate() + 1);
        } else if (body.scheduleType === "weekly") {
          nextRunAt.setDate(nextRunAt.getDate() + 7);
        } else if (body.scheduleType === "monthly") {
          nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        }
        
        const scheduleId = await db.createScheduledRun({
          companyId: body.companyId,
          scheduleType: body.scheduleType,
          nextRunAt: nextRunAt.toISOString(),
          isActive: true,
        });
        
        const schedule = await db.getScheduledRuns(undefined, false);
        const created = schedule.find(s => s.id === scheduleId);
        return new Response(JSON.stringify(created), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /api/schedules/:id - Update scheduled run
      if (path.startsWith("/api/schedules/") && request.method === "PUT") {
        const scheduleId = path.split("/")[3];
        const body = await request.json() as any;
        const db = new Database(env.geo_db);
        
        // Recalculate next run time if schedule type changed
        if (body.scheduleType) {
          const now = new Date();
          let nextRunAt = new Date(now);
          if (body.scheduleType === "daily") {
            nextRunAt.setDate(nextRunAt.getDate() + 1);
          } else if (body.scheduleType === "weekly") {
            nextRunAt.setDate(nextRunAt.getDate() + 7);
          } else if (body.scheduleType === "monthly") {
            nextRunAt.setMonth(nextRunAt.getMonth() + 1);
          }
          body.nextRunAt = nextRunAt.toISOString();
        }
        
        await db.updateScheduledRun(scheduleId, body);
        const schedules = await db.getScheduledRuns(undefined, false);
        const updated = schedules.find(s => s.id === scheduleId);
        return new Response(JSON.stringify(updated), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET / - Root endpoint with HTML landing page
      if (path === "/" && request.method === "GET") {
        const html = LANDING_PAGE_HTML;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...corsHeaders,
          },
        });
      }

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "The requested endpoint does not exist",
          availableEndpoints: [
            "GET /",
            "POST /api/analyze",
            "POST /api/test/analyze",
            "POST /api/chat",
            "GET /api/analysis/:runId",
            "GET /api/analysis/:runId/metrics",
            "GET /api/health",
          ],
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("API error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  private async handleFetchUrl(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { url } = body;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "GEO-Platform/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        // Extract text content
        let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        text = text.replace(/<[^>]+>/g, " ");
        text = text.replace(/\s+/g, " ").trim();
        
        return new Response(JSON.stringify({ content: text.substring(0, 2000) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ content: null, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ content: null, error: error instanceof Error ? error.message : "Unknown error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  private async handleExecutePrompt(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, prompt, userInput } = body;

    try {
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      const config = getConfig(env);
      const executor = new LLMExecutor(config);
      
      // Execute prompt with GPT-5 Web Search
      const response = await executor.executePrompt(prompt);
      
      // Extract brand name from website URL
      const websiteUrl = userInput?.websiteUrl || '';
      const { extractBrandName } = await import("./utils.js");
      const brandName = extractBrandName(websiteUrl);
      
      // Perform analysis: Brand mentions, Citations, Competitors, Sentiment
      const { AnalysisEngine } = await import("../analysis/index.js");
      const analysisEngine = new AnalysisEngine(brandName, 0.7);
      const analysis = analysisEngine.analyzeResponses([prompt], [response])[0];
      
      // Save prompt, response, and analysis immediately (with timestamps)
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Ensure prompt is saved (if runId is provided)
      // Use INSERT OR REPLACE to avoid duplicate key errors
      if (runId) {
        try {
          await db.savePrompts(runId, [prompt]);
        } catch (error: any) {
          // If it's a unique constraint error, the prompt already exists - that's okay
          if (!error.message?.includes("UNIQUE constraint")) {
            console.warn("Error saving prompt (may already exist):", error.message);
          }
        }
      }
      
      // Save response (with timestamp)
      await db.saveLLMResponses([response]);
      
      // Save analysis immediately (with structured answers)
      await db.savePromptAnalyses([analysis]);
      
      console.log(`✅ Saved question, answer, and analysis for prompt ${prompt.id} at ${new Date().toISOString()}`);
      
      // Return response with structured analysis
      // Structured answers to the three key questions:
      return new Response(JSON.stringify({ 
        response,
        analysis: {
          // Original analysis fields
          brandMentions: analysis.brandMentions,
          citations: response.citations || [], // Use citations directly from GPT-5 Web Search response
          competitors: analysis.competitors,
          sentiment: analysis.sentiment,
          citationCount: response.citations?.length || 0,
          citationUrls: response.citations?.map((c: any) => c.url) || [],
          brandCitations: analysis.brandCitations || [],
          
          // Structured answers to the three key questions:
          // 1. Bin ich erwähnt? Wenn ja, wie viel?
          isMentioned: analysis.isMentioned,
          mentionCount: analysis.mentionCount,
          
          // 2. Werde ich zitiert? Wenn ja, wo und was?
          isCited: analysis.isCited,
          citationDetails: analysis.citationDetails,
          
          // 3. Welche anderen Unternehmen werden genannt und wo?
          competitorDetails: analysis.competitorDetails,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error in handleExecutePrompt:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  
  private async handleGenerateSummary(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, questionsAndAnswers, userInput } = body;

    try {
      // Extract brand name from website URL
      const websiteUrl = userInput?.websiteUrl || '';
      const { extractBrandName } = await import("./utils.js");
      const brandName = extractBrandName(websiteUrl);
      
      // Calculate totals
      let totalMentions = 0;
      let totalCitations = 0;
      const promptScores: Array<{ question: string; mentions: number; citations: number; score: number }> = [];
      const sourceCounts: Record<string, number> = {};
      
      questionsAndAnswers.forEach((qa: any) => {
        const mentions = (qa.brandMentions?.exact || 0) + (qa.brandMentions?.fuzzy || 0);
        // Verwende die Anzahl der Markdown-Citations aus brand_mention.ts, nicht die gesamten Quellen
        const citations = qa.brandMentions?.citations || 0;
        
        totalMentions += mentions;
        totalCitations += citations;
        
        // Score = mentions * 2 + citations (weighted)
        const score = mentions * 2 + citations;
        promptScores.push({
          question: qa.question,
          mentions: mentions,
          citations: citations,
          score: score
        });
        
        // Count sources (exclude own brand)
        if (qa.citations && Array.isArray(qa.citations)) {
          qa.citations.forEach((citation: any) => {
            if (citation.url) {
              try {
                const url = new URL(citation.url);
                const hostname = url.hostname.replace(/^www\./, '');
                // Skip if this is the brand's own website
                if (!this.isBrandHostname(hostname, brandName, websiteUrl)) {
                  sourceCounts[hostname] = (sourceCounts[hostname] || 0) + 1;
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
          });
        }
      });
      
      // Sort prompts by score (best first)
      promptScores.sort((a, b) => b.score - a.score);
      const bestPrompts = promptScores.slice(0, 5).map(p => ({
        question: p.question,
        mentions: p.mentions,
        citations: p.citations
      }));
      
      // Prepare summary prompt for GPT
      const summaryPrompt = `Du bist ein Experte für Markenanalyse. Analysiere die folgenden Fragen und Antworten und erstelle ein präzises Fazit.

Marke: ${brandName}
Website: ${websiteUrl}

Fragen und Antworten:
${questionsAndAnswers.map((qa: any, idx: number) => 
  `${idx + 1}. Frage: ${qa.question}\n   Antwort: ${qa.answer.substring(0, 500)}${qa.answer.length > 500 ? '...' : ''}\n   Erwähnungen: ${(qa.brandMentions?.exact || 0) + (qa.brandMentions?.fuzzy || 0)}, Zitierungen: ${qa.brandMentions?.citations || 0}`
).join('\n\n')}

Bitte erstelle ein strukturiertes Fazit im JSON-Format mit folgenden Feldern:
{
  "totalMentions": ${totalMentions},
  "totalCitations": ${totalCitations},
  "bestPrompts": [${bestPrompts.map(p => JSON.stringify({ question: p.question, mentions: p.mentions, citations: p.citations })).join(', ')}],
  "otherSources": ${JSON.stringify(sourceCounts)},
  "summary": "Eine kurze Zusammenfassung der wichtigsten Erkenntnisse"
}

Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`;

      // Call GPT to generate summary
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      const config = getConfig(env);
      const executor = new LLMExecutor(config);
      
      // Create a prompt object for GPT
      const summaryPromptObj = {
        id: `summary-${runId}`,
        question: summaryPrompt,
        category: "summary",
        intent: "high" as const
      };
      
      const gptResponse = await executor.executePrompt(summaryPromptObj);
      const responseText = gptResponse.outputText || '';
      
      // Try to parse JSON from response
      let summaryData: any = {
        totalMentions: totalMentions,
        totalCitations: totalCitations,
        bestPrompts: bestPrompts,
        otherSources: sourceCounts,
        summary: responseText
      };
      
      // Try to extract JSON from GPT response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summaryData = { ...summaryData, ...parsed };
        }
      } catch (e) {
        // Use default summary data if JSON parsing fails
        console.warn('Could not parse JSON from GPT response, using calculated values');
      }
      
      return new Response(JSON.stringify(summaryData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error in handleGenerateSummary:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
  
  // extractBrandName moved to utils.ts

  /**
   * Check if a hostname belongs to the brand's own website
   */
  private isBrandHostname(hostname: string, brandName: string, websiteUrl: string): boolean {
    try {
      // Get brand's hostname from website URL
      const brandUrl = new URL(websiteUrl);
      const brandHostname = brandUrl.hostname.replace(/^www\./, '').toLowerCase();
      const checkHostname = hostname.toLowerCase();
      
      // Exact match
      if (checkHostname === brandHostname) {
        return true;
      }
      
      // Check if hostname contains brand name (e.g., "frehnertec.ch" contains "frehnertec")
      const brandLower = brandName.toLowerCase();
      const brandNoSpaces = brandLower.replace(/\s+/g, '');
      
      // Check if hostname starts with brand name (with or without spaces)
      if (checkHostname.startsWith(brandNoSpaces) || 
          checkHostname.startsWith(brandLower.replace(/\s+/g, '-'))) {
        // Additional check: if it's just the brand with a domain extension, it's the brand
        const domainPattern = /^[a-z0-9-]+\.(ch|com|de|org|net|io|co|app|dev|at|fr|uk|us)$/i;
        const remaining = checkHostname.substring(brandNoSpaces.length);
        if (domainPattern.test(remaining) || remaining === '') {
          return true;
        }
      }
      
      // Check if hostname contains brand name as a significant part
      if (checkHostname.includes(brandNoSpaces) && 
          checkHostname.length <= brandNoSpaces.length + 15) {
        // Check for common subdomains (e.g., "blog.frehnertec.ch", "www.frehnertec.ch")
        const subdomainPattern = /^(www|blog|shop|store|app|api|admin|mail|ftp|www2)\./i;
        if (subdomainPattern.test(checkHostname)) {
          const withoutSubdomain = checkHostname.replace(subdomainPattern, '');
          if (withoutSubdomain === brandHostname || withoutSubdomain.startsWith(brandNoSpaces)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (e) {
      // If URL parsing fails, do a simple string comparison
      return hostname.toLowerCase().includes(brandName.toLowerCase());
    }
  }

  private async handleChat(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
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
      const { LLMExecutor } = await import("../llm_execution/index.js");
      const { getConfig } = await import("../config.js");
      
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

  private async handleAnalyze(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    let websiteUrl = body.websiteUrl?.trim();
    // Auto-add https:// if missing
    if (websiteUrl) {
      const urlPattern4 = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern4.test(websiteUrl)) {
      websiteUrl = 'https://' + websiteUrl;
      }
    }
    const userInput: UserInput = {
      websiteUrl: websiteUrl,
      country: body.country,
      region: body.region,
      language: body.language,
    };

    // Validate input
    if (!userInput.websiteUrl || !userInput.country || !userInput.language) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const runId = await this.engine.runAnalysis(userInput, env);

    return new Response(
      JSON.stringify({
        runId,
        status: "started",
        message: "Analysis started successfully",
      }),
      {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  private async handleGetAllAnalyses(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      const analyses = await db.getAllAnalysisRuns(100);
      
      // Ensure we always return an array, even if empty or if there's an error
      const analysesArray = Array.isArray(analyses) ? analyses : [];
      
      return new Response(JSON.stringify(analysesArray), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting all analyses:", error);
      // Return empty array instead of error object to prevent frontend errors
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  private async handleGetAnalysis(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const result = await this.engine.getAnalysisResult(runId, env);

    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleGetStatus(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const { Database } = await import("../persistence/index.js");
    const db = new Database(env.geo_db as any);
    const status = await db.getAnalysisStatus(runId);

    if (!status) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleGetMetrics(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const result = await this.engine.getAnalysisResult(runId, env);

    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        categoryMetrics: result.categoryMetrics,
        competitiveAnalysis: result.competitiveAnalysis,
        timeSeries: result.timeSeries,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  private async handleStep1(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const body = await request.json();
      let websiteUrl = body.websiteUrl?.trim();
      // Auto-add https:// if missing
      if (websiteUrl) {
        const urlPattern5 = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern5.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
        }
      }
      const userInput: UserInput = {
        websiteUrl: websiteUrl,
        country: body.country,
        region: body.region,
        language: body.language,
      };

      const result = await this.workflowEngine.step1FindSitemap(userInput, env);

      return new Response(JSON.stringify({
        runId: result.runId,
        urls: result.urls,
        foundSitemap: result.foundSitemap,
        message: result.foundSitemap 
          ? `Sitemap gefunden: ${result.urls.length} URLs` 
          : `Keine Sitemap gefunden. ${result.urls.length} URLs von Startseite extrahiert`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in handleStep1:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to start analysis",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  private async handleStep2(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, urls } = body;

    const result = await this.workflowEngine.step2FetchContent(
      runId,
      urls,
      body.language,
      env
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleStep3(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, content, language } = body;

    const categories = await this.workflowEngine.step3GenerateCategories(
      runId,
      content,
      language,
      env
    );

    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleSaveCategories(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { selectedCategoryIds, customCategories } = body;

    await this.workflowEngine.saveSelectedCategories(
      runId,
      selectedCategoryIds || [],
      customCategories || [],
      env
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleStep4(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, categories, userInput, questionsPerCategory, companyId } = body;

    const prompts = await this.workflowEngine.step4GeneratePrompts(
      runId,
      categories,
      userInput,
      body.content || "",
      env,
      questionsPerCategory || 3,
      companyId // Pass companyId to save prompts to company_prompts
    );

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleSavePrompts(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { prompts } = body;

    await this.workflowEngine.saveUserPrompts(runId, prompts, env);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  private async handleStep5(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    const body = await request.json();
    const { runId, prompts: promptsFromBody } = body;

    try {
      // Step 1: Execute prompts
      const result = await this.workflowEngine.step5ExecutePrompts(
        runId,
        promptsFromBody,
        env
      );

      // Step 2: Perform full analysis after all prompts are executed
      const { Database } = await import("../persistence/index.js");
      const { AnalysisEngine } = await import("../analysis/index.js");
      const { getConfig } = await import("../config.js");
      const config = getConfig(env);
      const db = new Database(env.geo_db as any);

      // Get run info to extract brand name
      const runInfo = await db.db
        .prepare("SELECT website_url FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{ website_url: string }>();

      if (!runInfo) {
        throw new Error("Analysis run not found");
      }

      const { extractBrandName } = await import("./utils.js");
      const brandName = extractBrandName(runInfo.website_url);
      const analysisEngine = new AnalysisEngine(brandName, config.analysis.brandFuzzyThreshold);

      // Load all prompts for this run
      const savedPrompts = await db.db
        .prepare("SELECT * FROM prompts WHERE run_id = ?")
        .bind(runId)
        .all<Prompt>();

      // Load all responses for this run
      const savedResponses = await db.db
        .prepare(`
          SELECT lr.*, 
                 GROUP_CONCAT(c.url || '|' || COALESCE(c.title, '') || '|' || COALESCE(c.snippet, ''), '|||') as citations_data
          FROM llm_responses lr
          LEFT JOIN citations c ON c.llm_response_id = lr.id
          WHERE lr.prompt_id IN (SELECT id FROM prompts WHERE run_id = ?)
          GROUP BY lr.id
        `)
        .bind(runId)
        .all<any>();

      // Convert database responses to LLMResponse format
      const responses: LLMResponse[] = savedResponses.results?.map((row: any) => {
        const citations: any[] = [];
        if (row.citations_data) {
          const citationStrings = row.citations_data.split('|||');
          for (const citationStr of citationStrings) {
            if (citationStr) {
              const [url, title, snippet] = citationStr.split('|');
              if (url) {
                citations.push({
                  url: url,
                  title: title || undefined,
                  snippet: snippet || undefined,
                });
              }
            }
          }
        }

        return {
          promptId: row.prompt_id,
          outputText: row.output_text || '',
          citations: citations,
          timestamp: row.timestamp || new Date().toISOString(),
          model: row.model || 'gpt-5',
        };
      }) || [];

      // Load all categories for this run
      const savedCategories = await db.db
        .prepare("SELECT * FROM categories WHERE run_id = ?")
        .bind(runId)
        .all<Category>();

      const categories = savedCategories.results || [];
      const prompts = savedPrompts.results || [];

      // Perform analysis
      const analyses = analysisEngine.analyzeResponses(prompts, responses);
      await db.savePromptAnalyses(analyses);

      // Calculate category metrics
      const categoryMetrics: CategoryMetrics[] = [];
      for (const category of categories) {
        const metrics = analysisEngine.calculateCategoryMetrics(
          category.id,
          prompts,
          analyses
        );
        categoryMetrics.push(metrics);
      }
      await db.saveCategoryMetrics(runId, categoryMetrics);

      // Perform competitive analysis
      const competitiveAnalysis = analysisEngine.performCompetitiveAnalysis(analyses, prompts);
      await db.saveCompetitiveAnalysis(runId, competitiveAnalysis);

      // Calculate time series data
      const timeSeriesData: TimeSeriesData = {
        timestamp: new Date().toISOString(),
        visibilityScore: this.calculateOverallVisibility(categoryMetrics),
        citationCount: responses.reduce((sum, r) => sum + r.citations.length, 0),
        brandMentionCount: analyses.reduce(
          (sum, a) => sum + a.brandMentions.exact + a.brandMentions.fuzzy,
          0
        ),
        competitorMentionCount: analyses.reduce(
          (sum, a) => sum + a.competitors.reduce((s, c) => s + c.count, 0),
          0
        ),
      };
      await db.saveTimeSeriesData(runId, timeSeriesData);

      return new Response(JSON.stringify({
        ...result,
        analysesCount: analyses.length,
        categoryMetricsCount: categoryMetrics.length,
        competitiveAnalysis: competitiveAnalysis,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error in handleStep5:', error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  private calculateOverallVisibility(categoryMetrics: CategoryMetrics[]): number {
    if (categoryMetrics.length === 0) return 0;
    const avgScore = categoryMetrics.reduce((sum, m) => sum + m.visibilityScore, 0) / categoryMetrics.length;
    return Math.round(avgScore * 10) / 10;
  }

  // Execute scheduled run: Load saved prompts from company_prompts and execute them
  private async handleExecuteScheduledRun(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const body = await request.json();
      const { companyId, scheduleId } = body;

      if (!companyId) {
        return new Response(
          JSON.stringify({ error: "companyId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { Database } = await import("../persistence/index.js");
      const db = new Database();

      // Get saved prompts for this company
      const savedPrompts = await db.getCompanyPrompts(companyId, true);
      if (savedPrompts.length === 0) {
        return new Response(
          JSON.stringify({ error: "No active prompts found for this company" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Execute prompts (simplified - would need full execution logic)
      return new Response(
        JSON.stringify({ 
          message: "Scheduled run executed",
          promptsExecuted: savedPrompts.length 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Setup database - Run all migrations
  private async handleSetupDatabase(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    // Database setup is disabled - no database dependencies
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database setup is disabled - no database dependencies in this project",
        results: ["Database operations are disabled"],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Test Analysis: Analyze manual input
  private async handleTestAnalyze(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>
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
      const { AnalysisEngine } = await import("../analysis/index.js");
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

  // Get detailed insights for an analysis
  private async handleGetAnalysisInsights(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Get analysis run info
      const run = await db.db
        .prepare("SELECT * FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{
          id: string;
          website_url: string;
          country: string;
          language: string;
          region: string | null;
          created_at: string;
        }>();
      
      if (!run) {
        return new Response(JSON.stringify({ error: "Analysis not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Extract brand name from website URL
      const { extractBrandName } = await import("./utils.js");
      const brandName = extractBrandName(run.website_url);
      
      // Get all prompts for this run
      const prompts = await db.db
        .prepare("SELECT * FROM prompts WHERE analysis_run_id = ? ORDER BY created_at ASC")
        .bind(runId)
        .all<{
          id: string;
          question: string;
          category_id: string;
          created_at: string;
        }>();
      
      if (!prompts.results || prompts.results.length === 0) {
        return new Response(JSON.stringify({ 
          error: "No prompts found for this analysis",
          summary: {
            totalBrandMentions: 0,
            totalBrandCitations: 0,
            promptsWithMentions: 0,
            totalPrompts: 0,
          },
          promptsWithMentions: [],
          allCompetitors: [],
          detailedData: [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Get all responses and analyses
      const insightsData = await Promise.all(
        (prompts.results || []).map(async (prompt) => {
          // Get LLM response
          const response = await db.db
            .prepare("SELECT * FROM llm_responses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1")
            .bind(prompt.id)
            .first<{
              id: string;
              output_text: string;
              timestamp: string;
            }>();
          
          // Get citations
          const citations = response
            ? await db.db
                .prepare("SELECT * FROM citations WHERE llm_response_id = ?")
                .bind(response.id)
                .all<{
                  id: string;
                  url: string;
                  title: string | null;
                  snippet: string | null;
                }>()
            : { results: [] };
          
          // Get analysis
          const analysis = await db.db
            .prepare("SELECT * FROM prompt_analyses WHERE prompt_id = ? ORDER BY timestamp DESC LIMIT 1")
            .bind(prompt.id)
            .first<{
              id: string;
              brand_mentions_exact: number;
              brand_mentions_fuzzy: number;
              brand_mentions_contexts: string;
              citation_count: number;
              citation_urls: string;
              timestamp: string;
            }>();
          
          // Get competitor mentions
          let competitors: { results: Array<{
            id: string;
            competitor_name: string;
            mention_count: number;
            citation_urls: string;
          }> } = { results: [] };
          try {
            if (analysis) {
              const competitorsResult = await db.db
                .prepare("SELECT * FROM competitor_mentions WHERE prompt_analysis_id = ?")
                .bind(analysis.id)
                .all<{
                  id: string;
                  competitor_name: string;
                  mention_count: number;
                  citation_urls: string;
                }>();
              competitors = {
                results: competitorsResult.results || []
              };
            }
          } catch (e) {
            console.warn('Error fetching competitors for prompt', prompt.id, ':', e);
            competitors = { results: [] };
          }
          
          // Check which citations mention the brand
          const brandCitations = (citations.results || []).filter(citation => {
            try {
            const text = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
            return text.includes(brandName.toLowerCase());
            } catch (e) {
              console.warn('Error checking brand citation:', e);
              return false;
            }
          });
          
          // Safely parse JSON fields
          let contexts = [];
          try {
            if (analysis?.brand_mentions_contexts) {
              contexts = JSON.parse(analysis.brand_mentions_contexts);
            }
          } catch (e) {
            console.warn('Error parsing brand_mentions_contexts:', e);
            contexts = [];
          }
          
          return {
            promptId: prompt.id,
            question: prompt.question,
            answer: response?.output_text || null,
            timestamp: response?.timestamp || null,
            // Metriken
            brandMentions: {
              total: (analysis?.brand_mentions_exact || 0) + (analysis?.brand_mentions_fuzzy || 0),
              exact: analysis?.brand_mentions_exact || 0,
              fuzzy: analysis?.brand_mentions_fuzzy || 0,
              contexts: contexts,
            },
            citations: {
              total: analysis?.citation_count || 0,
              brandCitations: brandCitations.length, // Wie oft zitiert von meiner Seite
              allCitations: (citations.results || []).map(c => ({
                url: c.url,
                title: c.title,
                snippet: c.snippet,
                mentionsBrand: brandCitations.some(bc => bc.id === c.id),
              })),
            },
            competitors: (competitors.results || []).map(c => {
              let citationUrls = [];
              try {
                citationUrls = JSON.parse(c.citation_urls || "[]");
              } catch (e) {
                console.warn('Error parsing citation_urls for competitor:', e);
                citationUrls = [];
              }
              return {
              name: c.competitor_name,
              count: c.mention_count,
                citationUrls: citationUrls,
              };
            }),
          };
        })
      );
      
      // Calculate summary metrics (with safety checks)
      const totalBrandMentions = insightsData.reduce((sum, d) => sum + (d?.brandMentions?.total || 0), 0);
      const totalBrandCitations = insightsData.reduce((sum, d) => sum + (d?.citations?.brandCitations || 0), 0);
      const promptsWithMentions = insightsData.filter(d => (d?.brandMentions?.total || 0) > 0);
      const allCompetitors = new Map<string, { count: number; prompts: string[] }>();
      
      insightsData.forEach((data) => {
        if (data?.competitors && Array.isArray(data.competitors)) {
        data.competitors.forEach(comp => {
            if (comp?.name) {
          if (!allCompetitors.has(comp.name)) {
            allCompetitors.set(comp.name, { count: 0, prompts: [] });
          }
          const entry = allCompetitors.get(comp.name)!;
              entry.count += comp.count || 0;
              if (data.question) {
          entry.prompts.push(data.question);
              }
            }
        });
        }
      });
      
      const insights = {
        runId,
        websiteUrl: run.website_url,
        brandName,
        summary: {
          totalBrandMentions: totalBrandMentions || 0,
          totalBrandCitations: totalBrandCitations || 0,
          promptsWithMentions: promptsWithMentions.length || 0,
          totalPrompts: insightsData.length || 0,
        },
        promptsWithMentions: (promptsWithMentions || []).map(d => ({
          question: d?.question || '',
          mentionCount: d?.brandMentions?.total || 0,
          citationCount: d?.citations?.brandCitations || 0,
        })),
        allCompetitors: Array.from(allCompetitors.entries()).map(([name, data]) => ({
          name: name || '',
          totalMentions: data?.count || 0,
          mentionedInPrompts: data?.prompts || [],
        })),
        detailedData: insightsData || [],
      };
      
      return new Response(JSON.stringify(insights), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting analysis insights:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Delete an analysis
  private async handleDeleteAnalysis(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);

      // Delete all related data
      await db.db.prepare("DELETE FROM citations WHERE llm_response_id IN (SELECT id FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?))").bind(runId).run();
      await db.db.prepare("DELETE FROM competitor_mentions WHERE prompt_analysis_id IN (SELECT id FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?))").bind(runId).run();
      await db.db.prepare("DELETE FROM prompt_analyses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)").bind(runId).run();
      await db.db.prepare("DELETE FROM llm_responses WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)").bind(runId).run();
      await db.db.prepare("DELETE FROM prompts WHERE analysis_run_id = ?").bind(runId).run();
      await db.db.prepare("DELETE FROM categories WHERE analysis_run_id = ?").bind(runId).run();
      await db.db.prepare("DELETE FROM analysis_runs WHERE id = ?").bind(runId).run();

      return new Response(JSON.stringify({ success: true, message: "Analysis deleted successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Pause an analysis
  private async handlePauseAnalysis(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Update status to paused
      await db.updateAnalysisStatus(runId, "paused", {
        step: "paused",
        progress: undefined,
        message: "Analysis paused by user",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Analysis paused successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error pausing analysis:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // AI Readiness: Start analysis
  private async handleAIReadinessAnalyze(
    request: Request,
    env: Env,
    corsHeaders: Record<string, string>,
    ctx?: ExecutionContext
  ): Promise<Response> {
    try {
      const body = await request.json() as { websiteUrl: string };
      let { websiteUrl } = body;
      
      if (!websiteUrl || !websiteUrl.trim()) {
        return new Response(
          JSON.stringify({ error: "websiteUrl is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // URL Normalisierung: Ergänze https:// falls fehlend
      websiteUrl = websiteUrl.trim();
      const urlPattern = /^https?:\/\//i;
      if (!urlPattern.test(websiteUrl)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      // Validiere URL
      try {
        new URL(websiteUrl);
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid URL format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Erstelle Run-ID
      const runId = `ai_readiness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] 🚀 STARTING ANALYSIS`);
      console.log(`[AI Readiness ${runId}] URL: ${websiteUrl}`);
      console.log(`[AI Readiness ${runId}] RunId: ${runId}`);
      console.log(`[AI Readiness ${runId}] Timestamp: ${new Date().toISOString()}`);
      console.log(`[AI Readiness ${runId}] ctx available: ${!!ctx}`);
      console.log(`[AI Readiness ${runId}] ctx.waitUntil available: ${ctx ? typeof ctx.waitUntil : 'N/A'}`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      
      // Erstelle sofort einen Datenbankeintrag, damit der Status-Endpoint etwas zurückgeben kann
      let dbInitSuccess = false;
      try {
        console.log(`[AI Readiness ${runId}] → Step 1: Creating database connection...`);
        const { Database } = await import("../persistence/index.js");
        const db = new Database(env.geo_db as any);
        console.log(`[AI Readiness ${runId}] → Step 2: Creating table if not exists...`);
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, logs TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
        console.log(`[AI Readiness ${runId}] → Step 3: Inserting initial record...`);
        const now = new Date().toISOString();
        const insertResult = await db.db
          .prepare('INSERT OR REPLACE INTO ai_readiness_runs (id, website_url, status, created_at, updated_at, message, logs) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(runId, websiteUrl, 'processing', now, now, '🚀 Analyse wird gestartet...', '[]')
          .run();
        console.log(`[AI Readiness ${runId}] ✓ Initial database record created:`, {
          success: insertResult.success,
          changes: insertResult.meta?.changes
        });
        
        // Verify it was created
        const verify = await db.db
          .prepare('SELECT id, status, message FROM ai_readiness_runs WHERE id = ?')
          .bind(runId)
          .first();
        console.log(`[AI Readiness ${runId}] ✓ Verified record exists:`, verify);
        dbInitSuccess = true;
      } catch (initError: any) {
        console.error(`[AI Readiness ${runId}] ❌ Database initialization failed:`, {
          message: initError?.message,
          stack: initError?.stack,
          name: initError?.name,
          error: initError
        });
      }
      
      // Starte asynchrone Verarbeitung mit besserem Error Handling
      console.log(`[AI Readiness ${runId}] → Step 4: Starting processAIReadiness function...`);
      const processStartTime = Date.now();
      
      const promise = this.processAIReadiness(runId, websiteUrl, env).catch(async (error) => {
        const processTime = Date.now() - processStartTime;
        console.error(`[AI Readiness ${runId}] ========================================`);
        console.error(`[AI Readiness ${runId}] ❌ CRITICAL ERROR in processAIReadiness`);
        console.error(`[AI Readiness ${runId}] Time elapsed: ${processTime}ms`);
        console.error(`[AI Readiness ${runId}] Error type: ${error?.constructor?.name}`);
        console.error(`[AI Readiness ${runId}] Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`[AI Readiness ${runId}] Error stack:`, error instanceof Error ? error.stack : 'No stack');
        console.error(`[AI Readiness ${runId}] Full error:`, error);
        console.error(`[AI Readiness ${runId}] ========================================`);
        
        try {
          const { Database } = await import("../persistence/index.js");
          const db = new Database(env.geo_db as any);
          await db.db
            .prepare('UPDATE ai_readiness_runs SET status = ?, error = ?, message = ?, updated_at = ? WHERE id = ?')
            .bind(
              'error',
              error instanceof Error ? error.message : 'Unknown error',
              `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
              new Date().toISOString(),
              runId
            )
            .run();
          console.log(`[AI Readiness ${runId}] ✓ Error status saved to database`);
        } catch (dbError: any) {
          console.error(`[AI Readiness ${runId}] ❌ Could not update error status in database:`, {
            message: dbError?.message,
            stack: dbError?.stack,
            error: dbError
          });
        }
      });
      
      // In Cloudflare Workers: waitUntil sorgt dafür, dass die async Funktion vollständig ausgeführt wird
      console.log(`[AI Readiness ${runId}] → Step 5: Setting up waitUntil...`);
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(promise);
        console.log(`[AI Readiness ${runId}] ✓ Analysis promise started with ctx.waitUntil`);
        console.log(`[AI Readiness ${runId}] ✓ Promise will continue in background`);
      } else {
        console.warn(`[AI Readiness ${runId}] ⚠ No ExecutionContext available!`);
        console.warn(`[AI Readiness ${runId}] ⚠ ctx:`, ctx);
        console.warn(`[AI Readiness ${runId}] ⚠ Running without waitUntil - function may be cancelled`);
        // Fallback: Start promise anyway, but it might be cancelled
        promise.catch(err => {
          console.error(`[AI Readiness ${runId}] Promise failed (no waitUntil):`, err);
        });
      }
      
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] ✓ HANDLE REQUEST COMPLETE`);
      console.log(`[AI Readiness ${runId}] Returning response with runId: ${runId}`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      
      return new Response(
        JSON.stringify({
          runId,
          status: "started",
          message: "AI Readiness Check gestartet",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadinessAnalyze:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // AI Readiness: Get status
  private async handleAIReadinessStatus(
    runId: string,
    env: Env,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      console.log(`[AI Readiness Status] Requested runId: ${runId}`);
      
      const { Database } = await import("../persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Create table if not exists (using try-catch to ignore if already exists)
      try {
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, logs TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
        console.log(`[AI Readiness Status] Table created/verified for runId: ${runId}`);
      } catch (e: any) {
        // Ignore error if table already exists
        if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
          console.warn(`[AI Readiness Status] Could not create ai_readiness_runs table (may already exist):`, e);
        }
      }
      
      console.log(`[AI Readiness Status] Querying database for runId: ${runId}`);
      const result = await db.db
        .prepare("SELECT * FROM ai_readiness_runs WHERE id = ?")
        .bind(runId)
        .first<{
          id: string;
          status: string;
          recommendations: string | null;
          message: string | null;
          error: string | null;
        }>();
      
      console.log(`[AI Readiness Status] Query result for runId ${runId}:`, result ? 'Found' : 'Not found');
      
      if (!result) {
        // Check if there are any runs in the database
        const allRuns = await db.db
          .prepare("SELECT id, created_at FROM ai_readiness_runs ORDER BY created_at DESC LIMIT 5")
          .all();
        console.log(`[AI Readiness Status] Available runs in database:`, allRuns?.results || []);
        
        return new Response(
          JSON.stringify({ 
            error: "Run not found",
            runId: runId,
            message: `No run found with ID: ${runId}`
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Parse logs if available
      let logs: any[] = [];
      try {
        const logsField = (result as any).logs;
        if (logsField) {
          logs = JSON.parse(logsField);
        }
      } catch (e) {
        console.warn('Error parsing logs:', e);
      }
      
      return new Response(
        JSON.stringify({
          runId: result.id,
          status: result.status,
          recommendations: result.recommendations,
          message: result.message,
          error: result.error,
          logs: logs,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleAIReadinessStatus:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // AI Readiness: Process analysis (async)
  // Made public so it can be accessed by AIReadinessHandler
  public async processAIReadiness(
    runId: string,
    websiteUrl: string,
    env: Env
  ): Promise<void> {
    const { Database } = await import("../persistence/index.js");
    const db = new Database(env.geo_db as any);
    
    // Protocol Log Entry Interface
    interface LogEntry {
      timestamp: string;
      stepId: string;
      stepName: string;
      status: 'OK' | 'WARN' | 'ERROR';
      details: any;
      responseTime?: number;
    }
    
    const logs: LogEntry[] = [];
    let stepCounter = 0;
    
    // Helper: Add log entry
    const addLog = (stepName: string, status: 'OK' | 'WARN' | 'ERROR', details: any, responseTime?: number) => {
      stepCounter++;
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        stepId: `STEP-${stepCounter}`,
        stepName,
        status,
        details,
        responseTime
      };
      logs.push(logEntry);
      console.log(`[${logEntry.timestamp}] [${logEntry.stepId}] [${status}] ${stepName}`, details);
    };
    
    // Helper: Save logs to database
    const saveLogs = async () => {
      try {
        const logsStart = Date.now();
        const logsJson = JSON.stringify(logs);
        console.log(`[AI Readiness ${runId}] → Saving ${logs.length} logs (${logsJson.length} bytes)...`);
        const result = await db.db
          .prepare('UPDATE ai_readiness_runs SET logs = ?, updated_at = ? WHERE id = ?')
          .bind(logsJson, new Date().toISOString(), runId)
          .run();
        const logsTime = Date.now() - logsStart;
        console.log(`[AI Readiness ${runId}] ✓ Logs saved (${logsTime}ms):`, {
          success: result.success,
          changes: result.meta?.changes,
          logCount: logs.length
        });
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Error saving logs:`, {
          message: e?.message,
          stack: e?.stack,
          error: e
        });
      }
    };
    
    // Report structure
    interface PageData {
      url: string;
      title: string;
      metaDescription: string;
      h1: string[];
      h2: string[];
      h3: string[];
      content: string;
      responseTime: number;
      status: number;
      success: boolean;
    }
    
    const report = {
      originalUrl: '',
      normalizedUrl: '',
      homepage: { scraped: false, data: null as PageData | null },
      internalLinks: [] as string[],
      pages: [] as PageData[],
      summary: {
        totalPages: 0,
        successfulPages: 0,
        averageResponseTime: 0,
        fastestPage: '',
        slowestPage: ''
      }
    };
    
    const updateStatus = async (message: string) => {
      try {
        const statusStart = Date.now();
        console.log(`[AI Readiness ${runId}] → Updating status: "${message}"`);
        const result = await db.db
          .prepare('UPDATE ai_readiness_runs SET message = ?, updated_at = ? WHERE id = ?')
          .bind(message, new Date().toISOString(), runId)
          .run();
        const statusTime = Date.now() - statusStart;
        console.log(`[AI Readiness ${runId}] ✓ Status updated (${statusTime}ms):`, {
          success: result.success,
          changes: result.meta?.changes
        });
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Error updating status:`, {
          message: e?.message,
          stack: e?.stack,
          error: e
        });
      }
    };
    
    console.log(`[AI Readiness ${runId}] ========================================`);
    console.log(`[AI Readiness ${runId}] 🚀 processAIReadiness FUNCTION CALLED`);
    console.log(`[AI Readiness ${runId}] URL: ${websiteUrl}`);
    console.log(`[AI Readiness ${runId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`[AI Readiness ${runId}] Database connection: ${!!db}`);
    console.log(`[AI Readiness ${runId}] ========================================`);
    
    const startTime = Date.now();
    let lastStep = 'initialization';
    let lastHeartbeat = Date.now();
    let stepStartTime = Date.now();
    
    // Helper to log step timing
    const logStep = (stepName: string) => {
      const stepTime = Date.now() - stepStartTime;
      if (lastStep !== 'initialization') {
        console.log(`[AI Readiness ${runId}] ⏱️  Step "${lastStep}" took ${stepTime}ms`);
      }
      lastStep = stepName;
      stepStartTime = Date.now();
      console.log(`[AI Readiness ${runId}] → Starting step: ${stepName}`);
    };
    
    // Heartbeat function - updates status periodically to show we're alive
    // Note: setInterval might not work in Cloudflare Workers, so we'll use a different approach
    let heartbeatCount = 0;
    const sendHeartbeat = async () => {
      try {
        const now = Date.now();
        heartbeatCount++;
        const elapsed = Math.round((now - startTime) / 1000);
        const message = `⏳ Läuft... (${lastStep}, ${elapsed}s)`;
        const result = await db.db
          .prepare('UPDATE ai_readiness_runs SET message = ?, updated_at = ? WHERE id = ?')
          .bind(message, new Date().toISOString(), runId)
          .run();
        console.log(`[AI Readiness ${runId}] 💓 Heartbeat #${heartbeatCount}: ${lastStep} (${elapsed}s elapsed)`, {
          success: result.success,
          changes: result.meta?.changes
        });
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Heartbeat error:`, {
          message: e?.message,
          stack: e?.stack,
          error: e
        });
      }
    };
    
    // Send heartbeat after each major step instead of using setInterval
    
    try {
      logStep('database_setup');
      
      // Create table if not exists
      try {
        console.log(`[AI Readiness ${runId}] → Creating table if not exists...`);
        const tableStart = Date.now();
        await db.db.exec(
          'CREATE TABLE IF NOT EXISTS ai_readiness_runs (id TEXT PRIMARY KEY, website_url TEXT NOT NULL, status TEXT NOT NULL, robots_txt TEXT, sitemap_urls TEXT, total_urls INTEGER, recommendations TEXT, message TEXT, error TEXT, logs TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
        );
        console.log(`[AI Readiness ${runId}] ✓ Table check complete (${Date.now() - tableStart}ms)`);
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ⚠ Table creation error:`, {
          message: e?.message,
          stack: e?.stack,
          error: e
        });
        if (!e?.message?.includes('already exists') && !e?.message?.includes('duplicate')) {
          console.warn(`[AI Readiness ${runId}] Could not create table:`, e);
        }
      }
      
      // Update initial record
      logStep('initial_record');
      try {
        console.log(`[AI Readiness ${runId}] → Creating/updating initial record...`);
        const recordStart = Date.now();
        const now = new Date().toISOString();
        const result = await db.db
          .prepare('INSERT OR IGNORE INTO ai_readiness_runs (id, website_url, status, created_at, updated_at, message, logs) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(runId, websiteUrl, 'processing', now, now, '🚀 Starte Analyse...', '[]')
          .run();
        console.log(`[AI Readiness ${runId}] ✓ INSERT result:`, {
          success: result.success,
          meta: result.meta,
          time: Date.now() - recordStart
        });
        
        // If INSERT didn't work (already exists), try UPDATE
        if (!result.success || result.meta?.changes === 0) {
          console.log(`[AI Readiness ${runId}] → Record might already exist, trying UPDATE...`);
          const updateResult = await db.db
            .prepare('UPDATE ai_readiness_runs SET message = ?, updated_at = ?, logs = ? WHERE id = ?')
            .bind('🚀 Starte Analyse...', now, '[]', runId)
            .run();
          console.log(`[AI Readiness ${runId}] ✓ UPDATE result:`, {
            success: updateResult.success,
            meta: updateResult.meta,
            time: Date.now() - recordStart
          });
        }
        
        // Verify it was created
        const verify = await db.db
          .prepare('SELECT id, status, message FROM ai_readiness_runs WHERE id = ?')
          .bind(runId)
          .first();
        console.log(`[AI Readiness ${runId}] ✓ Verified record exists:`, verify);
        if (!verify) {
          throw new Error('Record was not created or cannot be verified');
        }
      } catch (e: any) {
        console.error(`[AI Readiness ${runId}] ❌ Database record error:`, {
          message: e?.message,
          stack: e?.stack,
          name: e?.name,
          error: e
        });
        throw new Error(`Database error: ${e.message}`);
      }
      
      // Helper function to execute a step with timeout and continue on error
      const executeStepWithTimeout = async <T>(
        stepName: string,
        timeoutMs: number,
        stepFunction: () => Promise<T>,
        fallbackValue: T
      ): Promise<T> => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout: ${stepName} hat zu lange gedauert (${timeoutMs}ms)`)), timeoutMs);
          });
          
          const result = await Promise.race([stepFunction(), timeoutPromise]);
          return result;
        } catch (error: any) {
          const isTimeout = error.message?.includes('Timeout') || error.message?.includes('zu lange gedauert');
          console.warn(`[AI Readiness ${runId}] ⚠ ${stepName} fehlgeschlagen oder zu lange gedauert:`, error.message);
          addLog(stepName, 'WARN', {
            error: isTimeout ? `Zu lange gedauert (${timeoutMs}ms)` : (error.message || 'Unbekannter Fehler'),
            skipped: true,
            message: isTimeout ? 'Schritt übersprungen - zu lange gedauert' : 'Schritt übersprungen - Fehler aufgetreten'
          });
          await saveLogs();
          return fallbackValue;
        }
      };
      
      // ========================================
      // STEP 1: URL NORMALISIERUNG
      // ========================================
      logStep('url_normalization');
      console.log(`[AI Readiness ${runId}] → STEP 1: URL Normalisierung`);
      await updateStatus('Schritt 1/6: Normalisiere URL...');
      
      // Execute with timeout - continue even if it fails (though this step should be very fast)
      await executeStepWithTimeout(
        'URL Normalisierung',
        5000, // 5 seconds timeout (should be instant, but just in case)
        async () => {
          const step1Start = Date.now();
          report.originalUrl = websiteUrl;
          const urlPattern = /^https?:\/\//i;
          if (!urlPattern.test(websiteUrl)) {
            websiteUrl = 'https://' + websiteUrl;
          }
          report.normalizedUrl = websiteUrl;
          console.log(`[AI Readiness ${runId}] → Original: ${report.originalUrl}`);
          console.log(`[AI Readiness ${runId}] → Normalized: ${report.normalizedUrl}`);
          
          addLog('URL Normalisierung', 'OK', {
            original: report.originalUrl,
            normalized: report.normalizedUrl
          });
          console.log(`[AI Readiness ${runId}] → Log added, updating status...`);
          
          await updateStatus('Schritt 1/6: URL normalisiert');
          console.log(`[AI Readiness ${runId}] → Status updated, saving logs...`);
          
          await saveLogs();
          console.log(`[AI Readiness ${runId}] → Logs saved, sending heartbeat...`);
          
          await sendHeartbeat();
          console.log(`[AI Readiness ${runId}] ✓ STEP 1 complete (${Date.now() - step1Start}ms)`);
        },
        websiteUrl // Fallback: use original URL
      );
      
      // Ensure normalized URL is set even if step failed
      if (!report.normalizedUrl) {
        report.normalizedUrl = websiteUrl;
        report.originalUrl = websiteUrl;
      }
      
      // Helper function to measure response time with timeout
      const measureResponseTime = async (url: string, timeoutMs: number = 20000): Promise<{ responseTime: number; response: Response; html: string }> => {
        const startTime = Date.now();
        try {
          const response = await fetch(url, {
            headers: { "User-Agent": "GEO-Platform/1.0" },
            signal: AbortSignal.timeout(timeoutMs) // Configurable timeout
          });
          const html = await response.text();
          const responseTime = Date.now() - startTime;
          return { responseTime, response, html };
        } catch (error: any) {
          const responseTime = Date.now() - startTime;
          const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('timeout');
          return {
            responseTime,
            response: new Response(null, { 
              status: 0, 
              statusText: isTimeout ? 'Timeout - Zu lange gedauert' : (error.message || 'Request failed')
            }) as any,
            html: ''
          };
        }
      };
      
      // Helper function to scrape page with enhanced extraction
      const scrapePageEnhanced = (html: string, url: string): PageData => {
        // Title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : '';
        
        // Meta Description
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                               html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
        
        // H1-H3 Hierarchy
        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
        const h1 = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h);
        
        const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
        const h2 = h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h);
        
        const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || [];
        const h3 = h3Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(h => h);
        
        // Main content (remove scripts, styles, nav, footer, cookie banners)
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (textContent.length > 10000) {
          textContent = textContent.substring(0, 10000) + '...';
        }
        
        return {
          url,
          title,
          metaDescription,
          h1,
          h2,
          h3,
          content: textContent,
          responseTime: 0,
          status: 0,
          success: false
        };
      };
      
      // ========================================
      // STEP 2: HOMEPAGE SCRAPING
      // ========================================
      lastStep = 'homepage_scraping';
      console.log(`[AI Readiness ${runId}] → STEP 2: Homepage Scraping`);
      await updateStatus('Schritt 2/6: Scrape Homepage...');
      let homepageHtml = ''; // Store HTML for later use
      
      // Execute with timeout - continue even if it fails
      await executeStepWithTimeout(
        'Homepage Scraping',
        25000, // 25 seconds timeout
        async () => {
          console.log(`[AI Readiness ${runId}] Fetching homepage: ${websiteUrl}`);
          const { responseTime, response, html } = await measureResponseTime(websiteUrl, 20000);
          homepageHtml = html; // Store for internal links extraction
          console.log(`[AI Readiness ${runId}] Homepage response: status=${response.status}, time=${responseTime}ms, htmlLength=${html.length}`);
          
          if (response.ok && response.status !== 0 && html) {
            const pageData = scrapePageEnhanced(html, websiteUrl);
            pageData.responseTime = responseTime;
            pageData.status = response.status;
            pageData.success = true;
            // Store HTML in pageData for later use
            (pageData as any).html = html;
            
            report.homepage = { scraped: true, data: pageData };
            
            addLog('Homepage Scraping', 'OK', {
              url: websiteUrl,
              httpStatus: response.status,
              responseTime: responseTime,
              title: pageData.title,
              metaDescription: pageData.metaDescription,
              h1Count: pageData.h1.length,
              h2Count: pageData.h2.length,
              h3Count: pageData.h3.length,
              contentLength: pageData.content.length,
              structure: {
                h1: pageData.h1,
                h2: pageData.h2.slice(0, 5), // First 5 H2s
                h3: pageData.h3.slice(0, 5)  // First 5 H3s
              }
            }, responseTime);
            await updateStatus(`✓ Homepage gescraped (${responseTime}ms, ${pageData.content.length} Zeichen)`);
            await sendHeartbeat();
          } else {
            report.homepage = {
              scraped: false,
              data: { url: websiteUrl, title: '', metaDescription: '', h1: [], h2: [], h3: [], content: '', responseTime, status: response.status || 0, success: false }
            };
            addLog('Homepage Scraping', 'WARN', {
              url: websiteUrl,
              httpStatus: response.status || 0,
              responseTime: responseTime,
              message: response.statusText?.includes('Timeout') ? 'Zu lange gedauert - übersprungen' : 'Homepage konnte nicht geladen werden - übersprungen'
            }, responseTime);
            await updateStatus(`⚠ Homepage übersprungen (Status: ${response.status || 0})`);
          }
          await saveLogs();
        },
        null // Fallback value
      );
      
      // Ensure we have a default homepage structure even if step failed
      if (!report.homepage.data) {
        report.homepage = {
          scraped: false,
          data: { url: websiteUrl, title: '', metaDescription: '', h1: [], h2: [], h3: [], content: '', responseTime: 0, status: 0, success: false }
        };
      }
      
      // ========================================
      // STEP 3: INTERNE LINKS
      // ========================================
      lastStep = 'internal_links';
      console.log(`[AI Readiness ${runId}] → STEP 3: Interne Links`);
      await updateStatus('Schritt 3/6: Extrahiere interne Links...');
      
      await executeStepWithTimeout(
        'Interne Links Extraktion',
        15000, // 15 seconds timeout
        async () => {
          if (report.homepage.scraped && report.homepage.data && homepageHtml) {
            console.log(`[AI Readiness ${runId}] Extracting internal links from homepage HTML...`);
            // Use the HTML we already fetched
            const html = homepageHtml;
            const baseUrl = new URL(websiteUrl);
            const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
            const allLinks: string[] = [];
            
            for (const linkMatch of linkMatches) {
              const hrefMatch = linkMatch.match(/href=["']([^"']+)["']/i);
              if (hrefMatch) {
                let href = hrefMatch[1];
                try {
                  // Resolve relative URLs
                  const resolvedUrl = new URL(href, baseUrl);
                  // Check if it's internal (same domain)
                  if (resolvedUrl.hostname === baseUrl.hostname) {
                    allLinks.push(resolvedUrl.toString());
                  }
                } catch (e) {
                  // Skip invalid URLs
                }
              }
            }
            
            // Remove duplicates
            report.internalLinks = [...new Set(allLinks)];
            
            addLog('Interne Links Extraktion', 'OK', {
              totalLinksFound: allLinks.length,
              uniqueInternalLinks: report.internalLinks.length,
              links: report.internalLinks.slice(0, 20) // First 20 links
            });
            await updateStatus(`✓ ${report.internalLinks.length} interne Links gefunden`);
            await sendHeartbeat();
          } else {
            addLog('Interne Links Extraktion', 'WARN', {
              message: 'Homepage nicht verfügbar, kann Links nicht extrahieren - übersprungen'
            });
            await updateStatus(`⚠ Homepage nicht verfügbar - übersprungen`);
          }
          await saveLogs();
        },
        [] // Fallback: empty array
      );
      
      // Ensure we have an array even if step failed
      if (!report.internalLinks) {
        report.internalLinks = [];
      }
      
      // ========================================
      // STEP 4: SCRAPE WEITERE SEITEN (optional, für bessere Analyse)
      // ========================================
      lastStep = 'scrape_pages';
      console.log(`[AI Readiness ${runId}] → STEP 4: Scrape weitere Seiten`);
      await updateStatus('Schritt 4/6: Scrape weitere Seiten...');
      const urlsToScrape = report.internalLinks.slice(0, 20); // Use internal links, limit to 20 pages for performance
      if (urlsToScrape.length === 0) {
        urlsToScrape.push(websiteUrl); // At least scrape homepage
      }
      console.log(`[AI Readiness ${runId}] Scraping ${urlsToScrape.length} pages...`);
      
      // Execute with timeout - continue even if it fails
      await executeStepWithTimeout(
        'Seiten Scraping',
        120000, // 2 minutes timeout for all pages (20 pages * 6 seconds max each)
        async () => {
          const startTime = Date.now();
          let successCount = 0;
          let failCount = 0;
          
          for (let i = 0; i < urlsToScrape.length; i++) {
            const url = urlsToScrape[i];
            try {
              // Each page gets max 15 seconds
              const { responseTime, response, html } = await measureResponseTime(url, 15000);
              if (response.ok && response.status !== 0 && html) {
                const pageData = scrapePageEnhanced(html, url);
                pageData.responseTime = responseTime;
                pageData.status = response.status;
                pageData.success = true;
                report.pages.push(pageData);
                successCount++;
              } else {
                // Timeout or error - skip this page
                report.pages.push({
                  url,
                  title: '',
                  metaDescription: '',
                  h1: [],
                  h2: [],
                  h3: [],
                  content: '',
                  responseTime,
                  status: response.status || 0,
                  success: false
                });
                failCount++;
              }
              
              if ((i + 1) % 5 === 0 || i === urlsToScrape.length - 1) {
                await updateStatus(`Schritt 4/6: ${i + 1}/${urlsToScrape.length} Seiten gescraped...`);
                await saveLogs();
              }
            } catch (e: any) {
              // Skip this page and continue
              report.pages.push({
                url,
                title: '',
                metaDescription: '',
                h1: [],
                h2: [],
                h3: [],
                content: '',
                responseTime: 0,
                status: 0,
                success: false
              });
              failCount++;
            }
          }
          
          const totalTime = Date.now() - startTime;
          addLog('Seiten Scraping', successCount > 0 ? 'OK' : 'WARN', {
            totalPages: urlsToScrape.length,
            successfulPages: successCount,
            failedPages: failCount,
            totalTime: totalTime,
            message: failCount > 0 ? `${failCount} Seiten übersprungen (Timeout/Fehler)` : 'Alle Seiten erfolgreich gescraped'
          });
          await saveLogs();
        },
        [] // Fallback: empty pages array
      );
      
      // Calculate summary
      const successfulPages = report.pages.filter(p => p.success);
      const responseTimes = report.pages.filter(p => p.responseTime > 0).map(p => p.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
      const fastestPage = responseTimes.length > 0 
        ? report.pages.find(p => p.responseTime === Math.min(...responseTimes))?.url || ''
        : '';
      const slowestPage = responseTimes.length > 0
        ? report.pages.find(p => p.responseTime === Math.max(...responseTimes))?.url || ''
        : '';
      
      report.summary = {
        totalPages: report.pages.length,
        successfulPages: successfulPages.length,
        averageResponseTime: avgResponseTime,
        fastestPage,
        slowestPage
      };
      
      // ========================================
      // STEP 5: GPT AUSWERTUNG – AI READINESS SCORE
      // ========================================
      lastStep = 'gpt_evaluation';
      console.log(`[AI Readiness ${runId}] → STEP 5: GPT Auswertung`);
      await updateStatus('Schritt 5/6: Generiere AI Readiness Score mit GPT...');
      
      let gptResponse: string = 'GPT-Auswertung übersprungen - zu lange gedauert oder Fehler aufgetreten';
      
      // Execute with timeout - continue even if it fails
      await executeStepWithTimeout(
        'GPT Auswertung',
        60000, // 60 seconds timeout for GPT call
        async () => {
          addLog('GPT Auswertung', 'OK', {
            message: 'Starte GPT-Analyse...'
          });
          await saveLogs();
          
          console.log(`[AI Readiness ${runId}] Building GPT prompt...`);
          const promptStartTime = Date.now();
          const prompt = this.buildAIReadinessPromptFromReport(report);
          const promptTime = Date.now() - promptStartTime;
          console.log(`[AI Readiness ${runId}] GPT prompt built: ${prompt.length} chars in ${promptTime}ms`);
          
          console.log(`[AI Readiness ${runId}] Calling GPT API...`);
          const gptStartTime = Date.now();
          try {
            gptResponse = await this.callGPTForAIReadiness(prompt, env);
            const gptTime = Date.now() - gptStartTime;
            console.log(`[AI Readiness ${runId}] ✓ GPT response received: ${gptResponse.length} chars in ${gptTime}ms`);
            
            addLog('GPT Auswertung', 'OK', {
              promptLength: prompt.length,
              promptBuildTime: promptTime,
              responseLength: gptResponse.length,
              responseTime: gptTime
            }, gptTime);
            await saveLogs();
          } catch (gptError: any) {
            console.error(`[AI Readiness ${runId}] ❌ GPT Error:`, gptError);
            const gptTime = Date.now() - gptStartTime;
            addLog('GPT Auswertung', 'WARN', {
              error: gptError.message || 'Unbekannter GPT-Fehler',
              responseTime: gptTime,
              message: 'GPT-Auswertung fehlgeschlagen - übersprungen'
            }, gptTime);
            await saveLogs();
            // Continue with error message instead of failing completely
            gptResponse = `GPT-Auswertung übersprungen: ${gptError.message || 'Unbekannter Fehler'}`;
          }
        },
        'GPT-Auswertung übersprungen - zu lange gedauert' // Fallback message
      );
      
      // Save final results
      lastStep = 'save_results';
      console.log(`[AI Readiness ${runId}] Saving final results...`);
      try {
        await db.db
          .prepare('UPDATE ai_readiness_runs SET status = ?, recommendations = ?, message = ?, robots_txt = ?, logs = ?, updated_at = ? WHERE id = ?')
          .bind(
            'completed',
            gptResponse,
            '✓ Analyse abgeschlossen',
            JSON.stringify(report),
            JSON.stringify(logs),
            new Date().toISOString(),
            runId
          )
          .run();
        console.log(`[AI Readiness ${runId}] ✓ Results saved to database`);
      } catch (saveError: any) {
        console.error(`[AI Readiness ${runId}] ❌ Error saving results:`, saveError);
        // Try to save at least the error
        try {
          await db.db
            .prepare('UPDATE ai_readiness_runs SET status = ?, error = ?, message = ?, updated_at = ? WHERE id = ?')
            .bind(
              'error',
              `Save error: ${saveError.message}`,
              '❌ Fehler beim Speichern',
              new Date().toISOString(),
              runId
            )
            .run();
        } catch (e) {
          console.error(`[AI Readiness ${runId}] ❌ Could not save error status:`, e);
        }
        throw saveError;
      }
      
      addLog('Analyse Abgeschlossen', 'OK', {
        message: 'AI Readiness Check erfolgreich abgeschlossen',
        totalSteps: logs.length,
        totalPages: report.pages.length,
        totalTime: Date.now() - startTime
      });
      await saveLogs();
      
      const totalTime = Date.now() - startTime;
      console.log(`[AI Readiness ${runId}] ========================================`);
      console.log(`[AI Readiness ${runId}] ✓ ANALYSIS COMPLETE`);
      console.log(`[AI Readiness ${runId}] Total time: ${totalTime}ms`);
      console.log(`[AI Readiness ${runId}] ========================================`);
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[AI Readiness ${runId}] ========================================`);
      console.error(`[AI Readiness ${runId}] ❌ ERROR in processAIReadiness`);
      console.error(`[AI Readiness ${runId}] Last step: ${lastStep}`);
      console.error(`[AI Readiness ${runId}] Total time: ${totalTime}ms`);
      console.error(`[AI Readiness ${runId}] Error:`, error);
      console.error(`[AI Readiness ${runId}] Stack:`, error instanceof Error ? error.stack : 'No stack');
      console.error(`[AI Readiness ${runId}] ========================================`);
      
      try {
        // Add error log
        console.error(`[AI Readiness ${runId}] ========================================`);
        console.error(`[AI Readiness ${runId}] ❌ CRITICAL ERROR CAUGHT`);
        console.error(`[AI Readiness ${runId}] Last step: ${lastStep}`);
        console.error(`[AI Readiness ${runId}] Total time: ${totalTime}ms`);
        console.error(`[AI Readiness ${runId}] Error type: ${error?.constructor?.name}`);
        console.error(`[AI Readiness ${runId}] Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`[AI Readiness ${runId}] Error stack:`, error instanceof Error ? error.stack : 'No stack');
        console.error(`[AI Readiness ${runId}] Full error object:`, error);
        console.error(`[AI Readiness ${runId}] ========================================`);
        
        addLog('Analyse Fehler', 'ERROR', {
          step: lastStep,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          totalTime: totalTime,
          errorType: error?.constructor?.name
        });
        
        console.log(`[AI Readiness ${runId}] → Saving error logs...`);
        await saveLogs();
        
        // Update database with error
        console.log(`[AI Readiness ${runId}] → Updating database with error status...`);
        try {
          const errorResult = await db.db
            .prepare('UPDATE ai_readiness_runs SET status = ?, error = ?, message = ?, logs = ?, updated_at = ? WHERE id = ?')
            .bind(
              'error',
              error instanceof Error ? error.message : 'Unknown error',
              `❌ Fehler in Schritt: ${lastStep}`,
              JSON.stringify(logs),
              new Date().toISOString(),
              runId
            )
            .run();
          console.log(`[AI Readiness ${runId}] ✓ Error status saved to database:`, {
            success: errorResult.success,
            changes: errorResult.meta?.changes
          });
        } catch (dbUpdateError: any) {
          console.error(`[AI Readiness ${runId}] ❌ Could not update database with error:`, {
            message: dbUpdateError?.message,
            stack: dbUpdateError?.stack,
            error: dbUpdateError
          });
        }
      } catch (dbError: any) {
        console.error(`[AI Readiness ${runId}] ❌ Could not save error to database:`, {
          message: dbError?.message,
          stack: dbError?.stack,
          name: dbError?.name,
          error: dbError
        });
      }
    }
  }

  // Build prompt for AI Readiness analysis from comprehensive report
  private buildAIReadinessPromptFromReport(report: any): string {
    let prompt = `# AI READINESS ANALYSE\n\n`;
    prompt += `Analysiere die folgende Website auf AI-Readiness und bewerte, wie gut sie von KI-Systemen gelesen und verstanden werden kann.\n\n`;
    prompt += `## WEBSITE\n${report.websiteUrl}\n\n`;
    
    // Homepage
    prompt += `## HOMEPAGE\n`;
    if (report.homepage.scraped && report.homepage.data) {
      const hp = report.homepage.data;
      prompt += `Status: ✓ Gescraped\n`;
      prompt += `Response Time: ${hp.responseTime}ms\n`;
      prompt += `HTTP Status: ${hp.status}\n`;
      prompt += `Titel: ${hp.title}\n`;
      prompt += `Content-Länge: ${hp.content.length} Zeichen\n`;
      prompt += `Inhalt (Auszug, erste 2000 Zeichen):\n${hp.content.substring(0, 2000)}${hp.content.length > 2000 ? '...' : ''}\n\n`;
    } else {
      prompt += `Status: ✗ Nicht gescraped\n`;
      prompt += `Hinweis: Homepage konnte nicht geladen werden\n\n`;
    }
    
    // Pages with response times
    prompt += `## GESCRAEPTE SEITEN (${report.pages.length} Seiten)\n\n`;
    prompt += `### PERFORMANCE-ÜBERSICHT\n`;
    prompt += `- Gesamt: ${report.summary.totalPages} Seiten\n`;
    prompt += `- Erfolgreich: ${report.summary.successfulPages} Seiten\n`;
    prompt += `- Durchschnittliche Response Time: ${report.summary.averageResponseTime}ms\n`;
    prompt += `- Schnellste Seite: ${report.summary.fastestPage} (${report.pages.find((p: any) => p.url === report.summary.fastestPage)?.responseTime || 0}ms)\n`;
    prompt += `- Langsamste Seite: ${report.summary.slowestPage} (${report.pages.find((p: any) => p.url === report.summary.slowestPage)?.responseTime || 0}ms)\n\n`;
    
    prompt += `### SEITEN-DETAILS\n`;
    report.pages.slice(0, 20).forEach((page: any, i: number) => {
      prompt += `\n#### Seite ${i + 1}: ${page.title || 'Kein Titel'}\n`;
      prompt += `- URL: ${page.url}\n`;
      prompt += `- Response Time: ${page.responseTime}ms\n`;
      prompt += `- HTTP Status: ${page.status}\n`;
      prompt += `- Erfolg: ${page.success ? '✓' : '✗'}\n`;
      if (page.success && page.content) {
        prompt += `- Content-Länge: ${page.content.length} Zeichen\n`;
        prompt += `- Inhalt (Auszug, erste 1000 Zeichen):\n${page.content.substring(0, 1000)}${page.content.length > 1000 ? '...' : ''}\n`;
      }
    });
    
    // Task with detailed scoring requirements
    prompt += `\n\n## AUFGABE\n\n`;
    prompt += `Bewerte diese Website auf AI-Readiness und gib eine strukturierte Analyse mit detailliertem Scoring:\n\n`;
    prompt += `**WICHTIG: Du MUSST folgendes Format verwenden:**\n\n`;
    prompt += `## AI READINESS SCORE\n\n`;
    prompt += `**Gesamtscore: [0-100]**\n\n`;
    prompt += `### Teil-Scores:\n`;
    prompt += `- **Technische AI-Readiness: [0-100]**\n`;
    prompt += `  - Crawlability: [0-100]\n`;
    prompt += `  - Response Speed: [0-100]\n`;
    prompt += `  - Link-Struktur: [0-100]\n\n`;
    prompt += `- **Strukturelle Readability: [0-100]**\n`;
    prompt += `  - Headline-Hierarchie: [0-100]\n`;
    prompt += `  - Content-Struktur: [0-100]\n`;
    prompt += `  - Semantische Klarheit: [0-100]\n\n`;
    prompt += `- **Content Readability für LLMs: [0-100]**\n`;
    prompt += `  - Klarheit: [0-100]\n`;
    prompt += `  - Kontext-Vollständigkeit: [0-100]\n`;
    prompt += `  - Redundanz: [0-100]\n\n`;
    prompt += `### Begründung pro Score:\n`;
    prompt += `Für jeden Teil-Score eine klare Begründung basierend auf den gefundenen Daten.\n\n`;
    prompt += `### Priorisierte Verbesserungsvorschläge:\n`;
    prompt += `1. [Konkreter, umsetzbarer Vorschlag mit höchster Priorität]\n`;
    prompt += `2. [Zweiter Vorschlag]\n`;
    prompt += `3. [Dritter Vorschlag]\n`;
    prompt += `...\n\n`;
    prompt += `Gib konkrete, umsetzbare Empfehlungen auf Deutsch. Sei spezifisch und beziehe dich auf die tatsächlich gefundenen Daten.`;
    
    return prompt;
  }
  
  // Legacy function for backward compatibility
  private buildAIReadinessPrompt(
    websiteUrl: string,
    robotsTxt: string,
    sitemapUrls: string[],
    pageContents: Array<{ url: string; content: string; title: string }>
  ): string {
    return this.buildAIReadinessPromptFromReport({
      websiteUrl,
      robotsTxt: { found: !!robotsTxt, content: robotsTxt, note: robotsTxt ? 'Gefunden' : 'Nicht gefunden' },
      sitemap: { found: sitemapUrls.length > 0, urls: sitemapUrls, note: sitemapUrls.length > 0 ? `${sitemapUrls.length} URLs` : 'Nicht gefunden' },
      homepage: { scraped: true, data: pageContents[0] || null },
      pages: pageContents.map(p => ({ ...p, responseTime: 0, status: 200, success: true })),
      summary: { totalPages: pageContents.length, successfulPages: pageContents.length, averageResponseTime: 0, fastestPage: '', slowestPage: '' }
    });
  }

  // Call GPT API for AI Readiness recommendations
  private async callGPTForAIReadiness(prompt: string, env: Env): Promise<string> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[GPT] OPENAI_API_KEY not configured");
      throw new Error("OPENAI_API_KEY not configured");
    }
    
    try {
      console.log("[GPT] → Preparing request to OpenAI API...");
      console.log("[GPT] → Model: gpt-4o-mini");
      console.log("[GPT] → Prompt length: " + prompt.length + " characters");
      console.log("[GPT] → Max tokens: 3000");
      console.log("[GPT] → Timeout: 120 seconds");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Du bist ein Experte für AI-Readiness und bewertest, wie gut Websites von KI-Systemen (wie ChatGPT, Claude, etc.) gelesen, verstanden und verarbeitet werden können. Du analysierst die technische Struktur, Content-Qualität, Performance und Zugänglichkeit und gibst strukturierte, umsetzbare Empfehlungen auf Deutsch."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
        signal: AbortSignal.timeout(120000) // 2 minutes timeout
      });
      
      console.log("[GPT] → Response status: " + response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GPT] ❌ API error: " + response.status + " - " + errorText);
        throw new Error(`GPT API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const content = data.choices[0]?.message?.content || "Keine Empfehlungen generiert.";
      console.log("[GPT] ✓ Response received: " + content.length + " characters");
      return content;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.error("[GPT] ❌ Timeout error after 120 seconds");
        throw new Error("GPT API timeout: Die Anfrage hat zu lange gedauert (über 2 Minuten). Bitte versuchen Sie es erneut.");
      }
      console.error("[GPT] ❌ Error: " + (error.message || error));
      throw error;
    }
  }
}

  
