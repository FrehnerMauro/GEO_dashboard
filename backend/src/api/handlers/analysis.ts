/**
 * Analysis API Handlers
 */

import type { UserInput } from "../../../shared/types.js";
import type { Env, CorsHeaders } from "../types.js";
import { GEOEngine } from "../../../shared/engine.js";

export class AnalysisHandlers {
  constructor(private engine: GEOEngine) {}

  async handleAnalyze(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json();
    let websiteUrl = body.websiteUrl?.trim();
    // Auto-add https:// if missing
    if (websiteUrl) {
      const urlPattern = new RegExp('^https?:\\/\\/', 'i');
      if (!urlPattern.test(websiteUrl)) {
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

  async handleGetAllAnalyses(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      const analyses = await db.getAllAnalysisRuns(100);
      
      // Ensure we always return an array, even if empty or if there's an error
      const analysesArray = Array.isArray(analyses) ? analyses : [];
      
      return new Response(JSON.stringify(analysesArray), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting all analyses:", error);
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

  async handleGetAllCompanies(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      const companies = await db.getAllCompanies();
      
      return new Response(JSON.stringify(companies), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting all companies:", error);
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

  async handleGetCompanyAnalyses(
    companyId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      const analyses = await db.getCompanyAnalysisRuns(companyId, 100);
      
      return new Response(JSON.stringify(analyses), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting company analyses:", error);
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

  async handleGetGlobalCategories(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      const categories = await db.getAllGlobalCategories();
      
      // Always return an array, even if empty (retry logic handles errors internally)
      return new Response(JSON.stringify(categories || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting global categories:", error);
      // Return empty array instead of 500 error to prevent frontend crashes
      // The retry logic in Database class should handle most transient errors
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  async handleGetGlobalPromptsByCategory(
    categoryName: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      const prompts = await db.getGlobalPromptsByCategory(categoryName);
      
      return new Response(JSON.stringify(prompts), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting global prompts by category:", error);
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

  async handleGetAnalysis(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
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

  async handleGetStatus(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const { Database } = await import("../../../shared/persistence/index.js");
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

  async handleGetMetrics(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
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

  async handleDeleteAnalysis(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      await db.deleteAnalysis(runId);
      
      return new Response(
        JSON.stringify({ success: true, message: "Analysis deleted" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

  async handleGetAnalysisInsights(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      const { extractBrandName } = await import("../utils.js");
      
      const run = await db.db
        .prepare("SELECT * FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<any>();

      if (!run) {
        return new Response(JSON.stringify({ error: "Analysis not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const brandName = extractBrandName(run.website_url);
      
      // Get all prompts and responses for this run
      const prompts = await db.db
        .prepare("SELECT * FROM prompts WHERE analysis_run_id = ?")
        .bind(runId)
        .all<any>();

      // Optimized: Use JOIN instead of nested subquery to avoid timeout
      const responses = await db.db
        .prepare(`
          SELECT lr.*, 
                 GROUP_CONCAT(c.url || '|' || COALESCE(c.title, '') || '|' || COALESCE(c.snippet, ''), '|||') as citations_data
          FROM llm_responses lr
          INNER JOIN prompts p ON lr.prompt_id = p.id
          LEFT JOIN citations c ON c.llm_response_id = lr.id
          WHERE p.analysis_run_id = ?
          GROUP BY lr.id
        `)
        .bind(runId)
        .all<any>();

      // Parse citations
      const responsesWithCitations = (responses.results || []).map((r: any) => {
        const citations = r.citations_data
          ? r.citations_data.split('|||').map((c: string) => {
              const [url, title, snippet] = c.split('|');
              return { url, title: title || '', snippet: snippet || '' };
            })
          : [];
        return { ...r, citations };
      });

      // Perform analysis
      const { AnalysisEngine } = await import("../../../shared/analysis/index.js");
      const { getConfig } = await import("../../../shared/config.js");
      const config = getConfig(env);
      const analysisEngine = new AnalysisEngine(brandName, config.analysis.brandFuzzyThreshold);
      const analyses = analysisEngine.analyzeResponses(prompts.results || [], responsesWithCitations);

      return new Response(JSON.stringify({
        runId,
        insights: analyses,
        prompts: prompts.results || [],
        responses: responsesWithCitations,
      }), {
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

  async handleGetAnalysisPromptsAndSummary(
    runId: string,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const { Database } = await import("../../../shared/persistence/index.js");
      const db = new Database(env.geo_db as any);
      
      // Get prompts with answers
      const prompts = await db.getPromptsForAnalysis(runId);
      
      // Get summary
      const summary = await db.getSummary(runId);
      
      return new Response(JSON.stringify({
        prompts,
        summary,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error getting analysis prompts and summary:", error);
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
}

