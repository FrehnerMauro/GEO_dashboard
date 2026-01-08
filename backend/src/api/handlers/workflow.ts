/**
 * Workflow API Handlers
 */

import type { UserInput } from "../../../shared/types.js";
import type { Env, CorsHeaders } from "../types.js";
import { WorkflowEngine } from "../../../shared/engine_workflow.js";
import { LLMExecutor } from "../../../shared/llm_execution/index.js";
import { getConfig } from "../../../shared/config.js";
import { Database } from "../../../shared/persistence/index.js";
import { AnalysisEngine } from "../../../shared/analysis/index.js";
import { extractBrandName } from "../utils.js";

export class WorkflowHandlers {
  constructor(private workflowEngine: WorkflowEngine) {}

  async handleStep1(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        websiteUrl?: string;
        country?: string;
        region?: string;
        language?: string;
      };
      let websiteUrl = body.websiteUrl?.trim();
      // Auto-add https:// if missing
      if (websiteUrl) {
        const urlPattern = new RegExp('^https?:\\/\\/', 'i');
        if (!urlPattern.test(websiteUrl)) {
          websiteUrl = 'https://' + websiteUrl;
        }
      }
      const userInput: UserInput = {
        websiteUrl: websiteUrl || '',
        country: body.country || '',
        region: body.region,
        language: body.language || '',
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

  async handleStep2(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId: string;
      urls: string[];
      language?: string;
    };
    const { runId, urls } = body;

    const result = await this.workflowEngine.step2FetchContent(
      runId,
      urls,
      body.language || 'de',
      env
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleStep3(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId: string;
      content: string;
      language?: string;
    };
    const { runId, content, language } = body;

    const categories = await this.workflowEngine.step3GenerateCategories(
      runId,
      content,
      language || 'de',
      env
    );

    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleSaveCategories(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      selectedCategoryIds?: string[];
      customCategories?: any[];
    };
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

  async handleStep4(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        runId: string;
        categories: any[];
        userInput?: UserInput;
        questionsPerCategory?: number;
        companyId?: string;
        content?: string;
      };
      const { runId, categories, userInput, questionsPerCategory, companyId } = body;

      if (!runId) {
        return new Response(
          JSON.stringify({ error: "runId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!categories || categories.length === 0) {
        return new Response(
          JSON.stringify({ error: "categories are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const prompts = await this.workflowEngine.step4GeneratePrompts(
        runId,
        categories,
        userInput || { websiteUrl: '', country: '', language: 'de' },
        body.content || "",
        env,
        questionsPerCategory || 3,
        companyId
      );

      return new Response(JSON.stringify({ prompts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error in handleStep4:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate prompts",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleSavePrompts(
    runId: string,
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      prompts?: any[];
    };
    const { prompts } = body;

    await this.workflowEngine.saveUserPrompts(runId, prompts || [], env);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleStep5(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json() as {
      runId: string;
      prompts?: any[];
    };
    const { runId, prompts: promptsFromBody } = body;

    try {
      const result = await this.workflowEngine.step5ExecutePrompts(
        runId,
        promptsFromBody || [],
        env
      );

      // Step 2: Perform full analysis after all prompts are executed
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

      const brandName = extractBrandName(runInfo.website_url);
      const analysisEngine = new AnalysisEngine(brandName, config.analysis.brandFuzzyThreshold);

      // Load all prompts for this run
      const savedPrompts = await db.db
        .prepare("SELECT * FROM prompts WHERE run_id = ?")
        .bind(runId)
        .all<any>();

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

      // Parse citations from concatenated string
      const responsesWithCitations = (savedResponses.results || []).map((r: any) => {
        const citations = r.citations_data
          ? r.citations_data.split('|||').map((c: string) => {
              const [url, title, snippet] = c.split('|');
              return { url, title: title || '', snippet: snippet || '' };
            })
          : [];
        return {
          ...r,
          citations
        };
      });

      // Perform analysis
      const promptsArray = (savedPrompts.results || []) as any[];
      const analyses = analysisEngine.analyzeResponses(
        promptsArray, 
        responsesWithCitations
      );

      // Save analyses
      await db.savePromptAnalyses(analyses);

      // Calculate metrics - using direct database queries since methods don't exist
      const categoryMetrics = await db.db
        .prepare(`
          SELECT category_id, 
                 COUNT(*) as prompt_count,
                 SUM(CASE WHEN brand_mentions > 0 THEN 1 ELSE 0 END) as mentions_count
          FROM prompt_analyses
          WHERE prompt_id IN (SELECT id FROM prompts WHERE run_id = ?)
          GROUP BY category_id
        `)
        .bind(runId)
        .all<any>();

      const competitiveAnalysis = await db.db
        .prepare(`
          SELECT competitor_name, COUNT(*) as mention_count
          FROM competitor_mentions
          WHERE prompt_analysis_id IN (
            SELECT id FROM prompt_analyses 
            WHERE prompt_id IN (SELECT id FROM prompts WHERE run_id = ?)
          )
          GROUP BY competitor_name
          ORDER BY mention_count DESC
        `)
        .bind(runId)
        .all<any>();

      const timeSeries = await db.db
        .prepare(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM llm_responses
          WHERE prompt_id IN (SELECT id FROM prompts WHERE run_id = ?)
          GROUP BY DATE(created_at)
          ORDER BY date
        `)
        .bind(runId)
        .all<any>();

      // Update run status
      await db.updateAnalysisStatus(runId, "completed", {
        step: "completed",
        progress: 100,
        message: "Analysis completed",
      });

      return new Response(JSON.stringify({
        success: true,
        runId,
        result: {
          categoryMetrics: categoryMetrics.results || [],
          competitiveAnalysis: competitiveAnalysis.results || [],
          timeSeries: timeSeries.results || [],
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in handleStep5:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to execute prompts",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  async handleFetchUrl(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
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

        return new Response(JSON.stringify({ content: text, text: text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ content: null, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

  async handleExecutePrompt(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    const body = await request.json();
    const { runId, prompt, userInput } = body;

    try {
      const config = getConfig(env);
      const executor = new LLMExecutor(config);

      // Execute prompt with GPT-5 Web Search
      const response = await executor.executePrompt(prompt);

      // Extract brand name from website URL
      const websiteUrl = userInput?.websiteUrl || '';
      const brandName = extractBrandName(websiteUrl);

      // Save prompt, response, and analysis immediately (with timestamps)
      const db = new Database(env.geo_db as any);
      
      // Ensure prompt has an ID and required fields
      if (!prompt.id) {
        prompt.id = `prompt_${runId}_${Date.now()}`;
      }
      if (!prompt.language) {
        prompt.language = userInput?.language || 'de';
      }
      if (!prompt.country) {
        prompt.country = userInput?.country || '';
      }
      if (!prompt.region) {
        prompt.region = userInput?.region || null;
      }
      if (!prompt.intent) {
        prompt.intent = 'high';
      }
      if (!prompt.createdAt) {
        prompt.createdAt = new Date().toISOString();
      }
      
      // Save prompt using the proper method
      await db.savePrompts(runId, [prompt]);
      
      // Ensure response has correct promptId
      response.promptId = prompt.id;

      // Save response and citations using the proper method
      await db.saveLLMResponses([response]);

      // Perform analysis: Brand mentions, Citations, Competitors, Sentiment
      const analysisEngine = new AnalysisEngine(brandName, 0.7);
      const analyses = analysisEngine.analyzeResponses([prompt], [response]);
      
      if (!analyses || analyses.length === 0) {
        throw new Error("Analysis failed: No analysis result returned");
      }
      
      const analysis = analyses[0];

      // Save analysis using the proper method
      await db.savePromptAnalyses([analysis]);

      return new Response(JSON.stringify({
        success: true,
        response,
        analysis,
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

  async handleGenerateSummary(
    request: Request,
    env: Env,
    corsHeaders: CorsHeaders
  ): Promise<Response> {
    try {
      const body = await request.json() as {
        runId: string;
        questionsAndAnswers?: any[];
        userInput?: any;
      };
      const { runId } = body;

      const db = new Database(env.geo_db as any);

      // Get run info to extract brand name
      const runInfo = await db.db
        .prepare("SELECT website_url FROM analysis_runs WHERE id = ?")
        .bind(runId)
        .first<{ website_url: string }>();

      if (!runInfo) {
        throw new Error("Analysis run not found");
      }

      const brandName = extractBrandName(runInfo.website_url);
      const brandLower = brandName.toLowerCase();
      const brandInUrl = brandLower.replace(/\s+/g, ""); // Remove spaces for URL matching

      // Calculate total mentions (exact + fuzzy)
      const mentionsResult = await db.db
        .prepare(`
          SELECT 
            SUM(brand_mentions_exact + brand_mentions_fuzzy) as totalMentions
          FROM prompt_analyses
          WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)
        `)
        .bind(runId)
        .first<{ totalMentions: number | null }>();

      const totalMentions = mentionsResult?.totalMentions || 0;

      // Get all citations for this run
      const allCitationsResult = await db.db
        .prepare(`
          SELECT 
            c.url,
            c.title,
            c.snippet
          FROM citations c
          WHERE c.llm_response_id IN (
            SELECT id FROM llm_responses 
            WHERE prompt_id IN (SELECT id FROM prompts WHERE analysis_run_id = ?)
          )
        `)
        .bind(runId)
        .all<{ url: string; title: string | null; snippet: string | null }>();

      // Filter citations where brand is mentioned (same logic as AnalysisEngine.findBrandCitations)
      const brandCitations = (allCitationsResult.results || []).filter((citation) => {
        const citationText = `${citation.title || ""} ${citation.snippet || ""}`.toLowerCase();
        const urlLower = citation.url.toLowerCase();
        
        // Check if brand is mentioned in citation title, snippet, or URL
        const mentionedInText = citationText.includes(brandLower);
        const mentionedInUrl = urlLower.includes(brandInUrl);
        
        return mentionedInText || mentionedInUrl;
      });

      const totalCitations = brandCitations.length;

      // Get best prompts (top prompts by mentions + brand citations)
      // Get all prompts with their citations in one query
      const promptsWithCitationsResult = await db.db
        .prepare(`
          SELECT 
            p.id,
            p.question,
            COALESCE(pa.brand_mentions_exact, 0) + COALESCE(pa.brand_mentions_fuzzy, 0) as mentions,
            c.url as citation_url,
            c.title as citation_title,
            c.snippet as citation_snippet
          FROM prompts p
          LEFT JOIN prompt_analyses pa ON pa.prompt_id = p.id
          LEFT JOIN llm_responses lr ON lr.prompt_id = p.id
          LEFT JOIN citations c ON c.llm_response_id = lr.id
          WHERE p.analysis_run_id = ?
        `)
        .bind(runId)
        .all<{
          id: string;
          question: string;
          mentions: number;
          citation_url: string | null;
          citation_title: string | null;
          citation_snippet: string | null;
        }>();

      // Group by prompt and count unique brand citations
      const promptMap = new Map<string, { question: string; mentions: number; citationUrls: Set<string> }>();
      
      (promptsWithCitationsResult.results || []).forEach((row) => {
        if (!promptMap.has(row.id)) {
          promptMap.set(row.id, {
            question: row.question,
            mentions: row.mentions,
            citationUrls: new Set<string>(),
          });
        }

        // Track brand citations by URL to avoid double counting
        if (row.citation_url) {
          const citationText = `${row.citation_title || ""} ${row.citation_snippet || ""}`.toLowerCase();
          const urlLower = row.citation_url.toLowerCase();
          const mentionedInText = citationText.includes(brandLower);
          const mentionedInUrl = urlLower.includes(brandInUrl);
          
          if (mentionedInText || mentionedInUrl) {
            const prompt = promptMap.get(row.id)!;
            prompt.citationUrls.add(row.citation_url);
          }
        }
      });

      // Convert to array with citation counts and sort
      const bestPrompts = Array.from(promptMap.entries())
        .map(([id, data]) => ({
          question: data.question,
          mentions: data.mentions,
          citations: data.citationUrls.size,
        }))
        .sort((a, b) => (b.mentions + b.citations) - (a.mentions + a.citations))
        .slice(0, 10);

      // Get other sources (only brand citation URLs grouped by domain)
      const otherSources: Record<string, number> = {};
      brandCitations.forEach((citation) => {
        try {
          const urlObj = new URL(citation.url);
          const domain = urlObj.hostname.replace('www.', '');
          otherSources[domain] = (otherSources[domain] || 0) + 1;
        } catch {
          // If URL parsing fails, use the URL as-is
          otherSources[citation.url] = (otherSources[citation.url] || 0) + 1;
        }
      });

      // Create summary object
      const summary = {
        totalMentions,
        totalCitations,
        bestPrompts,
        otherSources,
      };

      // Save summary to database
      await db.saveSummary(runId, summary);

      return new Response(
        JSON.stringify(summary),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in handleGenerateSummary:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate summary",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
}
