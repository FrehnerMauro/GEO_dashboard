/**
 * Analysis API Handlers
 */

import type { Env, CorsHeaders } from "../types.js";

export class AnalysisHandlers {
  constructor() {}

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

